
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  BlockType, WallType, Entity, InputState, InventoryItem, ToolType, NetworkMessage, InputMode, GameSettings, EntityType, DevSettings, TestInterface, ArmorType 
} from '../types';
import { 
  TILE_SIZE, CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT, GRAVITY, FRICTION, MOVE_SPEED, 
  JUMP_FORCE, MAX_FALL_SPEED, PLAYER_WIDTH, PLAYER_HEIGHT, BLOCK_COLORS,
  SKY_COLORS, PLAYER_MAX_HEALTH, BLOCK_MINING_STATS, CREATE_ITEM, TOOL_COLORS, ENEMY_STATS, NPC_DIALOGUES
} from '../constants';
import { generateWorld } from '../utils/worldGen';
import { drawBlock, drawWall, drawTool, texRandom, getToolPalette } from '../utils/drawUtils';
import { loadWorld, saveWorld, decodeWorldData } from '../utils/storage';
import { Hotbar } from './Hotbar';
import { Inventory } from './Inventory';
import { MobileControls } from './MobileControls';
import { HealthDisplay } from './HealthDisplay';
import { SettingsOverlay } from './SettingsOverlay';
import { DevTools } from './DevTools';
import { Minimap } from './Minimap';
import { Loader2, ArrowLeft, Terminal, Settings as SettingsIcon, Sun, Moon, Copy, Check, MessageSquare, Send, Save, MessageCircle, XCircle } from 'lucide-react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    rotation?: number;
    rv?: number;
}

interface WorldChange {
  x: number;
  y: number;
  b: BlockType;
}

interface WallChange {
  x: number;
  y: number;
  w: WallType;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  width: number;
  opacity: number;
}

interface ChunkCacheEntry {
    canvas: HTMLCanvasElement | null;
    isEmpty: boolean;
}

interface ChatMessage {
    id: string;
    text: string;
    author: string;
    color: string;
    time: number;
}

interface GameProps {
  roomId: string | null;
  saveId?: string | null;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onExit: () => void;
  onJoinGame: (id: string) => void;
}

const generateRandomId = () => Math.random().toString(36).substr(2, 7).toUpperCase();

const drawParallax = (ctx: CanvasRenderingContext2D, camX: number, camY: number, width: number, height: number, time: number, zoom: number) => {
    const t = time;
    const dayRatio = t / 24000;
    
    // Celestial params
    const centerX = width / 2 / zoom;
    const centerY = height / 1.2 / zoom; 
    const orbitRadius = width / zoom * 0.7;
    
    ctx.save();
    // Move celestial bodies with time
    ctx.translate(centerX, centerY + camY * 0.05); 
    ctx.rotate(dayRatio * Math.PI * 2 + Math.PI); 
    ctx.translate(0, orbitRadius);
    
    // Sun
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 60;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Moon (opposite side)
    ctx.translate(0, -orbitRadius * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#cbd5e1';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI*2);
    ctx.fill();
    
    // Moon Craters
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath(); ctx.arc(-10, -8, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, 10, 10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-5, 15, 5, 0, Math.PI*2); ctx.fill();
    
    ctx.restore();

    // Mountains Layers (Parallax)
    // Layer 1: Farthest (Slowest)
    const layers = [
        { speed: 0.1, color: '#0f172a', height: 250, period: 400, offset: 0 },
        { speed: 0.25, color: '#1e293b', height: 180, period: 250, offset: 150 },
        { speed: 0.5, color: '#334155', height: 120, period: 150, offset: 50 },
    ];

    layers.forEach(layer => {
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        // Calculate start based on camera to tile infinitely
        const startX = Math.floor((camX * layer.speed) / 500) * 500 - 500;
        const endX = startX + (width / zoom) + 1000;
        
        ctx.moveTo((startX - camX * layer.speed), height/zoom);
        
        for(let x = startX; x <= endX; x += 30) {
            const nx = x + layer.offset;
            // Combine sines for "mountainous" look
            const h = Math.sin(nx / layer.period) * 60 + Math.sin(nx / (layer.period * 0.4)) * 30 + layer.height;
            const drawX = x - camX * layer.speed;
            const drawY = (height/zoom) - h - (camY * 0.05); // slight Y parallax
            ctx.lineTo(drawX, drawY);
        }
        
        ctx.lineTo((endX - camX * layer.speed), height/zoom);
        ctx.fill();
    });
};

class SoundEngine {
  ctx: AudioContext | null = null;
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
  
  playBlip(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playDig(blockType: BlockType, volume = 0.15) {
      if (!this.ctx) return;
      
      let type: OscillatorType = 'sine';
      let freqStart = 150;
      let duration = 0.1;

      switch (blockType) {
          case BlockType.STONE:
          case BlockType.COAL:
          case BlockType.IRON:
          case BlockType.GOLD:
          case BlockType.DIAMOND:
          case BlockType.BRICK:
          case BlockType.FURNACE:
          case BlockType.ANVIL:
              type = 'square'; 
              freqStart = 300 + Math.random() * 100;
              duration = 0.08;
              break;
          case BlockType.DIRT:
          case BlockType.GRASS:
          case BlockType.SAND:
              type = 'sawtooth';
              freqStart = 100 + Math.random() * 30;
              duration = 0.12;
              break;
          case BlockType.WOOD:
              type = 'triangle';
              freqStart = 200 + Math.random() * 50;
              duration = 0.1;
              break;
          case BlockType.GLASS:
              type = 'sine';
              freqStart = 800;
              break;
      }

      this.playBlip(freqStart, duration, type, volume);
  }
}

const sfx = new SoundEngine();

export const Game: React.FC<GameProps> = ({ 
    roomId, saveId, inputMode, onInputModeChange, settings, onSettingsChange, onExit, onJoinGame
}) => {
  const [hostPeerId] = useState(generateRandomId());
  const [myAssignedId, setMyAssignedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(false);
  useEffect(() => { isLoadedRef.current = isLoaded; }, [isLoaded]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  const peerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const connectionsRef = useRef<Map<string, any>>(new Map());
  const [activePeersCount, setActivePeersCount] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState<{ text: string, speaker: string } | null>(null);
  
  // Robust mobile detection
  const [isMobile, setIsMobile] = useState(() => {
      if (typeof window === 'undefined') return false;
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });
  const [mobileActionMode, setMobileActionMode] = useState<'mine' | 'place'>('mine');
  const mobileActionModeRef = useRef<'mine' | 'place'>('mine');
  useEffect(() => { mobileActionModeRef.current = mobileActionMode; }, [mobileActionMode]);
  
  const zoom = settings.fov;
  const effectiveIsMobile = inputMode === InputMode.TOUCH || (inputMode === InputMode.AUTO && isMobile);
  const isHost = !roomId;

  const isDevUser = settings.playerName === 'DEV01';
  const [showDevTools, setShowDevTools] = useState(false);
  const [devSettings, setDevSettings] = useState<DevSettings>({
    godMode: false,
    noclip: false,
    superSpeed: false,
    instaMine: false,
    infiniteReach: false,
    showHitboxes: false,
    gravityScale: 1.0, 
    timeScale: 1.0, 
    freezeTime: false,
    infiniteDurability: false,
    showChunkBorders: false,
    debugInfo: false,
  });
  
  // MAP STATE
  const [showFullMap, setShowFullMap] = useState(false);

  // CHAT SYSTEM
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInputValue, setChatInputValue] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const isChatOpenRef = useRef(false);
  useEffect(() => { isChatOpenRef.current = isChatOpen; }, [isChatOpen]);

  const devSettingsRef = useRef<DevSettings>(devSettings);
  useEffect(() => { devSettingsRef.current = devSettings; }, [devSettings]);

  const settingsRef = useRef<GameSettings>(settings);
  useEffect(() => { 
    settingsRef.current = settings; 
    // Sync settings to player entity for immediate visual update
    if (playerRef.current) {
        playerRef.current.name = settings.playerName;
        playerRef.current.color = settings.playerColor;
        playerRef.current.hairColor = settings.playerHair;
        playerRef.current.skinColor = settings.playerSkin;
    }
  }, [settings]);

  const worldRef = useRef<Uint8Array>(new Uint8Array(0));
  const wallsRef = useRef<Uint8Array>(new Uint8Array(0));
  const lightRef = useRef<Float32Array>(new Float32Array(0));
  const worldSeedRef = useRef<number>(Math.floor(Math.random() * 1000000));
  const worldChangesRef = useRef<WorldChange[]>([]);
  const wallChangesRef = useRef<WallChange[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const [worldTime, setWorldTime] = useState(6000); 
  const worldTimeRef = useRef(6000);

  const chunkCacheRef = useRef<Map<string, ChunkCacheEntry>>(new Map());
  const dirtyChunksRef = useRef<Set<string>>(new Set());

  const markChunkDirty = (tx: number, ty: number) => {
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    dirtyChunksRef.current.add(`${cx},${cy}`);
  };

  const markChunkRangeDirty = (minX: number, maxX: number) => {
    const minCX = Math.floor(minX / CHUNK_SIZE);
    const maxCX = Math.floor(maxX / CHUNK_SIZE);
    for (let cx = minCX; cx <= maxCX; cx++) {
        for (let cy = 0; cy < Math.ceil(WORLD_HEIGHT / CHUNK_SIZE); cy++) {
            dirtyChunksRef.current.add(`${cx},${cy}`);
        }
    }
  };

  const [playerHealth, setPlayerHealth] = useState(PLAYER_MAX_HEALTH);

  const playerRef = useRef<Entity>({
    x: 0, y: 0, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, 
    vx: 0, vy: 0, grounded: false, 
    health: PLAYER_MAX_HEALTH, maxHealth: PLAYER_MAX_HEALTH,
    id: 'pending', color: settings.playerColor, hairColor: settings.playerHair, skinColor: settings.playerSkin,
    name: settings.playerName,
    facing: 'right', animTimer: 0, iFrames: 0, type: EntityType.PLAYER
  });

  // REFERENCES FOR GAME ENTITIES
  const enemiesRef = useRef<Map<string, Entity>>(new Map());
  const npcsRef = useRef<Map<string, Entity>>(new Map()); // NEW: Friendly NPCs
  const remotePlayersRef = useRef<Map<string, Entity>>(new Map());
  const [remotePlayersList, setRemotePlayersList] = useState<Entity[]>([]);

  const cameraRef = useRef({ x: 0, y: 0 });
  const inputRef = useRef<InputState>({
    left: false, right: false, up: false, down: false, jump: false,
    moveX: 0, moveY: 0, isGamepadActive: false,
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2, leftDown: false, rightDown: false }
  });
  
  const mobileAimRef = useRef({ x: 0, y: 0, active: false });
  const targetReticleRef = useRef<{x: number, y: number, valid: boolean}>({x: 0, y: 0, valid: false});

  // Inventory now 33 slots (0-29 main, 30 helmet, 31 chest, 32 legs)
  const inventoryRef = useRef<(InventoryItem | null)[]>(new Array(33).fill(null));
  const [inventoryState, setInventoryState] = useState<(InventoryItem | null)[]>(new Array(33).fill(null));
  const selectedSlotRef = useRef(0);
  const [selectedSlot, setSelectedSlotState] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const screenShakeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  
  const miningRef = useRef<{ 
    x: number; y: number; progress: number; swing: number; 
    isAttacking: boolean; hasHit: boolean; attackCooldown: number 
  }>({ 
    x: -1, y: -1, progress: 0, swing: 0, 
    isAttacking: false, hasHit: false, attackCooldown: 0 
  });
  
  const lastPlacementTimeRef = useRef(0);
  const lastEnemySpawnTime = useRef(0);
  const lastEnemySyncTime = useRef(0);
  const [targetEnemyId, setTargetEnemyId] = useState<string | null>(null);

  const lastMenuButtonState = useRef(false);
  const lastInventoryButtonState = useRef(false);
  const lastLBState = useRef(false);
  const lastRBState = useRef(false);

  const lastBroadcastTime = useRef(0);
  const lastTimeSyncBroadcastTime = useRef(0);
  
  const showInventoryRef = useRef(false);
  const showSettingsRef = useRef(false);
  useEffect(() => { showInventoryRef.current = showInventory; }, [showInventory]);
  useEffect(() => { showSettingsRef.current = showSettings; }, [showSettings]);
  useEffect(() => { selectedSlotRef.current = selectedSlot; }, [selectedSlot]);

  // --- HELPER FUNCTIONS ---

  const getNearbyStations = useCallback(() => {
      if (!worldRef.current.length) return [];
      const p = playerRef.current;
      const stations: BlockType[] = [];
      const cx = Math.floor((p.x + p.width/2) / TILE_SIZE);
      const cy = Math.floor((p.y + p.height/2) / TILE_SIZE);
      const radius = 6;
      
      for(let y = cy - radius; y <= cy + radius; y++) {
          for(let x = cx - radius; x <= cx + radius; x++) {
              if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                  const b = worldRef.current[y * WORLD_WIDTH + x];
                  if (b === BlockType.FURNACE || b === BlockType.ANVIL) {
                      if (!stations.includes(b)) stations.push(b);
                  }
              }
          }
      }
      return stations;
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const performanceFactor = settingsRef.current.performanceMode ? 0.2 : 1.0;
    const actualCount = Math.floor(count * performanceFactor);
    if (actualCount <= 0) return;

    for (let i = 0; i < actualCount; i++) {
        particlesRef.current.push({ 
          x, y, 
          vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 1) * 8, 
          life: 1, maxLife: settingsRef.current.performanceMode ? (10 + Math.random() * 5) : (20 + Math.random() * 30), 
          color, size: 2 + Math.random() * 4,
          rotation: Math.random() * Math.PI * 2, rv: (Math.random() - 0.5) * 0.4
        });
    }
  }, []);

  const updateLighting = useCallback((minX: number = 0, maxX: number = WORLD_WIDTH) => {
    if (!worldRef.current.length) return;
    if (!lightRef.current.length) lightRef.current = new Float32Array(WORLD_WIDTH * WORLD_HEIGHT);
    const light = lightRef.current;
    const world = worldRef.current;
    const walls = wallsRef.current;
    const startX = Math.max(0, minX);
    const endX = Math.min(WORLD_WIDTH, maxX);
    const s = settingsRef.current;

    for (let x = startX; x < endX; x++) {
      let currentLight = 1.0;
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        const idx = y * WORLD_WIDTH + x;
        const b = world[idx] as BlockType;
        const w = walls[idx] as WallType;
        
        if (b !== BlockType.AIR && b !== BlockType.LEAVES) {
          currentLight *= 0.58; 
        } else if (w !== WallType.AIR) {
          currentLight *= 0.9; // Walls reduce light slightly but don't block it fully
        }

        light[idx] = currentLight;
        if (currentLight < 0.05) {
            for(let k = y + 1; k < WORLD_HEIGHT; k++) {
                light[k * WORLD_WIDTH + x] = 0;
            }
            break;
        }
      }
    }

    if (s.smoothLighting && !s.performanceMode) {
        const sStart = Math.max(1, startX - 2);
        const sEnd = Math.min(WORLD_WIDTH - 1, endX + 2);
        for (let iteration = 0; iteration < 2; iteration++) {
          for (let y = 0; y < WORLD_HEIGHT; y++) {
            for (let x = sStart; x < sEnd; x++) {
              const idx = y * WORLD_WIDTH + x;
              const neighborLight = Math.max(light[idx - 1], light[idx + 1]);
              if (neighborLight * 0.75 > light[idx]) {
                  light[idx] = neighborLight * 0.75;
              }
            }
          }
        }
    }
    
    markChunkRangeDirty(startX, endX);
  }, []);

  const checkCollision = useCallback((ent: Entity, axis: 'x' | 'y'): boolean => {
    if (ent.type === EntityType.PLAYER && devSettingsRef.current.noclip) return false;
    let collided = false;
    const startX = Math.floor(ent.x / TILE_SIZE), endX = Math.floor((ent.x + ent.width) / TILE_SIZE);
    const startY = Math.floor(ent.y / TILE_SIZE), endY = Math.floor((ent.y + ent.height) / TILE_SIZE);
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;
        const b = worldRef.current[y * WORLD_WIDTH + x] as BlockType;
        if (b !== BlockType.AIR && b !== BlockType.LEAVES) {
             collided = true;
             if (axis === 'x') {
                if (ent.vx > 0) ent.x = x * TILE_SIZE - ent.width - 0.01;
                else if (ent.vx < 0) ent.x = (x + 1) * TILE_SIZE + 0.01;
                ent.vx = 0;
             } else {
                if (ent.vy > 0) { ent.y = y * TILE_SIZE - ent.height - 0.01; ent.grounded = true; }
                else if (ent.vy < 0) ent.y = (y + 1) * TILE_SIZE + 0.01;
                ent.vy = 0;
             }
             return true;
        }
      }
    }
    if (axis === 'y' && ent.vy !== 0) ent.grounded = false;
    return collided;
  }, []);

  const respawnPlayer = useCallback(() => {
    const p = playerRef.current;
    p.health = PLAYER_MAX_HEALTH;
    setPlayerHealth(PLAYER_MAX_HEALTH);
    const spawnX = WORLD_WIDTH / 2;
    let spawnY = 0;
    while (spawnY < WORLD_HEIGHT && worldRef.current[spawnY * WORLD_WIDTH + Math.floor(spawnX)] === BlockType.AIR) spawnY++;
    p.x = spawnX * TILE_SIZE;
    p.y = (spawnY - 5) * TILE_SIZE;
    p.vx = 0; p.vy = 0; p.iFrames = 60;
    sfx.playBlip(50, 0.4, 'sawtooth', settingsRef.current.audioVolume);
    spawnParticles(p.x + p.width/2, p.y + p.height/2, '#fff', 25);
  }, [spawnParticles]);

  const spawnEntityAtLocation = useCallback((type: EntityType, x: number, y: number) => {
      // Different stats logic for enemies vs NPCs
      const isEnemy = type === EntityType.SLIME || type === EntityType.ZOMBIE;
      const stats = isEnemy ? ENEMY_STATS[type === EntityType.SLIME ? 'SLIME' : 'ZOMBIE'] : ENEMY_STATS.GUIDE;
      
      const id = (isEnemy ? 'enemy_' : 'npc_') + Math.random().toString(36).substr(2, 9);
      
      const entity: Entity = {
        id, x, y, width: stats.width, height: stats.height, vx: 0, vy: 0, grounded: false, 
        health: stats.hp, maxHealth: stats.hp,
        type, color: stats.color, iFrames: 0, jumpTimer: 0,
        name: type === EntityType.GUIDE ? 'Guide' : undefined,
        // Guide specific visuals
        hairColor: type === EntityType.GUIDE ? '#8d5524' : undefined,
        skinColor: type === EntityType.GUIDE ? '#ffdbac' : undefined,
        // NPC AI State
        state: 'idle', stateTimer: 0
      };

      if (isEnemy) {
          enemiesRef.current.set(id, entity);
      } else {
          npcsRef.current.set(id, entity);
      }
  }, []);

  const spawnEnemies = useCallback((now: number) => {
    if (roomId) return;
    
    if (enemiesRef.current.size >= 12 || now - lastEnemySpawnTime.current < 4500) return;
    const p = playerRef.current;
    const spawnX = p.x + (Math.random() < 0.5 ? -1 : 1) * (500 + Math.random() * 400);
    const tx = Math.floor(spawnX / TILE_SIZE);
    if (tx < 0 || tx >= WORLD_WIDTH) return;
    let ty = 0;
    while (ty < WORLD_HEIGHT && worldRef.current[ty * WORLD_WIDTH + tx] === BlockType.AIR) ty++;
    if (ty < WORLD_HEIGHT && ty > 0) {
      const time = worldTimeRef.current;
      const isNight = time > 13000 || time < 5000;
      let type = EntityType.SLIME;
      if (isNight) {
          type = Math.random() < 0.4 ? EntityType.SLIME : EntityType.ZOMBIE;
      } else {
          type = EntityType.SLIME;
      }
      spawnEntityAtLocation(type, tx * TILE_SIZE, (ty - 2) * TILE_SIZE);
      lastEnemySpawnTime.current = now;
    }
  }, [roomId, spawnEntityAtLocation]);

  const addItemToInventory = useCallback((newItem: InventoryItem) => {
    const inv = inventoryRef.current;
    // Don't auto-stack into armor slots (30-32)
    for (let i = 0; i < 30; i++) {
        const item = inv[i];
        if (item && item.id === newItem.id && item.count < item.maxStack) {
            const space = item.maxStack - item.count;
            const take = Math.min(space, newItem.count);
            item.count += take;
            newItem.count -= take;
            if (newItem.count <= 0) {
                setInventoryState([...inv]);
                return true; 
            }
        }
    }
    if (newItem.count > 0) {
        for (let i = 0; i < 30; i++) { 
            if (!inv[i]) { 
                inv[i] = { ...newItem }; 
                setInventoryState([...inv]); 
                return true; 
            } 
        }
    }
    return false;
  }, []);

  const broadcast = useCallback((type: string, payload: any) => {
    if (!playerRef.current.id || playerRef.current.id === 'pending') return;
    const msg: NetworkMessage = { type: type as any, payload, senderId: playerRef.current.id };
    connectionsRef.current.forEach(conn => { 
        if (conn && conn.open) {
            try { conn.send(msg); } catch(e) { /* ignore broken pipes */ }
        } 
    });
  }, []);

  const sendChat = (text: string) => {
      const msg: ChatMessage = {
          id: Math.random().toString(),
          text,
          author: settings.playerName,
          color: settings.playerColor,
          time: Date.now()
      };
      setChatMessages(prev => [...prev, msg].slice(-50));
      broadcast('CHAT', { text, author: settings.playerName, color: settings.playerColor });
      setTimeout(() => {
          if (chatMessagesRef.current) {
              chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
          }
      }, 50);
  };

  // --- SAVE/LOAD LOGIC ---
  const handleSaveGame = useCallback((silent: boolean = false) => {
      if (!saveId) return;
      
      // Only show UI feedback if not silent (manual save or exit)
      if (!silent) setSaveStatus('saving');
      
      const p = playerRef.current;
      // Stable reference to settings to avoid dependency change
      p.color = settingsRef.current.playerColor;
      p.hairColor = settingsRef.current.playerHair;
      p.skinColor = settingsRef.current.playerSkin;

      saveWorld(
          saveId, 
          `World ${saveId.replace('world_', '')}`, 
          worldRef.current,
          wallsRef.current,
          p,
          inventoryRef.current,
          worldTimeRef.current,
          worldSeedRef.current
      );
      
      if (!silent) {
          setTimeout(() => setSaveStatus('saved'), 500);
          setTimeout(() => setSaveStatus(null), 2500);
      }
  }, [saveId]);

  // Auto-Save Effect
  useEffect(() => {
      if (!saveId) return;
      const interval = setInterval(() => {
          handleSaveGame(true); // Silent save every second
      }, 1000); 
      return () => clearInterval(interval);
  }, [saveId, handleSaveGame]);

  // --- DEPENDENT CALLBACKS ---

  const finishLoading = useCallback(() => {
    try {
        setTimeout(() => {
            // LOAD CHECK
            if (!worldRef.current.length) {
                if (saveId) {
                    const save = loadWorld(saveId);
                    if (save) {
                        worldRef.current = decodeWorldData(save.worldData);
                        wallsRef.current = decodeWorldData(save.wallsData);
                        worldSeedRef.current = save.seed;
                        worldTimeRef.current = save.time;
                        setWorldTime(save.time);
                        
                        const p = playerRef.current;
                        p.x = save.player.x;
                        p.y = save.player.y;
                        p.health = save.player.health;
                        setPlayerHealth(p.health);
                        
                        if(save.player.color) p.color = save.player.color;
                        if(save.player.hairColor) p.hairColor = save.player.hairColor;
                        if(save.player.skinColor) p.skinColor = save.player.skinColor;

                        // Ensure loaded inventory matches size 33
                        const loadedInv = save.player.inventory;
                        inventoryRef.current = new Array(33).fill(null);
                        for(let i=0; i<Math.min(loadedInv.length, 33); i++) {
                            inventoryRef.current[i] = loadedInv[i];
                        }
                        setInventoryState([...inventoryRef.current]);
                    } else {
                        // New World but has saveId target
                        const gen = generateWorld(worldSeedRef.current);
                        worldRef.current = gen.world;
                        wallsRef.current = gen.walls;
                        
                        const spawnX = WORLD_WIDTH / 2;
                        let spawnY = 0;
                        while (spawnY < WORLD_HEIGHT && worldRef.current[spawnY * WORLD_WIDTH + Math.floor(spawnX)] === BlockType.AIR) spawnY++;
                        playerRef.current.x = spawnX * TILE_SIZE;
                        playerRef.current.y = (spawnY - 5) * TILE_SIZE;
                        
                        // Init Inventory
                        if (!inventoryRef.current[0]) {
                            inventoryRef.current[0] = CREATE_ITEM.wood_pickaxe();
                            inventoryRef.current[1] = CREATE_ITEM.wood_sword();
                            inventoryRef.current[2] = CREATE_ITEM.block(BlockType.WOOD);
                            inventoryRef.current[2]!.count = 5;
                            setInventoryState([...inventoryRef.current]);
                        }
                        
                        // Initial Save
                        handleSaveGame(true);
                    }
                } else {
                    // Classic Gen (Multiplayer / Temp)
                    const gen = generateWorld(worldSeedRef.current);
                    worldRef.current = gen.world;
                    wallsRef.current = gen.walls;
                    
                    const spawnX = WORLD_WIDTH / 2;
                    let spawnY = 0;
                    while (spawnY < WORLD_HEIGHT && worldRef.current[spawnY * WORLD_WIDTH + Math.floor(spawnX)] === BlockType.AIR) spawnY++;
                    playerRef.current.x = spawnX * TILE_SIZE;
                    playerRef.current.y = (spawnY - 5) * TILE_SIZE;
                    if (!inventoryRef.current[0]) {
                        inventoryRef.current[0] = CREATE_ITEM.wood_pickaxe();
                        inventoryRef.current[1] = CREATE_ITEM.wood_sword();
                        inventoryRef.current[2] = CREATE_ITEM.block(BlockType.WOOD);
                        inventoryRef.current[2]!.count = 5;
                        setInventoryState([...inventoryRef.current]);
                    }
                }
            }

            // SAFETY: Calculate Spawn if Joining Player is at 0,0
            if (playerRef.current.x === 0 && playerRef.current.y === 0 && worldRef.current.length > 0) {
                const spawnX = WORLD_WIDTH / 2;
                let spawnY = 0;
                while (spawnY < WORLD_HEIGHT && worldRef.current[spawnY * WORLD_WIDTH + Math.floor(spawnX)] === BlockType.AIR) spawnY++;
                playerRef.current.x = spawnX * TILE_SIZE;
                playerRef.current.y = (spawnY - 5) * TILE_SIZE;
                
                // Also give starter items to joiners if empty
                if (!inventoryRef.current[0]) {
                    inventoryRef.current[0] = CREATE_ITEM.wood_pickaxe();
                    inventoryRef.current[1] = CREATE_ITEM.wood_sword();
                    inventoryRef.current[2] = CREATE_ITEM.block(BlockType.WOOD);
                    inventoryRef.current[2]!.count = 5;
                    setInventoryState([...inventoryRef.current]);
                }
            }

            updateLighting();
            
            // Spawn Guide NPC if none exists
            if (npcsRef.current.size === 0 && !roomId) {
                spawnEntityAtLocation(EntityType.GUIDE, playerRef.current.x + 100, playerRef.current.y);
            }

            cloudsRef.current = [];
            for (let i = 0; i < 15; i++) {
              cloudsRef.current.push({
                x: Math.random() * WORLD_WIDTH * TILE_SIZE,
                y: Math.random() * 500 + 50,
                speed: 0.2 + Math.random() * 0.5,
                width: 100 + Math.random() * 200,
                opacity: 0.1 + Math.random() * 0.3
              });
            }
            
            setIsLoaded(true); isLoadedRef.current = true; setLoadingError(null);
        }, 50);
    } catch(e: any) {
        setLoadingError(`World Generation Failed: ${e.message}`);
        isInitializingRef.current = false;
    }
  }, [updateLighting, saveId, handleSaveGame, spawnEntityAtLocation, roomId]);

  const setupConnection = useCallback((conn: any) => {
    if (!conn) return;
    conn.on('open', () => {
      console.log('Peer Connected:', conn.peer);
      connectionsRef.current.set(conn.peer, conn);
      setActivePeersCount(connectionsRef.current.size + 1);
      // Ensure we only request init if we are joining (roomId is set) and connected to the right peer
      if (roomId && conn.peer === roomId) {
          setIsSyncing(true);
          conn.send({ type: 'REQUEST_INIT', payload: {}, senderId: playerRef.current.id });
      }
      conn.send({ type: 'PLAYER_MOVE', payload: { 
          x: playerRef.current.x, y: playerRef.current.y, color: playerRef.current.color, hairColor: playerRef.current.hairColor, name: playerRef.current.name, facing: playerRef.current.facing,
          // Sync visuals? For now just base traits. Armor sync could be added here.
      }, senderId: playerRef.current.id });
    });
    
    conn.on('data', (data: any) => {
      const msg = data as NetworkMessage;
      if (msg.senderId === playerRef.current.id) return;

      switch (msg.type) {
        case 'CHAT':
            setChatMessages(prev => [...prev, { 
                id: Math.random().toString(), 
                text: msg.payload.text, 
                author: msg.payload.author, 
                color: msg.payload.color, 
                time: Date.now() 
            }].slice(-50));
            setTimeout(() => { if (chatMessagesRef.current) chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight; }, 10);
            break;
        case 'REQUEST_INIT':
          conn.send({ type: 'INIT_SYNC', payload: { seed: worldSeedRef.current, changes: worldChangesRef.current, wallChanges: wallChangesRef.current, time: worldTimeRef.current }, senderId: playerRef.current.id });
          break;
        case 'INIT_SYNC':
          if (isLoadedRef.current) return;
          worldSeedRef.current = msg.payload.seed;
          worldChangesRef.current = msg.payload.changes;
          wallChangesRef.current = msg.payload.wallChanges || [];
          worldTimeRef.current = msg.payload.time || 6000;
          setWorldTime(worldTimeRef.current);
          
          const gen = generateWorld(worldSeedRef.current);
          worldRef.current = gen.world;
          wallsRef.current = gen.walls;

          msg.payload.changes.forEach((c: WorldChange) => { 
            if (c.x >= 0 && c.x < WORLD_WIDTH && c.y >= 0 && c.y < WORLD_HEIGHT) worldRef.current[c.y * WORLD_WIDTH + c.x] = c.b; 
          });
          
          if (msg.payload.wallChanges) {
              msg.payload.wallChanges.forEach((c: WallChange) => {
                  if (c.x >= 0 && c.x < WORLD_WIDTH && c.y >= 0 && c.y < WORLD_HEIGHT) wallsRef.current[c.y * WORLD_WIDTH + c.x] = c.w;
              });
          }

          setIsSyncing(false); finishLoading(); break;
        case 'TIME_SYNC':
            worldTimeRef.current = msg.payload.time;
            setWorldTime(msg.payload.time);
            break;
        case 'PLAYER_MOVE': {
          const existing = remotePlayersRef.current.get(msg.senderId);
          const { x, y, vx, vy, ...rest } = msg.payload;
          
          let snap = false;
          if (!existing) snap = true;
          else {
              const dx = x - existing.x;
              const dy = y - existing.y;
              if (Math.sqrt(dx*dx + dy*dy) > 200) snap = true; 
          }

          remotePlayersRef.current.set(msg.senderId, { 
            ...(existing || { width: PLAYER_WIDTH, height: PLAYER_HEIGHT, health: 100, maxHealth: 100 }), 
            ...rest, 
            id: msg.senderId,
            x: snap ? x : existing?.x,
            y: snap ? y : existing?.y,
            targetX: x,
            targetY: y,
            vx, vy,
            animTimer: msg.payload.animTimer !== undefined ? msg.payload.animTimer : (existing?.animTimer || 0),
            heldItem: msg.payload.heldItem
          });
          
          setRemotePlayersList(Array.from(remotePlayersRef.current.values()));
          break;
        }
        case 'WORLD_CHANGE': {
          const { x, y, blockType } = msg.payload;
          if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            worldRef.current[y * WORLD_WIDTH + x] = blockType;
            worldChangesRef.current.push({ x, y, b: blockType });
            updateLighting(x - 5, x + 6);
          }
          break;
        }
        case 'WALL_CHANGE': {
            const { x, y, wallType } = msg.payload;
            if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                wallsRef.current[y * WORLD_WIDTH + x] = wallType;
                wallChangesRef.current.push({ x, y, w: wallType });
                markChunkDirty(x * TILE_SIZE, y * TILE_SIZE);
            }
            break;
        }
        case 'ENEMY_SYNC':
            const serverIds = new Set(msg.payload.enemies.map((e: any) => e.id));
            for (const id of enemiesRef.current.keys()) {
                if (!serverIds.has(id)) enemiesRef.current.delete(id);
            }
            msg.payload.enemies.forEach((e: any) => {
                const existing = enemiesRef.current.get(e.id);
                if (existing) {
                    existing.x = e.x; existing.y = e.y;
                    existing.vx = e.vx; existing.vy = e.vy;
                    existing.health = e.health;
                    existing.facing = e.facing;
                } else {
                    enemiesRef.current.set(e.id, e);
                }
            });
            break;
        case 'ENEMY_HIT':
          const enemy = enemiesRef.current.get(msg.payload.id);
          if (enemy) {
              enemy.health -= msg.payload.damage; enemy.vx = msg.payload.vx; enemy.vy = msg.payload.vy; enemy.iFrames = 20;
              spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color || '#fff', 5);
              if (enemy.health <= 0) enemiesRef.current.delete(msg.payload.id);
          }
          break;
      }
    });

    conn.on('close', () => {
        connectionsRef.current.delete(conn.peer);
        remotePlayersRef.current.delete(conn.peer);
        setActivePeersCount(connectionsRef.current.size + 1);
        setRemotePlayersList(Array.from(remotePlayersRef.current.values()));
    });

    conn.on('error', (err: any) => {
        console.error('Connection Error:', err);
    });

  }, [roomId, finishLoading, updateLighting, spawnParticles]); 

  // --- PHYSICS ENGINE & INPUT HANDLER ---
  const redrawChunk = useCallback((cx: number, cy: number) => {
    const key = `${cx},${cy}`;
    let entry = chunkCacheRef.current.get(key);
    
    if (!entry) {
        const canvas = document.createElement('canvas');
        canvas.width = CHUNK_SIZE * TILE_SIZE;
        canvas.height = CHUNK_SIZE * TILE_SIZE;
        entry = { canvas, isEmpty: true };
        chunkCacheRef.current.set(key, entry);
    }
    
    const ctx = entry.canvas?.getContext('2d');
    if (!ctx || !entry.canvas) return;

    ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
    
    let hasContent = false;
    const startX = cx * CHUNK_SIZE;
    const startY = cy * CHUNK_SIZE;
    const world = worldRef.current;
    const walls = wallsRef.current;
    const light = lightRef.current;

    for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
            const wx = startX + x;
            const wy = startY + y;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
                 const block = world[wy * WORLD_WIDTH + wx];
                 const wall = walls[wy * WORLD_WIDTH + wx];
                 
                 // Draw Wall first (Background)
                 if (wall !== WallType.AIR && block === BlockType.AIR) {
                     hasContent = true;
                     drawWall(ctx, x * TILE_SIZE, y * TILE_SIZE, wall as WallType, wx, wy);
                 }

                 // Draw Block
                 if (block !== BlockType.AIR) {
                     hasContent = true;
                     drawBlock(ctx, x * TILE_SIZE, y * TILE_SIZE, block as BlockType, wx, wy);
                 }
                 
                 // Apply Shadow
                 if (hasContent && light.length > 0) {
                     const l = light[wy * WORLD_WIDTH + wx];
                     if (l < 1.0) {
                        ctx.fillStyle = `rgba(0,0,0,${1 - l})`;
                        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                     }
                 }
            }
        }
    }
    entry.isEmpty = !hasContent;
  }, []);

  const drawCracks = (ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, max: number) => {
      const ratio = progress / max;
      if (ratio < 0.05) return;
      
      const stage = Math.min(4, Math.floor(ratio * 5)); 
      
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      if (stage >= 0) {
          ctx.moveTo(16, 16); ctx.lineTo(10, 10);
          ctx.moveTo(16, 16); ctx.lineTo(22, 22);
      }
      if (stage >= 1) {
          ctx.moveTo(16, 16); ctx.lineTo(16, 6);
          ctx.moveTo(16, 16); ctx.lineTo(26, 16);
      }
      if (stage >= 2) {
           ctx.moveTo(10, 10); ctx.lineTo(4, 12);
           ctx.moveTo(22, 22); ctx.lineTo(28, 20);
           ctx.moveTo(16, 6); ctx.lineTo(10, 2);
      }
      if (stage >= 3) {
           ctx.moveTo(16, 16); ctx.lineTo(6, 26);
           ctx.moveTo(26, 16); ctx.lineTo(30, 8);
           ctx.moveTo(10, 10); ctx.lineTo(2, 2);
      }
      
      if (ratio > 0.8) {
          ctx.fillStyle = `rgba(255,255,255,${(ratio - 0.8) * 1.5})`;
          ctx.fillRect(0,0,32,32);
      }

      ctx.stroke();
      ctx.restore();
  };

  const pollGamepad = useCallback((now: number) => {
    const gp = navigator.getGamepads()[0];
    const input = inputRef.current;
    
    if (!gp) {
        if (input.isGamepadActive) input.isGamepadActive = false;
        return;
    }
    
    const hasInput = gp.buttons.some(b => b.pressed) || Math.abs(gp.axes[0]) > 0.1 || Math.abs(gp.axes[1]) > 0.1;
    if (hasInput) input.isGamepadActive = true;
    if (!input.isGamepadActive) return;

    input.moveX = Math.abs(gp.axes[0]) > 0.1 ? gp.axes[0] : 0;
    input.moveY = Math.abs(gp.axes[1]) > 0.1 ? gp.axes[1] : 0;

    if (gp.buttons[14].pressed) input.moveX = -1;
    if (gp.buttons[15].pressed) input.moveX = 1;
    
    input.jump = gp.buttons[0].pressed; 
    
    if (gp.buttons[9].pressed) {
        if (!lastMenuButtonState.current) setShowSettings(prev => !prev);
        lastMenuButtonState.current = true;
    } else lastMenuButtonState.current = false;

    if (gp.buttons[3].pressed) {
        if (!lastInventoryButtonState.current) setShowInventory(prev => !prev);
        lastInventoryButtonState.current = true;
    } else lastInventoryButtonState.current = false;

    if (gp.buttons[4].pressed) {
        if (!lastLBState.current) setSelectedSlotState(prev => (prev - 1 + 6) % 6);
        lastLBState.current = true;
    } else lastLBState.current = false;

    if (gp.buttons[5].pressed) {
        if (!lastRBState.current) setSelectedSlotState(prev => (prev + 1) % 6);
        lastRBState.current = true;
    } else lastRBState.current = false;
  }, []);

  const updateInteraction = useCallback((now: number, dt: number) => {
      const input = inputRef.current;
      const p = playerRef.current;
      const world = worldRef.current;
      const walls = wallsRef.current;
      const inv = inventoryRef.current;
      const selectedItem = inv[selectedSlotRef.current];
      const cam = cameraRef.current;
      const dev = devSettingsRef.current;

      let tx = 0, ty = 0;
      let isPressed = false;
      const reach = dev.infiniteReach ? 9999 : (selectedItem?.toolProps?.attackRange || 180);

      if (effectiveIsMobile) {
          if (mobileAimRef.current.active) {
              const v = mobileAimRef.current;
              // Clamp joystick aim to reach to avoid invalidating action
              let offX = v.x * 300;
              let offY = v.y * 300;
              const rawDist = Math.sqrt(offX*offX + offY*offY);
              
              if (rawDist > reach) {
                  const ratio = reach / rawDist;
                  offX *= ratio;
                  offY *= ratio;
              }
              
              const aimX = (p.x + p.width / 2) + offX;
              const aimY = (p.y + p.height / 2) + offY;
              
              tx = Math.floor(aimX / TILE_SIZE);
              ty = Math.floor(aimY / TILE_SIZE);
              isPressed = true;
              targetReticleRef.current = { x: tx * TILE_SIZE, y: ty * TILE_SIZE, valid: true };
          } else if (input.mouse.leftDown) {
              // Direct touch fallback
              tx = Math.floor((input.mouse.x / zoom + cam.x) / TILE_SIZE);
              ty = Math.floor((input.mouse.y / zoom + cam.y) / TILE_SIZE);
              isPressed = true;
              targetReticleRef.current = { x: tx * TILE_SIZE, y: ty * TILE_SIZE, valid: true };
          } else {
              targetReticleRef.current.valid = false;
          }
      } else if (input.isGamepadActive) {
          const gp = navigator.getGamepads()[0];
          if (gp) {
              const ax = gp.axes[2] || 0;
              const ay = gp.axes[3] || 0;
              if (Math.abs(ax) > 0.1 || Math.abs(ay) > 0.1) {
                  tx = Math.floor((p.x + p.width/2 + ax * 150) / TILE_SIZE);
                  ty = Math.floor((p.y + p.height/2 + ay * 150) / TILE_SIZE);
                  isPressed = gp.buttons[7].pressed;
              }
          }
      } else {
          tx = Math.floor((input.mouse.x / zoom + cam.x) / TILE_SIZE);
          ty = Math.floor((input.mouse.y / zoom + cam.y) / TILE_SIZE);
          isPressed = input.mouse.leftDown;
      }

      const dist = Math.sqrt(Math.pow((tx * TILE_SIZE + TILE_SIZE/2) - (p.x + p.width/2), 2) + Math.pow((ty * TILE_SIZE + TILE_SIZE/2) - (p.y + p.height/2), 2));
      
      if (dist > reach && !dev.infiniteReach) isPressed = false;

      if (isPressed) {
          if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
              const block = world[ty * WORLD_WIDTH + tx];
              const wall = walls[ty * WORLD_WIDTH + tx];
              
              if (selectedItem && (selectedItem.isBlock || selectedItem.isWall) && (block === BlockType.AIR)) {
                  if (now - lastPlacementTimeRef.current > 200) {
                      if (selectedItem.isBlock && selectedItem.blockType) {
                          const bx = tx * TILE_SIZE, by = ty * TILE_SIZE;
                          const collision = !dev.noclip && (p.x < bx + TILE_SIZE && p.x + p.width > bx && p.y < by + TILE_SIZE && p.y + p.height > by);
                          
                          if (!collision) {
                              world[ty * WORLD_WIDTH + tx] = selectedItem.blockType;
                              broadcast('WORLD_CHANGE', { x: tx, y: ty, blockType: selectedItem.blockType });
                              updateLighting(tx - 5, tx + 6);
                              sfx.playDig(selectedItem.blockType);
                              if (!dev.godMode) {
                                  selectedItem.count--;
                                  if (selectedItem.count <= 0) inv[selectedSlotRef.current] = null;
                                  setInventoryState([...inv]);
                              }
                              lastPlacementTimeRef.current = now;
                          }
                      } else if (selectedItem.isWall && selectedItem.wallType && wall === WallType.AIR) {
                           walls[ty * WORLD_WIDTH + tx] = selectedItem.wallType;
                           broadcast('WALL_CHANGE', { x: tx, y: ty, wallType: selectedItem.wallType });
                           markChunkDirty(tx * TILE_SIZE, ty * TILE_SIZE);
                           if (!dev.godMode) {
                               selectedItem.count--;
                               if (selectedItem.count <= 0) inv[selectedSlotRef.current] = null;
                               setInventoryState([...inv]);
                           }
                           lastPlacementTimeRef.current = now;
                      }
                  }
              } else if (block !== BlockType.AIR) {
                   if (miningRef.current.x !== tx || miningRef.current.y !== ty) {
                       miningRef.current = { x: tx, y: ty, progress: 0, swing: 0, isAttacking: false, hasHit: false, attackCooldown: 0 };
                   }
                   
                   const stats = BLOCK_MINING_STATS[block];
                   let speed = 1;
                   if (stats) {
                       const tool = selectedItem?.toolProps;
                       if (tool && tool.type === stats.requiredTool && tool.tier >= stats.minTier) {
                           speed = (tool.efficiency || 1) * 5;
                       } else if (stats.requiredTool !== ToolType.NONE) {
                           speed = 0.2;
                       }
                   }
                   if (dev.instaMine) speed = 9999;
                   
                   miningRef.current.progress += speed * dt;
                   miningRef.current.swing = (Math.sin(now / 50) + 1) / 2;
                   
                   if (Math.random() < 0.2) spawnParticles(tx * TILE_SIZE + TILE_SIZE/2, ty * TILE_SIZE + TILE_SIZE/2, BLOCK_COLORS[block], 1);

                   if (miningRef.current.progress >= (stats?.hardness || 10)) {
                       if (!dev.godMode) {
                           const drop = CREATE_ITEM.block(block);
                           addItemToInventory(drop);
                           
                           // Mining Durability Loss
                           if (selectedItem && selectedItem.toolProps && selectedItem.toolProps.durability !== undefined && !dev.infiniteDurability) {
                               // Clone item for immutability
                               const newItem = { ...selectedItem, toolProps: { ...selectedItem.toolProps } };
                               newItem.toolProps.durability = (newItem.toolProps.durability || 0) - 1;
                               
                               if (newItem.toolProps.durability <= 0) {
                                   inv[selectedSlotRef.current] = null;
                                   sfx.playBlip(100, 0.2, 'sawtooth', settingsRef.current.audioVolume);
                                   spawnParticles(p.x, p.y - 10, '#ffffff', 10); // Break effect
                               } else {
                                   inv[selectedSlotRef.current] = newItem;
                               }
                               setInventoryState([...inv]);
                           }
                       }
                       world[ty * WORLD_WIDTH + tx] = BlockType.AIR;
                       broadcast('WORLD_CHANGE', { x: tx, y: ty, blockType: BlockType.AIR });
                       updateLighting(tx - 5, tx + 6);
                       sfx.playDig(block);
                       miningRef.current.progress = 0;
                   }
              } else {
                  // SWING ATTACK (Hitting Air)
                  miningRef.current.swing = (Math.sin(now / 50) + 1) / 2;
                  miningRef.current.x = -1;
                  
                  // Attack Hit Logic
                  if (miningRef.current.attackCooldown <= 0) {
                      let hasHit = false;
                      // Simple melee hit detection box based on cursor/aim
                      const hitX = tx * TILE_SIZE + TILE_SIZE/2;
                      const hitY = ty * TILE_SIZE + TILE_SIZE/2;
                      const attackRadius = TILE_SIZE * 1.5;

                      enemiesRef.current.forEach((e, id) => {
                          if (hasHit) return; // Single target hit per swing for now
                          const ex = e.x + e.width/2;
                          const ey = e.y + e.height/2;
                          const dist = Math.sqrt((ex-hitX)**2 + (ey-hitY)**2);
                          
                          if (dist < attackRadius + Math.max(e.width, e.height)/2) {
                              const dmg = selectedItem?.toolProps?.damage || 1;
                              const kb = selectedItem?.toolProps?.knockback || 2;
                              
                              e.health -= dmg;
                              e.vx = (e.x > p.x ? 1 : -1) * kb;
                              e.vy = -3;
                              e.iFrames = 20;
                              
                              spawnParticles(ex, ey, e.color || '#fff', 5);
                              sfx.playBlip(200, 0.1, 'square', settings.audioVolume);
                              
                              broadcast('ENEMY_HIT', { id, damage: dmg, vx: e.vx, vy: e.vy });
                              
                              if (e.health <= 0) enemiesRef.current.delete(id);
                              hasHit = true;

                              // Durability Loss on Hit
                              if (!dev.godMode && selectedItem && selectedItem.toolProps && selectedItem.toolProps.durability !== undefined && !dev.infiniteDurability) {
                                  // Clone item for immutability
                                  const newItem = { ...selectedItem, toolProps: { ...selectedItem.toolProps } };
                                  newItem.toolProps.durability = (newItem.toolProps.durability || 0) - 1;

                                  if (newItem.toolProps.durability <= 0) {
                                       inv[selectedSlotRef.current] = null;
                                       sfx.playBlip(100, 0.2, 'sawtooth', settingsRef.current.audioVolume);
                                  } else {
                                       inv[selectedSlotRef.current] = newItem;
                                  }
                                  setInventoryState([...inv]);
                              }
                          }
                      });
                      
                      if (hasHit) miningRef.current.attackCooldown = 20; // Cooldown frames
                  }
                  miningRef.current.attackCooldown -= dt;
              }
          }
      } else {
          miningRef.current.progress = 0;
          miningRef.current.swing = 0;
          miningRef.current.x = -1;
          miningRef.current.attackCooldown = 0;
      }
  }, [effectiveIsMobile, zoom, broadcast, updateLighting, spawnParticles, addItemToInventory]);

  const updatePhysics = (now: number, dt: number) => {
    const input = inputRef.current;
    const p = playerRef.current;
    const dev = devSettingsRef.current;
    
    if (!dev.freezeTime) { 
        if (isHost) {
            worldTimeRef.current = (worldTimeRef.current + dev.timeScale) % 24000; 
            setWorldTime(worldTimeRef.current);
            if (now - lastTimeSyncBroadcastTime.current > 5000) {
                broadcast('TIME_SYNC', { time: worldTimeRef.current });
                lastTimeSyncBroadcastTime.current = now;
            }
        } else {
            worldTimeRef.current = (worldTimeRef.current + dev.timeScale) % 24000; 
            setWorldTime(worldTimeRef.current); 
        }
    }

    pollGamepad(now);

    const speed = dev.superSpeed ? 2 : 1;
    const accel = MOVE_SPEED * speed * dt;
    
    if (Math.abs(input.moveX) > 0.05) {
        p.vx += input.moveX * accel;
    } else {
        if (input.left) p.vx -= accel;
        if (input.right) p.vx += accel;
    }

    if (Math.abs(p.vx) > 0.1 && p.grounded && !input.down && !dev.noclip) {
        const side = p.vx > 0 ? 1 : -1;
        const checkX = Math.floor((p.x + p.width / 2 + side * (p.width / 2 + 5)) / TILE_SIZE);
        const checkY = Math.floor((p.y + p.height - 10) / TILE_SIZE); 
        const headY = Math.floor((p.y + p.height - TILE_SIZE - 10) / TILE_SIZE);
        
        if (checkX >= 0 && checkX < WORLD_WIDTH && checkY >= 0 && checkY < WORLD_HEIGHT) {
            const footBlock = worldRef.current[checkY * WORLD_WIDTH + checkX];
            const headBlock = worldRef.current[headY * WORLD_WIDTH + checkX];
            if (footBlock !== BlockType.AIR && footBlock !== BlockType.LEAVES && 
                (headBlock === BlockType.AIR || headBlock === BlockType.LEAVES)) {
                p.vy = JUMP_FORCE * 0.78; 
                p.grounded = false;
            }
        }
    }

    const frictionFactor = Math.pow(FRICTION, dt);
    p.vx *= frictionFactor;
    
    if (dev.noclip) {
        p.vy *= frictionFactor; 
        if (input.up || input.jump) p.vy -= accel;
        if (input.down) p.vy += accel;
    } else {
        p.vy += GRAVITY * dev.gravityScale * dt;
        if (input.jump && p.grounded) {
             p.vy = JUMP_FORCE;
             p.grounded = false;
        }
    }

    if (Math.abs(p.vx) < 0.01) p.vx = 0;
    if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;

    const steps = Math.ceil(Math.max(1, dt));
    const stepDt = dt / steps;

    for(let i=0; i<steps; i++) {
        p.x += p.vx * stepDt;
        if (!dev.noclip) checkCollision(p, 'x');

        p.y += p.vy * stepDt;
        if (!dev.noclip) checkCollision(p, 'y');
    }
    
    if (Math.abs(p.vx) > 0.1) {
        p.facing = p.vx > 0 ? 'right' : 'left';
        p.animTimer = (p.animTimer || 0) + dt;
    } else {
        p.animTimer = 0;
    }

    if (p.y > WORLD_HEIGHT * TILE_SIZE + 200) {
        if (!dev.godMode) {
            p.health = 0;
            respawnPlayer();
        } else {
            p.y = 0;
            p.vy = 0;
        }
    }

    if (p.iFrames && p.iFrames > 0) p.iFrames -= dt;

    remotePlayersRef.current.forEach((rp) => {
        if (rp.targetX !== undefined && rp.targetY !== undefined) {
            const lerpFactor = 0.2 * dt; 
            rp.x += (rp.targetX - rp.x) * lerpFactor;
            rp.y += (rp.targetY - rp.y) * lerpFactor;
            
            if (Math.abs(rp.x - rp.targetX) > 1 || Math.abs(rp.vx) > 0.1) {
               rp.animTimer = (rp.animTimer || 0) + dt;
            } else {
               rp.animTimer = 0;
            }
        }
    });

    if (isHost) {
        // NPC Logic (Friendly)
        npcsRef.current.forEach((npc, id) => {
            // Wander logic
            npc.stateTimer = (npc.stateTimer || 0) - dt;
            if (npc.stateTimer <= 0) {
                const action = Math.random();
                if (action < 0.6) {
                    npc.state = 'idle';
                    npc.vx = 0;
                } else if (action < 0.8) {
                    npc.state = 'walk';
                    npc.vx = -MOVE_SPEED * 0.5;
                    npc.facing = 'left';
                } else {
                    npc.state = 'walk';
                    npc.vx = MOVE_SPEED * 0.5;
                    npc.facing = 'right';
                }
                npc.stateTimer = 100 + Math.random() * 200;
            }

            // Flee from enemies
            enemiesRef.current.forEach((e) => {
                const dist = Math.sqrt(Math.pow(npc.x - e.x, 2) + Math.pow(npc.y - e.y, 2));
                if (dist < 100) {
                    npc.vx = (npc.x - e.x > 0 ? 1 : -1) * MOVE_SPEED * 0.8;
                    npc.state = 'flee';
                    npc.stateTimer = 60;
                }
            });

            // Physics
            npc.vx *= frictionFactor;
            npc.vy += GRAVITY * dt;
            npc.x += npc.vx * dt; checkCollision(npc, 'x');
            npc.y += npc.vy * dt; checkCollision(npc, 'y');

            // Jump if wall
            if (Math.abs(npc.vx) > 0.1 && npc.grounded) {
                const side = npc.vx > 0 ? 1 : -1;
                const checkX = Math.floor((npc.x + npc.width / 2 + side * (npc.width / 2 + 5)) / TILE_SIZE);
                const checkY = Math.floor((npc.y + npc.height - 10) / TILE_SIZE); 
                const headY = Math.floor((npc.y + npc.height - TILE_SIZE - 10) / TILE_SIZE);
                if (checkX >= 0 && checkX < WORLD_WIDTH && checkY >= 0 && checkY < WORLD_HEIGHT) {
                    const footBlock = worldRef.current[checkY * WORLD_WIDTH + checkX];
                    const headBlock = worldRef.current[headY * WORLD_WIDTH + checkX];
                    if (footBlock !== BlockType.AIR && (headBlock === BlockType.AIR || headBlock === BlockType.LEAVES)) {
                        npc.vy = JUMP_FORCE * 0.9; 
                        npc.grounded = false;
                    }
                }
            }

            // Anim
            if (Math.abs(npc.vx) > 0.1) {
                npc.animTimer = (npc.animTimer || 0) + dt;
                npc.facing = npc.vx > 0 ? 'right' : 'left';
            } else {
                npc.animTimer = 0;
            }

            if (npc.y > WORLD_HEIGHT * TILE_SIZE + 200) {
                npc.y = 0; // Respawn at top if falls out of world (Guide magic)
                npc.vy = 0;
            }
        });

        enemiesRef.current.forEach((e, id) => {
            if (e.health <= 0) return; 
            const dx = (p.x + p.width/2) - (e.x + e.width/2);
            const dy = (p.y + p.height/2) - (e.y + e.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 400 && dist > 10) {
                const moveDir = dx > 0 ? 1 : -1;
                const enemySpeed = ENEMY_STATS[e.type === EntityType.SLIME ? 'SLIME' : 'ZOMBIE'].speed || 0.2;
                e.vx += moveDir * enemySpeed * dt;
                
                if (e.grounded && (worldRef.current[Math.floor((e.y + e.height - 5)/TILE_SIZE) * WORLD_WIDTH + Math.floor((e.x + e.width/2 + moveDir * 20)/TILE_SIZE)] !== BlockType.AIR)) {
                    e.vy = JUMP_FORCE * 0.8;
                    e.grounded = false;
                }
            }
            
            e.vx *= frictionFactor;
            e.vy += GRAVITY * dt;
            e.x += e.vx * dt; checkCollision(e, 'x');
            e.y += e.vy * dt; checkCollision(e, 'y');

            if (e.iFrames && e.iFrames > 0) e.iFrames -= dt;

            if (!dev.godMode && (!p.iFrames || p.iFrames <= 0)) {
                if (p.x < e.x + e.width && p.x + p.width > e.x &&
                    p.y < e.y + e.height && p.y + p.height > e.y) {
                    
                    const dmg = ENEMY_STATS[e.type === EntityType.SLIME ? 'SLIME' : 'ZOMBIE'].damage;
                    
                    // Calculate Defense
                    let defense = 0;
                    const inv = inventoryRef.current;
                    if (inv[30] && inv[30]?.armorProps) defense += inv[30]!.armorProps!.defense;
                    if (inv[31] && inv[31]?.armorProps) defense += inv[31]!.armorProps!.defense;
                    if (inv[32] && inv[32]?.armorProps) defense += inv[32]!.armorProps!.defense;

                    const finalDmg = Math.max(1, dmg - defense);

                    p.health -= finalDmg;
                    setPlayerHealth(p.health);
                    p.iFrames = 60;
                    p.vx = (p.x < e.x ? -10 : 10);
                    p.vy = -5;
                    screenShakeRef.current = 5;
                    sfx.playBlip(100, 0.3, 'sawtooth', settingsRef.current.audioVolume);
                    if (p.health <= 0) respawnPlayer();
                }
            }

            if (e.y > WORLD_HEIGHT * TILE_SIZE + 200) {
                enemiesRef.current.delete(id);
            }
        });

        spawnEnemies(now);

        if (now - lastEnemySyncTime.current > 100) { 
            const enemiesList = Array.from(enemiesRef.current.values());
            broadcast('ENEMY_SYNC', { enemies: enemiesList });
            lastEnemySyncTime.current = now;
        }
    } else {
        enemiesRef.current.forEach((e) => {
             if (e.iFrames && e.iFrames > 0) e.iFrames -= dt;
        });
    }

    updateInteraction(now, dt);
    
    if (now - lastBroadcastTime.current > 40) { 
         broadcast('PLAYER_MOVE', { 
             x: parseFloat(p.x.toFixed(2)), 
             y: parseFloat(p.y.toFixed(2)), 
             vx: parseFloat(p.vx.toFixed(2)), 
             vy: parseFloat(p.vy.toFixed(2)), 
             facing: p.facing, 
             heldItem: inventoryRef.current[selectedSlotRef.current],
             animTimer: p.animTimer
         });
         lastBroadcastTime.current = now;
    }
  };

  const renderLoop = (time: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    
    if (lastTimeRef.current === 0) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;
    const dt = Math.min(delta, 50) / 16.667; 

    updatePhysics(time, dt);
    
    const targetX = playerRef.current.x + playerRef.current.width/2 - (canvas.width / zoom) / 2;
    const targetY = playerRef.current.y + playerRef.current.height/2 - (canvas.height / zoom) / 2;
    cameraRef.current.x += (targetX - cameraRef.current.x) * 0.1; cameraRef.current.y += (targetY - cameraRef.current.y) * 0.1;
    if (screenShakeRef.current > 0) {
        if (!settingsRef.current.performanceMode) { cameraRef.current.x += (Math.random() - 0.5) * screenShakeRef.current; cameraRef.current.y += (Math.random() - 0.5) * screenShakeRef.current; }
        screenShakeRef.current *= 0.88;
    }
    const camX = Math.floor(cameraRef.current.x), camY = Math.floor(cameraRef.current.y);
    ctx.save(); ctx.scale(zoom, zoom);
    
    const t = worldTimeRef.current;
    let skyColor = SKY_COLORS.DAY_TOP;
    if (t < 4000 || t > 20000) skyColor = SKY_COLORS.NIGHT_TOP;
    else if (t > 16000 && t < 20000) skyColor = '#c2410c'; // Sunset
    
    if (settingsRef.current.performanceMode) { 
        ctx.fillStyle = skyColor; 
        ctx.fillRect(0, 0, canvas.width/zoom, canvas.height/zoom); 
    } else { 
        const grd = ctx.createLinearGradient(0, 0, 0, canvas.height/zoom); 
        grd.addColorStop(0, skyColor); 
        grd.addColorStop(1, t < 4000 || t > 20000 ? SKY_COLORS.NIGHT_BOTTOM : SKY_COLORS.DAY_BOTTOM); 
        ctx.fillStyle = grd; 
        ctx.fillRect(0, 0, canvas.width/zoom, canvas.height/zoom); 
    }

    if (!settingsRef.current.performanceMode) {
        drawParallax(ctx, camX, camY, canvas.width, canvas.height, t, zoom);
    }

    const renderDist = settingsRef.current.renderDistance || 2;
    const loadPadding = Math.max(6, renderDist * 6); 
    const drawPadding = 2;

    const camChunkX = Math.floor(camX / (CHUNK_SIZE * TILE_SIZE));
    const camChunkY = Math.floor(camY / (CHUNK_SIZE * TILE_SIZE));
    
    const viewportChunksW = Math.ceil((canvas.width / zoom) / (CHUNK_SIZE * TILE_SIZE));
    const viewportChunksH = Math.ceil((canvas.height / zoom) / (CHUNK_SIZE * TILE_SIZE));

    const loadStartCX = camChunkX - loadPadding;
    const loadEndCX = camChunkX + viewportChunksW + loadPadding;
    const loadStartCY = camChunkY - loadPadding;
    const loadEndCY = camChunkY + viewportChunksH + loadPadding;

    const drawStartCX = camChunkX - drawPadding;
    const drawEndCX = camChunkX + viewportChunksW + drawPadding;
    const drawStartCY = camChunkY - drawPadding;
    const drawEndCY = camChunkY + viewportChunksH + drawPadding;

    // --- DEBUG: CHUNK BORDERS ---
    const showBorders = devSettingsRef.current.showChunkBorders;

    for (let cx = loadStartCX; cx <= loadEndCX; cx++) {
        for (let cy = loadStartCY; cy <= loadEndCY; cy++) {
             if (cx < 0 || cy < 0 || cx >= WORLD_WIDTH / CHUNK_SIZE || cy >= WORLD_HEIGHT / CHUNK_SIZE) continue;
             const key = `${cx},${cy}`;
             if (dirtyChunksRef.current.has(key) || !chunkCacheRef.current.has(key)) {
                 redrawChunk(cx, cy);
                 dirtyChunksRef.current.delete(key);
             }
             if (cx >= drawStartCX && cx <= drawEndCX && cy >= drawStartCY && cy <= drawEndCY) {
                 const entry = chunkCacheRef.current.get(key);
                 if (entry && !entry.isEmpty && entry.canvas) {
                     ctx.drawImage(entry.canvas, cx * CHUNK_SIZE * TILE_SIZE - camX, cy * CHUNK_SIZE * TILE_SIZE - camY);
                 }
                 
                 // Debug: Draw Border
                 if (showBorders) {
                     ctx.strokeStyle = '#06b6d4'; // Cyan
                     ctx.lineWidth = 1;
                     ctx.strokeRect(cx * CHUNK_SIZE * TILE_SIZE - camX, cy * CHUNK_SIZE * TILE_SIZE - camY, CHUNK_SIZE * TILE_SIZE, CHUNK_SIZE * TILE_SIZE);
                     
                     ctx.fillStyle = '#06b6d4';
                     ctx.font = '8px monospace';
                     ctx.fillText(`${cx},${cy}`, cx * CHUNK_SIZE * TILE_SIZE - camX + 2, cy * CHUNK_SIZE * TILE_SIZE - camY + 10);
                 }
             }
        }
    }

    if (!settingsRef.current.performanceMode && (t < 5000 || t > 19000)) {
        const darkness = t < 5000 ? (1 - t/5000) : (t - 19000)/5000;
        ctx.fillStyle = `rgba(0, 10, 30, ${darkness * 0.45})`;
        ctx.fillRect(0, 0, canvas.width/zoom, canvas.height/zoom);
    }

    if (miningRef.current.x >= 0) {
        const mx = miningRef.current.x;
        const my = miningRef.current.y;
        if (mx >= 0 && mx < WORLD_WIDTH && my >= 0 && my < WORLD_HEIGHT) {
             const b = worldRef.current[my * WORLD_WIDTH + mx];
             if (b !== BlockType.AIR) {
                 const maxH = BLOCK_MINING_STATS[b].hardness;
                 drawCracks(ctx, mx * TILE_SIZE - camX, my * TILE_SIZE - camY, miningRef.current.progress, maxH);
             }
        }
    }

    if (effectiveIsMobile && targetReticleRef.current.valid) {
        const {x, y} = targetReticleRef.current;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - camX, y - camY, TILE_SIZE, TILE_SIZE);
    }

    const drawP = (p: Entity) => {
      const rx = Math.floor(p.x - camX);
      const ry = Math.floor(p.y - camY);
      const cx = rx + p.width / 2;
      const cy = ry + p.height;

      ctx.save();
      ctx.translate(cx, cy);

      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI*2);
      ctx.fill();

      const stretch = Math.max(0.85, Math.min(1.15, 1 + Math.abs(p.vy) * 0.02 * (p.grounded ? -1 : 1)));
      const squash = 1 / stretch;
      ctx.scale(squash, stretch);

      const facingDir = p.facing === 'right' ? 1 : -1;
      
      const lean = (Math.abs(p.vx) > 0.1) ? (p.vx * 0.05) : 0;
      ctx.rotate(lean);

      ctx.scale(facingDir, 1);

      const isMoving = Math.abs(p.vx) > 0.1;
      const animTime = p.animTimer || 0;
      const walkCycle = animTime * 0.8; 
      
      const bob = isMoving ? Math.abs(Math.sin(walkCycle * 2)) * 2 : 0;
      const breath = !isMoving ? Math.sin(time / 200) * 1 : 0;

      // GET EQUIPPED ARMOR (If local player)
      let helmetItem, chestItem, legsItem;
      if (p.id === playerRef.current.id) {
          helmetItem = inventoryRef.current[30];
          chestItem = inventoryRef.current[31];
          legsItem = inventoryRef.current[32];
      }

      // Base Leg Color
      const pantColor = p.type === EntityType.GUIDE ? '#1e3a8a' : '#1e293b'; 

      // -- DRAW LEGS --
      const drawLeg = (isBack: boolean) => {
          ctx.save();
          ctx.translate(isBack ? -2 : 2, -10);
          ctx.rotate(isMoving ? (isBack ? -1 : 1) * Math.sin(walkCycle) * 0.6 : 0);
          
          // Pants Base
          ctx.fillStyle = pantColor;
          ctx.fillRect(-3, 0, 6, 12); 

          // Armor (Leggings)
          if (legsItem && legsItem.armorProps) {
              const ap = getToolPalette(legsItem.armorProps.tier);
              // Greave
              ctx.fillStyle = ap.base;
              ctx.fillRect(-3, 6, 6, 6); // Boot/Greave bottom
              ctx.fillStyle = ap.light;
              ctx.fillRect(-2, 7, 2, 4); // Shine
              
              // Knee Pad
              ctx.fillStyle = ap.dark;
              ctx.fillRect(-3, 4, 6, 2);
          }
          ctx.restore();
      };

      drawLeg(true); // Back Leg

      ctx.save();
      ctx.translate(0, -bob + breath);

      drawLeg(false); // Front Leg

      // -- DRAW TORSO --
      // Base Shirt
      ctx.fillStyle = p.color || settingsRef.current.playerColor;
      ctx.fillRect(-6, -22, 12, 12);
      
      // Armor (Chestplate)
      if (chestItem && chestItem.armorProps) {
          const ap = getToolPalette(chestItem.armorProps.tier);
          
          // Main Plate
          ctx.fillStyle = ap.base;
          ctx.fillRect(-6, -22, 12, 12); // Cover shirt
          
          // Detail / Shading
          ctx.fillStyle = ap.dark;
          ctx.fillRect(-2, -22, 4, 12); // Center strip
          
          ctx.fillStyle = ap.light; // Highlights
          ctx.fillRect(-5, -20, 2, 4);
          ctx.fillRect(3, -20, 2, 4);
          
          // Belt
          ctx.fillStyle = ap.outline;
          ctx.fillRect(-6, -11, 12, 2);
      } else {
          // Standard Shirt Detail
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(-6, -12, 12, 2);
      }

      ctx.save();
      ctx.translate(0, -22);
      ctx.rotate(-lean * 0.5 + (isMoving ? Math.sin(walkCycle * 2) * 0.05 : 0));
      
      // -- DRAW HEAD --
      ctx.fillStyle = p.skinColor || '#ffdbac';
      ctx.fillRect(-8, -16, 16, 16);
      
      // Face
      ctx.fillStyle = '#111';
      ctx.fillRect(2, -9, 2, 2);
      ctx.fillRect(-4, -9, 2, 2);

      // Hair
      if (!helmetItem) {
          ctx.fillStyle = p.hairColor || settingsRef.current.playerHair;
          ctx.fillRect(-9, -19, 18, 5);
          ctx.fillRect(-9, -19, 5, 14);
          ctx.fillRect(8, -14, 1, 4);
      } 
      // Armor (Helmet)
      else if (helmetItem.armorProps) {
          const ap = getToolPalette(helmetItem.armorProps.tier);
          const isDiamond = helmetItem.armorProps.tier >= 4;

          // Helmet Base
          ctx.fillStyle = ap.base;
          ctx.fillRect(-9, -19, 18, 14); // Full coverage sides
          ctx.fillRect(-9, -19, 18, 6);  // Top Dome thicker
          
          // Visor / Face Opening
          if (isDiamond) {
              // Full face helm with slit
              ctx.fillStyle = ap.dark;
              ctx.fillRect(-5, -11, 10, 8); // Dark visor area
              ctx.fillStyle = ap.base; 
              ctx.fillRect(-1, -11, 2, 8); // Vertical bar
              ctx.fillRect(-5, -8, 10, 2); // Horizontal bar
              
              // Wings/Horns
              ctx.fillStyle = ap.light;
              ctx.fillRect(-11, -20, 2, 6);
              ctx.fillRect(9, -20, 2, 6);
          } else {
              // Standard Helm (Open Face or T-slit)
              ctx.clearRect(-4, -13, 8, 8); // Cut out face hole from box
              ctx.fillStyle = p.skinColor || '#ffdbac'; // Re-draw face skin background just in case
              ctx.fillRect(-4, -13, 8, 8); 
              
              // Re-draw eyes since we covered them or cut them
              ctx.fillStyle = '#111';
              ctx.fillRect(2, -9, 2, 2);
              ctx.fillRect(-4, -9, 2, 2);
              
              // Nasal Guard
              ctx.fillStyle = ap.base;
              ctx.fillRect(-1, -13, 2, 4);
          }
          
          // Top Highlight
          ctx.fillStyle = ap.light;
          ctx.fillRect(-6, -18, 4, 2);
      }
      
      if (p.name) {
          ctx.save();
          ctx.scale(facingDir, 1);
          ctx.rotate(-lean + (lean*0.5)); 
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(-p.name.length * 3 - 4, -40, p.name.length * 6 + 8, 14);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(p.name, 0, -30);
          ctx.restore();
      }

      ctx.restore();
      
      // -- DRAW ARM --
      ctx.save();
      ctx.translate(0, -18);
      
      const heldItem = p.id === playerRef.current.id 
          ? inventoryRef.current[selectedSlotRef.current] 
          : (p as any).heldItem;

      const isSwinging = (p.id === playerRef.current.id) ? miningRef.current.swing > 0 : false;
      
      let armAngle = 0;

      if (isSwinging) {
           const swing = miningRef.current.swing;
           const start = -Math.PI / 1.5;
           const end = Math.PI / 2;
           armAngle = start + (end - start) * swing;
      } else {
           armAngle = isMoving ? -Math.sin(walkCycle) * 0.8 : 0.1;
      }

      ctx.rotate(armAngle);

      // Shoulder/Sleeve Base
      ctx.fillStyle = p.color || settingsRef.current.playerColor;
      ctx.fillRect(-3, -2, 6, 8);
      
      // Armor (Pauldrons overlay)
      if (chestItem && chestItem.armorProps) {
          const ap = getToolPalette(chestItem.armorProps.tier);
          ctx.fillStyle = ap.base;
          ctx.fillRect(-4, -3, 8, 5); // Shoulder pad
          ctx.fillStyle = ap.outline;
          ctx.fillRect(-4, -3, 8, 1); // Top trim
      }

      // Hand/Skin
      ctx.fillStyle = p.skinColor || '#ffdbac';
      ctx.fillRect(-2, 6, 4, 6);

      if (heldItem) {
          ctx.translate(0, 10);
          ctx.rotate(Math.PI / 2);

          if (heldItem.isBlock) {
             const size = 10;
             const scale = size/TILE_SIZE;
             ctx.save();
             ctx.translate(-size/2, -size/2);
             ctx.scale(scale, scale);
             drawBlock(ctx, 0, 0, heldItem.blockType as BlockType, 0, 0);
             ctx.restore();
          } else if (heldItem.isWall) {
             const size = 10;
             const scale = size/TILE_SIZE;
             ctx.save();
             ctx.translate(-size/2, -size/2);
             ctx.scale(scale, scale);
             drawWall(ctx, 0, 0, heldItem.wallType as WallType, 0, 0);
             ctx.restore();
          } else {
             const tier = heldItem.toolProps?.tier ?? 0;
             const type = heldItem.toolProps?.type as ToolType;
             
             let gripOffset = 0;
             if (type === ToolType.SWORD) gripOffset = -2.5;
             else if (type === ToolType.PICKAXE) gripOffset = -2.5;
             else if (type === ToolType.AXE) gripOffset = -2.5;
             else if (type === ToolType.SHOVEL) gripOffset = -1.5;

             const drawScale = 0.8;
             const pixelSize = 2 * drawScale;
             
             drawTool(ctx, type, tier, 0, gripOffset * pixelSize, drawScale);
          }
      }

      ctx.restore();
      ctx.restore();
      ctx.restore();

      if (devSettingsRef.current.showHitboxes) {
          ctx.strokeStyle = '#f00';
          ctx.lineWidth = 1;
          ctx.strokeRect(rx, ry, p.width, p.height);
      }
    };

    const drawE = (e: Entity) => {
        if (e.isDead) return;
        const rx = Math.floor(e.x - camX);
        const ry = Math.floor(e.y - camY);
        
        ctx.save();
        ctx.translate(rx + e.width/2, ry + e.height);
        
        if (e.iFrames && e.iFrames > 0) {
            ctx.scale(1.1 - Math.sin(time/20)*0.1, 0.9 + Math.sin(time/20)*0.1);
            ctx.filter = 'brightness(200%) sepia(100%) hue-rotate(-50deg) saturate(600%)';
        }

        const facingDir = e.facing === 'right' ? 1 : -1;
        ctx.scale(facingDir, 1);

        if (e.type === EntityType.SLIME) {
            const squish = Math.abs(Math.sin(time / 200)) * 0.2;
            const stretch = 1 + squish;
            const compress = 1 - squish;
            ctx.scale(stretch, compress);

            const color = e.color || '#4ade80';

            ctx.save();
            ctx.fillStyle = color;
            ctx.filter = 'brightness(0.7)';
            ctx.beginPath();
            const coreBob = Math.sin(time / 300) * 2;
            ctx.arc(0, -8 + coreBob, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.bezierCurveTo(-14, -8, -10, -20, 0, -20);
            ctx.bezierCurveTo(10, -20, 14, -8, 12, 0);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.ellipse(-6, -14, 3, 1.5, -0.4, 0, Math.PI*2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            const eyeY = -10 + Math.sin(time/200)*0.5;
            ctx.beginPath(); ctx.arc(-4, eyeY, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(4, eyeY, 2, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-3.5, eyeY-0.5, 0.8, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(4.5, eyeY-0.5, 0.8, 0, Math.PI*2); ctx.fill();
        } else {
            const walk = Math.sin(time / 100);
            const legColor = '#1e293b'; 
            
            ctx.save();
            ctx.translate(-4, -12);
            ctx.rotate(-Math.sin(walk) * 0.4);
            ctx.fillStyle = legColor;
            ctx.fillRect(-4, 0, 8, 12);
            ctx.restore();

            ctx.save();
            ctx.translate(4, -12);
            ctx.rotate(Math.sin(walk) * 0.4);
            ctx.fillStyle = legColor;
            ctx.fillRect(-4, 0, 8, 12);
            ctx.restore();

            ctx.save();
            ctx.translate(0, -12);
            ctx.rotate(walk * 0.1); 

            ctx.fillStyle = '#3b82f6'; 
            ctx.fillRect(-10, -20, 20, 20);
            
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(-8, -5, 4, 4);
            ctx.fillRect(4, -15, 3, 3);

            ctx.save();
            ctx.translate(0, -20);
            ctx.rotate(Math.sin(time / 250) * 0.1); 
            
            ctx.fillStyle = '#4ade80'; 
            ctx.fillRect(-10, -16, 20, 16); 
            
            ctx.fillStyle = '#000'; 
            ctx.fillRect(2, -10, 4, 4);
            ctx.fillRect(-6, -10, 4, 4);
            
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(-4, -4, 8, 2);
            ctx.restore();

            ctx.save();
            ctx.translate(0, -16); 
            ctx.rotate(-1.5 + Math.sin(time/150)*0.15); 
            
            ctx.fillStyle = '#3b82f6'; 
            ctx.fillRect(-2, -2, 8, 6);
            
            ctx.fillStyle = '#4ade80'; 
            ctx.fillRect(6, -1, 14, 4);
            
            ctx.restore();

            ctx.restore();
        }

        ctx.restore();
    };

    remotePlayersRef.current.forEach(drawP); 
    npcsRef.current.forEach(drawP);
    enemiesRef.current.forEach(drawE); 
    drawP(playerRef.current);

    // --- DEBUG: INFO OVERLAY ---
    if (devSettingsRef.current.debugInfo) {
        // Calculate grid pos under cursor
        const { x, y } = inputRef.current.mouse;
        const wx = Math.floor((x / zoom + camX) / TILE_SIZE);
        const wy = Math.floor((y / zoom + camY) / TILE_SIZE);
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x / zoom + 10, y / zoom + 10, 140, 65);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.strokeRect(x / zoom + 10, y / zoom + 10, 140, 65);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        
        let blockName = 'VOID';
        let lightVal = 0;
        if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
            const b = worldRef.current[wy * WORLD_WIDTH + wx];
            const w = wallsRef.current[wy * WORLD_WIDTH + wx];
            blockName = b !== BlockType.AIR ? BlockType[b] : (w !== WallType.AIR ? `WALL:${WallType[w]}` : 'AIR');
            lightVal = lightRef.current[wy * WORLD_WIDTH + wx] || 0;
        }

        const lines = [
            `X,Y: ${wx}, ${wy}`,
            `TILE: ${blockName}`,
            `LIGHT: ${(lightVal * 100).toFixed(0)}%`,
            `CAM: ${camX}, ${camY}`,
            `FPS: ${Math.round(1000/delta)}`
        ];

        lines.forEach((l, i) => {
            ctx.fillText(l, x / zoom + 18, y / zoom + 25 + (i * 12));
        });
        
        // Draw highlight
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx * TILE_SIZE - camX, wy * TILE_SIZE - camY, TILE_SIZE, TILE_SIZE);
    }
    
    const remainingParticles: Particle[] = [];
    const maxParticles = settingsRef.current.performanceMode ? 50 : 250;
    for (let i = 0; i < Math.min(particlesRef.current.length, maxParticles); i++) {
        const part = particlesRef.current[i];
        part.x += part.vx; part.y += part.vy; part.vy += 0.45; part.life++;
        if (part.life < part.maxLife) {
            ctx.fillStyle = part.color; 
            ctx.globalAlpha = 1 - part.life/part.maxLife; 
            ctx.fillRect(part.x - camX, part.y - camY, part.size, part.size);
            remainingParticles.push(part);
        }
    }
    particlesRef.current = remainingParticles;

    ctx.globalAlpha = 1; ctx.restore();
    requestRef.current = requestAnimationFrame(renderLoop);
  };

  useEffect(() => { if (isLoaded) requestRef.current = requestAnimationFrame(renderLoop); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }; }, [isLoaded]);

  const handleCopyId = () => {
      const id = roomId || myAssignedId;
      if (id) {
          navigator.clipboard.writeText(id);
          setCopiedId(true);
          setTimeout(() => setCopiedId(false), 2000);
      }
  };

  const testInterface: TestInterface = useMemo(() => ({
    playerRef,
    worldRef,
    wallsRef,
    inputRef,
    enemiesRef,
    inventoryRef,
    spawnEntity: spawnEntityAtLocation,
    setHealth: (hp: number) => {
        playerRef.current.health = hp;
        setPlayerHealth(hp);
    },
    teleport: (x: number, y: number) => {
        playerRef.current.x = x;
        playerRef.current.y = y;
        playerRef.current.vx = 0;
        playerRef.current.vy = 0;
    },
    setInventory: (items: (InventoryItem | null)[]) => {
        inventoryRef.current = items;
        setInventoryState([...items]);
    },
    addItem: addItemToInventory,
    refreshWorld: (minX: number, maxX: number) => updateLighting(minX, maxX)
  }), [spawnEntityAtLocation, addItemToInventory, updateLighting]);

  // Connection Timeout Safety Valve
  useEffect(() => {
      if (roomId && !isLoaded) {
          const timer = setTimeout(() => {
              setLoadingError("Connection timed out. Host may be offline or unreachable.");
          }, 15000);
          return () => clearTimeout(timer);
      }
  }, [roomId, isLoaded]);

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    const requestedId = roomId ? undefined : hostPeerId;
    let peer: any = null;
    try {
        peer = new (window as any).Peer(requestedId, { 
          debug: 1, 
          config: { 
            iceServers: [
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
            ],
            iceTransportPolicy: 'all' 
          }
        });
        peerRef.current = peer;
    } catch (e) { setLoadingError("Failed to initialize networking service."); isInitializingRef.current = false; return; }
    
    peer.on('error', (err: any) => {
        console.warn('PeerJS Error:', err);
        if (err.type === 'peer-unavailable') {
            setLoadingError(`Session "${roomId}" not found. Check the ID and try again.`);
        } else {
            setLoadingError(`Network Error: ${err.type || 'Unknown'}`);
        }
        isInitializingRef.current = false;
    });

    peer.on('open', (id: string) => { 
      setMyAssignedId(id); playerRef.current.id = id;
      if (!roomId) finishLoading();
      else setTimeout(() => { if (peerRef.current && !peerRef.current.destroyed) setupConnection(peerRef.current.connect(roomId, { reliable: true })); }, 800);
      isInitializingRef.current = false;
    });
    peer.on('connection', setupConnection);
    
    return () => {
        broadcast('PLAYER_LEAVE', {});
        if (peerRef.current) { try { peerRef.current.destroy(); } catch(e) {} }
        isInitializingRef.current = false; // Reset for Strict Mode re-mounts
    };
  }, [roomId, hostPeerId, setupConnection, broadcast, finishLoading]); 

  if (!isLoaded) return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#05080f] text-white">
        {loadingError ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                    <XCircle size={32} className="text-red-500" />
                </div>
                <div className="text-center max-w-md px-6">
                    <h3 className="text-xl font-black mb-2">CONNECTION FAILED</h3>
                    <p className="text-zinc-400 mb-6 font-mono text-xs">{loadingError}</p>
                    <button onClick={onExit} className="bg-white text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg active:scale-95">
                        Return to Menu
                    </button>
                </div>
            </div>
        ) : (
            <>
                <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
                <span className="font-bold tracking-widest animate-pulse text-xs text-zinc-400">{roomId ? 'JOINING SECURE FREQUENCY...' : 'GENERATING TERRAIN...'}</span>
                {roomId && <button onClick={onExit} className="mt-12 text-[10px] font-bold text-zinc-600 hover:text-red-400 border-b border-transparent hover:border-red-400/50 transition-all uppercase tracking-widest">Cancel Connection</button>}
            </>
        )}
    </div>
  );

  return (
    <div 
        ref={containerRef} 
        className="relative w-full h-full overflow-hidden touch-none select-none bg-[#0b0e14]" 
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
             if (e.isPrimary && (e.button === 0 || e.pointerType === 'touch')) {
                inputRef.current.mouse.leftDown = true;
                const rect = containerRef.current?.getBoundingClientRect();
                if(rect) {
                     inputRef.current.mouse.x = e.clientX - rect.left;
                     inputRef.current.mouse.y = e.clientY - rect.top;
                }
             }
             if (e.button === 2) inputRef.current.mouse.rightDown = true;
        }}
        onPointerMove={(e) => {
             if (e.isPrimary) {
                 const rect = containerRef.current?.getBoundingClientRect();
                 if(rect) {
                     inputRef.current.mouse.x = e.clientX - rect.left;
                     inputRef.current.mouse.y = e.clientY - rect.top;
                 }
             }
        }}
        onPointerUp={(e) => {
             if (e.isPrimary) inputRef.current.mouse.leftDown = false;
             if (e.button === 2) inputRef.current.mouse.rightDown = false;
        }}
        onPointerCancel={() => {
             inputRef.current.mouse.leftDown = false;
        }}
    >
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />
      
      {/* HUD Elements */}
      <div className="fixed top-0 left-0 right-0 p-4 sm:p-6 flex items-start justify-between pointer-events-none z-50 pt-[max(env(safe-area-inset-top),16px)]">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={onExit} className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-950/60 border border-white/10 rounded-xl text-white hover:bg-white/10 flex items-center justify-center backdrop-blur-xl transition-all active:scale-90"><ArrowLeft size={20} /></button>
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-950/60 border border-white/10 rounded-xl text-white hover:bg-white/10 flex items-center justify-center backdrop-blur-xl transition-all active:scale-90"><SettingsIcon size={20} /></button>
          
          <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-xl flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isDisconnected ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className="text-[10px] text-white font-black uppercase tracking-widest leading-none">{activePeersCount} ONLINE</span>
             <div className="w-px h-3 bg-white/20 mx-1"></div>
             <div className="flex flex-col">
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">Time</span>
                <span className="text-xs text-white font-black">{Math.floor(worldTime/1000).toString().padStart(2, '0')}:00</span>
             </div>
             {worldTime > 5000 && worldTime < 19000 ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-blue-400" />}
          </div>
          
          {myAssignedId && (
             <div className="hidden sm:flex bg-slate-950/60 px-3 py-2 rounded-xl border border-white/10 backdrop-blur-xl items-center gap-2 max-w-[200px] pointer-events-auto">
                <div className="flex flex-col overflow-hidden">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">Session ID</span>
                    <span className="text-xs text-white font-mono truncate w-full">{roomId || myAssignedId}</span>
                </div>
                <button onClick={handleCopyId} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95 shrink-0">
                    {copiedId ? <Check size={14} className="text-emerald-500"/> : <Copy size={14} />}
                </button>
             </div>
          )}
          {isDevUser && (
            <button onClick={() => setShowDevTools(prev => !prev)} className="bg-amber-500/20 px-3 py-2 rounded-xl border border-amber-500/50 backdrop-blur-xl flex items-center gap-2 hover:bg-amber-500/30 transition-all pointer-events-auto active:scale-95"><Terminal size={14} className="text-amber-400" /><span className="text-[10px] text-amber-400 font-black uppercase tracking-widest leading-none">DEV</span></button>
          )}
        </div>
        
        <HealthDisplay current={playerHealth} max={PLAYER_MAX_HEALTH} />
      </div>

      <div className={`fixed left-4 sm:left-6 bottom-24 sm:bottom-24 w-72 sm:w-96 flex flex-col justify-end pointer-events-none z-50 transition-all ${effectiveIsMobile ? 'bottom-40' : ''}`}>
        <div ref={chatMessagesRef} className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar-hidden pointer-events-auto pb-2">
            {chatMessages.map((msg) => {
                const opacity = isChatOpen ? 1 : Math.max(0, 1 - (Date.now() - msg.time) / 10000);
                if (opacity <= 0) return null;
                return (
                    <div key={msg.id} style={{ opacity }} className="text-sm font-bold drop-shadow-md transition-opacity duration-500">
                        <span style={{ color: msg.color }} className="mr-1 shadow-black drop-shadow-md">{msg.author}:</span>
                        <span className="text-white drop-shadow-md">{msg.text}</span>
                    </div>
                );
            })}
        </div>
        {isChatOpen && (
            <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10 animate-in slide-in-from-left-2 fade-in">
                <input 
                    ref={chatInputRef}
                    type="text" 
                    value={chatInputValue} 
                    onChange={e => setChatInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if(chatInputValue.trim()) sendChat(chatInputValue.trim());
                            setChatInputValue('');
                            setIsChatOpen(false);
                        }
                    }}
                    maxLength={100}
                    placeholder="Press Enter to send..."
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-500 font-bold"
                />
                <button onClick={() => { if(chatInputValue.trim()) sendChat(chatInputValue.trim()); setChatInputValue(''); setIsChatOpen(false); }} className="text-zinc-400 hover:text-white transition-colors">
                    <Send size={16} />
                </button>
            </div>
        )}
      </div>

      {/* NPC Dialogue Overlay */}
      {activeDialogue && (
          <div className="fixed bottom-32 sm:bottom-40 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-white/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl z-[70] max-w-[90vw] sm:max-w-md animate-in slide-in-from-bottom-4 fade-in duration-200 pointer-events-auto flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                  <MessageCircle size={20} />
              </div>
              <div className="flex-1">
                  <div className="text-xs font-black uppercase text-blue-400 mb-1 tracking-widest">{activeDialogue.speaker}</div>
                  <p className="text-sm font-medium text-white leading-relaxed">"{activeDialogue.text}"</p>
                  <div className="text-[9px] text-zinc-500 mt-2 font-bold uppercase tracking-wide">Press SPACE or Click to close</div>
              </div>
          </div>
      )}

      <Minimap 
          world={worldRef.current} 
          player={playerRef.current} 
          others={remotePlayersRef.current} 
          isOpen={true} 
          onToggle={() => setShowFullMap(prev => !prev)}
          isFullMap={showFullMap}
      />

      <Hotbar inventory={inventoryState} selectedIndex={selectedSlot} onSelect={setSelectedSlotState} isMobile={effectiveIsMobile} />
      
      <Inventory 
          isOpen={showInventory} 
          inventory={inventoryState} 
          onSwap={(a, b) => { 
              const inv = inventoryRef.current;
              // Validation for armor slots
              const isValid = (idx: number, item: InventoryItem | null) => {
                  if (!item) return true;
                  if (idx === 30) return item.armorProps?.type === ArmorType.HELMET;
                  if (idx === 31) return item.armorProps?.type === ArmorType.CHESTPLATE;
                  if (idx === 32) return item.armorProps?.type === ArmorType.LEGGINGS;
                  return true;
              };

              // Check if swap targets armor slots
              if ((a >= 30 && !isValid(a, inv[b])) || (b >= 30 && !isValid(b, inv[a]))) {
                  return; // Invalid swap
              }

              const tmp = inv[a]; 
              inv[a] = inv[b]; 
              inv[b] = tmp; 
              setInventoryState([...inv]); 
          }} 
          onClose={() => setShowInventory(false)} 
          addItem={addItemToInventory} 
          onUpdateSlot={(index, item) => { inventoryRef.current[index] = item; setInventoryState([...inventoryRef.current]); }}
          nearbyStations={getNearbyStations()}
      />
      
      <DevTools 
          isOpen={isDevUser && showDevTools} 
          onClose={() => setShowDevTools(false)} 
          settings={devSettings} 
          onUpdateSettings={setDevSettings} 
          onSpawnEntity={(type, count) => { 
            if (isHost) {
                const wx = playerRef.current.x + (playerRef.current.facing === 'right' ? 100 : -100); 
                for(let i=0; i<count; i++) spawnEntityAtLocation(type, wx + i*10, playerRef.current.y - 100); 
            }
          }} 
          onGiveItem={(item) => addItemToInventory(item)} 
          onTeleport={(x, y) => { 
             playerRef.current.x = x;
             playerRef.current.y = y;
             playerRef.current.vx = 0; 
             playerRef.current.vy = 0; 
          }} 
          onClearEnemies={() => { if (isHost) enemiesRef.current.clear(); }}
          onSetTime={(t) => { worldTimeRef.current = t; setWorldTime(t); }}
          onClearInventory={() => { inventoryRef.current.fill(null); setInventoryState([...inventoryRef.current]); }}
          playerPos={{ x: Math.floor(playerRef.current.x / TILE_SIZE), y: Math.floor(playerRef.current.y / TILE_SIZE) }} 
          entityCount={enemiesRef.current.size} 
          testInterface={testInterface}
          remotePlayers={remotePlayersList}
          roomId={roomId || myAssignedId || 'SINGLEPLAYER'}
          onJoinGame={onJoinGame}
      />
      
      <SettingsOverlay 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        inputMode={inputMode} 
        onInputModeChange={onInputModeChange} 
        settings={settings} 
        onSettingsChange={onSettingsChange} 
        onExit={onExit} 
        isIngame 
        onJoinGame={onJoinGame}
        onSaveGame={() => handleSaveGame()}
      />
      
      {effectiveIsMobile && !showInventory && !showSettings && !showFullMap && (
        <MobileControls 
            actionMode={mobileActionMode} 
            onToggleActionMode={() => setMobileActionMode(prev => prev === 'mine' ? 'place' : 'mine')} 
            onMove={(v) => { 
                inputRef.current.moveX = v.x; 
                inputRef.current.moveY = v.y; 
                if (Math.abs(v.y) > 0.5) {
                    inputRef.current.down = v.y > 0;
                } else {
                    inputRef.current.down = false;
                }
            }} 
            onAim={(v, active) => { 
                mobileAimRef.current = { x: v.x, y: v.y, active }; 
            }}
            onJumpStart={() => { inputRef.current.jump = true; }} 
            onJumpEnd={() => { inputRef.current.jump = false; }} 
            onInventoryToggle={() => setShowInventory(prev => !prev)} 
            onChatToggle={() => setIsChatOpen(prev => !prev)}
        />
      )}

      {/* Save Notification Toast */}
      {saveStatus && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 px-6 py-3 rounded-xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 z-[60]">
              {saveStatus === 'saving' ? (
                  <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                  <Check size={20} className="text-emerald-400" />
              )}
              <span className="font-bold text-white text-xs uppercase tracking-widest">
                  {saveStatus === 'saving' ? 'Saving World...' : 'Game Saved'}
              </span>
          </div>
      )}
    </div>
  );
};
