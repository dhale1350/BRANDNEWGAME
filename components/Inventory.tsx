
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, ArmorType } from '../types';
import { CRAFTING_RECIPES, CraftingRecipe } from '../constants';
import { Box, X, Info, Zap, Hammer, Sword, Shield, Battery, ArrowRightLeft, MousePointerClick, Archive } from 'lucide-react';
import { ItemIcon } from './ItemIcon';

interface InventoryProps {
  isOpen: boolean;
  inventory: (InventoryItem | null)[];
  onSwap: (fromIndex: number, toIndex: number) => void;
  onClose: () => void;
  addItem: (item: InventoryItem) => boolean;
  onUpdateSlot?: (index: number, item: InventoryItem | null) => void;
  nearbyStations?: any[];
  externalInventory?: (InventoryItem | null)[];
  onUpdateExternalSlot?: (index: number, item: InventoryItem | null) => void;
  onTransfer?: (fromIndex: number, fromLoc: 'player' | 'container', toIndex: number, toLoc: 'player' | 'container') => void;
}

export const Inventory: React.FC<InventoryProps> = ({ 
    isOpen, inventory, onSwap, onClose, addItem, onUpdateSlot, 
    externalInventory, onUpdateExternalSlot, onTransfer 
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{ index: number, loc: 'player' | 'container' } | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
  const [hoverItem, setHoverItem] = useState<InventoryItem | null>(null);

  const inventoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach(item => { if (item) counts[item.id] = (counts[item.id] || 0) + item.count; });
    return counts;
  }, [inventory]);

  // Mobile/Touch: Tapping an item sets it as "Hovered" so we can see stats in footer
  const handleSlotInteraction = (index: number, loc: 'player' | 'container') => {
      const sourceList = loc === 'player' ? inventory : (externalInventory || []);
      const item = sourceList[index];
      
      // If we are already holding an item (selectedSlot is valid)
      if (selectedSlot !== null) {
          // Perform swap/transfer
          if (selectedSlot.loc === loc) {
              // Same container swap
              if (loc === 'player') onSwap(selectedSlot.index, index);
              else if (onUpdateExternalSlot) {
                  // Swap external items
                  const list = [...(externalInventory || [])];
                  const temp = list[selectedSlot.index];
                  list[selectedSlot.index] = list[index];
                  list[index] = temp;
                  // We need to update both slots, simpler to just swap via parent logic if parent supported generic onSwap. 
                  // But since parent supports onUpdateExternalSlot, we can do it manually or via onTransfer.
                  if (onTransfer) onTransfer(selectedSlot.index, loc, index, loc);
              }
          } else {
              // Cross container transfer
              if (onTransfer) onTransfer(selectedSlot.index, selectedSlot.loc, index, loc);
          }
          
          setSelectedSlot(null);
          // If we swapped to a new item, show its stats
          const newList = loc === 'player' ? inventory : (externalInventory || []);
          // Note: The list update might be async, so we might check stale data here, but usually fine for hover update
          if (sourceList[index]) setHoverItem(sourceList[index]); // Use sourceList (pre-swap) or assume update?
      } else {
          // If clicking an empty slot, do nothing unless we want to just clear hover
          if (!item) {
              setHoverItem(null);
          } else {
              // Select it for moving
              setSelectedSlot({ index, loc });
              setHoverItem(item);
          }
      }
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    const can = recipe.ingredients.every(i => (inventoryCounts[i.id] || 0) >= i.count);
    if (can && onUpdateSlot) {
        recipe.ingredients.forEach(ing => {
            let rem = ing.count;
            for(let i=0; i<30; i++) { 
                if(inventory[i]?.id === ing.id) {
                    const take = Math.min(rem, inventory[i]!.count);
                    const ni = { ...inventory[i]!, count: inventory[i]!.count - take };
                    onUpdateSlot(i, ni.count <= 0 ? null : ni); rem -= take; if (rem <= 0) break;
                }
            }
        });
        addItem(recipe.result());
    }
  };

  if (!isOpen) return null;
  const displayItem = hoverItem;
  const isContainerOpen = !!externalInventory;

  const renderSlot = (i: number, list: (InventoryItem | null)[], loc: 'player' | 'container', icon?: React.ReactNode, typeHint?: string) => {
      const item = list[i];
      const isSelected = selectedSlot?.index === i && selectedSlot?.loc === loc;
      return (
        <button 
            key={`${loc}-${i}`} 
            onClick={() => handleSlotInteraction(i, loc)}
            onMouseEnter={() => { if (!isSelected) setHoverItem(item || null); }}
            className={`aspect-square relative rounded-xl flex items-center justify-center transition-all duration-100 ${isSelected ? 'bg-amber-500/20 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] z-10 scale-105' : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'}`}
        >
            {item ? (
                <>
                    <div className="transform transition-transform hover:scale-110">
                        <ItemIcon item={item} size={36} />
                    </div>
                    {item.count > 1 && <span className="absolute bottom-1 right-1.5 text-[10px] font-black text-white drop-shadow-md bg-black/40 px-1 rounded-md">{item.count}</span>}
                </>
            ) : (
                icon ? <div className="text-white/10">{icon}</div> : null
            )}
            {typeHint && !item && <span className="absolute bottom-1 text-[7px] uppercase font-bold text-white/20 tracking-wider">{typeHint}</span>}
        </button>
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0b0e14]/90 border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
          <div className="flex gap-2">
             <button onClick={() => setActiveTab('inventory')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>Inventory</button>
             {!isContainerOpen && <button onClick={() => setActiveTab('crafting')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'crafting' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>Crafting</button>}
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b0e14] custom-scrollbar min-h-[320px]">
          {activeTab === 'inventory' ? (
             <div className="flex flex-col gap-6 h-full">
                 
                 {/* External Container Grid */}
                 {isContainerOpen && externalInventory && (
                     <div className="flex flex-col gap-2">
                         <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2 px-2">
                             <Archive size={12} /> Chest Storage
                         </div>
                         <div className="bg-black/20 p-4 rounded-3xl border border-white/5">
                            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-10 gap-2 sm:gap-3">
                                {Array.from({ length: 15 }).map((_, i) => renderSlot(i, externalInventory, 'container'))}
                            </div>
                         </div>
                     </div>
                 )}

                 <div className="flex flex-col sm:flex-row gap-6 h-full">
                     {/* Armor Column - Horizontal on mobile, Vertical on desktop */}
                     <div className="flex sm:flex-col gap-3 shrink-0 justify-center bg-black/20 p-3 rounded-2xl border border-white/5 h-min">
                         {renderSlot(30, inventory, 'player', <Shield size={18} />, 'Head')}
                         {renderSlot(31, inventory, 'player', <Shield size={18} />, 'Chest')}
                         {renderSlot(32, inventory, 'player', <Shield size={18} />, 'Legs')}
                     </div>
                     
                     {/* Main Grid */}
                     <div className="flex-1 flex flex-col gap-2">
                        {!isContainerOpen && <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Backpack</div>}
                        <div className="bg-black/20 p-4 rounded-3xl border border-white/5 flex-1">
                            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-10 gap-2 sm:gap-3">
                                {Array.from({ length: 30 }).map((_, i) => renderSlot(i, inventory, 'player'))}
                            </div>
                        </div>
                     </div>
                 </div>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CRAFTING_RECIPES.map((recipe, i) => {
                    const canCraft = recipe.ingredients.every(ing => (inventoryCounts[ing.id] || 0) >= ing.count);
                    return (
                      <button 
                        key={recipe.id} 
                        onClick={() => handleCraft(recipe)} 
                        onMouseEnter={() => setHoverItem(recipe.result())}
                        disabled={!canCraft}
                        className={`flex items-center gap-4 p-3 rounded-2xl border transition-all text-left group ${canCraft ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]' : 'border-transparent opacity-40 cursor-not-allowed'}`}
                      >
                        <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden group-hover:scale-110 transition-transform">
                            <ItemIcon item={recipe.result()} size={32} />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-amber-400 transition-colors">{recipe.name}</div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-1">
                                {recipe.ingredients.map(ing => (
                                    <span key={ing.id} className={inventoryCounts[ing.id] >= ing.count ? 'text-emerald-500' : 'text-red-500'}>
                                        {ing.count}x {ing.id.replace('block_', '')}{' '}
                                    </span>
                                ))}
                            </div>
                        </div>
                      </button>
                    )
                })}
             </div>
          )}
        </div>

        {/* Info Panel Footer */}
        <div className="bg-[#080a0e] border-t border-white/5 p-4 sm:p-6 flex gap-6 items-center shrink-0 min-h-[110px]">
            {displayItem ? (
                <>
                    <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center shadow-lg shrink-0">
                        <ItemIcon item={displayItem} size={48} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-white uppercase tracking-wide truncate">{displayItem.name}</h3>
                        <div className="flex items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex-wrap mt-1">
                            <span className="bg-white/5 px-2 py-0.5 rounded text-zinc-400 whitespace-nowrap">{displayItem.isBlock ? 'Block' : displayItem.armorProps ? 'Armor' : 'Tool'}</span>
                            {displayItem.toolProps && (
                                <>
                                    {displayItem.toolProps.damage && <span className="flex items-center gap-1 text-red-400 whitespace-nowrap"><Sword size={12}/> {displayItem.toolProps.damage} DMG</span>}
                                    {displayItem.toolProps.efficiency && <span className="flex items-center gap-1 text-amber-400 whitespace-nowrap"><Hammer size={12}/> {Math.round(displayItem.toolProps.efficiency * 100)}% PWR</span>}
                                    {displayItem.toolProps.durability !== undefined && (
                                        <span className={`flex items-center gap-1 whitespace-nowrap ${displayItem.toolProps.durability < (displayItem.toolProps.maxDurability || 100) * 0.2 ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                                            <Battery size={12}/> {displayItem.toolProps.durability} / {displayItem.toolProps.maxDurability}
                                        </span>
                                    )}
                                </>
                            )}
                            {displayItem.armorProps && <span className="flex items-center gap-1 text-emerald-400 whitespace-nowrap"><Shield size={12}/> {displayItem.armorProps.defense} DEF</span>}
                        </div>
                        <p className="text-xs text-zinc-600 italic mt-2 line-clamp-1">
                            {displayItem.isBlock ? "Use to build structures." : displayItem.armorProps ? `Equip to increase defense.` : `Essential tool for survival.`}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-4 text-zinc-700 select-none w-full justify-center opacity-50">
                    {selectedSlot !== null ? (
                        <div className="flex items-center gap-2 animate-pulse text-amber-500">
                             <ArrowRightLeft size={20} /> <span className="text-xs font-black uppercase tracking-widest">Select Target Slot</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                             <MousePointerClick size={20} /> <span className="text-xs font-black uppercase tracking-widest">Select an Item</span>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
