
export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
}

export enum InputMode {
  AUTO = 'auto',
  KEYBOARD_MOUSE = 'kb_mouse',
  CONTROLLER = 'controller',
  TOUCH = 'touch',
}

export interface GameSettings {
  showGrid: boolean;
  screenShake: boolean;
  smoothLighting: boolean;
  audioVolume: number;
  playerName: string;
  playerColor: string;
  playerHair: string;
  playerSkin: string;
  performanceMode: boolean;
  renderDistance: number; 
  fov: number; // 1.0 to 2.5
  uiScale: number; // 0.8 to 1.2
}

export interface DevSettings {
  godMode: boolean;
  noclip: boolean;
  superSpeed: boolean;
  instaMine: boolean;
  infiniteReach: boolean;
  showHitboxes: boolean;
  gravityScale: number;
  timeScale: number;
  freezeTime: boolean;
}

export enum BlockType {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  BEDROCK = 6,
  COAL = 7,
  IRON = 8,
  GOLD = 9,
  DIAMOND = 10,
  SAND = 11,
  GLASS = 12,
  BRICK = 13,
  FURNACE = 14,
  ANVIL = 15,
}

export enum WallType {
  AIR = 0,
  DIRT = 1,
  STONE = 2,
  WOOD = 3,
  BRICK = 4,
}

export enum ToolType {
  NONE = 'none',
  PICKAXE = 'pickaxe',
  AXE = 'axe',
  SHOVEL = 'shovel',
  SWORD = 'sword',
}

export enum ArmorType {
  HELMET = 'helmet',
  CHESTPLATE = 'chestplate',
  LEGGINGS = 'leggings'
}

export enum EntityType {
  PLAYER = 'player',
  SLIME = 'slime',
  ZOMBIE = 'zombie',
  GUIDE = 'guide',
}

export interface ToolProps {
  type: ToolType;
  efficiency: number;
  tier: number;
  damage?: number;
  knockback?: number;
  swingSpeed?: number;
  attackRange?: number;
  scale?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  maxStack: number;
  isBlock: boolean;
  blockType?: BlockType;
  isWall?: boolean;
  wallType?: WallType;
  toolProps?: ToolProps;
  armorProps?: {
    type: ArmorType;
    defense: number;
    tier: number;
  };
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  grounded: boolean;
  health: number;
  maxHealth: number;
  id?: string;
  type?: EntityType;
  color?: string;
  hairColor?: string;
  skinColor?: string;
  name?: string;
  isDead?: boolean;
  facing?: 'left' | 'right';
  animTimer?: number;
  iFrames?: number;
  jumpTimer?: number;
  targetId?: string;
  heldItem?: InventoryItem | null;
  targetX?: number;
  targetY?: number;
  // NPC specific
  state?: 'idle' | 'walk' | 'flee';
  stateTimer?: number;
  dialogueIndex?: number;
  // Armor visuals for multiplayer
  helmetColor?: string;
  chestColor?: string;
  legsColor?: string;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  moveX: number;
  moveY: number;
  isGamepadActive: boolean;
  mouse: {
    x: number;
    y: number;
    leftDown: boolean;
    rightDown: boolean;
  };
}

export type NetworkMessageType = 
  | 'PLAYER_MOVE' 
  | 'WORLD_CHANGE' 
  | 'WALL_CHANGE'
  | 'PLAYER_JOIN' 
  | 'PLAYER_LEAVE' 
  | 'INIT_SYNC'
  | 'REQUEST_INIT'
  | 'PEER_LIST'
  | 'ENEMY_SYNC'
  | 'ENEMY_HIT'
  | 'CHAT'
  | 'TIME_SYNC';

export interface NetworkMessage {
  type: NetworkMessageType;
  payload: any;
  senderId: string;
}

export interface TestInterface {
  playerRef: any;
  worldRef: any;
  wallsRef: any;
  inputRef: any;
  enemiesRef: any;
  inventoryRef: any;
  spawnEntity: (type: EntityType, x: number, y: number) => void;
  setHealth: (hp: number) => void;
  teleport: (x: number, y: number) => void;
  setInventory: (items: (InventoryItem | null)[]) => void;
  addItem: (item: InventoryItem) => boolean;
  refreshWorld: (minX: number, maxX: number) => void;
}
