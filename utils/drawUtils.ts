



import { BlockType, ToolType, WallType, ArmorType } from '../types';
import { BLOCK_COLORS, WALL_COLORS, TILE_SIZE } from '../constants';

// --- PALETTES ---

export const TOOL_PALETTES = {
  wood: { base: '#8d6e63', dark: '#5d4037', light: '#bcaaa4', outline: '#3e2723' },
  stone: { base: '#90a4ae', dark: '#546e7a', light: '#cfd8dc', outline: '#263238' },
  iron: { base: '#eceff1', dark: '#b0bec5', light: '#ffffff', outline: '#546e7a' }, 
  gold: { base: '#fbc02d', dark: '#f57f17', light: '#fff9c4', outline: '#bf360c' },
  diamond: { base: '#00bcd4', dark: '#0097a7', light: '#84ffff', outline: '#006064' },
};

export const getToolPalette = (tier: number) => {
    switch(tier) {
        case 0: return TOOL_PALETTES.wood;
        case 1: return TOOL_PALETTES.stone;
        case 2: return TOOL_PALETTES.iron;
        case 3: return TOOL_PALETTES.gold;
        case 4: return TOOL_PALETTES.diamond;
        default: return TOOL_PALETTES.wood;
    }
};

// --- PROCEDURAL TEXTURES ---

export const texRandom = (x: number, y: number, seed: number = 0) => {
    const n = x * 374761393 + y * 668265263 + seed * 536870912;
    return (Math.abs(Math.sin(n)) * 10000) % 1;
};

export const drawWall = (ctx: CanvasRenderingContext2D, x: number, y: number, type: WallType, wx: number, wy: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = WALL_COLORS[type] || '#000000';
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // Darken walls globally
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    if (type === WallType.WOOD) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 0, 2, TILE_SIZE);
        ctx.fillRect(16, 0, 2, TILE_SIZE);
    } else if (type === WallType.BRICK) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 8, TILE_SIZE, 2);
        ctx.fillRect(0, 24, TILE_SIZE, 2);
    } else if (type === WallType.STONE || type === WallType.SANDSTONE || type === WallType.SNOW) {
        if (texRandom(wx, wy, 5) > 0.6) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(4, 4, 8, 8);
        }
    }

    ctx.restore();
}

export const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, type: BlockType, wx: number, wy: number) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Draw Base
    if (type === BlockType.GRASS) {
         ctx.fillStyle = BLOCK_COLORS[BlockType.DIRT];
         ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    } else {
         ctx.fillStyle = BLOCK_COLORS[type] || '#ff00ff';
         ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    }

    // Bevel / Depth Effect for Hard Blocks
    if ([BlockType.STONE, BlockType.BRICK, BlockType.COAL, BlockType.IRON, BlockType.GOLD, BlockType.DIAMOND, BlockType.WOOD, BlockType.SANDSTONE, BlockType.ICE].includes(type)) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, 0, TILE_SIZE, 2); // Top Highlight
        ctx.fillRect(0, 0, 2, TILE_SIZE); // Left Highlight
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, TILE_SIZE-2, TILE_SIZE, 2); // Bottom Shadow
        ctx.fillRect(TILE_SIZE-2, 0, 2, TILE_SIZE); // Right Shadow
    }

    // Procedural Textures
    switch (type) {
        case BlockType.GRASS:
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for(let i=0; i<3; i++) {
                const rx = (texRandom(wx, wy, i) * TILE_SIZE) % TILE_SIZE;
                const ry = 10 + (texRandom(wx, wy, i+10) * (TILE_SIZE-10));
                ctx.fillRect(rx, ry, 3, 3);
            }
            ctx.fillStyle = '#4caf50'; 
            ctx.fillRect(0, 0, TILE_SIZE, 8);
            for(let i=0; i<8; i++) {
                if (texRandom(wx, wy, i+20) > 0.4) {
                    const h = 4 + texRandom(wx, wy, i+30) * 6;
                    ctx.fillRect(i*4, 6, 3, h);
                }
            }
            ctx.fillStyle = '#81c784';
            ctx.fillRect(2, 2, 2, 2); ctx.fillRect(10, 3, 2, 2); ctx.fillRect(20, 1, 2, 2);
            break;
            
        case BlockType.DIRT:
            for(let i=0; i<6; i++) {
                ctx.fillStyle = 'rgba(0,0,0,0.15)'; 
                const rx = (texRandom(wx, wy, i) * (TILE_SIZE-4));
                const ry = (texRandom(wx, wy, i+10) * (TILE_SIZE-4));
                ctx.fillRect(rx, ry, 4, 4);
                
                ctx.fillStyle = 'rgba(255,255,255,0.05)'; 
                const rx2 = (texRandom(wx, wy, i+20) * (TILE_SIZE-2));
                const ry2 = (texRandom(wx, wy, i+30) * (TILE_SIZE-2));
                ctx.fillRect(rx2, ry2, 2, 2);
            }
            break;

        case BlockType.STONE:
            ctx.fillStyle = '#546e7a'; 
            if (texRandom(wx, wy, 1) > 0.3) ctx.fillRect(2, 2, 10, 8);
            if (texRandom(wx, wy, 2) > 0.3) ctx.fillRect(16, 16, 12, 10);
            ctx.fillStyle = '#78909c'; 
            ctx.fillRect(20, 4, 6, 4);
            ctx.fillRect(4, 20, 6, 4);
            break;
        
        case BlockType.SANDSTONE:
            ctx.fillStyle = '#bfa588'; 
            ctx.fillRect(0, 5, TILE_SIZE, 2);
            ctx.fillRect(0, 15, TILE_SIZE, 2);
            ctx.fillRect(0, 25, TILE_SIZE, 2);
            break;

        case BlockType.WOOD:
            ctx.fillStyle = '#3e2723'; 
            ctx.fillRect(4, 0, 2, TILE_SIZE);
            ctx.fillRect(12, 0, 2, TILE_SIZE);
            ctx.fillRect(20, 0, 2, TILE_SIZE);
            ctx.fillRect(28, 0, 2, TILE_SIZE);
            break;

        case BlockType.LEAVES:
        case BlockType.PINE_LEAVES:
            ctx.fillStyle = type === BlockType.LEAVES ? '#2e7d32' : '#0f3d22'; 
            ctx.fillRect(2, 2, 10, 10);
            ctx.fillRect(18, 14, 10, 10);
            ctx.fillStyle = type === BlockType.LEAVES ? '#66bb6a' : '#14532d'; 
            ctx.fillRect(14, 4, 6, 6);
            ctx.fillRect(4, 18, 6, 6);
            break;
            
        case BlockType.CACTUS:
             ctx.fillStyle = '#365314'; 
             ctx.fillRect(4, 4, 2, 8); ctx.fillRect(12, 18, 2, 8); ctx.fillRect(24, 6, 2, 8);
             ctx.fillStyle = 'rgba(0,0,0,0.1)';
             ctx.fillRect(6, 0, 4, TILE_SIZE);
             ctx.fillRect(18, 0, 4, TILE_SIZE);
             break;

        case BlockType.BRICK:
            ctx.fillStyle = '#b71c1c'; 
            ctx.fillRect(0,0,TILE_SIZE,TILE_SIZE);
            ctx.fillStyle = '#ef9a9a'; 
            ctx.fillRect(0, 0, TILE_SIZE, 2);
            ctx.fillRect(0, 16, TILE_SIZE, 2);
            ctx.fillRect(16, 0, 2, 16);
            ctx.fillRect(8, 16, 2, 16); 
            ctx.fillRect(24, 16, 2, 16);
            break;
            
        case BlockType.COAL:
        case BlockType.IRON:
        case BlockType.GOLD:
        case BlockType.DIAMOND:
            ctx.fillStyle = '#546e7a'; 
            ctx.fillRect(2, 2, 8, 8); ctx.fillRect(18, 18, 8, 8);
            ctx.fillStyle = type === BlockType.COAL ? '#212121' : 
                           type === BlockType.IRON ? '#d7ccc8' : 
                           type === BlockType.GOLD ? '#ffd740' : '#40c4ff';
            ctx.beginPath();
            ctx.moveTo(10, 10); ctx.lineTo(16, 6); ctx.lineTo(22, 10); ctx.lineTo(16, 16); ctx.fill();
            ctx.fillRect(6, 22, 6, 6);
            ctx.fillRect(22, 6, 5, 5);
            if (type === BlockType.GOLD || type === BlockType.DIAMOND) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.7;
                ctx.fillRect(14, 8, 4, 4);
                ctx.globalAlpha = 1.0;
            }
            break;
            
        case BlockType.SAND:
            ctx.fillStyle = '#fdd835'; 
            for(let i=0; i<10; i++) {
                const rx = (texRandom(wx, wy, i*2) * (TILE_SIZE-2));
                const ry = (texRandom(wx, wy, i*3) * (TILE_SIZE-2));
                ctx.fillRect(rx, ry, 2, 2);
            }
            break;
            
        case BlockType.SNOW:
            ctx.fillStyle = '#e2e8f0'; 
            for(let i=0; i<10; i++) {
                const rx = (texRandom(wx, wy, i*2) * (TILE_SIZE-2));
                const ry = (texRandom(wx, wy, i*3) * (TILE_SIZE-2));
                ctx.fillRect(rx, ry, 2, 2);
            }
            break;
            
        case BlockType.ICE:
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.moveTo(0,0); ctx.lineTo(10, TILE_SIZE);
            ctx.moveTo(15,0); ctx.lineTo(25, TILE_SIZE);
            ctx.stroke();
            break;
            
        case BlockType.BEDROCK:
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(0,0); ctx.lineTo(10, 10); ctx.lineTo(20, 0); ctx.lineTo(32, 10); ctx.lineTo(32, 32); ctx.lineTo(0, 32);
            ctx.fill();
            ctx.fillStyle = '#212121';
            ctx.fillRect(5, 20, 10, 5);
            ctx.fillRect(20, 15, 5, 10);
            break;

        case BlockType.GLASS:
             ctx.fillStyle = 'rgba(224, 247, 250, 0.2)';
             ctx.fillRect(0,0,TILE_SIZE,TILE_SIZE);
             ctx.lineWidth = 2;
             ctx.strokeStyle = '#b2ebf2';
             ctx.strokeRect(2, 2, TILE_SIZE-4, TILE_SIZE-4);
             ctx.fillStyle = 'rgba(255,255,255,0.6)';
             ctx.beginPath();
             ctx.moveTo(6, 26); ctx.lineTo(12, 26); ctx.lineTo(26, 12); ctx.lineTo(26, 6); 
             ctx.fill();
             break;

        case BlockType.CHEST:
             ctx.fillStyle = '#8d6e63'; 
             ctx.fillRect(2, 8, 28, 24); 
             ctx.fillStyle = '#5d4037'; 
             ctx.fillRect(2, 8, 28, 2); 
             ctx.fillRect(13, 16, 6, 8); 
             ctx.fillStyle = '#ffca28'; 
             ctx.fillRect(14, 18, 4, 4);
             break;
    }

    ctx.restore();
};

// --- TOOL DRAWING ---

export const drawTool = (
    ctx: CanvasRenderingContext2D, 
    type: ToolType, 
    tier: number, 
    x: number, 
    y: number, 
    scale: number = 1
) => {
    const p = getToolPalette(tier);
    const pixel = 2 * scale; 

    ctx.save();
    ctx.translate(x, y);
    
    // Helper
    const dp = (gx: number, gy: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(gx * pixel, gy * pixel, pixel, pixel);
    };

    const handle = '#5d4037';
    const handleDark = '#3e2723';
    
    if (type === ToolType.BOW) {
        // Draw Bow
        // Curve
        dp(1, -5, handle); dp(2, -4, handle); dp(3, -3, handle);
        dp(3, -2, handle); dp(3, -1, handle); dp(3, 0, handle); // Grip area
        dp(3, 1, handle); dp(3, 2, handle); dp(2, 3, handle); dp(1, 4, handle);
        
        // String
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(1 * pixel, -5 * pixel, 1, 9 * pixel);
        
        // Arrow (if charged? visually just static for icon)
        dp(2, 0, '#ccc'); dp(1, 0, '#ccc'); dp(0, 0, '#ccc');
        dp(2, 0, '#fff'); // Tip
        dp(-1, 0, '#8d6e63'); // Fletching
    }
    else if (type === ToolType.SWORD) {
        // Hilt
        dp(0, 3, handleDark); // Pommel
        dp(0, 2, handle);
        dp(0, 1, handle);
        
        // Guard
        dp(-2, 0, p.outline); dp(2, 0, p.outline);
        dp(-1, 0, p.dark); dp(1, 0, p.dark); dp(0, 0, p.base);

        // Blade
        for (let i = 1; i <= 9; i++) {
            dp(0, -i, i % 2 === 0 ? p.base : p.light); // Core spine
            dp(-1, -i, p.dark); // Left edge (shadow)
            dp(1, -i, p.light); // Right edge (highlight)
        }
        // Tip
        dp(0, -10, p.light);
    } 
    else if (type === ToolType.PICKAXE) {
        // Handle
        for(let i=-2; i<=5; i++) dp(0, i, handle);
        
        // Head Connector
        dp(0, -3, p.dark); 
        dp(0, -4, p.base);
        
        // Curved Head (Arc)
        dp(-1, -4, p.base); dp(-2, -3, p.base); dp(-3, -2, p.dark); dp(-4, -1, p.outline); 
        dp(1, -4, p.base); dp(2, -3, p.base); dp(3, -2, p.dark); dp(4, -1, p.outline);
        
        dp(-1, -5, p.light); dp(0, -5, p.light); dp(1, -5, p.light);
    }
    else if (type === ToolType.AXE) {
        // Handle
        for(let i=-2; i<=6; i++) dp(0, i, handle);
        dp(0, -3, p.dark); dp(0, -2, p.dark);
        // Blade
        dp(1, -4, p.base); dp(2, -4, p.light);
        dp(1, -3, p.base); dp(2, -3, p.base); dp(3, -3, p.light);
        dp(1, -2, p.base); dp(2, -2, p.base); dp(3, -2, p.light);
        dp(1, -1, p.dark); dp(2, -1, p.base); dp(3, -1, p.light);
        dp(1, 0, p.dark); dp(2, 0, p.dark);
        dp(-1, -3, p.dark);
    }
    else if (type === ToolType.SHOVEL) {
        for(let i=-3; i<=4; i++) dp(0, i, handle);
        dp(0, -4, p.dark);
        dp(0, -5, p.base); dp(-1, -5, p.base); dp(1, -5, p.base);
        dp(0, -6, p.base); dp(-1, -6, p.base); dp(1, -6, p.base); dp(-2, -6, p.base); dp(2, -6, p.base);
        dp(0, -7, p.base); dp(-1, -7, p.base); dp(1, -7, p.base); dp(-2, -7, p.base); dp(2, -7, p.base);
        dp(0, -8, p.light); dp(-1, -8, p.light); dp(1, -8, p.light); 
    }

    ctx.restore();
};

export const drawArmor = (ctx: CanvasRenderingContext2D, type: ArmorType, tier: number, x: number, y: number, scale: number = 1) => {
    const p = getToolPalette(tier);
    const pixel = 2 * scale; 

    ctx.save();
    ctx.translate(x, y);
    
    const dp = (gx: number, gy: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(gx * pixel, gy * pixel, pixel, pixel);
    };

    if (type === ArmorType.HELMET) {
        for(let i=-3; i<=3; i++) dp(i, -6, p.base);
        for(let i=-4; i<=4; i++) dp(i, -5, p.base);
        for(let i=-4; i<=4; i++) dp(i, -4, p.base);
        dp(-2, -6, p.light); dp(-1, -6, p.light); dp(-3, -5, p.light); 
        dp(-4, -3, p.base); dp(-4, -2, p.base); dp(-4, -1, p.dark);
        dp(4, -3, p.base); dp(4, -2, p.base); dp(4, -1, p.dark);

        if (tier >= 4) { 
            dp(-3, -3, p.dark); dp(3, -3, p.dark);
            dp(-3, -2, p.base); dp(3, -2, p.base); 
            dp(-3, -1, p.base); dp(3, -1, p.base);
            dp(0, -3, p.dark); dp(0, -2, p.dark); dp(0, -1, p.dark);
            dp(-1, -2, p.dark); dp(1, -2, p.dark);
            dp(-5, -6, p.light); dp(-5, -7, p.light); dp(-6, -8, p.light);
            dp(5, -6, p.light); dp(5, -7, p.light); dp(6, -8, p.light);
        } else {
            dp(-3, -3, p.dark); dp(3, -3, p.dark); 
            dp(-4, -1, p.outline); dp(4, -1, p.outline); 
            dp(0, -3, p.base); dp(0, -2, p.base); dp(0, -1, p.dark);
        }
    } 
    else if (type === ArmorType.CHESTPLATE) {
        dp(-5, -5, p.outline); dp(-4, -5, p.base); dp(-3, -5, p.light);
        dp(5, -5, p.outline); dp(4, -5, p.base); dp(3, -5, p.light);
        dp(-2, -5, p.dark); dp(2, -5, p.dark);
        for(let y=-4; y<=1; y++) {
            for(let x=-4; x<=4; x++) {
                if (Math.abs(x) > 3 && y > -2) continue; 
                dp(x, y, p.base);
            }
        }
        dp(-2, -3, p.light); dp(2, -3, p.light);
        dp(0, -3, p.dark); dp(0, -2, p.dark);
        dp(-1, 0, p.dark); dp(1, 0, p.dark); dp(0, 1, p.outline); 
    }
    else if (type === ArmorType.LEGGINGS) {
        for(let i=-3; i<=3; i++) dp(i, -4, p.dark);
        dp(0, -4, p.light); 
        dp(0, -3, p.base); dp(-1, -3, p.base); dp(1, -3, p.base); dp(0, -2, p.dark);
        
        dp(-2, -3, p.base); dp(-3, -3, p.dark);
        dp(-2, -2, p.base); dp(-3, -2, p.base);
        dp(-2, -1, p.base); dp(-3, -1, p.base);
        dp(-2, 0, p.dark); dp(-3, 0, p.dark); 
        dp(-2, 1, p.base); dp(-3, 1, p.base); 
        
        dp(2, -3, p.base); dp(3, -3, p.dark);
        dp(2, -2, p.base); dp(3, -2, p.base);
        dp(2, -1, p.base); dp(3, -1, p.base);
        dp(2, 0, p.dark); dp(3, 0, p.dark);
        dp(2, 1, p.base); dp(3, 1, p.base); 
    }

    ctx.restore();
};

export const drawAccessory = (ctx: CanvasRenderingContext2D, type: string, x: number, y: number, scale: number = 1) => {
    const pixel = 2 * scale;
    ctx.save();
    ctx.translate(x, y);

    const dp = (gx: number, gy: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(gx * pixel, gy * pixel, pixel, pixel);
    };

    if (type === 'grip') {
        const metal = '#cfd8dc';
        const darkMetal = '#546e7a';
        const accent = '#f44336'; // Red piston

        // Draw mechanical arm/claw
        dp(-3, 0, darkMetal); dp(-2, 0, metal); dp(-1, 0, darkMetal);
        dp(-3, 1, darkMetal); dp(-2, 1, metal); dp(-1, 1, darkMetal);
        
        // Piston shaft
        dp(0, 0, '#37474f'); dp(1, 0, accent); dp(2, 0, accent);
        
        // Claw
        dp(3, -2, metal); dp(4, -2, metal);
        dp(3, -1, metal); dp(5, -1, metal);
        dp(3, 0, darkMetal); dp(4, 0, metal);
        dp(3, 1, metal); dp(5, 1, metal);
        dp(3, 2, metal); dp(4, 2, metal);
    }

    ctx.restore();
};