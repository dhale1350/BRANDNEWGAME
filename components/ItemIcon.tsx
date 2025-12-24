

import React, { useRef, useEffect } from 'react';
import { InventoryItem } from '../types';
import { drawBlock, drawTool, drawWall, drawArmor, drawAccessory } from '../utils/drawUtils';
import { TILE_SIZE } from '../constants';

export const ItemIcon = ({ item, size = 32 }: { item: InventoryItem, size?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, size, size);
        ctx.imageSmoothingEnabled = false;

        // Center point
        const cx = size / 2;
        const cy = size / 2;

        if (item.isBlock && item.blockType !== undefined) {
             // Draw block scaled to fit
             const scale = size / TILE_SIZE;
             ctx.save();
             ctx.translate(cx - (TILE_SIZE * scale) / 2, cy - (TILE_SIZE * scale) / 2);
             ctx.scale(scale, scale);
             drawBlock(ctx, 0, 0, item.blockType, 0, 0); 
             ctx.restore();
             
             // Add a slight shadow/border for UI feel
             ctx.strokeStyle = 'rgba(255,255,255,0.1)';
             ctx.lineWidth = 2;
             ctx.strokeRect(cx - (TILE_SIZE * scale) / 2, cy - (TILE_SIZE * scale) / 2, size, size);

        } else if (item.isWall && item.wallType !== undefined) {
             // Draw wall scaled to fit
             const scale = size / TILE_SIZE;
             ctx.save();
             ctx.translate(cx - (TILE_SIZE * scale) / 2, cy - (TILE_SIZE * scale) / 2);
             ctx.scale(scale, scale);
             drawWall(ctx, 0, 0, item.wallType, 0, 0);
             ctx.restore();
             
             // Border for walls to distinguish from blocks (dashed maybe? or just darker)
             ctx.strokeStyle = 'rgba(0,0,0,0.5)';
             ctx.lineWidth = 1;
             ctx.strokeRect(cx - (TILE_SIZE * scale) / 2, cy - (TILE_SIZE * scale) / 2, size, size);

        } else if (item.toolProps) {
             // Draw Tool
             ctx.save();
             ctx.translate(cx, cy);
             
             // Scale factor
             const baseSize = 32; 
             const toolScale = size / baseSize; 
             
             ctx.scale(toolScale, toolScale);
             
             // Rotate for icon display (45 deg)
             ctx.rotate(-Math.PI / 4);
             
             drawTool(ctx, item.toolProps.type, item.toolProps.tier, 0, 0, 1.2);
             
             // Drop shadow
             ctx.globalCompositeOperation = 'destination-over';
             ctx.shadowColor = 'rgba(0,0,0,0.5)';
             ctx.shadowBlur = 10;
             ctx.shadowOffsetX = 2;
             ctx.shadowOffsetY = 2;
             
             ctx.restore();
        } else if (item.armorProps) {
             // Draw Armor
             ctx.save();
             ctx.translate(cx, cy);
             
             const baseSize = 32;
             const scale = size / baseSize;
             ctx.scale(scale, scale);
             
             // Draw upright
             drawArmor(ctx, item.armorProps.type, item.armorProps.tier, 0, 0, 1.5);
             
             // Drop shadow
             ctx.globalCompositeOperation = 'destination-over';
             ctx.shadowColor = 'rgba(0,0,0,0.5)';
             ctx.shadowBlur = 8;
             ctx.shadowOffsetX = 2;
             ctx.shadowOffsetY = 2;
             
             ctx.restore();
        } else if (item.accessoryProps) {
             // Draw Accessory
             ctx.save();
             ctx.translate(cx, cy);
             
             const baseSize = 32;
             const scale = size / baseSize;
             ctx.scale(scale, scale);
             
             drawAccessory(ctx, item.accessoryProps.type, 0, 0, 1.5);

             ctx.globalCompositeOperation = 'destination-over';
             ctx.shadowColor = 'rgba(0,0,0,0.5)';
             ctx.shadowBlur = 8;
             ctx.shadowOffsetX = 2;
             ctx.shadowOffsetY = 2;
             ctx.restore();
        }

        // Draw Durability Bar
        if (item.toolProps && item.toolProps.durability !== undefined && item.toolProps.maxDurability) {
            const current = item.toolProps.durability;
            const max = item.toolProps.maxDurability;
            const ratio = current / max;
            
            const barWidth = size * 0.8;
            const barHeight = Math.max(2, size * 0.08);
            const x = (size - barWidth) / 2;
            const y = size - barHeight - 2;

            // Background
            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, barWidth, barHeight);

            // Color based on durability
            let color = '#4ade80'; // Green
            if (ratio < 0.5) color = '#facc15'; // Yellow
            if (ratio < 0.2) color = '#ef4444'; // Red

            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth * ratio, barHeight);
        }
    }, [item, size]);

    return <canvas ref={canvasRef} width={size} height={size} className="block drop-shadow-md" />;
};