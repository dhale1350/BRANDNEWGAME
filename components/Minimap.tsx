
import React, { useEffect, useRef } from 'react';
import { BlockType, Entity, EntityType } from '../types';
import { BLOCK_COLORS, WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE } from '../constants';
import { Map, X } from 'lucide-react';

interface MinimapProps {
  world: Uint8Array;
  player: Entity;
  others: Map<string, Entity>;
  isOpen: boolean;
  onToggle: () => void;
  isFullMap: boolean;
}

export const Minimap: React.FC<MinimapProps> = ({ world, player, others, isOpen, onToggle, isFullMap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapBufferRef = useRef<HTMLCanvasElement | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Initialize or update the world buffer (Heavy operation, do infrequently or on open)
  useEffect(() => {
    if (!world.length) return;
    
    // Create buffer if needed
    if (!mapBufferRef.current) {
        mapBufferRef.current = document.createElement('canvas');
        mapBufferRef.current.width = WORLD_WIDTH;
        mapBufferRef.current.height = WORLD_HEIGHT;
    }

    const ctx = mapBufferRef.current.getContext('2d');
    if (!ctx) return;

    // We only redraw the whole map buffer occasionally to save FPS
    // In a real implementation, we would dirty-rect update, but for 400x180 pixels, a full redraw is cheap enough
    const id = requestAnimationFrame(() => {
        const imgData = ctx.createImageData(WORLD_WIDTH, WORLD_HEIGHT);
        const data = imgData.data;

        for (let i = 0; i < world.length; i++) {
            const block = world[i];
            if (block !== BlockType.AIR) {
                const colorHex = BLOCK_COLORS[block as BlockType] || '#000000';
                // Parse hex to rgb
                const r = parseInt(colorHex.slice(1, 3), 16);
                const g = parseInt(colorHex.slice(3, 5), 16);
                const b = parseInt(colorHex.slice(5, 7), 16);
                
                const idx = i * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    });

    return () => cancelAnimationFrame(id);
  }, [world, world.length]); // Re-run when world array reference changes (chunk updates)

  // Render Loop for Player Positions (High FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const buffer = mapBufferRef.current;

    let animId: number;

    const render = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      // Draw World Buffer
      if (buffer) {
          if (isFullMap) {
              // Draw full world scaled to fit canvas
              ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
          } else {
              // Draw crop centered on player
              const px = player.x / TILE_SIZE;
              const py = player.y / TILE_SIZE;
              const zoom = 4; // Zoom level for minimap
              
              // Source coordinates (World)
              const viewW = canvas.width / zoom;
              const viewH = canvas.height / zoom;
              const sx = Math.max(0, Math.min(WORLD_WIDTH - viewW, px - viewW/2));
              const sy = Math.max(0, Math.min(WORLD_HEIGHT - viewH, py - viewH/2));

              ctx.drawImage(
                  buffer, 
                  sx, sy, viewW, viewH, 
                  0, 0, canvas.width, canvas.height
              );
          }
      }

      // Draw Players
      const drawEnt = (e: Entity, color: string, isSelf: boolean) => {
          const ex = e.x / TILE_SIZE;
          const ey = e.y / TILE_SIZE;

          let dx, dy;

          if (isFullMap) {
             // Scale coords to canvas
             dx = (ex / WORLD_WIDTH) * canvas.width;
             dy = (ey / WORLD_HEIGHT) * canvas.height;
          } else {
             // Relative coords
             const px = player.x / TILE_SIZE;
             const py = player.y / TILE_SIZE;
             const zoom = 4;
             const viewW = canvas.width / zoom;
             const viewH = canvas.height / zoom;
             const sx = Math.max(0, Math.min(WORLD_WIDTH - viewW, px - viewW/2));
             const sy = Math.max(0, Math.min(WORLD_HEIGHT - viewH, py - viewH/2));
             
             dx = (ex - sx) * zoom;
             dy = (ey - sy) * zoom;
          }

          // Blip
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(dx, dy, isFullMap ? 3 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Name
          if (isFullMap || isSelf) {
             ctx.fillStyle = 'white';
             ctx.font = 'bold 10px sans-serif';
             ctx.textAlign = 'center';
             ctx.fillText(isSelf ? 'YOU' : (e.name || '???'), dx, dy - 6);
          }
      };

      others.forEach(p => drawEnt(p, p.color || '#ef4444', false));
      drawEnt(player, '#3b82f6', true);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [player, others, isFullMap, world]);

  if (isFullMap) {
      if (!isOpen) return null;
      return (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative w-full h-full max-w-5xl max-h-[80vh] bg-[#0b0e14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white font-bold tracking-widest uppercase">
                        <Map size={20} /> World Map
                    </div>
                    <button onClick={onToggle} className="text-zinc-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="flex-1 relative bg-[#050505]">
                    <canvas 
                        ref={canvasRef} 
                        width={800} 
                        height={360} 
                        className="w-full h-full object-contain"
                    />
                </div>
                <div className="p-2 bg-black/40 text-center text-[10px] text-zinc-500 font-mono">
                    POS: {Math.floor(player.x/TILE_SIZE)}, {Math.floor(player.y/TILE_SIZE)}
                </div>
            </div>
        </div>
      );
  }

  // HUD Minimap
  return (
    <div 
        className="fixed top-20 right-4 sm:right-6 w-32 h-32 sm:w-40 sm:h-40 bg-black/60 border-2 border-white/10 rounded-full overflow-hidden backdrop-blur-xl shadow-2xl z-40 transition-transform hover:scale-105 cursor-pointer"
        onClick={onToggle}
    >
        <canvas 
            ref={canvasRef} 
            width={160} 
            height={160} 
            className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 border-[3px] border-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-white/80 drop-shadow-md">
            {Math.floor(player.x/TILE_SIZE)}, {Math.floor(player.y/TILE_SIZE)}
        </div>
    </div>
  );
};
