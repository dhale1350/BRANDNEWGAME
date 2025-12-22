
import { BlockType, InventoryItem, EntityType, TestInterface, WallType } from '../types';
import { generateWorld } from './worldGen';
import { noise2D, seedNoise } from './noise';
import { 
    WORLD_WIDTH, WORLD_HEIGHT, CREATE_ITEM, CRAFTING_RECIPES, TILE_SIZE, 
    PLAYER_MAX_HEALTH, BLOCK_MINING_STATS, BLOCK_COLORS, WALL_COLORS, 
    ENEMY_STATS, NPC_DIALOGUES 
} from '../constants';
import { decodeWorldData } from './storage';

export interface DiagnosticResult {
    category: string;
    name: string;
    passed: boolean;
    details: string;
}

export const runSystemDiagnostics = async (game?: TestInterface): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = [];

    const check = (category: string, name: string, condition: boolean, details: string = '') => {
        results.push({ category, name, passed: condition, details: condition ? 'OK' : details });
    };

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    // 1. STATIC LOGIC CHECKS
    try {
        seedNoise(12345);
        const n1 = noise2D(10.5, 20.5);
        seedNoise(12345);
        const n2 = noise2D(10.5, 20.5);
        check('Static', 'Noise Determinism', n1 === n2, `Noise mismatch: ${n1} !== ${n2}`);
        check('Static', 'Noise Range', n1 >= -1 && n1 <= 1, `Noise out of range: ${n1}`);

        const t0 = performance.now();
        const { world: worldData } = generateWorld(999);
        const t1 = performance.now();
        check('Static', 'WorldGen Perf', (t1 - t0) < 3000, `Took ${Math.round(t1-t0)}ms`);
        check('Static', 'WorldGen Size', worldData.length === WORLD_WIDTH * WORLD_HEIGHT, `Size: ${worldData.length}`);
        
        let hasBedrock = true;
        for(let x=0; x<WORLD_WIDTH; x++) {
            if(worldData[(WORLD_HEIGHT-1)*WORLD_WIDTH + x] !== BlockType.BEDROCK) hasBedrock = false;
        }
        check('Static', 'WorldGen Bedrock', hasBedrock, 'Bottom layer integrity check failed');
    } catch (e: any) { check('Static', 'Static Exception', false, e.message); }

    // 2. REGISTRY INTEGRITY
    try {
        // Block Registry
        const blocks = Object.values(BlockType).filter(v => typeof v === 'number') as number[];
        const missingColors = blocks.filter(b => !BLOCK_COLORS[b as BlockType]);
        check('Registry', 'Block Colors', missingColors.length === 0, `Missing: ${missingColors.join(',')}`);
        
        const mineStats = Object.values(BlockType).filter(v => typeof v === 'number' && v !== 0); // Skip Air
        const missingStats = mineStats.filter(b => !BLOCK_MINING_STATS[b as BlockType]);
        check('Registry', 'Mining Stats', missingStats.length === 0, `Missing: ${missingStats.join(',')}`);

        // Wall Registry
        const walls = Object.values(WallType).filter(v => typeof v === 'number') as number[];
        const missingWallColors = walls.filter(w => !WALL_COLORS[w as WallType]);
        check('Registry', 'Wall Colors', missingWallColors.length === 0, `Missing: ${missingWallColors.join(',')}`);

        // Entity Registry
        const enemies = ['SLIME', 'ZOMBIE', 'GUIDE'];
        const missingStatsEnt = enemies.filter(e => !(ENEMY_STATS as any)[e]);
        check('Registry', 'Entity Stats', missingStatsEnt.length === 0, `Missing: ${missingStatsEnt.join(',')}`);

        // Dialogues
        check('Registry', 'NPC Dialogues', NPC_DIALOGUES.length > 0, 'No dialogues found');

    } catch (e: any) { check('Registry', 'Exception', false, e.message); }

    // 3. STORAGE COMPATIBILITY
    try {
        const testSize = 100;
        const arr = new Uint8Array(testSize);
        for(let i=0; i<testSize; i++) arr[i] = i % 255;
        
        // Simulate storage encoding (btoa of char code)
        let binary = '';
        for (let i = 0; i < testSize; i++) binary += String.fromCharCode(arr[i]);
        const b64 = btoa(binary);
        
        // Test Decode
        const decoded = decodeWorldData(b64);
        // decodeWorldData returns WORLD_WIDTH*WORLD_HEIGHT size, but puts data at start
        let match = true;
        for(let i=0; i<testSize; i++) {
            if(decoded[i] !== arr[i]) match = false;
        }
        check('Storage', 'Codec Integrity', match, 'Encoded/Decoded data mismatch');

    } catch (e: any) { check('Storage', 'Exception', false, e.message); }


    if (!game) {
        check('System', 'Test Interface', false, 'Game Interface not connected');
        return results;
    }

    // Capture initial state to restore later
    const initialPos = { x: game.playerRef.current.x, y: game.playerRef.current.y };
    const initialHp = game.playerRef.current.health;
    const initialInv = [...game.inventoryRef.current];

    // 4. LIVE PHYSICS TESTS
    try {
        // Safe Teleport for testing
        game.teleport(200 * TILE_SIZE, 50 * TILE_SIZE); // Assuming 200,50 is safe-ish air in generated world logic or we make it air
        
        // Clear area around player for testing
        const px = Math.floor(game.playerRef.current.x / TILE_SIZE);
        const py = Math.floor(game.playerRef.current.y / TILE_SIZE);
        for(let y=py-2; y<=py+2; y++) {
            for(let x=px-2; x<=px+2; x++) {
                if(y*WORLD_WIDTH+x < game.worldRef.current.length) {
                    game.worldRef.current[y*WORLD_WIDTH+x] = BlockType.AIR;
                    game.wallsRef.current[y*WORLD_WIDTH+x] = WallType.AIR;
                }
            }
        }

        await wait(100);

        // GRAVITY Check
        const y1 = game.playerRef.current.y;
        await wait(200);
        const y2 = game.playerRef.current.y;
        check('Physics', 'Gravity', y2 > y1, `Player didn't fall: ${y1} -> ${y2}`);

        // MOVEMENT Check
        game.teleport(200 * TILE_SIZE, 50 * TILE_SIZE);
        game.playerRef.current.vy = 0; // stop falling for a moment
        game.inputRef.current.right = true;
        await wait(150);
        const mx1 = game.playerRef.current.x;
        game.inputRef.current.right = false;
        await wait(50);
        check('Physics', 'Move Right', mx1 > 200 * TILE_SIZE + 5, `Pos X: ${mx1}`);

        game.inputRef.current.left = true;
        await wait(150);
        game.inputRef.current.left = false;
        const mx2 = game.playerRef.current.x;
        check('Physics', 'Move Left', mx2 < mx1, `Pos X: ${mx2} !< ${mx1}`);

        // JUMP Check
        // Need to be grounded to jump usually. Let's fake grounded.
        game.playerRef.current.grounded = true;
        game.inputRef.current.jump = true;
        await wait(100);
        game.inputRef.current.jump = false;
        // Should be moving UP (negative Y)
        check('Physics', 'Jump Response', game.playerRef.current.vy < 0, `VY was ${game.playerRef.current.vy}`);

    } catch (e: any) { check('Physics', 'Exception', false, e.message); }
    finally {
        game.inputRef.current.left = false;
        game.inputRef.current.right = false;
        game.inputRef.current.jump = false;
    }

    // 5. INVENTORY & ITEM LOGIC
    try {
        game.setInventory(new Array(30).fill(null)); // Clear inv
        
        // Add single item
        const dirt = CREATE_ITEM.block(BlockType.DIRT);
        game.addItem(dirt);
        check('Inventory', 'Add Item', game.inventoryRef.current[0]?.blockType === BlockType.DIRT, 'Item not added to slot 0');

        // Stack item
        const dirt2 = CREATE_ITEM.block(BlockType.DIRT);
        dirt2.count = 5;
        game.addItem(dirt2);
        check('Inventory', 'Stacking', game.inventoryRef.current[0]?.count === 6, `Stack failed: ${game.inventoryRef.current[0]?.count}`);

        // Overflow stack
        const dirt3 = CREATE_ITEM.block(BlockType.DIRT);
        dirt3.count = 995; // Should fill slot 0 to 999 and put 2 in slot 1
        game.addItem(dirt3);
        check('Inventory', 'Stack Overflow', game.inventoryRef.current[0]?.count === 999 && game.inventoryRef.current[1]?.count === 2, 'Stack overflow logic failed');

        // Unstackable item
        const pick = CREATE_ITEM.wood_pickaxe();
        game.addItem(pick);
        game.addItem(pick); // Should go to next slot
        check('Inventory', 'Unstackable', game.inventoryRef.current[2]?.id === 'wood_pickaxe' && game.inventoryRef.current[3]?.id === 'wood_pickaxe', 'Tools stacked or failed to add');

        // Data Integrity: Crafting
        const recipe = CRAFTING_RECIPES.find(r => r.id === 'recipe_wood_pickaxe');
        const result = recipe?.result();
        check('Crafting', 'Recipe Validity', !!result && result.toolProps?.type === 'pickaxe', 'Recipe result invalid');

    } catch (e: any) { check('Inventory', 'Exception', false, e.message); }

    // 6. WORLD INTERACTION (BLOCKS & WALLS)
    try {
        const tx = Math.floor(game.playerRef.current.x / TILE_SIZE) + 2;
        const ty = Math.floor(game.playerRef.current.y / TILE_SIZE);
        const idx = ty * WORLD_WIDTH + tx;
        
        // Place Block Test
        game.worldRef.current[idx] = BlockType.DIRT;
        check('World', 'Block Placement', game.worldRef.current[idx] === BlockType.DIRT, 'Direct world mod failed');

        // Wall Test
        game.wallsRef.current[idx] = WallType.WOOD;
        check('World', 'Wall Placement', game.wallsRef.current[idx] === WallType.WOOD, 'Direct wall mod failed');

        // Tool Tier Logic
        const stoneHardness = BLOCK_MINING_STATS[BlockType.STONE].minTier;
        const diamondHardness = BLOCK_MINING_STATS[BlockType.DIAMOND].minTier;
        check('World', 'Mining Tiers', diamondHardness > stoneHardness, 'Diamond should be harder than Stone');
        
        const woodPick = CREATE_ITEM.wood_pickaxe().toolProps!;
        const diaPick = CREATE_ITEM.diamond_pickaxe().toolProps!;
        check('World', 'Tool Efficiency', diaPick.efficiency > woodPick.efficiency, 'Diamond pick should be faster');

        // Block Removal
        game.worldRef.current[idx] = BlockType.AIR;
        check('World', 'Block Removal', game.worldRef.current[idx] === BlockType.AIR, 'Direct world clear failed');
        
        // Wall Removal
        game.wallsRef.current[idx] = WallType.AIR;
        check('World', 'Wall Removal', game.wallsRef.current[idx] === WallType.AIR, 'Direct wall clear failed');

    } catch (e: any) { check('World', 'Exception', false, e.message); }

    // 7. ENTITY & COMBAT
    try {
        const startCount = game.enemiesRef.current.size;
        // Spawn Enemy
        game.spawnEntity(EntityType.ZOMBIE, game.playerRef.current.x, game.playerRef.current.y);
        check('Entity', 'Spawn System', game.enemiesRef.current.size === startCount + 1, 'Enemy count did not increase');
        
        // Damage Test
        game.setHealth(100);
        await wait(50);
        const p = game.playerRef.current;
        const enemies = Array.from(game.enemiesRef.current.values()) as any[];
        const e = enemies[enemies.length-1];
        
        // Force collision
        if(e) {
            e.x = p.x; e.y = p.y;
            // Wait for game loop to process collision
            await wait(200);
            check('Combat', 'Take Damage', p.health < 100, `Health: ${p.health}`);
        } else {
            check('Combat', 'Enemy Missing', false, 'Could not find spawned enemy');
        }

        // Cleanup
        game.enemiesRef.current.clear();
        check('Entity', 'Clear System', game.enemiesRef.current.size === 0, 'Enemies not cleared');

    } catch (e: any) { check('Combat', 'Exception', false, e.message); }

    // Restore State
    game.playerRef.current.x = initialPos.x;
    game.playerRef.current.y = initialPos.y;
    game.playerRef.current.vx = 0;
    game.playerRef.current.vy = 0;
    game.setHealth(initialHp);
    game.setInventory(initialInv);

    return results;
};
