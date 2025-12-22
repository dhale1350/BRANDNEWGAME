
import React, { useEffect, useRef } from 'react';
import { GameSettings } from '../types';

interface CharacterPreviewProps {
  settings: GameSettings;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      const dt = time - timeRef.current;
      timeRef.current = time;
      
      const width = canvas.width;
      const height = canvas.height;
      const scale = 5; // Zoom level

      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;

      ctx.save();
      // Center the drawing - moved down to prevent head clipping
      ctx.translate(width / 2, height / 2 + 80);
      ctx.scale(scale, scale);

      // Idle Animation Calculation
      const breath = Math.sin(time / 500) * 1;
      const blink = Math.random() > 0.99 ? 2 : 0; // Random blink frame? No, simpler blink logic below

      // SHADOW
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Start Drawing Character (matches Game.tsx but simplified for idle)
      
      // Back Leg
      ctx.fillStyle = '#1e293b'; // Pants (Dark Slate)
      ctx.fillRect(-5, -10, 6, 12);

      // Body Bob (Breathing)
      ctx.translate(0, breath);

      // Front Leg
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -10, 6, 12);

      // Torso
      ctx.fillStyle = settings.playerColor; // Shirt Color
      ctx.fillRect(-6, -22, 12, 12);
      
      // Shirt Detail (Collar/Shadow)
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(-6, -12, 12, 2);

      // Head Group
      ctx.save();
      ctx.translate(0, -22);
      ctx.rotate(Math.sin(time / 800) * 0.05); // Subtle head bob

      // Head Skin
      ctx.fillStyle = settings.playerSkin;
      ctx.fillRect(-8, -16, 16, 16);

      // Hair
      ctx.fillStyle = settings.playerHair;
      ctx.fillRect(-9, -19, 18, 5); // Top
      ctx.fillRect(-9, -19, 5, 14); // Left Side
      ctx.fillRect(8, -14, 1, 4);   // Right Sideburn logic
      
      // Eyes (Blinking Logic)
      const isBlinking = Math.floor(time / 3000) % 2 === 0 && (time % 3000) < 150;
      ctx.fillStyle = '#111';
      if (isBlinking) {
          ctx.fillRect(2, -8, 2, 1);
          ctx.fillRect(-4, -8, 2, 1);
      } else {
          ctx.fillRect(2, -9, 2, 2);
          ctx.fillRect(-4, -9, 2, 2);
      }

      ctx.restore();

      // Arm (Idle Sway)
      ctx.save();
      ctx.translate(0, -18);
      ctx.rotate(Math.sin(time / 600) * 0.1);
      
      ctx.fillStyle = settings.playerColor; // Sleeve
      ctx.fillRect(-3, -2, 6, 8);
      
      ctx.fillStyle = settings.playerSkin; // Hand
      ctx.fillRect(-2, 6, 4, 6);
      
      ctx.restore();

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [settings]);

  return (
    <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className="w-full h-full object-contain drop-shadow-2xl"
    />
  );
};
