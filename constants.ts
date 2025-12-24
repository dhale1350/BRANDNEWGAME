

import { BlockType, WallType, InventoryItem, ToolType, ArmorType } from './types';

export const TILE_SIZE = 32;
export const CHUNK_SIZE = 16; 
export const WORLD_WIDTH = 400;
export const WORLD_HEIGHT = 180;
export const GRAVITY = 0.60; 
export const FRICTION = 0.88; 
export const MOVE_SPEED = 0.55; 
export const JUMP_FORCE = -11.5; 
export const MAX_FALL_SPEED = 24;
export const PLAYER_WIDTH = 0.75 * TILE_SIZE;
export const PLAYER_HEIGHT = 1.7 * TILE_SIZE;

export const PLAYER_MAX_HEALTH = 100;

export const SKY_COLORS = {
  DAY_TOP: '#3b82f6',
  DAY_BOTTOM: '#93c5fd',
  NIGHT_TOP: '#020617',
  NIGHT_BOTTOM: '#1e293b',
};

export const BLOCK_COLORS: Record<BlockType, string> = {
  [BlockType.AIR]: 'transparent',
  [BlockType.DIRT]: '#795548',
  [BlockType.GRASS]: '#4caf50',
  [BlockType.STONE]: '#78909c',
  [BlockType.WOOD]: '#5d4037',
  [BlockType.LEAVES]: '#388e3c',
  [BlockType.BEDROCK]: '#1a1a1a',
  [BlockType.COAL]: '#263238',
  [BlockType.IRON]: '#d7ccc8',
  [BlockType.GOLD]: '#ffd740',
  [BlockType.DIAMOND]: '#00e5ff',
  [BlockType.SAND]: '#f0e68c',
  [BlockType.GLASS]: 'rgba(178, 235, 242, 0.4)',
  [BlockType.BRICK]: '#b71c1c',
  [BlockType.FURNACE]: '#374151',
  [BlockType.ANVIL]: '#1f2937',
  [BlockType.SNOW]: '#f8fafc',
  [BlockType.ICE]: '#93c5fd',
  [BlockType.CACTUS]: '#4d7c0f',
  [BlockType.SANDSTONE]: '#d4a373',
  [BlockType.PINE_LEAVES]: '#14532d',
  [BlockType.WATER]: 'rgba(66, 165, 245, 0.6)',
  [BlockType.LAVA]: '#ef4444',
  [BlockType.CHEST]: '#8d6e63',
};

export const WALL_COLORS: Record<WallType, string> = {
  [WallType.AIR]: 'transparent',
  [WallType.DIRT]: '#4e342e',
  [WallType.STONE]: '#455a64',
  [WallType.WOOD]: '#3e2723',
  [WallType.BRICK]: '#7f1d1d',
  [WallType.SANDSTONE]: '#a16207',
  [WallType.SNOW]: '#cbd5e1',
};

export const TOOL_COLORS: Record<number, string> = {
  0: '#a0522d', // Wood
  1: '#90a4ae', // Stone
  2: '#b0bec5', // Iron
  3: '#ffca28', // Gold
  4: '#4dd0e1', // Diamond
};

export const ENEMY_STATS = {
  SLIME: { hp: 30, damage: 10, speed: 0.4, color: '#4ade80', width: 28, height: 20 },
  ZOMBIE: { hp: 60, damage: 20, speed: 0.6, color: '#4d7c0f', width: 24, height: 48 },
  GUIDE: { hp: 250, damage: 0, speed: 0.5, color: '#ef4444', width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
};

export const NPC_DIALOGUES = [
    "You should build a shelter before nightfall. The zombies are relentless!",
    "Press 'E' to open your inventory. You can craft new items there.",
    "Dig deep underground to find precious ores like Iron and Gold.",
    "If you get lost, check your Map with 'M'.",
    "Torches are essential for exploring caves. Craft them with Wood and Coal.",
    "I saw a strange eye watching me from the darkness last night...",
    "Walls are needed to make a house safe and cozy.",
    "Try using different tools. Pickaxes for stone, Axes for wood!",
    "Be careful near the bottom of the world. The lava is dangerous.",
];

export const BLOCK_MINING_STATS: Record<BlockType, { hardness: number; requiredTool: ToolType; minTier: number }> = {
  [BlockType.AIR]: { hardness: 0, requiredTool: ToolType.NONE, minTier: 0 },
  [BlockType.DIRT]: { hardness: 8, requiredTool: ToolType.SHOVEL, minTier: 0 },
  [BlockType.SAND]: { hardness: 6, requiredTool: ToolType.SHOVEL, minTier: 0 },
  [BlockType.GRASS]: { hardness: 8, requiredTool: ToolType.SHOVEL, minTier: 0 },
  [BlockType.WOOD]: { hardness: 20, requiredTool: ToolType.AXE, minTier: 0 },
  [BlockType.LEAVES]: { hardness: 2, requiredTool: ToolType.AXE, minTier: 0 },
  [BlockType.STONE]: { hardness: 40, requiredTool: ToolType.PICKAXE, minTier: 0 },
  [BlockType.COAL]: { hardness: 65, requiredTool: ToolType.PICKAXE, minTier: 0 },
  [BlockType.IRON]: { hardness: 95, requiredTool: ToolType.PICKAXE, minTier: 1 }, 
  [BlockType.GOLD]: { hardness: 160, requiredTool: ToolType.PICKAXE, minTier: 2 }, 
  [BlockType.DIAMOND]: { hardness: 280, requiredTool: ToolType.PICKAXE, minTier: 2 }, // Updated to allow Iron Pickaxe
  [BlockType.BEDROCK]: { hardness: Infinity, requiredTool: ToolType.NONE, minTier: 999 },
  [BlockType.BRICK]: { hardness: 50, requiredTool: ToolType.PICKAXE, minTier: 0 },
  [BlockType.GLASS]: { hardness: 4, requiredTool: ToolType.PICKAXE, minTier: 0 },
  [BlockType.FURNACE]: { hardness: 50, requiredTool: ToolType.PICKAXE, minTier: 0 },
  [BlockType.ANVIL]: { hardness: 100, requiredTool: ToolType.PICKAXE, minTier: 0 },
  [BlockType.SNOW]: { hardness: 6, requiredTool: ToolType.SHOVEL, minTier: 0 },
  [BlockType.ICE]: { hardness: 15, requiredTool: ToolType.PICKAXE, minTier: 0 },
  [BlockType.CACTUS]: { hardness: 8, requiredTool: ToolType.AXE, minTier: 0 },
  [BlockType.SANDSTONE]: { hardness: 45, requiredTool: ToolType.PICKAXE, minTier: 0 },
  [BlockType.PINE_LEAVES]: { hardness: 2, requiredTool: ToolType.AXE, minTier: 0 },
  [BlockType.WATER]: { hardness: Infinity, requiredTool: ToolType.NONE, minTier: 0 },
  [BlockType.LAVA]: { hardness: Infinity, requiredTool: ToolType.NONE, minTier: 0 },
  [BlockType.CHEST]: { hardness: 15, requiredTool: ToolType.AXE, minTier: 0 },
};

export const CREATE_ITEM = {
  // WOOD TIER (0)
  wood_pickaxe: (): InventoryItem => ({
    id: 'wood_pickaxe', name: 'Wood Pickaxe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.PICKAXE, efficiency: 0.45, tier: 0, swingSpeed: 0.04, durability: 60, maxDurability: 60, swingType: 'arc', damage: 4, knockback: 3, attackRange: 48 }
  }),
  wood_sword: (): InventoryItem => ({
    id: 'wood_sword', name: 'Wood Sword', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SWORD, efficiency: 1, tier: 0, damage: 15, knockback: 6, swingSpeed: 0.05, attackRange: 60, scale: 1.4, durability: 60, maxDurability: 60, swingType: 'arc' }
  }),
  wood_axe: (): InventoryItem => ({
    id: 'wood_axe', name: 'Wood Axe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.AXE, efficiency: 0.45, tier: 0, swingSpeed: 0.04, durability: 60, maxDurability: 60, swingType: 'arc', damage: 5, knockback: 4, attackRange: 48 }
  }),
  wood_shovel: (): InventoryItem => ({
    id: 'wood_shovel', name: 'Wood Shovel', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SHOVEL, efficiency: 0.45, tier: 0, swingSpeed: 0.04, durability: 60, maxDurability: 60, swingType: 'arc', damage: 3, knockback: 3, attackRange: 48 }
  }),
  wooden_bow: (): InventoryItem => ({
    id: 'wooden_bow', name: 'Wooden Bow', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.BOW, efficiency: 1, tier: 0, damage: 12, knockback: 4, swingSpeed: 0.03, attackRange: 400, scale: 1.0, durability: 100, maxDurability: 100, projectileSpeed: 16, swingType: 'shoot' }
  }),

  // STONE TIER (1)
  stone_pickaxe: (): InventoryItem => ({
    id: 'stone_pickaxe', name: 'Stone Pickaxe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.PICKAXE, efficiency: 0.75, tier: 1, swingSpeed: 0.05, durability: 132, maxDurability: 132, swingType: 'arc', damage: 6, knockback: 3, attackRange: 48 }
  }),
  stone_sword: (): InventoryItem => ({
    id: 'stone_sword', name: 'Stone Sword', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SWORD, efficiency: 1, tier: 1, damage: 22, knockback: 6, swingSpeed: 0.06, attackRange: 64, scale: 1.5, durability: 132, maxDurability: 132, swingType: 'arc' }
  }),
  stone_axe: (): InventoryItem => ({
    id: 'stone_axe', name: 'Stone Axe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.AXE, efficiency: 0.75, tier: 1, swingSpeed: 0.05, durability: 132, maxDurability: 132, swingType: 'arc', damage: 7, knockback: 4, attackRange: 48 }
  }),
  stone_shovel: (): InventoryItem => ({
    id: 'stone_shovel', name: 'Stone Shovel', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SHOVEL, efficiency: 0.75, tier: 1, swingSpeed: 0.05, durability: 132, maxDurability: 132, swingType: 'arc', damage: 5, knockback: 3, attackRange: 48 }
  }),
  stone_bow: (): InventoryItem => ({
    id: 'stone_bow', name: 'Stone Bow', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.BOW, efficiency: 1, tier: 1, damage: 16, knockback: 4, swingSpeed: 0.04, attackRange: 420, scale: 1.0, durability: 150, maxDurability: 150, projectileSpeed: 18, swingType: 'shoot' }
  }),

  // IRON TIER (2)
  iron_pickaxe: (): InventoryItem => ({
    id: 'iron_pickaxe', name: 'Iron Pickaxe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.PICKAXE, efficiency: 1.25, tier: 2, swingSpeed: 0.06, durability: 250, maxDurability: 250, swingType: 'arc', damage: 9, knockback: 4, attackRange: 55 }
  }),
  iron_sword: (): InventoryItem => ({
    id: 'iron_sword', name: 'Iron Sword', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SWORD, efficiency: 1, tier: 2, damage: 32, knockback: 8, swingSpeed: 0.07, attackRange: 70, scale: 1.6, durability: 250, maxDurability: 250, swingType: 'arc' }
  }),
  iron_axe: (): InventoryItem => ({
    id: 'iron_axe', name: 'Iron Axe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.AXE, efficiency: 1.25, tier: 2, swingSpeed: 0.06, durability: 250, maxDurability: 250, swingType: 'arc', damage: 10, knockback: 5, attackRange: 55 }
  }),
  iron_shovel: (): InventoryItem => ({
    id: 'iron_shovel', name: 'Iron Shovel', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SHOVEL, efficiency: 1.25, tier: 2, swingSpeed: 0.06, durability: 250, maxDurability: 250, swingType: 'arc', damage: 7, knockback: 4, attackRange: 55 }
  }),
  iron_bow: (): InventoryItem => ({
    id: 'iron_bow', name: 'Iron Bow', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.BOW, efficiency: 1, tier: 2, damage: 22, knockback: 5, swingSpeed: 0.05, attackRange: 450, scale: 1.0, durability: 300, maxDurability: 300, projectileSpeed: 20, swingType: 'shoot' }
  }),

  // GOLD TIER (3) - High speed, Low durability
  gold_pickaxe: (): InventoryItem => ({
    id: 'gold_pickaxe', name: 'Gold Pickaxe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.PICKAXE, efficiency: 4.0, tier: 3, swingSpeed: 0.12, durability: 32, maxDurability: 32, swingType: 'arc', damage: 12, knockback: 3, attackRange: 50 }
  }),
  gold_sword: (): InventoryItem => ({
    id: 'gold_sword', name: 'Gold Sword', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SWORD, efficiency: 1, tier: 3, damage: 25, knockback: 5, swingSpeed: 0.12, attackRange: 65, scale: 1.5, durability: 32, maxDurability: 32, swingType: 'arc' }
  }),
  gold_axe: (): InventoryItem => ({
    id: 'gold_axe', name: 'Gold Axe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.AXE, efficiency: 4.0, tier: 3, swingSpeed: 0.12, durability: 32, maxDurability: 32, swingType: 'arc', damage: 15, knockback: 4, attackRange: 50 }
  }),
  gold_shovel: (): InventoryItem => ({
    id: 'gold_shovel', name: 'Gold Shovel', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SHOVEL, efficiency: 4.0, tier: 3, swingSpeed: 0.12, durability: 32, maxDurability: 32, swingType: 'arc', damage: 10, knockback: 3, attackRange: 50 }
  }),
  gold_bow: (): InventoryItem => ({
    id: 'gold_bow', name: 'Gold Bow', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.BOW, efficiency: 1, tier: 3, damage: 18, knockback: 3, swingSpeed: 0.08, attackRange: 480, scale: 1.0, durability: 50, maxDurability: 50, projectileSpeed: 24, swingType: 'shoot' }
  }),

  // DIAMOND TIER (4)
  diamond_pickaxe: (): InventoryItem => ({
    id: 'diamond_pickaxe', name: 'Diamond Pickaxe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.PICKAXE, efficiency: 3.5, tier: 4, swingSpeed: 0.10, durability: 1000, maxDurability: 1000, swingType: 'arc', damage: 20, knockback: 5, attackRange: 60 }
  }),
  diamond_sword: (): InventoryItem => ({
    id: 'diamond_sword', name: 'Diamond Sword', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SWORD, efficiency: 1, tier: 4, damage: 65, knockback: 10, swingSpeed: 0.09, attackRange: 80, scale: 1.9, durability: 1000, maxDurability: 1000, swingType: 'arc' }
  }),
  diamond_axe: (): InventoryItem => ({
    id: 'diamond_axe', name: 'Diamond Axe', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.AXE, efficiency: 3.5, tier: 4, swingSpeed: 0.10, durability: 1000, maxDurability: 1000, swingType: 'arc', damage: 25, knockback: 6, attackRange: 60 }
  }),
  diamond_shovel: (): InventoryItem => ({
    id: 'diamond_shovel', name: 'Diamond Shovel', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.SHOVEL, efficiency: 3.5, tier: 4, swingSpeed: 0.10, durability: 1000, maxDurability: 1000, swingType: 'arc', damage: 15, knockback: 5, attackRange: 60 }
  }),
  diamond_bow: (): InventoryItem => ({
    id: 'diamond_bow', name: 'Diamond Bow', count: 1, maxStack: 1, isBlock: false,
    toolProps: { type: ToolType.BOW, efficiency: 1, tier: 4, damage: 35, knockback: 7, swingSpeed: 0.06, attackRange: 600, scale: 1.0, durability: 800, maxDurability: 800, projectileSpeed: 28, swingType: 'shoot' }
  }),

  // ARMOR
  iron_helmet: (): InventoryItem => ({
    id: 'iron_helmet', name: 'Iron Helmet', count: 1, maxStack: 1, isBlock: false,
    armorProps: { type: ArmorType.HELMET, defense: 2, tier: 2 }
  }),
  iron_chestplate: (): InventoryItem => ({
    id: 'iron_chestplate', name: 'Iron Chestplate', count: 1, maxStack: 1, isBlock: false,
    armorProps: { type: ArmorType.CHESTPLATE, defense: 3, tier: 2 }
  }),
  iron_leggings: (): InventoryItem => ({
    id: 'iron_leggings', name: 'Iron Leggings', count: 1, maxStack: 1, isBlock: false,
    armorProps: { type: ArmorType.LEGGINGS, defense: 2, tier: 2 }
  }),
  diamond_helmet: (): InventoryItem => ({
    id: 'diamond_helmet', name: 'Diamond Helmet', count: 1, maxStack: 1, isBlock: false,
    armorProps: { type: ArmorType.HELMET, defense: 4, tier: 4 }
  }),
  diamond_chestplate: (): InventoryItem => ({
    id: 'diamond_chestplate', name: 'Diamond Chestplate', count: 1, maxStack: 1, isBlock: false,
    armorProps: { type: ArmorType.CHESTPLATE, defense: 6, tier: 4 }
  }),
  diamond_leggings: (): InventoryItem => ({
    id: 'diamond_leggings', name: 'Diamond Leggings', count: 1, maxStack: 1, isBlock: false,
    armorProps: { type: ArmorType.LEGGINGS, defense: 4, tier: 4 }
  }),
  // ACCESSORIES
  extendo_grip: (): InventoryItem => ({
      id: 'extendo_grip', name: 'Extendo Grip', count: 1, maxStack: 1, isBlock: false,
      accessoryProps: { type: 'grip', effectValue: 120, description: "Increases block reach by 120px." }
  }),
  block: (type: BlockType): InventoryItem => {
    const name = BlockType[type] || 'Unknown';
    return {
      id: `block_${type}`,
      name: name.charAt(0) + name.slice(1).toLowerCase().replace('_', ' '),
      count: 1,
      maxStack: 999,
      isBlock: true,
      blockType: type
    };
  },
  wall: (type: WallType): InventoryItem => {
    const name = WallType[type] || 'Unknown';
    return {
      id: `wall_${type}`,
      name: `${name.charAt(0) + name.slice(1).toLowerCase()} Wall`,
      count: 1,
      maxStack: 999,
      isBlock: false,
      isWall: true,
      wallType: type
    }
  },
  chest: (): InventoryItem => ({
      id: 'block_chest', name: 'Chest', count: 1, maxStack: 99, isBlock: true, blockType: BlockType.CHEST
  })
};

export interface CraftingRecipe {
  id: string;
  name: string;
  result: () => InventoryItem;
  ingredients: { id: string; count: number }[];
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // WOOD
  { id: 'recipe_wood_pickaxe', name: 'Wood Pickaxe', result: CREATE_ITEM.wood_pickaxe, ingredients: [{ id: `block_${BlockType.WOOD}`, count: 4 }] },
  { id: 'recipe_wood_sword', name: 'Wood Sword', result: CREATE_ITEM.wood_sword, ingredients: [{ id: `block_${BlockType.WOOD}`, count: 5 }] },
  { id: 'recipe_wood_axe', name: 'Wood Axe', result: CREATE_ITEM.wood_axe, ingredients: [{ id: `block_${BlockType.WOOD}`, count: 3 }] },
  { id: 'recipe_wood_shovel', name: 'Wood Shovel', result: CREATE_ITEM.wood_shovel, ingredients: [{ id: `block_${BlockType.WOOD}`, count: 2 }] },
  { id: 'recipe_wooden_bow', name: 'Wooden Bow', result: CREATE_ITEM.wooden_bow, ingredients: [{ id: `block_${BlockType.WOOD}`, count: 10 }] },
  
  // STONE
  { id: 'recipe_stone_pickaxe', name: 'Stone Pickaxe', result: CREATE_ITEM.stone_pickaxe, ingredients: [{ id: `block_${BlockType.STONE}`, count: 8 }, { id: `block_${BlockType.WOOD}`, count: 4 }] },
  { id: 'recipe_stone_sword', name: 'Stone Sword', result: CREATE_ITEM.stone_sword, ingredients: [{ id: `block_${BlockType.STONE}`, count: 6 }, { id: `block_${BlockType.WOOD}`, count: 2 }] },
  { id: 'recipe_stone_axe', name: 'Stone Axe', result: CREATE_ITEM.stone_axe, ingredients: [{ id: `block_${BlockType.STONE}`, count: 6 }, { id: `block_${BlockType.WOOD}`, count: 3 }] },
  { id: 'recipe_stone_shovel', name: 'Stone Shovel', result: CREATE_ITEM.stone_shovel, ingredients: [{ id: `block_${BlockType.STONE}`, count: 4 }, { id: `block_${BlockType.WOOD}`, count: 2 }] },
  { id: 'recipe_stone_bow', name: 'Stone Bow', result: CREATE_ITEM.stone_bow, ingredients: [{ id: `block_${BlockType.STONE}`, count: 10 }, { id: `block_${BlockType.WOOD}`, count: 5 }] },

  // IRON
  { id: 'recipe_iron_pickaxe', name: 'Iron Pickaxe', result: CREATE_ITEM.iron_pickaxe, ingredients: [{ id: `block_${BlockType.IRON}`, count: 8 }, { id: `block_${BlockType.WOOD}`, count: 4 }] },
  { id: 'recipe_iron_sword', name: 'Iron Sword', result: CREATE_ITEM.iron_sword, ingredients: [{ id: `block_${BlockType.IRON}`, count: 8 }, { id: `block_${BlockType.WOOD}`, count: 2 }] },
  { id: 'recipe_iron_axe', name: 'Iron Axe', result: CREATE_ITEM.iron_axe, ingredients: [{ id: `block_${BlockType.IRON}`, count: 6 }, { id: `block_${BlockType.WOOD}`, count: 3 }] },
  { id: 'recipe_iron_shovel', name: 'Iron Shovel', result: CREATE_ITEM.iron_shovel, ingredients: [{ id: `block_${BlockType.IRON}`, count: 4 }, { id: `block_${BlockType.WOOD}`, count: 2 }] },
  { id: 'recipe_iron_bow', name: 'Iron Bow', result: CREATE_ITEM.iron_bow, ingredients: [{ id: `block_${BlockType.IRON}`, count: 10 }, { id: `block_${BlockType.WOOD}`, count: 5 }] },
  { id: 'recipe_iron_helmet', name: 'Iron Helmet', result: CREATE_ITEM.iron_helmet, ingredients: [{ id: `block_${BlockType.IRON}`, count: 10 }] },
  { id: 'recipe_iron_chestplate', name: 'Iron Chestplate', result: CREATE_ITEM.iron_chestplate, ingredients: [{ id: `block_${BlockType.IRON}`, count: 16 }] },
  { id: 'recipe_iron_leggings', name: 'Iron Leggings', result: CREATE_ITEM.iron_leggings, ingredients: [{ id: `block_${BlockType.IRON}`, count: 12 }] },

  // GOLD
  { id: 'recipe_gold_pickaxe', name: 'Gold Pickaxe', result: CREATE_ITEM.gold_pickaxe, ingredients: [{ id: `block_${BlockType.GOLD}`, count: 8 }, { id: `block_${BlockType.WOOD}`, count: 4 }] },
  { id: 'recipe_gold_sword', name: 'Gold Sword', result: CREATE_ITEM.gold_sword, ingredients: [{ id: `block_${BlockType.GOLD}`, count: 8 }, { id: `block_${BlockType.WOOD}`, count: 2 }] },
  { id: 'recipe_gold_axe', name: 'Gold Axe', result: CREATE_ITEM.gold_axe, ingredients: [{ id: `block_${BlockType.GOLD}`, count: 6 }, { id: `block_${BlockType.WOOD}`, count: 3 }] },
  { id: 'recipe_gold_shovel', name: 'Gold Shovel', result: CREATE_ITEM.gold_shovel, ingredients: [{ id: `block_${BlockType.GOLD}`, count: 4 }, { id: `block_${BlockType.WOOD}`, count: 2 }] },
  { id: 'recipe_gold_bow', name: 'Gold Bow', result: CREATE_ITEM.gold_bow, ingredients: [{ id: `block_${BlockType.GOLD}`, count: 10 }, { id: `block_${BlockType.WOOD}`, count: 5 }] },

  // DIAMOND
  { id: 'recipe_diamond_pickaxe', name: 'Diamond Pickaxe', result: CREATE_ITEM.diamond_pickaxe, ingredients: [{ id: `block_${BlockType.DIAMOND}`, count: 12 }, { id: `block_${BlockType.WOOD}`, count: 2 }] },
  { id: 'recipe_diamond_sword', name: 'Diamond Sword', result: CREATE_ITEM.diamond_sword, ingredients: [{ id: `block_${BlockType.DIAMOND}`, count: 10 }, { id: `block_${BlockType.WOOD}`, count: 1 }] },
  { id: 'recipe_diamond_axe', name: 'Diamond Axe', result: CREATE_ITEM.diamond_axe, ingredients: [{ id: `block_${BlockType.DIAMOND}`, count: 10 }, { id: `block_${BlockType.WOOD}`, count: 3 }] },
  { id: 'recipe_diamond_shovel', name: 'Diamond Shovel', result: CREATE_ITEM.diamond_shovel, ingredients: [{ id: `block_${BlockType.DIAMOND}`, count: 6 }, { id: `block_${BlockType.WOOD}`, count: 2 }] },
  { id: 'recipe_diamond_bow', name: 'Diamond Bow', result: CREATE_ITEM.diamond_bow, ingredients: [{ id: `block_${BlockType.DIAMOND}`, count: 12 }, { id: `block_${BlockType.WOOD}`, count: 5 }] },
  { id: 'recipe_diamond_helmet', name: 'Diamond Helmet', result: CREATE_ITEM.diamond_helmet, ingredients: [{ id: `block_${BlockType.DIAMOND}`, count: 10 }] },
  { id: 'recipe_diamond_chestplate', name: 'Diamond Chestplate', result: CREATE_ITEM.diamond_chestplate, ingredients: [{ id: `block_${BlockType.DIAMOND}`, count: 16 }] },
  { id: 'recipe_diamond_leggings', name: 'Diamond Leggings', result: CREATE_ITEM.diamond_leggings, ingredients: [{ id: `block_${BlockType.DIAMOND}`, count: 12 }] },

  // MISC
  { id: 'recipe_chest', name: 'Chest', result: CREATE_ITEM.chest, ingredients: [{ id: `block_${BlockType.WOOD}`, count: 8 }] },
  { id: 'recipe_extendo_grip', name: 'Extendo Grip', result: CREATE_ITEM.extendo_grip, ingredients: [{ id: `block_${BlockType.IRON}`, count: 10 }, { id: `block_${BlockType.WOOD}`, count: 10 }] },
  { id: 'recipe_glass', name: 'Glass (x2)', result: () => { const i = CREATE_ITEM.block(BlockType.GLASS); i.count = 2; return i; }, ingredients: [{ id: `block_${BlockType.SAND}`, count: 1 }] },
  { id: 'recipe_brick', name: 'Brick (x4)', result: () => { const i = CREATE_ITEM.block(BlockType.BRICK); i.count = 4; return i; }, ingredients: [{ id: `block_${BlockType.STONE}`, count: 2 }, { id: `block_${BlockType.DIRT}`, count: 1 }] },
  { id: 'recipe_wood_wall', name: 'Wood Wall (x4)', result: () => { const i = CREATE_ITEM.wall(WallType.WOOD); i.count = 4; return i; }, ingredients: [{ id: `block_${BlockType.WOOD}`, count: 1 }] },
  { id: 'recipe_stone_wall', name: 'Stone Wall (x4)', result: () => { const i = CREATE_ITEM.wall(WallType.STONE); i.count = 4; return i; }, ingredients: [{ id: `block_${BlockType.STONE}`, count: 1 }] },
  { id: 'recipe_brick_wall', name: 'Brick Wall (x4)', result: () => { const i = CREATE_ITEM.wall(WallType.BRICK); i.count = 4; return i; }, ingredients: [{ id: `block_${BlockType.BRICK}`, count: 1 }] }
];