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
    <div className={`fixed left-1/2 transform -translate-x-1/2 bg-[#0b0e14]/90 p-2 sm:p-2.5 rounded-3xl flex items-center gap-2 sm:gap-3 border border-white/10 shadow-2xl backdrop-blur-xl z-50 transition-all duration-300 pointer-events-auto ${isMobile ? 'top-6 sm:top-6 scale-90 sm:scale-100' : 'bottom-8 sm:bottom-10'}`}>
      
      {/* PC Hint */}
      <div className="hidden lg:flex items-center justify-center w-6 h-6 bg-white/5 rounded text-[10px] text-white/20 font-bold border border-white/5">Q</div>
      
      <div className="flex gap-2 sm:gap-3">
          {slots.map((item, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); onSelect(index); }}
                className={`
                  w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl transition-all duration-200 relative group
                  ${isSelected 
                    ? 'bg-white/10 ring-2 ring-blue-500 ring-offset-2 ring-offset-black scale-110 z-10 shadow-lg shadow-blue-500/20' 
                    : 'bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5'
                  }
                `}
              >
                {item ? (
                    <>
                        <div className="transform transition-transform group-hover:scale-110 duration-200">
                             <ItemIcon item={item} size={36} />
                        </div>
                        {item.count > 1 && (
                            <span className="absolute bottom-0.5 right-1.5 text-[9px] sm:text-[10px] text-white font-black drop-shadow-md bg-black/50 px-1 rounded">
                                {item.count}
                            </span>
                        )}
                        {isSelected && (
                            <div className={`absolute left-1/2 -translate-x-1/2 bg-black/90 text-white text-[9px] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-100 transition-opacity border border-white/10 font-bold tracking-tight shadow-xl z-50 ${isMobile ? 'top-[140%] animate-in slide-in-from-top-2' : 'bottom-[140%] animate-in slide-in-from-bottom-2'}`}>
                                {item.name.toUpperCase()}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />
                )}
                <span className="absolute top-1 left-1.5 text-[8px] text-white/20 font-mono font-bold">
                    {index + 1}
                </span>
              </button>
            );
          })}
      </div>

      <div className="hidden lg:flex items-center justify-center w-6 h-6 bg-white/5 rounded text-[10px] text-white/20 font-bold border border-white/5">E</div>
    </div>
  );
};