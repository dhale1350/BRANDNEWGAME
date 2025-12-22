import React, { useState, useEffect, useRef } from 'react';
import { DevSettings, EntityType, BlockType, InventoryItem, TestInterface, Entity, WallType } from '../types';
import { 
    X, Shield, Ghost, Hammer, Bug, Sun, Trash2, Gauge, Clock, Clipboard, 
    PlayCircle, CheckCircle, XCircle, Zap, Move, Eye, MapPin, Box, Briefcase,
    Sunrise, Sunset, Moon, Skull, Crosshair, User, Globe, Activity, Radio, ArrowRight, History, GripHorizontal, Palette, LayoutGrid
} from 'lucide-react';
import { CREATE_ITEM, TILE_SIZE, WORLD_WIDTH } from '../constants';
import { runSystemDiagnostics, DiagnosticResult } from '../utils/tests';
import { ItemIcon } from './ItemIcon';

interface DevToolsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DevSettings;
  onUpdateSettings: (s: DevSettings) => void;
  onSpawnEntity: (type: EntityType, count: number) => void;
  onGiveItem: (item: InventoryItem) => void;
  onTeleport: (location: string) => void;
  onClearEnemies: () => void;
  onSetTime: (time: number) => void;
  onClearInventory: () => void;
  playerPos: { x: number, y: number };
  entityCount: number;
  testInterface?: TestInterface;
  remotePlayers?: Entity[];
  roomId?: string;
  onJoinGame?: (id: string) => void;
}

const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1 pl-1">{children}</h3>
);

const ToggleBtn = ({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon?: any }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-2.5 rounded border transition-all active:scale-95 ${active ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm' : 'bg-slate-900 border-white/5 text-slate-500 hover:bg-slate-800'}`}>
        <div className="flex items-center gap-2">{icon}<span className="text-[10px] font-bold uppercase">{label}</span></div>
        <div className={`w-2 h-2 rounded-full shadow-inner ${active ? 'bg-amber-500 shadow-amber-500/50' : 'bg-slate-700'}`} />
    </button>
);

const ActionBtn = ({ label, onClick, icon, danger }: { label: string, onClick: () => void, icon?: any, danger?: boolean }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded border transition-all active:scale-95 hover:bg-white/5 ${danger ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-slate-800 border-white/5 text-slate-400'}`}>
        {icon}
        <span className="text-[9px] font-bold uppercase text-center leading-none">{label}</span>
    </button>
);

const IconButton = ({ icon, onClick, title }: { icon: any, onClick: () => void, title: string }) => (
    <button onClick={onClick} title={title} className="flex items-center justify-center p-3 rounded bg-slate-800 border border-white/5 text-slate-400 hover:text-amber-400 hover:bg-white/10 active:scale-95 transition-all">
        {icon}
    </button>
);

const ItemBtn: React.FC<{ onClick: () => void, item: InventoryItem }> = ({ onClick, item }) => (
    <button onClick={onClick} className="h-10 w-10 rounded bg-slate-800 border border-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all relative group" title={item.name}>
        <ItemIcon item={item} size={28} />
        {item.count > 1 && <span className="absolute bottom-0 right-1 text-[8px] font-bold text-white shadow-black drop-shadow-md">{item.count}</span>}
    </button>
);

export const DevTools: React.FC<DevToolsProps> = ({
  isOpen, onClose, settings, onUpdateSettings, onSpawnEntity, onGiveItem, onTeleport, 
  onClearEnemies, onSetTime, onClearInventory, playerPos, entityCount, testInterface, remotePlayers = [],
  roomId, onJoinGame
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'world' | 'items' | 'visual' | 'network' | 'tests'>('general');
  const [fps, setFps] = useState(0);
  const [testResults, setTestResults] = useState<DiagnosticResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [recentWorlds, setRecentWorlds] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[]>([]);
  
  // Dragging state
  const [pos, setPos] = useState({ x: Math.min(window.innerWidth - 340, 100), y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  useEffect(() => {
    if (!isOpen) return;
    let fc = 0, lt = performance.now(), req: number;
    const loop = () => {
      fc++; const now = performance.now();
      if (now - lt >= 1000) { setFps(Math.round((fc * 1000) / (now - lt))); fc = 0; lt = now; }
      req = requestAnimationFrame(loop);
    };
    req = requestAnimationFrame(loop);
    
    // Load Recents
    const stored = localStorage.getItem('terrarium_recent_worlds');
    if (stored) setRecentWorlds(JSON.parse(stored));

    return () => cancelAnimationFrame(req);
  }, [isOpen]);

  useEffect(() => {
      const handleMove = (e: MouseEvent) => {
          if (!isDragging) return;
          const dx = e.clientX - dragRef.current.startX;
          const dy = e.clientY - dragRef.current.startY;
          setPos({ x: dragRef.current.initX + dx, y: dragRef.current.initY + dy });
      };
      const handleUp = () => setIsDragging(false);

      if (isDragging) {
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mouseup', handleUp);
      };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      dragRef.current = { startX: e.clientX, startY: e.clientY, initX: pos.x, initY: pos.y };
  };

  const runTests = async () => {
      if (!testInterface) return;
      setIsRunningTests(true);
      setTestResults(null);
      setTimeout(async () => {
          const results = await runSystemDiagnostics(testInterface);
          setTestResults(results);
          setIsRunningTests(false);
      }, 100);
  };

  const startScan = () => {
      setIsScanning(true);
      setScanResults([]);
      // Simulated scan delay and discovery for effect
      setTimeout(() => {
          setScanResults([
              'DEV_TEST_WORLD_1',
              'PUBLIC_LOBBY_ALPHA',
              Math.random().toString(36).substr(2, 7).toUpperCase()
          ]);
          setIsScanning(false);
      }, 1500);
  };

  const handleJoin = (id: string) => {
      if (onJoinGame) onJoinGame(id);
      onClose();
  };

  const spawnBlockPalette = () => {
      if (!testInterface) return;
      const { playerRef, worldRef, wallsRef } = testInterface;
      const px = Math.floor(playerRef.current.x / TILE_SIZE);
      const py = Math.floor(playerRef.current.y / TILE_SIZE);
      
      const blocks = Object.values(BlockType).filter(v => typeof v === 'number' && v !== 0) as number[];
      const startX = px - Math.floor(blocks.length/2);

      // Build a platform
      for(let i=0; i<blocks.length; i++) {
          const x = startX + i;
          const y = py - 2;
          if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < 200) {
              worldRef.current[y * WORLD_WIDTH + x] = blocks[i];
              // Clear wall behind to see block clearly? or set wall
              wallsRef.current[y * WORLD_WIDTH + x] = WallType.AIR;
              // Platform below
              worldRef.current[(y+1) * WORLD_WIDTH + x] = BlockType.WOOD;
          }
      }
      testInterface.refreshWorld(startX - 2, startX + blocks.length + 2);
  };

  const spawnWallPalette = () => {
      if (!testInterface) return;
      const { playerRef, worldRef, wallsRef } = testInterface;
      const px = Math.floor(playerRef.current.x / TILE_SIZE);
      const py = Math.floor(playerRef.current.y / TILE_SIZE);
      
      const walls = Object.values(WallType).filter(v => typeof v === 'number' && v !== 0) as number[];
      const startX = px - Math.floor(walls.length/2);

      for(let i=0; i<walls.length; i++) {
          const x = startX + i;
          const y = py - 5; // Higher up
          if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < 200) {
              wallsRef.current[y * WORLD_WIDTH + x] = walls[i];
              worldRef.current[y * WORLD_WIDTH + x] = BlockType.AIR; // Clear block to see wall
              // Platform below
              worldRef.current[(y+1) * WORLD_WIDTH + x] = BlockType.WOOD;
          }
      }
      testInterface.refreshWorld(startX - 2, startX + walls.length + 2);
  };

  const copyReport = () => {
      if (!testResults) return;
      const report = [
          `TERRARIUM JS DIAGNOSTIC REPORT`,
          `timestamp: ${new Date().toISOString()}`,
          `userAgent: ${navigator.userAgent}`,
          `fps: ${fps}`,
          `pos: ${playerPos.x},${playerPos.y}`,
          `entities: ${entityCount}`,
          `cheats: ${JSON.stringify(settings)}`,
          ``,
          `--- TEST RESULTS ---`,
          ...testResults.map(r => `[${r.passed ? 'PASS' : 'FAIL'}] [${r.category}] ${r.name}: ${r.details}`)
      ].join('\n');
      navigator.clipboard.writeText(report).then(() => alert('Report copied to clipboard!'));
  };

  if (!isOpen) return null;

  const toggle = (key: keyof DevSettings) => onUpdateSettings({ ...settings, [key]: !settings[key] });
  const setVal = (key: keyof DevSettings, val: any) => onUpdateSettings({ ...settings, [key]: val });

  return (
    <div 
        style={{ left: pos.x, top: pos.y }}
        className="fixed z-[100] w-80 bg-slate-950/95 border border-amber-500/30 rounded-lg shadow-2xl backdrop-blur-md flex flex-col overflow-hidden font-mono text-sm max-h-[80vh] animate-in slide-in-from-right-10 duration-200"
    >
      <div 
        onMouseDown={handleMouseDown}
        className="bg-slate-900 p-3 border-b border-amber-500/20 flex items-center justify-center relative cursor-move select-none"
      >
        <div className="absolute left-3 flex items-center gap-2 text-amber-500"><Bug size={16} /><span className="font-bold uppercase text-xs tracking-wider">Dev Console</span></div>
        <GripHorizontal size={16} className="text-slate-700" />
        <button onClick={onClose} className="absolute right-3 text-slate-500 hover:text-white" onMouseDown={e => e.stopPropagation()}><X size={16} /></button>
      </div>

      <div className="bg-black/40 px-3 py-1.5 flex justify-between text-[10px] text-slate-400 border-b border-white/5">
        <span>FPS: <span className="text-emerald-400 font-bold">{fps}</span></span>
        <span>POS: <span className="text-blue-400 font-bold">{playerPos.x}, {playerPos.y}</span></span>
        <span>ENT: <span className="text-red-400 font-bold">{entityCount}</span></span>
      </div>

      <div className="flex bg-slate-900 border-b border-white/5 overflow-x-auto no-scrollbar">
        {[
            { id: 'general', icon: <Zap size={12}/> },
            { id: 'world', icon: <MapPin size={12}/> },
            { id: 'items', icon: <Briefcase size={12}/> },
            { id: 'visual', icon: <Palette size={12}/> },
            { id: 'network', icon: <Globe size={12}/> },
            { id: 'tests', icon: <Clipboard size={12}/> }
        ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] uppercase font-bold transition-colors min-w-[50px] ${activeTab === tab.id ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}>
                {tab.icon}
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        
        {activeTab === 'general' && (
            <div className="space-y-4">
                <div className="space-y-2">
                    <SectionTitle>Player Cheats</SectionTitle>
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleBtn label="God Mode" active={settings.godMode} onClick={() => toggle('godMode')} icon={<Shield size={14} />} />
                        <ToggleBtn label="No Clip" active={settings.noclip} onClick={() => toggle('noclip')} icon={<Ghost size={14} />} />
                        <ToggleBtn label="Super Speed" active={settings.superSpeed} onClick={() => toggle('superSpeed')} icon={<Zap size={14} />} />
                        <ToggleBtn label="Inf. Reach" active={settings.infiniteReach} onClick={() => toggle('infiniteReach')} icon={<Move size={14} />} />
                    </div>
                </div>

                <div className="space-y-2">
                    <SectionTitle>World Interaction</SectionTitle>
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleBtn label="Insta-Mine" active={settings.instaMine} onClick={() => toggle('instaMine')} icon={<Hammer size={14} />} />
                        <ToggleBtn label="Hitboxes" active={settings.showHitboxes} onClick={() => toggle('showHitboxes')} icon={<Eye size={14} />} />
                    </div>
                </div>

                <div className="space-y-2">
                    <SectionTitle>Physics</SectionTitle>
                    <div className="space-y-1 bg-slate-900 p-2 rounded border border-white/5">
                        <div className="flex justify-between text-[10px] uppercase text-zinc-500 font-bold">
                            <span className="flex items-center gap-1"><Gauge size={10}/> Gravity Scale</span>
                            <span className="text-amber-500">{settings.gravityScale.toFixed(1)}x</span>
                        </div>
                        <input type="range" min="0" max="3" step="0.1" value={settings.gravityScale} onChange={e => setVal('gravityScale', parseFloat(e.target.value))} className="w-full h-1 bg-zinc-800 accent-amber-500 rounded-lg cursor-pointer" />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'world' && (
            <div className="space-y-5">
                <div className="space-y-2">
                    <SectionTitle>Time of Day</SectionTitle>
                    <div className="grid grid-cols-4 gap-1">
                        <IconButton icon={<Sunrise size={14}/>} onClick={() => onSetTime(0)} title="Dawn" />
                        <IconButton icon={<Sun size={14}/>} onClick={() => onSetTime(6000)} title="Noon" />
                        <IconButton icon={<Sunset size={14}/>} onClick={() => onSetTime(12000)} title="Dusk" />
                        <IconButton icon={<Moon size={14}/>} onClick={() => onSetTime(18000)} title="Midnight" />
                    </div>
                    <div className="space-y-1 bg-slate-900 p-2 rounded border border-white/5">
                        <div className="flex justify-between text-[10px] uppercase text-zinc-500 font-bold">
                            <span className="flex items-center gap-1"><Clock size={10}/> Time Speed</span>
                            <span className="text-blue-400">{settings.timeScale.toFixed(0)}x</span>
                        </div>
                        <input type="range" min="0" max="100" step="1" value={settings.timeScale} onChange={e => setVal('timeScale', parseInt(e.target.value))} className="w-full h-1 bg-zinc-800 accent-blue-500 rounded-lg cursor-pointer" />
                    </div>
                    <ToggleBtn label="Freeze Time" active={settings.freezeTime} onClick={() => toggle('freezeTime')} icon={<Clock size={14} />} />
                </div>

                <div className="space-y-2">
                    <SectionTitle>Teleportation</SectionTitle>
                    <div className="grid grid-cols-3 gap-2">
                        <ActionBtn label="Surface" onClick={() => onTeleport('surface')} icon={<Sun size={14} />} />
                        <ActionBtn label="Hell" onClick={() => onTeleport('hell')} icon={<Skull size={14} />} />
                        <ActionBtn label="Origin" onClick={() => onTeleport('origin')} icon={<Crosshair size={14} />} />
                    </div>
                </div>

                {remotePlayers.length > 0 && (
                    <div className="space-y-2">
                        <SectionTitle>Connected Players</SectionTitle>
                        <div className="space-y-1">
                            {remotePlayers.map((p, i) => (
                                <button key={i} onClick={() => onTeleport(`player:${p.id}`)} className="w-full flex items-center justify-between p-2 rounded border bg-slate-800 border-white/5 text-slate-400 hover:bg-white/10 transition-all text-xs">
                                    <span className="flex items-center gap-2"><User size={12} className="text-blue-400" /> {p.name || 'Unknown'}</span>
                                    <span className="text-[10px] font-mono text-zinc-500">TP</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <SectionTitle>Entity Spawner</SectionTitle>
                    <div className="grid grid-cols-2 gap-2">
                        <ActionBtn label="Slime" onClick={() => onSpawnEntity(EntityType.SLIME, 1)} />
                        <ActionBtn label="Zombie" onClick={() => onSpawnEntity(EntityType.ZOMBIE, 1)} />
                        <ActionBtn label="Horde (5x)" onClick={() => onSpawnEntity(EntityType.ZOMBIE, 5)} icon={<Ghost size={14} />} />
                        <ActionBtn label="Kill All" onClick={onClearEnemies} icon={<Trash2 size={14} />} danger />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'items' && (
            <div className="space-y-5">
                <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <SectionTitle>Tools & Combat</SectionTitle>
                        <button onClick={onClearInventory} className="text-[10px] text-red-500 font-bold hover:text-red-400 uppercase flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded"><Trash2 size={10}/> Clear</button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.wood_pickaxe())} item={CREATE_ITEM.wood_pickaxe()} />
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.wood_sword())} item={CREATE_ITEM.wood_sword()} />
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.iron_pickaxe())} item={CREATE_ITEM.iron_pickaxe()} />
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.iron_sword())} item={CREATE_ITEM.iron_sword()} />
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.diamond_pickaxe())} item={CREATE_ITEM.diamond_pickaxe()} />
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.diamond_sword())} item={CREATE_ITEM.diamond_sword()} />
                     </div>
                </div>

                <div className="space-y-2">
                    <SectionTitle>Armor Sets</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.iron_helmet())} item={CREATE_ITEM.iron_helmet()} />
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.iron_chestplate())} item={CREATE_ITEM.iron_chestplate()} />
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.iron_leggings())} item={CREATE_ITEM.iron_leggings()} />
                        <div className="w-px h-10 bg-white/10 mx-1"/>
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.diamond_helmet())} item={CREATE_ITEM.diamond_helmet()} />
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.diamond_chestplate())} item={CREATE_ITEM.diamond_chestplate()} />
                        <ItemBtn onClick={() => onGiveItem(CREATE_ITEM.diamond_leggings())} item={CREATE_ITEM.diamond_leggings()} />
                    </div>
                </div>

                <div className="space-y-2">
                    <SectionTitle>Resources</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                        {[
                            BlockType.DIRT, BlockType.GRASS, BlockType.STONE, BlockType.WOOD, BlockType.LEAVES,
                            BlockType.SAND, BlockType.GLASS, BlockType.BRICK, BlockType.COAL, BlockType.IRON,
                            BlockType.GOLD, BlockType.DIAMOND, BlockType.FURNACE, BlockType.ANVIL
                        ].map(b => {
                            const item = CREATE_ITEM.block(b);
                            item.count = 64;
                            return <ItemBtn key={b} onClick={() => onGiveItem(item)} item={item} />;
                        })}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'visual' && (
            <div className="space-y-5">
                <div className="space-y-2">
                    <SectionTitle>Rendering Tests</SectionTitle>
                    <p className="text-[10px] text-slate-500 mb-2">Spawns a row of every block/wall type near player to verify rendering assets.</p>
                    <div className="grid grid-cols-1 gap-2">
                        <ActionBtn label="Spawn Block Palette" onClick={spawnBlockPalette} icon={<LayoutGrid size={14} />} />
                        <ActionBtn label="Spawn Wall Palette" onClick={spawnWallPalette} icon={<Box size={14} />} />
                    </div>
                </div>
                {!testInterface && <div className="text-red-500 text-[10px] text-center italic">Game interface required</div>}
            </div>
        )}

        {activeTab === 'network' && (
            <div className="space-y-5">
                <div className="bg-blue-900/20 border border-blue-500/20 rounded p-3">
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <Radio size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Current Frequency</span>
                    </div>
                    <div className="font-mono text-lg text-white font-bold select-all bg-black/30 p-2 rounded text-center truncate">
                        {roomId || 'OFFLINE'}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
                        <span>Status: <span className="text-emerald-400">ACTIVE</span></span>
                        <span>Peers: {remotePlayers.length + 1}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <SectionTitle>World Scanner</SectionTitle>
                    <button onClick={startScan} disabled={isScanning} className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-zinc-300 p-2 rounded border border-white/5 flex items-center justify-center gap-2 transition-all">
                        <Activity size={14} className={isScanning ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-bold uppercase">{isScanning ? 'Scanning Frequencies...' : 'Scan for Active Worlds'}</span>
                    </button>
                    
                    {scanResults.length > 0 && (
                        <div className="space-y-1 animate-in slide-in-from-top-2">
                            {scanResults.map((id) => (
                                <div key={id} className="flex items-center justify-between p-2 bg-emerald-900/10 border border-emerald-500/20 rounded">
                                    <span className="text-xs font-mono text-emerald-400">{id}</span>
                                    <button onClick={() => handleJoin(id)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                        Join <ArrowRight size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <SectionTitle>Recent History</SectionTitle>
                    {recentWorlds.length === 0 && <div className="text-center py-4 text-xs text-zinc-600 italic">No recent worlds found.</div>}
                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                         {recentWorlds.map((id, i) => (
                             <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 border border-white/5 rounded hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <History size={12} className="text-zinc-500" />
                                    <span className="text-xs font-mono text-zinc-300 truncate">{id}</span>
                                </div>
                                <button onClick={() => handleJoin(id)} className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all">
                                    Join
                                </button>
                             </div>
                         ))}
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                    <SectionTitle>Direct Connect</SectionTitle>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={joinInput}
                            onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                            placeholder="ROOM ID" 
                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50"
                        />
                        <button onClick={() => handleJoin(joinInput)} disabled={!joinInput} className="bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white px-3 rounded flex items-center justify-center">
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'tests' && (
            <div className="space-y-4">
                <div className="flex gap-2">
                    <button onClick={runTests} disabled={isRunningTests || !testInterface} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 border border-blue-400/30 shadow-lg shadow-blue-900/20">
                        {isRunningTests ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <PlayCircle size={16} />}
                        <span className="font-bold uppercase text-xs">Run Diagnostic Suite</span>
                    </button>
                    {testResults && (
                        <button onClick={copyReport} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 rounded flex items-center justify-center transition-all active:scale-95 border border-white/10" title="Copy Report">
                            <Clipboard size={16} />
                        </button>
                    )}
                </div>

                {!testInterface && <div className="text-red-500 text-[10px] text-center font-bold bg-red-500/10 p-2 rounded">Test Interface Not Connected</div>}

                {testResults ? (
                    <div className="space-y-2 animate-in slide-in-from-bottom-2">
                        {testResults.map((r, i) => (
                            <div key={i} className={`p-2 rounded border flex items-start gap-2 ${r.passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <div className={`mt-0.5 ${r.passed ? 'text-emerald-500' : 'text-red-500'}`}>{r.passed ? <CheckCircle size={14} /> : <XCircle size={14} />}</div>
                                <div>
                                    <div className={`text-[10px] font-black uppercase ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>{r.category} / {r.name}</div>
                                    <div className="text-[10px] text-slate-400 leading-tight">{r.details}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-600 text-xs italic bg-black/20 rounded border border-white/5">
                        Run diagnostics to check system integrity and live gameplay mechanics.
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};