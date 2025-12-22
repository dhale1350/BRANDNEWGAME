
import React from 'react';
import { InventoryItem } from '../types';
import { ItemIcon } from './ItemIcon';

interface HotbarProps {
  inventory: (InventoryItem | null)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  isMobile?: boolean;
}

export const Hotbar: React.FC<HotbarProps> = ({ inventory, selectedIndex, onSelect, isMobile }) => {
  const slots = inventory.slice(0, 6);

  return (
    <div className={`fixed left-1/2 transform -translate-x-1/2 bg-slate-950/80 p-2 sm:p-3 rounded-2xl sm:rounded-3xl flex items-center gap-2 sm:gap-3 border border-white/20 shadow-2xl backdrop-blur-3xl z-50 transition-all scale-105 sm:scale-100 pointer-events-auto ${isMobile ? 'top-16 sm:top-20' : 'bottom-12 sm:bottom-12'}`}>
      <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-white/5 rounded-lg border border-white/10 text-[10px] text-white/40 font-bold">LB</div>
      
      <div className="flex gap-2 sm:gap-3">
          {slots.map((item, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); onSelect(index); }}
                className={`
                  w-13 h-13 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl transition-all duration-200 relative
                  ${isSelected 
                    ? 'bg-white/25 ring-2 ring-yellow-400 z-10 animate-selected-pulse scale-110' 
                    : 'bg-white/5 hover:bg-white/10 active:scale-95'
                  }
                `}
              >
                {item ? (
                    <>
                        <ItemIcon item={item} size={48} />
                        {item.count > 1 && (
                            <span className="absolute bottom-1 right-2 text-[10px] sm:text-xs text-white font-black drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-20">
                                {item.count}
                            </span>
                        )}
                        {isSelected && (
                            <div className={`absolute left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[9px] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-100 transition-opacity border border-white/20 font-bold tracking-tight shadow-2xl z-50 ${isMobile ? '-bottom-10' : '-top-16'}`}>
                                {item.name.toUpperCase()}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
                <span className="absolute top-1 left-1.5 text-[8px] sm:text-[9px] text-white/30 font-mono font-bold">
                    {index + 1}
                </span>
              </button>
            );
          })}
      </div>

      <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-white/5 rounded-lg border border-white/10 text-[10px] text-white/40 font-bold">RB</div>
    </div>
  );
};
