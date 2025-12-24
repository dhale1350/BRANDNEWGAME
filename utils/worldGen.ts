

import { BlockType, WallType, InventoryItem, ToolType, ArmorType } from '../types';
import { WORLD_HEIGHT, WORLD_WIDTH, CREATE_ITEM } from '../constants';
import { noise2D, seedNoise } from './noise';

// --- SEEDED RNG ---
let _seed = 12345;

const setRngSeed = (s: number) => { _seed = s; };

const random = (): number => {
    _seed = (_seed * 16807) % 2147483647;
    return (_seed - 1) / 2147483646;
};

const setBlock = (world: Uint8Array, x: number, y: number, type: BlockType) => {
  if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
    world[y * WORLD_WIDTH + x] = type;
  }
};

const getBlock = (world: Uint8Array, x: number, y: number): BlockType => {
  if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
    return world[y * WORLD_WIDTH + x] as BlockType;
  }
  return BlockType.AIR;
};

const setWall = (walls: Uint8Array, x: number, y: number, type: WallType) => {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
      walls[y * WORLD_WIDTH + x] = type;
    }
};

type BiomeType = 'forest' | 'snow' | 'desert';

function getBiome(x: number): BiomeType {
    if (x < WORLD_WIDTH * 0.25) return 'snow';
    if (x > WORLD_WIDTH * 0.75) return 'desert';
    return 'forest';
}

// --- LOOT GENERATION ---

function generateLoot(): (InventoryItem | null)[] {
    const items: (InventoryItem | null)[] = new Array(15).fill(null);
    let count = 3 + Math.floor(random() * 5); // 3 to 7 items
    
    const possibleLoot = [
        { item: () => CREATE_ITEM.block(BlockType.WOOD), chance: 0.8, min: 10, max: 50 },
        { item: () => CREATE_ITEM.block(BlockType.STONE), chance: 0.8, min: 10, max: 50 },
        { item: () => CREATE_ITEM.block(BlockType.IRON), chance: 0.4, min: 2, max: 8 },
        { item: () => CREATE_ITEM.block(BlockType.GOLD), chance: 0.2, min: 2, max: 6 },
        { item: () => CREATE_ITEM.block(BlockType.DIAMOND), chance: 0.05, min: 1, max: 3 },
        { item: () => CREATE_ITEM.iron_pickaxe(), chance: 0.15, min: 1, max: 1 },
        { item: () => CREATE_ITEM.iron_sword(), chance: 0.15, min: 1, max: 1 },
        { item: () => CREATE_ITEM.wooden_bow(), chance: 0.2, min: 1, max: 1 },
        { item: () => CREATE_ITEM.extendo_grip(), chance: 0.08, min: 1, max: 1 }, // Rare accessory
        { item: () => CREATE_ITEM.block(BlockType.GRASS), chance: 0.5, min: 5, max: 15 },
    ];

    for(let i=0; i<count; i++) {
        const slot = Math.floor(random() * 15);
        if (items[slot]) continue;

        // Pick item
        let picked = null;
        let attempts = 0;
        while (!picked && attempts < 10) {
            const candidate = possibleLoot[Math.floor(random() * possibleLoot.length)];
            if (random() < candidate.chance) {
                const qty = candidate.min + Math.floor(random() * (candidate.max - candidate.min + 1));
                picked = { ...candidate.item(), count: qty };
                if (picked.toolProps || picked.accessoryProps) picked.count = 1; // Unstackables
            }
            attempts++;
        }
        
        if (picked) items[slot] = picked;
    }
    
    return items;
}

// --- STRUCTURE GENERATORS ---

function generateStructure(
    world: Uint8Array, 
    walls: Uint8Array, 
    x: number, 
    y: number, 
    type: 'ruin' | 'cabin',
    containers: Record<string, (InventoryItem | null)[]>
) {
    const w = 10;
    const h = 6;
    
    // Clear area
    for(let dy = 0; dy < h; dy++) {
        for(let dx = 0; dx < w; dx++) {
            setBlock(world, x + dx, y - dy, BlockType.AIR);
            if (type === 'cabin') {
                setWall(walls, x + dx, y - dy, WallType.WOOD);
            } else if (type === 'ruin') {
                if (random() > 0.3) setWall(walls, x + dx, y - dy, WallType.STONE);
            }
        }
    }

    // Build Shell
    for(let dx = 0; dx < w; dx++) {
        setBlock(world, x + dx, y, type === 'cabin' ? BlockType.WOOD : BlockType.STONE); // Floor
        setBlock(world, x + dx, y - h + 1, type === 'cabin' ? BlockType.WOOD : BlockType.STONE); // Ceiling
    }
    for(let dy = 0; dy < h; dy++) {
        setBlock(world, x, y - dy, type === 'cabin' ? BlockType.WOOD : BlockType.STONE); // Left Wall
        setBlock(world, x + w - 1, y - dy, type === 'cabin' ? BlockType.WOOD : BlockType.STONE); // Right Wall
    }

    // Doorway
    setBlock(world, x, y - 1, BlockType.AIR);
    setBlock(world, x, y - 2, BlockType.AIR);
    
    // Chest
    const chestX = x + Math.floor(w/2) + Math.floor(random() * 2);
    const chestY = y - 1;
    setBlock(world, chestX, chestY, BlockType.CHEST);
    
    // Populate Chest
    const loot = generateLoot();
    containers[`${chestX},${chestY}`] = loot;
}

function generateTree(world: Uint8Array, x: number, y: number, biome: BiomeType) {
    if (biome === 'desert') {
        // Cactus
        const height = 3 + Math.floor(random() * 4);
        for(let i=0; i<height; i++) setBlock(world, x, y - 1 - i, BlockType.CACTUS);
        // Arms
        if (height > 3 && random() > 0.4) {
             const armY = y - 2 - Math.floor(random() * 2);
             const side = random() > 0.5 ? 1 : -1;
             setBlock(world, x + side, armY, BlockType.CACTUS);
             setBlock(world, x + side, armY - 1, BlockType.CACTUS);
        }
        return;
    }

    if (biome === 'snow') {
        // Pine Tree
        const height = 6 + Math.floor(random() * 6);
        // Trunk
        for (let i = 0; i < height; i++) {
            setBlock(world, x, y - 1 - i, BlockType.WOOD);
        }
        // Cone Leaves
        const leafStart = y - 3;
        const leafEnd = y - height - 1;
        let radius = 3;
        for(let ly = leafStart; ly >= leafEnd; ly--) {
            for(let lx = -radius; lx <= radius; lx++) {
                if (Math.abs(lx) + Math.abs(ly - leafStart) * 0.3 < radius + 1) { 
                    setBlock(world, x + lx, ly, BlockType.PINE_LEAVES);
                }
            }
            if ((leafStart - ly) % 2 === 0) radius = Math.max(0, radius - 1);
        }
        return;
    }

    // Forest Tree (Oak)
    const height = 4 + Math.floor(random() * 4);
    for (let i = 0; i < height; i++) setBlock(world, x, y - 1 - i, BlockType.WOOD);
    if (height > 5 && random() > 0.4) {
        const side = random() > 0.5 ? 1 : -1;
        const by = y - Math.floor(height * 0.6) - 1;
        setBlock(world, x + side, by, BlockType.WOOD);
        setBlock(world, x + side, by - 1, BlockType.LEAVES);
    }
    const crownBase = y - height - 1;
    for(let lx = -2; lx <= 2; lx++) {
        setBlock(world, x + lx, crownBase, BlockType.LEAVES);
        setBlock(world, x + lx, crownBase - 1, BlockType.LEAVES);
    }
    setBlock(world, x - 1, crownBase - 2, BlockType.LEAVES);
    setBlock(world, x, crownBase - 2, BlockType.LEAVES);
    setBlock(world, x + 1, crownBase - 2, BlockType.LEAVES);
    setBlock(world, x, crownBase - 3, BlockType.LEAVES);
}

// --- MAIN GENERATOR ---

export function generateWorld(seed: number): { world: Uint8Array, walls: Uint8Array, containers: Record<string, (InventoryItem | null)[]> } {
  seedNoise(seed);
  setRngSeed(seed); 

  const world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const walls = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const heightMap = new Int32Array(WORLD_WIDTH);
  const containers: Record<string, (InventoryItem | null)[]> = {};
  
  const groundLevel = Math.floor(WORLD_HEIGHT * 0.4); 
  const mountainScale = 0.015; 
  const caveScale = 0.05;

  // PASS 1: TERRAIN
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const biome = getBiome(x);
    const h = noise2D(x * mountainScale, 0) * 20;
    const surfaceY = Math.floor(groundLevel + h);
    heightMap[x] = surfaceY;

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const index = y * WORLD_WIDTH + x;
      let block = BlockType.AIR;
      let wall = WallType.AIR;

      if (y >= surfaceY) {
        // Surface Layer
        if (y === surfaceY) {
            if (biome === 'snow') block = BlockType.SNOW;
            else if (biome === 'desert') block = BlockType.SAND;
            else block = BlockType.GRASS;
        }
        // Sub-surface
        else if (y < surfaceY + 5) {
            if (biome === 'snow') {
                block = BlockType.SNOW; 
                wall = WallType.SNOW; 
            } else if (biome === 'desert') {
                block = BlockType.SAND;
                wall = WallType.SANDSTONE;
            } else {
                block = BlockType.DIRT;
                wall = WallType.DIRT;
            }
        }
        // Deep
        else {
            if (biome === 'desert' && y < surfaceY + 15) {
                 block = BlockType.SANDSTONE;
                 wall = WallType.SANDSTONE;
            } else if (biome === 'snow' && y < surfaceY + 10) {
                 block = BlockType.ICE;
                 wall = WallType.SNOW;
            } else {
                 block = BlockType.STONE;
                 wall = WallType.STONE;
            }
        }

        // Caves
        if (y > surfaceY + 4) {
           const caveNoise = Math.abs(noise2D(x * caveScale, y * caveScale));
           if (caveNoise > 0.45) {
               block = BlockType.AIR;
           }
        }

        // Ores
        if (block === BlockType.STONE || block === BlockType.SANDSTONE || block === BlockType.ICE) {
           const d = y - surfaceY;
           if (noise2D(x * 0.1, y * 0.1) > 0.72) block = BlockType.COAL;
           if (d > 20 && noise2D(x * 0.15, y * 0.15 + 100) > 0.76) block = BlockType.IRON;
           if (d > 50 && noise2D(x * 0.2, y * 0.2 + 200) > 0.83) block = BlockType.GOLD;
           if (d > 90 && noise2D(x * 0.3, y * 0.3 + 300) > 0.91) block = BlockType.DIAMOND;
        }
      }

      if (y >= WORLD_HEIGHT - 3) block = BlockType.BEDROCK;
      
      world[index] = block;
      walls[index] = wall;
    }
  }

  // PASS 2: STRUCTURES
  // Randomly place structures
  for (let i = 0; i < 15; i++) { // Attempt 15 structures
      const x = Math.floor(random() * (WORLD_WIDTH - 20)) + 10;
      const surfaceY = heightMap[x];
      
      // Determine type and depth
      const isUnderground = random() > 0.6;
      let sy = surfaceY;
      
      if (isUnderground) {
          sy = surfaceY + 20 + Math.floor(random() * 40); // Deep underground
          if (sy < WORLD_HEIGHT - 10) {
              generateStructure(world, walls, x, sy, 'cabin', containers);
          }
      } else {
          // Surface Ruin
          // Find flat-ish spot or just embed it
          generateStructure(world, walls, x, sy, 'ruin', containers);
      }
  }
  
  // PASS 3: VEGETATION
  const takenSpots = new Set<number>();
  for (let x = 10; x < WORLD_WIDTH - 10; x++) {
      if (takenSpots.has(x)) continue; 

      let y = 0;
      while (y < WORLD_HEIGHT && getBlock(world, x, y) === BlockType.AIR) y++;
      
      const ground = getBlock(world, x, y);
      const biome = getBiome(x);
      
      // Trees grow on valid ground for their biome
      let canGrow = false;
      if (biome === 'forest' && ground === BlockType.GRASS) canGrow = true;
      if (biome === 'snow' && ground === BlockType.SNOW) canGrow = true;
      if (biome === 'desert' && ground === BlockType.SAND) canGrow = true;

      if (canGrow) {
          if (random() < 0.15) {
              if (!takenSpots.has(x+1) && !takenSpots.has(x-1)) {
                 generateTree(world, x, y, biome);
                 x += 2;
              }
          }
      }
  }

  return { world, walls, containers };
}