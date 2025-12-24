
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, ArmorType, BlockType, WallType } from '../types';
import { CRAFTING_RECIPES, CraftingRecipe, CREATE_ITEM } from '../constants';
import { Box, X, Info, Zap, Hammer, Sword, Shield, Battery, ArrowRightLeft, MousePointerClick, Archive, Sparkles, Check, AlertCircle, Briefcase } from 'lucide-react';
import { ItemIcon } from './ItemIcon';

// Cache for ingredient display items to prevent re-renders and flickering
const ingredientCache: Record<string, InventoryItem> = {};

// Helper to resolve ingredient IDs to Items for display
const getIngredientItem = (id: string): InventoryItem => {
    if (ingredientCache[id]) return ingredientCache[id];

    let item: InventoryItem;
    if (id.startsWith('block_')) {
        const type = parseInt(id.split('_')[1]);
        if (!isNaN(type)) item = CREATE_ITEM.block(type as BlockType);
        else item = { id, name: 'Unknown Block', count: 1, maxStack: 64, isBlock: false };
    }
    else if (id.startsWith('wall_')) {
        const type = parseInt(id.split('_')[1]);
        if (!isNaN(type)) item = CREATE_ITEM.wall(type as WallType);
        else item = { id, name: 'Unknown Wall', count: 1, maxStack: 64, isBlock: false };
    }
    else {
        // Fallback or specific items logic if needed
        item = { id, name: id.replace(/_/g, ' '), count: 1, maxStack: 64, isBlock: false };
    }
    
    // Ensure display item has count 1 so no stack number appears in icon
    item.count = 1;
    ingredientCache[id] = item;
    return item;
};

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

  const handleSlotInteraction = (index: number, loc: 'player' | 'container') => {
      const sourceList = loc === 'player' ? inventory : (externalInventory || []);
      const item = sourceList[index];
      
      if (selectedSlot !== null) {
          if (selectedSlot.loc === loc) {
              if (loc === 'player') onSwap(selectedSlot.index, index);
              else if (onUpdateExternalSlot) {
                  const list = [...(externalInventory || [])];
                  const temp = list[selectedSlot.index];
                  list[selectedSlot.index] = list[index];
                  list[index] = temp;
                  if (onTransfer) onTransfer(selectedSlot.index, loc, index, loc);
              }
          } else {
              if (onTransfer) onTransfer(selectedSlot.index, selectedSlot.loc, index, loc);
          }
          setSelectedSlot(null);
          if (sourceList[index]) setHoverItem(sourceList[index]); 
      } else {
          if (!item) {
              setHoverItem(null);
          } else {
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
            className={`aspect-square relative rounded-xl flex items-center justify-center transition-all duration-200 group ${isSelected ? 'bg-amber-500/20 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] z-10 scale-105' : 'bg-[#0f1115] border border-white/5 hover:bg-white/10 hover:border-white/20'}`}
        >
            {item ? (
                <>
                    <div className="transform transition-transform group-hover:scale-110 duration-200">
                        <ItemIcon item={item} size={36} />
                    </div>
                    {item.count > 1 && <span className="absolute bottom-1 right-1.5 text-[10px] font-black text-white drop-shadow-md bg-black/60 px-1.5 py-0.5 rounded-md leading-none border border-white/5">{item.count}</span>}
                </>
            ) : (
                icon ? <div className="text-white/10 group-hover:text-white/20 transition-colors">{icon}</div> : null
            )}
            {typeHint && !item && <span className="absolute bottom-1.5 text-[7px] uppercase font-bold text-white/10 tracking-wider group-hover:text-white/30 transition-colors">{typeHint}</span>}
        </button>
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#0b0e14] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#13161c] shrink-0">
          <div className="flex gap-2">
             <button onClick={() => setActiveTab('inventory')} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>Inventory</button>
             {!isContainerOpen && <button onClick={() => setActiveTab('crafting')} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'crafting' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20 scale-105' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>Crafting</button>}
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-white/5 hover:border-white/20"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b0e14] custom-scrollbar min-h-[400px]">
          {activeTab === 'inventory' ? (
             <div className="flex flex-col gap-6 h-full animate-in slide-in-from-bottom-4 fade-in duration-300">
                 
                 {/* External Container Grid */}
                 {isContainerOpen && externalInventory && (
                     <div className="flex flex-col gap-3">
                         <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2 px-2">
                             <Archive size={12} /> External Storage
                         </div>
                         <div className="bg-[#13161c] p-4 rounded-3xl border border-white/5 shadow-inner">
                            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-10 gap-2 sm:gap-3">
                                {Array.from({ length: 15 }).map((_, i) => renderSlot(i, externalInventory, 'container'))}
                            </div>
                         </div>
                     </div>
                 )}

                 <div className="flex flex-col sm:flex-row gap-6 h-full">
                     {/* Armor & Accessories Column */}
                     <div className="flex sm:flex-col gap-3 shrink-0 justify-center bg-[#13161c] p-3 rounded-2xl border border-white/5 h-min shadow-lg">
                         {/* Armor */}
                         {renderSlot(30, inventory, 'player', <Shield size={18} />, 'Head')}
                         {renderSlot(31, inventory, 'player', <Shield size={18} />, 'Chest')}
                         {renderSlot(32, inventory, 'player', <Shield size={18} />, 'Legs')}
                         
                         <div className="w-full h-px bg-white/5 my-1"></div>

                         {/* Accessories */}
                         {renderSlot(33, inventory, 'player', <Sparkles size={18} />, 'Acc 1')}
                         {renderSlot(34, inventory, 'player', <Sparkles size={18} />, 'Acc 2')}
                         {renderSlot(35, inventory, 'player', <Sparkles size={18} />, 'Acc 3')}
                     </div>
                     
                     {/* Main Grid */}
                     <div className="flex-1 flex flex-col gap-3">
                        {!isContainerOpen && <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2 flex items-center gap-2"><Briefcase size={12} /> Backpack</div>}
                        <div className="bg-[#13161c] p-4 sm:p-5 rounded-3xl border border-white/5 flex-1 shadow-inner">
                            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-10 gap-2 sm:gap-3">
                                {Array.from({ length: 30 }).map((_, i) => renderSlot(i, inventory, 'player'))}
                            </div>
                        </div>
                     </div>
                 </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10 animate-in slide-in-from-bottom-4 fade-in duration-300">
                {CRAFTING_RECIPES.map((recipe) => {
                     const canCraft = recipe.ingredients.every(ing => (inventoryCounts[ing.id] || 0) >= ing.count);
                     return (
                         <div key={recipe.id} 
                              onMouseEnter={() => setHoverItem(recipe.result())}
                              className={`relative group flex flex-col gap-4 p-5 rounded-3xl border transition-all duration-300 ${
                                  canCraft 
                                  ? 'bg-[#13161c] border-white/5 hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                                  : 'bg-[#0f1115] border-transparent opacity-60 hover:opacity-100 grayscale-[0.8] hover:grayscale-0'
                              }`}
                         >
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all shadow-xl bg-black/40 border-white/5 group-hover:scale-105 duration-300`}>
                                          <ItemIcon item={recipe.result()} size={42} />
                                      </div>
                                      <div className="flex flex-col py-1">
                                          <div className={`text-base font-black uppercase tracking-wide transition-colors ${canCraft ? 'text-white group-hover:text-amber-400' : 'text-zinc-500'}`}>
                                              {recipe.name}
                                          </div>
                                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mt-1">
                                              {recipe.result().count > 1 ? <span className="bg-white/10 text-white px-1.5 py-0.5 rounded">x{recipe.result().count}</span> : 'Single Item'}
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <button 
                                      onClick={() => handleCraft(recipe)}
                                      disabled={!canCraft}
                                      className={`h-10 px-5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center gap-2 border ${
                                          canCraft 
                                          ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 hover:shadow-amber-900/20 active:scale-95' 
                                          : 'bg-white/5 text-zinc-600 border-white/5 cursor-not-allowed'
                                      }`}
                                  >
                                      {canCraft ? <><Hammer size={14} className="group-hover:animate-pulse"/> Craft</> : 'Locked'}
                                  </button>
                              </div>

                              {/* Ingredients Grid */}
                              <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                  <div className="grid grid-cols-2 gap-2">
                                      {recipe.ingredients.map(ing => {
                                          const item = getIngredientItem(ing.id);
                                          const count = inventoryCounts[ing.id] || 0;
                                          const hasEnough = count >= ing.count;
                                          
                                          return (
                                              <div key={ing.id} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                                                  hasEnough 
                                                  ? 'bg-white/5 border-white/5' 
                                                  : 'bg-red-500/10 border-red-500/20'
                                              }`}>
                                                  <div className="w-8 h-8 rounded bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                                      <ItemIcon item={item} size={20} />
                                                  </div>
                                                  <div className="flex flex-col min-w-0">
                                                      <span className={`text-[10px] font-bold truncate ${hasEnough ? 'text-zinc-300' : 'text-red-300'}`}>
                                                          {item.name}
                                                      </span>
                                                      <span className="text-[9px] font-mono font-bold">
                                                          <span className={hasEnough ? 'text-emerald-400' : 'text-red-400'}>{count}</span> 
                                                          <span className="text-zinc-600"> / </span>
                                                          <span className="text-zinc-400">{ing.count}</span>
                                                      </span>
                                                  </div>
                                                  <div className="ml-auto">
                                                      {hasEnough 
                                                          ? <Check size={12} className="text-emerald-500" /> 
                                                          : <AlertCircle size={12} className="text-red-500" />
                                                      }
                                                  </div>
                                              </div>
                                          )
                                      })}
                                  </div>
                              </div>
                         </div>
                     )
                })}
            </div>
          )}
        </div>

        {/* Info Panel Footer */}
        <div className="bg-[#13161c] border-t border-white/5 p-4 sm:p-6 flex gap-6 items-center shrink-0 min-h-[120px] shadow-2xl relative z-20">
            {displayItem ? (
                <>
                    <div className="w-20 h-20 bg-[#0b0e14] rounded-2xl border border-white/10 flex items-center justify-center shadow-lg shrink-0">
                        <ItemIcon item={displayItem} size={56} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        <div className="flex items-center justify-between">
                             <h3 className="text-xl font-black text-white uppercase tracking-wide truncate">{displayItem.name}</h3>
                             <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                                 {displayItem.isBlock ? 'Block' : displayItem.armorProps ? 'Armor' : displayItem.accessoryProps ? 'Accessory' : 'Tool'}
                             </span>
                        </div>
                        
                        <div className="flex items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase text-zinc-400 tracking-wider flex-wrap">
                            {displayItem.toolProps && (
                                <>
                                    {displayItem.toolProps.damage && <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"><Sword size={12}/> {displayItem.toolProps.damage} DMG</span>}
                                    {displayItem.toolProps.efficiency && <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"><Hammer size={12}/> {Math.round(displayItem.toolProps.efficiency * 100)}% PWR</span>}
                                    {displayItem.toolProps.durability !== undefined && (
                                        <span className={`flex items-center gap-1.5 bg-zinc-800 px-2 py-0.5 rounded border border-white/5 ${displayItem.toolProps.durability < (displayItem.toolProps.maxDurability || 100) * 0.2 ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                                            <Battery size={12}/> {displayItem.toolProps.durability}/{displayItem.toolProps.maxDurability}
                                        </span>
                                    )}
                                </>
                            )}
                            {displayItem.armorProps && <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><Shield size={12}/> {displayItem.armorProps.defense} DEFENSE</span>}
                            {displayItem.accessoryProps && <span className="flex items-center gap-1.5 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20"><Sparkles size={12}/> {displayItem.accessoryProps.effectValue} POWER</span>}
                        </div>
                        <p className="text-xs text-zinc-500 mt-2 font-medium leading-relaxed">
                            {displayItem.accessoryProps?.description || (displayItem.isBlock ? "Can be placed in the world to build structures." : displayItem.armorProps ? `Equip in armor slots to increase damage reduction.` : `Essential tool for survival and gathering resources.`)}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-4 text-zinc-700 select-none w-full justify-center opacity-40">
                    {selectedSlot !== null ? (
                        <div className="flex items-center gap-3 animate-pulse text-amber-500">
                             <ArrowRightLeft size={24} /> <span className="text-sm font-black uppercase tracking-widest">Select Target Slot to Move</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                             <MousePointerClick size={24} /> <span className="text-sm font-black uppercase tracking-widest">Hover Item for Details</span>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
