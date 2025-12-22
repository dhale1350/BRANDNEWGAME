
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, ArmorType } from '../types';
import { CRAFTING_RECIPES, CraftingRecipe } from '../constants';
import { Box, X, Info, Zap, Hammer, Sword, Shield, Battery } from 'lucide-react';
import { ItemIcon } from './ItemIcon';

interface InventoryProps {
  isOpen: boolean;
  inventory: (InventoryItem | null)[];
  onSwap: (fromIndex: number, toIndex: number) => void;
  onClose: () => void;
  addItem: (item: InventoryItem) => boolean;
  onUpdateSlot?: (index: number, item: InventoryItem | null) => void;
  nearbyStations?: any[];
}

export const Inventory: React.FC<InventoryProps> = ({ isOpen, inventory, onSwap, onClose, addItem, onUpdateSlot }) => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
  const [focusIndex, setFocusIndex] = useState(0);
  const [hoverItem, setHoverItem] = useState<InventoryItem | null>(null);
  const lastDirRef = useRef({ x: 0, y: 0, select: false });

  const inventoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach(item => { if (item) counts[item.id] = (counts[item.id] || 0) + item.count; });
    return counts;
  }, [inventory]);

  // Set default hover item to first in inventory if available
  useEffect(() => {
      if (isOpen && !hoverItem && inventory[0]) {
          setHoverItem(inventory[0]);
      }
  }, [isOpen, inventory]);

  useEffect(() => {
    if (!isOpen) return;
    let req: number;
    const poll = () => {
      const gp = navigator.getGamepads()[0];
      if (gp) {
        const dx = gp.axes[0] || (gp.buttons[14].pressed ? -1 : gp.buttons[15].pressed ? 1 : 0);
        const dy = gp.axes[1] || (gp.buttons[12].pressed ? -1 : gp.buttons[13].pressed ? 1 : 0);
        if (Math.abs(dx) > 0.5 && lastDirRef.current.x === 0) setFocusIndex(p => Math.max(0, Math.min(29, p + Math.sign(dx))));
        if (Math.abs(dy) > 0.5 && lastDirRef.current.y === 0) setFocusIndex(p => Math.max(0, Math.min(29, p + Math.sign(dy)*6)));
        lastDirRef.current.x = Math.abs(dx) > 0.5 ? Math.sign(dx) : 0;
        lastDirRef.current.y = Math.abs(dy) > 0.5 ? Math.sign(dy) : 0;
        
        // Auto-hover focused item with controller
        if (activeTab === 'inventory') {
             setHoverItem(inventory[focusIndex] || null);
        } else {
             setHoverItem(CRAFTING_RECIPES[focusIndex]?.result() || null);
        }

        if (gp.buttons[0].pressed && !lastDirRef.current.select) {
            if (activeTab === 'inventory') { if (selectedSlot === null) setSelectedSlot(focusIndex); else { onSwap(selectedSlot, focusIndex); setSelectedSlot(null); } }
            else handleCraft(CRAFTING_RECIPES[focusIndex]);
            lastDirRef.current.select = true;
        } else if (!gp.buttons[0].pressed) lastDirRef.current.select = false;
        if (gp.buttons[4].pressed) setActiveTab('inventory'); if (gp.buttons[5].pressed) setActiveTab('crafting');
        if (gp.buttons[1].pressed || gp.buttons[9].pressed) onClose();
      }
      req = requestAnimationFrame(poll);
    };
    req = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(req);
  }, [isOpen, activeTab, focusIndex, inventory, selectedSlot]);

  const handleCraft = (recipe: CraftingRecipe) => {
    const can = recipe.ingredients.every(i => (inventoryCounts[i.id] || 0) >= i.count);
    if (can && onUpdateSlot) {
        recipe.ingredients.forEach(ing => {
            let rem = ing.count;
            for(let i=0; i<30; i++) { // Only take from main inventory
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

  const renderSlot = (i: number, icon?: React.ReactNode, typeHint?: string) => {
      const item = inventory[i];
      const isSelected = selectedSlot === i;
      const isFocused = focusIndex === i && activeTab === 'inventory';
      return (
        <button 
            key={i} 
            onClick={() => { if(selectedSlot===null) setSelectedSlot(i); else { onSwap(selectedSlot, i); setSelectedSlot(null); } }} 
            onMouseEnter={() => setHoverItem(item)}
            onMouseLeave={() => setHoverItem(null)}
            className={`aspect-square bg-[#27272a] rounded-xl border-2 flex items-center justify-center relative transition-all group ${isSelected ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5 hover:border-white/20 hover:bg-white/5'} ${isFocused ? 'ring-4 ring-blue-500 scale-105 z-10' : ''}`}
        >
            {item ? (
                <>
                    <ItemIcon item={item} size={40} />
                    {item.count > 1 && <span className="absolute bottom-1 right-2 text-[10px] font-black text-white drop-shadow-md">{item.count}</span>}
                </>
            ) : (
                icon && <div className="text-white/10">{icon}</div>
            )}
            {typeHint && !item && <span className="absolute bottom-1 text-[8px] uppercase font-bold text-white/20">{typeHint}</span>}
        </button>
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl bg-[#18181b] border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#27272a]">
          <div className="flex gap-4">
             <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-white/5'}`}>Inventory</button>
             <button onClick={() => setActiveTab('crafting')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'crafting' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-white/5'}`}>Crafting</button>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#18181b] custom-scrollbar min-h-[300px]">
          {activeTab === 'inventory' ? (
             <div className="flex gap-6">
                 {/* Armor Column */}
                 <div className="flex flex-col gap-3 w-16 shrink-0">
                     <div className="text-[10px] uppercase font-black text-zinc-500 text-center tracking-widest mb-1">Equip</div>
                     {renderSlot(30, <Shield size={20} />, 'Head')}
                     {renderSlot(31, <Shield size={20} />, 'Chest')}
                     {renderSlot(32, <Shield size={20} />, 'Legs')}
                 </div>
                 
                 {/* Main Grid */}
                 <div className="flex-1">
                    <div className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-4">Storage</div>
                    <div className="grid grid-cols-6 gap-3">
                        {Array.from({ length: 30 }).map((_, i) => renderSlot(i))}
                    </div>
                 </div>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CRAFTING_RECIPES.map((recipe, i) => (
                  <button 
                    key={recipe.id} 
                    onClick={() => handleCraft(recipe)} 
                    onMouseEnter={() => setHoverItem(recipe.result())}
                    onMouseLeave={() => setHoverItem(null)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${focusIndex === i ? 'ring-4 ring-blue-500' : 'border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                  >
                    <div className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden group-hover:scale-110 transition-transform">
                        <ItemIcon item={recipe.result()} size={32} />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-white uppercase tracking-widest">{recipe.name}</div>
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">{recipe.ingredients.map(ing => `${ing.count}x ${ing.id.replace('block_', '')}`).join(', ')}</div>
                    </div>
                  </button>
                ))}
             </div>
          )}
        </div>

        {/* Info Panel Footer */}
        <div className="bg-[#101012] border-t border-white/5 p-6 flex gap-6 items-center shrink-0 min-h-[100px]">
            {displayItem ? (
                <>
                    <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center shadow-lg">
                        <ItemIcon item={displayItem} size={48} />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h3 className="text-xl font-black text-white uppercase tracking-wide">{displayItem.name}</h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex-wrap">
                            <span className="bg-white/5 px-2 py-1 rounded text-zinc-400">{displayItem.isBlock ? 'Construction Block' : displayItem.armorProps ? 'Armor' : 'Equipment'}</span>
                            {displayItem.toolProps && (
                                <>
                                    {displayItem.toolProps.damage && (
                                        <span className="flex items-center gap-1 text-red-400"><Sword size={12}/> {displayItem.toolProps.damage} DMG</span>
                                    )}
                                    {displayItem.toolProps.efficiency && (
                                        <span className="flex items-center gap-1 text-amber-400"><Hammer size={12}/> {Math.round(displayItem.toolProps.efficiency * 100)}% PWR</span>
                                    )}
                                    {displayItem.toolProps.swingSpeed && (
                                        <span className="flex items-center gap-1 text-blue-400"><Zap size={12}/> {displayItem.toolProps.swingSpeed > 0.1 ? 'FAST' : 'NORMAL'}</span>
                                    )}
                                    {displayItem.toolProps.durability !== undefined && (
                                        <span className={`flex items-center gap-1 ${displayItem.toolProps.durability < (displayItem.toolProps.maxDurability || 100) * 0.2 ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                                            <Battery size={12}/> {displayItem.toolProps.durability} / {displayItem.toolProps.maxDurability}
                                        </span>
                                    )}
                                </>
                            )}
                            {displayItem.armorProps && (
                                <span className="flex items-center gap-1 text-emerald-400"><Shield size={12}/> {displayItem.armorProps.defense} DEF</span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-600 italic leading-relaxed">
                            {displayItem.isBlock 
                                ? "Can be placed in the world or used for crafting." 
                                : displayItem.armorProps 
                                    ? `Equip in the ${displayItem.armorProps.type} slot to reduce damage.`
                                    : `Tier ${displayItem.toolProps?.tier || 0} tool. Essential for survival and progression.`}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-3 text-zinc-700 select-none">
                    <Info size={24} />
                    <span className="text-sm font-bold uppercase tracking-widest">Hover over an item for details</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
