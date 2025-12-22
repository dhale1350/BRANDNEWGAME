
import { BlockType, WallType } from '../types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { noise2D, seedNoise } from './noise';

// --- SEEDED RNG ---
// A simple Park-Miller LCG for deterministic "random" numbers based on the world seed
let _seed = 12345;

const setRngSeed = (s: number) => { _seed = s; };

const random = (): number => {
    _seed = (_seed * 16807) % 2147483647;
    return (_seed - 1) / 2147483646;
};

// Helper to safely set a block
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

// --- STRUCTURE GENERATORS ---

function generateCozyHouse(world: Uint8Array, walls: Uint8Array, startX: number, surfaceY: number) {
  const width = 6 + Math.floor(random() * 4); // 6-9 width (Small & Cozy)
  const height = 4; // Standard cozy height
  const floorY = surfaceY;

  // 1. Foundation (Stone anchors into the ground)
  for (let x = 0; x < width; x++) {
      const wx = startX + x;
      // Floor
      setBlock(world, wx, floorY, BlockType.WOOD);
      
      // Foundation legs down to solid ground
      let fy = floorY + 1;
      let depth = 0;
      while (fy < WORLD_HEIGHT && depth < 10) {
          const existing = getBlock(world, wx, fy);
          if (existing !== BlockType.AIR && existing !== BlockType.GRASS && existing !== BlockType.LEAVES) break;
          setBlock(world, wx, fy, BlockType.STONE);
          setWall(walls, wx, fy, WallType.STONE);
          fy++;
          depth++;
      }

      // Clear Interior (Air) & Place Background Walls
      for(let h = 1; h <= height; h++) {
          setBlock(world, wx, floorY - h, BlockType.AIR);
          setWall(walls, wx, floorY - h, WallType.WOOD);
      }
      // Attic Space
      setWall(walls, wx, floorY - height - 1, WallType.WOOD);
  }

  // 2. Walls
  for(let h = 1; h <= height; h++) {
      setBlock(world, startX, floorY - h, BlockType.WOOD);
      setBlock(world, startX + width - 1, floorY - h, BlockType.WOOD);
  }

  // 3. Ceiling / Attic Floor
  const ceilingY = floorY - height - 1;
  for(let x = 0; x < width; x++) {
      setBlock(world, startX + x, ceilingY, BlockType.WOOD);
  }

  // 4. Pitched Roof (Brick)
  // Overhang of 1
  for(let i = 0; i <= Math.ceil(width / 2) + 1; i++) {
      const ry = ceilingY - i;
      const start = startX - 1 + i;
      const end = startX + width - i;
      if (end >= start) {
          for(let x = start; x <= end; x++) {
              // Don't fill the very inside if it's large, but for small houses solid is fine
              setBlock(world, x, ry, BlockType.BRICK);
              setWall(walls, x, ry, WallType.BRICK);
          }
      }
  }

  // 5. Chimney
  const chimneyX = startX + width - 2;
  let cy = ceilingY;
  while(getBlock(world, chimneyX, cy) !== BlockType.AIR) cy--; // Find top of roof
  setBlock(world, chimneyX, cy, BlockType.STONE);
  setBlock(world, chimneyX, cy - 1, BlockType.STONE);

  // 6. Door & Window
  const doorX = startX + 1 + Math.floor(random() * (width - 3));
  setBlock(world, doorX, floorY - 1, BlockType.AIR);
  setBlock(world, doorX, floorY - 2, BlockType.AIR);

  // Add a window if there is space
  if (width > 6) {
      if (doorX > startX + 2) setBlock(world, startX + 2, floorY - 2, BlockType.GLASS);
      else if (doorX < startX + width - 3) setBlock(world, startX + width - 2, floorY - 2, BlockType.GLASS);
  }
}

function generateLookoutTower(world: Uint8Array, walls: Uint8Array, startX: number, surfaceY: number) {
  const width = 6;
  const height = 10 + Math.floor(random() * 6); // 10-16 blocks tall
  const floorY = surfaceY;

  // Foundation
  for(let x = 0; x < width; x++) {
      let fy = floorY;
      while(fy < WORLD_HEIGHT && (getBlock(world, startX + x, fy) === BlockType.AIR || getBlock(world, startX + x, fy) === BlockType.GRASS)) {
          setBlock(world, startX + x, fy, BlockType.STONE);
          setWall(walls, startX + x, fy, WallType.STONE);
          fy++;
      }
      setBlock(world, startX + x, floorY, BlockType.STONE);
  }

  // Tower Shaft
  for(let y = 1; y <= height; y++) {
      const wy = floorY - y;
      for(let x = 0; x < width; x++) {
          const isWall = x === 0 || x === width - 1;
          if (isWall) {
             setBlock(world, startX + x, wy, BlockType.BRICK);
          } else {
             setBlock(world, startX + x, wy, BlockType.AIR);
             setWall(walls, startX + x, wy, WallType.STONE);
             // Platforms every 4 blocks
             if (y % 4 === 0 && x % 2 !== 0) {
                 setBlock(world, startX + x, wy, BlockType.WOOD);
             }
          }
      }
      // Windows occasionally
      if (y % 5 === 2) {
          setBlock(world, startX + 2, wy, BlockType.GLASS);
          setBlock(world, startX + 3, wy, BlockType.GLASS);
      }
  }

  // Battlements / Crown
  const topY = floorY - height;
  // Flared top
  for(let x = -1; x <= width; x++) {
      setBlock(world, startX + x, topY, BlockType.BRICK);
      // Spikes
      if ((x + 1) % 2 === 0) setBlock(world, startX + x, topY - 1, BlockType.BRICK);
  }
}

function generateAncientRuins(world: Uint8Array, walls: Uint8Array, startX: number, surfaceY: number) {
    const width = 6 + Math.floor(random() * 5);
    
    // Sunk into ground
    const groundY = surfaceY + 1;

    for(let x = 0; x < width; x++) {
        // Floor (Broken)
        if (random() > 0.2) {
            setBlock(world, startX + x, groundY, BlockType.STONE);
            // Deep foundation
            let fy = groundY + 1;
            while(fy < WORLD_HEIGHT && getBlock(world, startX + x, fy) === BlockType.AIR) {
                 setBlock(world, startX + x, fy, BlockType.DIRT);
                 fy++;
            }
        }

        // Walls / Pillars (Random heights)
        const wallH = Math.floor(random() * 4);
        for(let h = 1; h <= wallH; h++) {
             setBlock(world, startX + x, groundY - h, random() > 0.7 ? BlockType.STONE : BlockType.BRICK);
             setWall(walls, startX + x, groundY - h, WallType.BRICK);
        }
    }

    // Moss / Overgrowth
    for(let i = 0; i < 5; i++) {
        const rx = Math.floor(random() * (width + 2)) - 1;
        const ry = Math.floor(random() * 6);
        const wx = startX + rx;
        const wy = groundY - ry;
        if (getBlock(world, wx, wy) === BlockType.AIR) {
             // Only if touching something
             if (getBlock(world, wx, wy+1) !== BlockType.AIR || getBlock(world, wx+1, wy) !== BlockType.AIR) {
                 setBlock(world, wx, wy, BlockType.LEAVES);
             }
        }
    }
}

function generateTree(world: Uint8Array, x: number, y: number) {
    const height = 4 + Math.floor(random() * 4); // 4-7 height
    
    // Trunk
    for (let i = 0; i < height; i++) {
        setBlock(world, x, y - 1 - i, BlockType.WOOD);
    }
    
    // Branch?
    if (height > 5 && random() > 0.4) {
        const side = random() > 0.5 ? 1 : -1;
        const by = y - Math.floor(height * 0.6) - 1;
        setBlock(world, x + side, by, BlockType.WOOD);
        setBlock(world, x + side, by - 1, BlockType.LEAVES); // Leaf tip
    }

    // Leaves Cluster (Top)
    const crownBase = y - height - 1;
    // Layer 1 (Wide)
    for(let lx = -2; lx <= 2; lx++) {
        setBlock(world, x + lx, crownBase, BlockType.LEAVES);
        setBlock(world, x + lx, crownBase - 1, BlockType.LEAVES);
    }
    // Layer 2 (Narrow)
    setBlock(world, x - 1, crownBase - 2, BlockType.LEAVES);
    setBlock(world, x, crownBase - 2, BlockType.LEAVES);
    setBlock(world, x + 1, crownBase - 2, BlockType.LEAVES);
    // Top
    setBlock(world, x, crownBase - 3, BlockType.LEAVES);
}

// --- MAIN GENERATOR ---

export function generateWorld(seed: number): { world: Uint8Array, walls: Uint8Array } {
  // Initialize seeded systems
  seedNoise(seed);
  setRngSeed(seed); // Initialize our structure RNG with the same seed

  const world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const walls = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const heightMap = new Int32Array(WORLD_WIDTH);
  
  const groundLevel = Math.floor(WORLD_HEIGHT * 0.4); 
  const mountainScale = 0.015; 
  const caveScale = 0.05;

  // PASS 1: TERRAIN
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const h = noise2D(x * mountainScale, 0) * 20;
    const surfaceY = Math.floor(groundLevel + h);
    heightMap[x] = surfaceY;

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const index = y * WORLD_WIDTH + x;
      let block = BlockType.AIR;
      let wall = WallType.AIR;

      if (y >= surfaceY) {
        if (y === surfaceY) block = BlockType.GRASS;
        else if (y < surfaceY + 5) {
            block = BlockType.DIRT;
            wall = WallType.DIRT;
        }
        else {
            block = BlockType.STONE;
            wall = WallType.STONE;
        }

        // Caves (Simplex-like noise threshold)
        if (y > surfaceY + 4) {
           const caveNoise = Math.abs(noise2D(x * caveScale, y * caveScale));
           if (caveNoise > 0.45) {
               block = BlockType.AIR;
               // Walls remain inside caves usually
           }
        }

        // Ores
        if (block === BlockType.STONE) {
           const d = y - surfaceY;
           // Use noise for ores to keep them deterministic with noise seed
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
  const takenSpots = new Set<number>(); 
  let lastStructureEnd = 0;
  const MIN_DIST = 40; // Minimum blocks between structures

  for (let x = 20; x < WORLD_WIDTH - 20; x++) {
      if (x < lastStructureEnd + MIN_DIST) continue; // Skip if too close to last one
      
      const surfaceY = heightMap[x];
      
      // Check for relatively flat terrain (variance < 3 over 6 blocks)
      let minH = surfaceY;
      let maxH = surfaceY;
      for(let k = 0; k < 6; k++) {
          const kh = heightMap[x+k] || surfaceY;
          minH = Math.min(minH, kh);
          maxH = Math.max(maxH, kh);
      }
      const isFlat = (maxH - minH) <= 2;

      // Rare chance to spawn
      if (isFlat && random() < 0.2) { 
          const type = random();
          let width = 0;
          
          if (type < 0.5) {
              generateCozyHouse(world, walls, x, surfaceY);
              width = 9;
          } else if (type < 0.8) {
              generateAncientRuins(world, walls, x, surfaceY);
              width = 8;
          } else {
              generateLookoutTower(world, walls, x, surfaceY);
              width = 6;
          }

          // Mark buffer
          lastStructureEnd = x + width;
          for(let k = x - 2; k < x + width + 2; k++) takenSpots.add(k);
      }
  }

  // PASS 3: VEGETATION
  for (let x = 10; x < WORLD_WIDTH - 10; x++) {
      if (takenSpots.has(x)) continue; // Not inside buildings

      // Find ground
      let y = 0;
      while (y < WORLD_HEIGHT && getBlock(world, x, y) === BlockType.AIR) y++;
      
      if (y < WORLD_HEIGHT && getBlock(world, x, y) === BlockType.GRASS) {
          // Trees are moderately common
          if (random() < 0.15) {
              // Ensure space
              if (!takenSpots.has(x+1) && !takenSpots.has(x-1)) {
                 generateTree(world, x, y);
                 // Space out trees a bit
                 x += 2;
              }
          }
      }
  }

  return { world, walls };
}
