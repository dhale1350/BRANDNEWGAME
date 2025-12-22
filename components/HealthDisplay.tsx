import React from 'react';
import { Heart } from 'lucide-react';

interface HealthDisplayProps {
  current: number;
  max: number;
}

export const HealthDisplay: React.FC<HealthDisplayProps> = ({ current, max }) => {
  const isLow = current < max * 0.3;
  const hearts = [];
  const heartCount = 10;
  const hpPerHeart = max / heartCount;

  for (let i = 0; i < heartCount; i++) {
    const threshold = i * hpPerHeart;
    let fillAmount = (current - threshold) / hpPerHeart;
    fillAmount = Math.max(0, Math.min(1, fillAmount));

    hearts.push(
      <div key={i} className={`relative w-4 h-4 sm:w-5 sm:h-5 ${isLow && current > 0 ? 'animate-pulse' : ''}`}>
        <Heart className="w-full h-full text-black/40 absolute top-0 left-0" strokeWidth={1} />
        <div 
            className="absolute top-0 left-0 overflow-hidden transition-all duration-300" 
            style={{ width: `${fillAmount * 100}%` }}
        >
           <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" strokeWidth={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5 select-none">
      <div className={`flex flex-wrap max-w-[120px] sm:max-w-none gap-1 bg-slate-950/40 p-2 sm:p-3 rounded-2xl backdrop-blur-xl border border-white/5 shadow-2xl transition-all ${isLow ? 'border-red-500/30' : ''}`}>
        {hearts}
      </div>
      <div className={`text-[10px] sm:text-[11px] font-black font-mono px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md transition-colors ${isLow ? 'text-red-400 animate-pulse' : 'text-white/60'}`}>
          HP: {Math.ceil(current)} / {max}
      </div>
    </div>
  );
};