
import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Grid3X3, Zap, Eye, MousePointer2, Gamepad, Cpu, LogOut, User, Sparkles, ZoomIn, Maximize, Edit3, BookOpen, Globe, ArrowRight, Save } from 'lucide-react';
import { InputMode, GameSettings } from '../types';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onExit?: () => void;
  isIngame?: boolean;
  onJoinGame?: (id: string) => void;
  onSaveGame?: () => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#0f172a', '#ffffff'];
const HAIR_COLORS = ['#422006', '#0f172a', '#facc15', '#a16207', '#dc2626', '#ffffff', '#57534e', '#3b82f6'];
const SKIN_COLORS = ['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#c68642', '#593b2b', '#3e2723', '#2d2d2d'];

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  isOpen, onClose, inputMode, onInputModeChange, settings, onSettingsChange, onExit, isIngame, onJoinGame, onSaveGame
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'character' | 'controls' | 'guide' | 'multiplayer'>('system');
  const [joinId, setJoinId] = useState('');
  const lastDirRef = useRef({ x: 0, y: 0, select: false });

  useEffect(() => {
    if (!isOpen) return;
    let req: number;
    const poll = () => {
      const gp = navigator.getGamepads()[0];
      if (gp) {
        const dx = gp.axes[0] || (gp.buttons[14].pressed ? -1 : gp.buttons[15].pressed ? 1 : 0);
        if (Math.abs(dx) > 0.5 && lastDirRef.current.x === 0) {
             const tabs = ['system', 'character', 'controls', 'guide', 'multiplayer'];
             const currIdx = tabs.indexOf(activeTab);
             const nextIdx = Math.max(0, Math.min(tabs.length - 1, currIdx + Math.sign(dx)));
             setActiveTab(tabs[nextIdx] as any);
        }
        lastDirRef.current.x = Math.abs(dx) > 0.5 ? Math.sign(dx) : 0;

        if (gp.buttons[0].pressed && !lastDirRef.current.select) { 
            if (activeTab !== 'guide') onClose(); 
            lastDirRef.current.select = true; 
        }
        else if (!gp.buttons[0].pressed) lastDirRef.current.select = false;
        if (gp.buttons[1].pressed) onClose();
      }
      req = requestAnimationFrame(poll);
    };
    req = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(req);
  }, [isOpen, activeTab, onClose]);

  if (!isOpen) return null;

  const update = (key: keyof GameSettings, val: any) => onSettingsChange({ ...settings, [key]: val });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0b0e14]/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[85vh] h-[600px]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex gap-2 p-1 bg-black/40 rounded-xl overflow-x-auto custom-scrollbar w-full sm:w-auto">
             <TabButton id="system" label="System" icon={<Settings size={14}/>} active={activeTab==='system'} onClick={() => setActiveTab('system')} />
             <TabButton id="character" label="Character" icon={<User size={14}/>} active={activeTab==='character'} onClick={() => setActiveTab('character')} />
             <TabButton id="controls" label="Controls" icon={<Gamepad size={14}/>} active={activeTab==='controls'} onClick={() => setActiveTab('controls')} />
             <TabButton id="multiplayer" label="Net" icon={<Globe size={14}/>} active={activeTab==='multiplayer'} onClick={() => setActiveTab('multiplayer')} />
             <TabButton id="guide" label="Guide" icon={<BookOpen size={14}/>} active={activeTab==='guide'} onClick={() => setActiveTab('guide')} />
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 shrink-0 ml-2"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#0b0e14] relative">
          
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-2"><Eye size={12}/> Camera</h3>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
                            <span>Field of View</span>
                            <span className="font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">{settings.fov.toFixed(1)}x</span>
                        </div>
                        <input type="range" min="1.0" max="2.5" step="0.1" value={settings.fov} onChange={e => update('fov', parseFloat(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-widest flex items-center gap-2"><Sparkles size={12}/> Graphics</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Toggle label="Grid Overlay" active={settings.showGrid} onClick={() => update('showGrid', !settings.showGrid)} icon={<Grid3X3 size={14} />} />
                        <Toggle label="Screen Shake" active={settings.screenShake} onClick={() => update('screenShake', !settings.screenShake)} icon={<Maximize size={14} />} />
                        <Toggle label="Smooth Light" active={settings.smoothLighting} onClick={() => update('smoothLighting', !settings.smoothLighting)} icon={<Sparkles size={14} />} />
                        <Toggle label="Perform. Mode" active={settings.performanceMode} onClick={() => update('performanceMode', !settings.performanceMode)} icon={<Zap size={14} />} />
                    </div>
                </div>

                {isIngame && onSaveGame && (
                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <button onClick={onSaveGame} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]">
                            <Save size={16} /> Save World
                        </button>
                    </div>
                )}
            </div>
          )}

          {activeTab === 'character' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Display Name</label>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 focus-within:border-blue-500/50 transition-colors">
                        <Edit3 size={16} className="text-zinc-500" />
                        <input 
                            type="text" 
                            value={settings.playerName} 
                            onChange={e => update('playerName', e.target.value)} 
                            maxLength={12}
                            className="bg-transparent w-full text-white font-bold outline-none placeholder:text-zinc-700 uppercase"
                            placeholder="NAME"
                        />
                    </div>
                 </div>

                 <ColorPicker label="Outfit Color" colors={COLORS} selected={settings.playerColor} onSelect={(c) => update('playerColor', c)} />
                 <ColorPicker label="Hair Color" colors={HAIR_COLORS} selected={settings.playerHair} onSelect={(c) => update('playerHair', c)} />
                 <ColorPicker label="Skin Tone" colors={SKIN_COLORS} selected={settings.playerSkin} onSelect={(c) => update('playerSkin', c)} />
             </div>
          )}

          {activeTab === 'controls' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 fade-in">
                <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                    <Gamepad size={12}/> Input Method
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[InputMode.AUTO, InputMode.KEYBOARD_MOUSE, InputMode.CONTROLLER, InputMode.TOUCH].map(mode => (
                        <button 
                            key={mode} 
                            onClick={() => onInputModeChange(mode)} 
                            className={`p-4 rounded-xl border-2 transition-all flex sm:flex-col items-center gap-3 active:scale-95 ${inputMode === mode ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}
                        >
                            <div className={`p-2 rounded-full transition-colors ${inputMode === mode ? 'bg-amber-500/20' : 'bg-black/20'}`}>
                                {mode === InputMode.AUTO ? <Cpu size={18}/> : mode === InputMode.CONTROLLER ? <Gamepad size={18}/> : mode === InputMode.TOUCH ? <MousePointer2 size={18}/> : <MousePointer2 size={18}/>}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wide">{mode === 'kb_mouse' ? 'KB & Mouse' : mode}</span>
                        </button>
                    ))}
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-300 text-xs leading-relaxed">
                    <p className="font-bold mb-1">Tip:</p>
                    For forced Mobile Controls on desktop, select <strong>TOUCH</strong> mode.
                </div>
             </div>
          )}

          {activeTab === 'multiplayer' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                  <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                          <Globe size={12}/> Session Connection
                      </h3>
                      <div className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-2xl space-y-4">
                          <p className="text-xs text-indigo-300">Enter a Room ID to join an active world session.</p>
                          <div className="flex gap-2">
                              <input 
                                  type="text" 
                                  value={joinId}
                                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                                  placeholder="ENTER ROOM ID"
                                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 uppercase tracking-widest"
                              />
                              <button 
                                onClick={() => { if(onJoinGame && joinId) { onJoinGame(joinId); onClose(); } }} 
                                disabled={!joinId}
                                className="bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white px-6 rounded-xl flex items-center justify-center transition-all active:scale-95"
                              >
                                  <ArrowRight size={20} />
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'guide' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in pb-4">
                
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                        Gameplay Basics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InfoCard title="The World" desc="Infinite procedural generation with diverse biomes: Forest, Caves, Deepslate, and Bedrock." />
                        <InfoCard title="Day & Night" desc="A full cycle exists. Build shelter before nightfall to survive Zombie attacks." />
                        <InfoCard title="Structures" desc="Explore to find Cozy Houses, Lookout Towers, and Ancient Ruins." />
                        <InfoCard title="Multiplayer" desc="Host shares a Session ID. Friends join via P2P. No servers needed." />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                        Crafting Recipes
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        <RecipeRow name="Wood Pickaxe" cost="4 Wood" />
                        <RecipeRow name="Wood Sword" cost="5 Wood" />
                        <RecipeRow name="Iron Pickaxe" cost="8 Iron + 4 Wood" />
                        <RecipeRow name="Iron Sword" cost="8 Iron + 2 Wood" />
                        <RecipeRow name="Diamond Pickaxe" cost="4 Diamond + 2 Wood" />
                        <RecipeRow name="Brick Block" cost="2 Stone + 1 Dirt" />
                        <RecipeRow name="Glass" cost="1 Sand" />
                    </div>
                </div>

                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-2">
                        Mining & Ores
                    </h3>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                            <span>Ore Type</span>
                            <span>Depth / Rarity</span>
                        </div>
                        <OreRow name="Coal" loc="Common Surface/Caves" color="text-zinc-500" />
                        <OreRow name="Iron" loc="Underground Layers" color="text-orange-300" />
                        <OreRow name="Gold" loc="Deep Caves" color="text-yellow-400" />
                        <OreRow name="Diamond" loc="Deepslate / Bedrock" color="text-cyan-400" />
                    </div>
                </div>

             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-black/40 border-t border-white/5 flex gap-4 backdrop-blur-xl shrink-0">
          {isIngame ? (
             <button onClick={onExit} className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 hover:text-red-400 font-black py-3 sm:py-4 rounded-xl uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                <LogOut size={16} /> <span className="hidden sm:inline">Exit to Menu</span><span className="sm:hidden">Exit</span>
             </button>
          ) : (
             <div className="flex-1 text-[10px] text-zinc-600 font-mono flex items-center justify-center">SETTINGS SAVED</div>
          )}
          <button onClick={onClose} className="flex-[2] bg-white hover:bg-zinc-200 text-black font-black py-3 sm:py-4 rounded-xl uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">Resume</button>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ id, label, icon, active, onClick }: any) => (
    <button onClick={() => onClick(id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap ${active ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
        {icon} <span className="hidden sm:inline">{label}</span>
    </button>
);

const Toggle = ({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon?: any }) => (
    <button onClick={onClick} className={`flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 ${active ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-black/20 border-white/5 text-zinc-500 hover:bg-white/5'}`}>
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
        </div>
        <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-blue-500' : 'bg-zinc-800'}`}>
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${active ? 'translate-x-4' : ''}`} />
        </div>
    </button>
);

const ColorPicker = ({ label, colors, selected, onSelect }: { label: string, colors: string[], selected: string, onSelect: (c: string) => void }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{label}</label>
        <div className="flex flex-wrap gap-2">
            {colors.map(c => (
                <button
                    key={c}
                    onClick={() => onSelect(c)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 relative ${selected === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b0e14] scale-110 z-10' : ''}`}
                    style={{ backgroundColor: c }}
                />
            ))}
        </div>
    </div>
);

const InfoCard = ({ title, desc }: any) => (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="text-xs font-bold text-white mb-1">{title}</div>
        <div className="text-[10px] text-zinc-400 leading-relaxed">{desc}</div>
    </div>
);

const RecipeRow = ({ name, cost }: any) => (
    <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl border border-white/5">
        <span className="text-xs font-bold text-zinc-200">{name}</span>
        <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded">{cost}</span>
    </div>
);

const OreRow = ({ name, loc, color }: any) => (
    <div className="flex justify-between items-center text-xs">
        <span className={`font-bold ${color}`}>{name}</span>
        <span className="text-zinc-500">{loc}</span>
    </div>
);
