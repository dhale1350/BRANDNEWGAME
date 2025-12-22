
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DevSettings, EntityType, BlockType, InventoryItem, TestInterface, Entity, WallType } from '../types';
import { 
    X, Shield, Ghost, Hammer, Bug, Sun, Trash2, Gauge, Clock, Clipboard, 
    PlayCircle, CheckCircle, XCircle, Zap, Move, Eye, MapPin, Box, Briefcase,
    Sunrise, Sunset, Moon, Skull, Crosshair, User, Globe, Activity, Radio, ArrowRight, History, GripHorizontal, Palette, LayoutGrid, Search, BarChart3, Terminal, Minus, Maximize2, Heart
} from 'lucide-react';
import { CREATE_ITEM, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { runSystemDiagnostics, DiagnosticResult } from '../utils/tests';
import { ItemIcon } from './ItemIcon';

interface DevToolsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DevSettings;
  onUpdateSettings: (s: DevSettings) => void;
  onSpawnEntity: (type: EntityType, count: number) => void;
  onGiveItem: (item: InventoryItem) => void;
  onTeleport: (x: number, y: number) => void;
  onClearEnemies: () => void;
  onSetTime: (time: number) => void;
  onClearInventory: () => void;
  playerPos: { x: number, y: number };
  entityCount: number;
  testInterface?: TestInterface;
  remotePlayers?: Entity[];
  roomId?: string;
  onJoinGame?: (id: string) => void;
}

const FPSGraph = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const historyRef = useRef<number[]>([]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        let lastTime = performance.now();

        const loop = () => {
            const now = performance.now();
            const delta = now - lastTime;
            lastTime = now;
            
            const fps = 1000 / Math.max(delta, 1);
            historyRef.current.push(fps);
            if (historyRef.current.length > 100) historyRef.current.shift();
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Transparent bg for graph
            ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
            ctx.fillRect(0,0, canvas.width, canvas.height);
            
            ctx.beginPath();
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1.5;
            
            const max = 120; // Scale to 120 FPS
            
            historyRef.current.forEach((val, i) => {
                const x = (i / 100) * canvas.width;
                const y = canvas.height - ((val / max) * canvas.height);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Grid lines
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(0, canvas.height - (60/max)*canvas.height, canvas.width, 1);
            
            frameId = requestAnimationFrame(loop);
        };
        
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, []);

    return <canvas ref={canvasRef} width={280} height={40} className="w-full h-10 rounded border border-cyan-500/20 bg-slate-900/50" />;
}

const ToggleBtn = ({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon?: any }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-3 rounded-lg transition-all active:scale-95 border ${active ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">{icon}<span>{label}</span></div>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-zinc-700'}`} />
    </button>
);

const ActionBtn = ({ label, onClick, icon, danger, color }: { label: string, onClick: () => void, icon?: any, danger?: boolean, color?: string }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all active:scale-95 hover:bg-white/5 ${danger ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : color ? `bg-${color}-500/10 border-${color}-500/20 text-${color}-400` : 'bg-slate-800/50 border-white/5 text-zinc-400'}`}>
        {icon}
        <span className="text-[9px] font-bold uppercase text-center leading-none tracking-tight">{label}</span>
    </button>
);

const IconButton = ({ icon, onClick, title, active }: { icon: any, onClick: () => void, title: string, active?: boolean }) => (
    <button onClick={onClick} title={title} className={`flex items-center justify-center p-2 rounded-lg border transition-all active:scale-95 ${active ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}>
        {icon}
    </button>
);

export const DevTools: React.FC<DevToolsProps> = ({
  isOpen, onClose, settings, onUpdateSettings, onSpawnEntity, onGiveItem, onTeleport, 
  onClearEnemies, onSetTime, onClearInventory, playerPos, entityCount, testInterface, remotePlayers = [],
  roomId, onJoinGame
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'world' | 'items' | 'entities' | 'network' | 'tests'>('general');
  const [testResults, setTestResults] = useState<DiagnosticResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [tpInput, setTpInput] = useState({ x: '', y: '' });
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Dragging state
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Generate Item List
  const allItems = useMemo(() => {
    const items: InventoryItem[] = [];
    // Blocks
    Object.values(BlockType).forEach(v => {
        if(typeof v === 'number' && v !== 0) items.push(CREATE_ITEM.block(v));
    });
    // Walls
    Object.values(WallType).forEach(v => {
        if(typeof v === 'number' && v !== 0) items.push(CREATE_ITEM.wall(v));
    });
    // Tools/Armor
    items.push(CREATE_ITEM.wood_pickaxe(), CREATE_ITEM.wood_sword(), CREATE_ITEM.iron_pickaxe(), CREATE_ITEM.iron_sword(), CREATE_ITEM.diamond_pickaxe(), CREATE_ITEM.diamond_sword());
    items.push(CREATE_ITEM.iron_helmet(), CREATE_ITEM.iron_chestplate(), CREATE_ITEM.iron_leggings());
    items.push(CREATE_ITEM.diamond_helmet(), CREATE_ITEM.diamond_chestplate(), CREATE_ITEM.diamond_leggings());
    
    return items;
  }, []);

  const filteredItems = useMemo(() => {
      if(!itemSearch) return allItems;
      return allItems.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
  }, [allItems, itemSearch]);

  useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
          if (!isDragging) return;
          // Prevent default to stop scrolling on mobile while dragging window
          if (e.cancelable) e.preventDefault();

          let cx, cy;
          if ('touches' in e) {
              cx = e.touches[0].clientX;
              cy = e.touches[0].clientY;
          } else {
              cx = (e as MouseEvent).clientX;
              cy = (e as MouseEvent).clientY;
          }

          setPos({ 
              x: dragRef.current.initX + (cx - dragRef.current.startX), 
              y: dragRef.current.initY + (cy - dragRef.current.startY) 
          });
      };

      const handleUp = () => setIsDragging(false);

      if (isDragging) { 
          window.addEventListener('mousemove', handleMove); 
          window.addEventListener('mouseup', handleUp);
          window.addEventListener('touchmove', handleMove, { passive: false }); 
          window.addEventListener('touchend', handleUp);
      }
      return () => { 
          window.removeEventListener('mousemove', handleMove); 
          window.removeEventListener('mouseup', handleUp);
          window.removeEventListener('touchmove', handleMove); 
          window.removeEventListener('touchend', handleUp);
      };
  }, [isDragging]);

  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      let cx, cy;
      if ('touches' in e) {
          cx = e.touches[0].clientX;
          cy = e.touches[0].clientY;
      } else {
          cx = (e as React.MouseEvent).clientX;
          cy = (e as React.MouseEvent).clientY;
      }
      dragRef.current = { startX: cx, startY: cy, initX: pos.x, initY: pos.y };
  };

  const toggle = (key: keyof DevSettings) => onUpdateSettings({ ...settings, [key]: !settings[key] });

  const runTests = async () => {
      if (!testInterface) return;
      setIsRunningTests(true); setTestResults(null);
      setTimeout(async () => {
          const results = await runSystemDiagnostics(testInterface);
          setTestResults(results); setIsRunningTests(false);
      }, 100);
  };

  if (!isOpen) return null;

  // Minimized View
  if (isMinimized) {
      return (
        <div 
            style={{ left: pos.x, top: pos.y }}
            className="fixed z-[100] bg-slate-900/90 border border-amber-500/30 rounded-full shadow-2xl backdrop-blur-xl flex items-center p-1 pr-2 gap-2 animate-in zoom-in-95 duration-200 cursor-move touch-none"
            onMouseDown={handleStartDrag}
            onTouchStart={handleStartDrag}
        >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Terminal size={14} />
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-white uppercase leading-none">DEV MODE</span>
                <span className="text-[8px] font-mono text-zinc-400 leading-none mt-0.5">{entityCount} ENTS</span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }} 
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white ml-1 transition-colors"
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
            >
                <Maximize2 size={12} />
            </button>
        </div>
      );
  }

  // Expanded View
  return (
    <div 
        style={{ left: pos.x, top: pos.y }}
        className="fixed z-[100] w-[95vw] sm:w-[360px] bg-[#0b0e14]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden font-sans max-h-[80vh] animate-in zoom-in-95 duration-200"
    >
      {/* Header / Drag Handle */}
      <div 
        onMouseDown={handleStartDrag}
        onTouchStart={handleStartDrag}
        className="bg-white/5 p-3 border-b border-white/5 flex items-center justify-between cursor-move select-none touch-none"
      >
        <div className="flex items-center gap-2 text-zinc-100">
            <Terminal size={14} className="text-amber-500" />
            <span className="font-black uppercase text-xs tracking-widest">Engine Console</span>
        </div>
        <div className="flex items-center gap-1">
            <button 
                onClick={() => setIsMinimized(true)} 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
            >
                <Minus size={16} />
            </button>
            <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors" 
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
            >
                <X size={16} />
            </button>
        </div>
      </div>

      {/* Monitor Strip */}
      <div className="bg-black/40 p-3 border-b border-white/5 space-y-2 shrink-0">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 font-bold uppercase">
              <span>Performance</span>
              <span className="text-cyan-400">{entityCount} Entities</span>
          </div>
          <FPSGraph />
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
             <span>POS: <span className="text-white">{playerPos.x}, {playerPos.y}</span></span>
             <span>BUILD: <span className="text-zinc-600">DEV_1.3</span></span>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar bg-[#0f1115] shrink-0">
        {[
            { id: 'general', icon: <Zap size={14}/>, label: 'Cheats' },
            { id: 'world', icon: <MapPin size={14}/>, label: 'World' },
            { id: 'items', icon: <Box size={14}/>, label: 'Items' },
            { id: 'entities', icon: <Ghost size={14}/>, label: 'Mobs' },
            { id: 'network', icon: <Globe size={14}/>, label: 'Net' },
            { id: 'tests', icon: <Activity size={14}/>, label: 'Diag' }
        ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[50px] py-3 flex flex-col items-center justify-center gap-1 transition-colors border-b-2 ${activeTab === tab.id ? 'bg-white/5 text-amber-400 border-amber-500' : 'text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-white/5'}`}>
                {tab.icon}
                <span className="text-[8px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0b0e14] overscroll-contain">
        
        {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Player Attributes</h3>
                        <ActionBtn label="Heal" onClick={() => testInterface?.setHealth(100)} icon={<Heart size={12}/>} color="emerald" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleBtn label="God Mode" active={settings.godMode} onClick={() => toggle('godMode')} icon={<Shield size={12} />} />
                        <ToggleBtn label="No Clip" active={settings.noclip} onClick={() => toggle('noclip')} icon={<Ghost size={12} />} />
                        <ToggleBtn label="Super Speed" active={settings.superSpeed} onClick={() => toggle('superSpeed')} icon={<Zap size={12} />} />
                        <ToggleBtn label="Inf. Reach" active={settings.infiniteReach} onClick={() => toggle('infiniteReach')} icon={<Move size={12} />} />
                        <ToggleBtn label="Inf. Durability" active={settings.infiniteDurability} onClick={() => toggle('infiniteDurability')} icon={<Hammer size={12} />} />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Debug Overlays</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleBtn label="Hitboxes" active={settings.showHitboxes} onClick={() => toggle('showHitboxes')} icon={<Eye size={12} />} />
                        <ToggleBtn label="Chunk Borders" active={settings.showChunkBorders} onClick={() => toggle('showChunkBorders')} icon={<LayoutGrid size={12} />} />
                        <ToggleBtn label="Data Overlay" active={settings.debugInfo} onClick={() => toggle('debugInfo')} icon={<Clipboard size={12} />} />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'world' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                 <div className="bg-white/5 rounded-lg p-3 space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-400">
                         <span>Time Control</span>
                         <span className={settings.freezeTime ? 'text-blue-400' : 'text-zinc-600'}>{settings.freezeTime ? 'FROZEN' : 'ACTIVE'}</span>
                     </div>
                     <div className="flex gap-1 bg-black/20 p-1 rounded-lg">
                        <div className="flex-1 grid grid-cols-4 gap-1">
                            <IconButton icon={<Sunrise size={12}/>} onClick={() => onSetTime(0)} title="Dawn" />
                            <IconButton icon={<Sun size={12}/>} onClick={() => onSetTime(6000)} title="Noon" />
                            <IconButton icon={<Sunset size={12}/>} onClick={() => onSetTime(12000)} title="Dusk" />
                            <IconButton icon={<Moon size={12}/>} onClick={() => onSetTime(18000)} title="Midnight" />
                        </div>
                        <IconButton icon={<Clock size={12}/>} onClick={() => toggle('freezeTime')} title="Freeze Time" active={settings.freezeTime} />
                     </div>
                     <input type="range" min="0" max="100" value={settings.timeScale} onChange={e => onUpdateSettings({ ...settings, timeScale: parseInt(e.target.value) })} className="w-full h-1 bg-zinc-700 accent-amber-500 rounded-lg appearance-none cursor-pointer" />
                 </div>

                 <div className="space-y-2">
                     <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Teleportation</h3>
                     <div className="flex gap-2">
                         <input type="number" placeholder="X" className="w-16 bg-black/40 border border-white/10 rounded px-2 text-xs font-mono text-white" value={tpInput.x} onChange={e => setTpInput({...tpInput, x: e.target.value})} />
                         <input type="number" placeholder="Y" className="w-16 bg-black/40 border border-white/10 rounded px-2 text-xs font-mono text-white" value={tpInput.y} onChange={e => setTpInput({...tpInput, y: e.target.value})} />
                         <button onClick={() => { if(tpInput.x && tpInput.y) onTeleport(parseInt(tpInput.x) * TILE_SIZE, parseInt(tpInput.y) * TILE_SIZE); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase">TP</button>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                         <ActionBtn label="Surface" onClick={() => onTeleport(WORLD_WIDTH * TILE_SIZE / 2, 5 * TILE_SIZE)} icon={<Sun size={12}/>} />
                         <ActionBtn label="Hell" onClick={() => onTeleport(playerPos.x * TILE_SIZE, (WORLD_HEIGHT - 20) * TILE_SIZE)} icon={<Skull size={12}/>} />
                         <ActionBtn label="Origin" onClick={() => onTeleport(10 * TILE_SIZE, 10 * TILE_SIZE)} icon={<Crosshair size={12}/>} />
                     </div>
                 </div>

                 <ToggleBtn label="Insta-Mine" active={settings.instaMine} onClick={() => toggle('instaMine')} icon={<Hammer size={12} />} />
            </div>
        )}

        {activeTab === 'items' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 h-full flex flex-col">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search size={12} className="absolute left-2 top-2.5 text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="Search items..." 
                            value={itemSearch}
                            onChange={e => setItemSearch(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-7 pr-2 py-2 text-xs text-white focus:border-amber-500/50 outline-none"
                        />
                    </div>
                    <button onClick={onClearInventory} className="px-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center" title="Clear Inventory">
                        <Trash2 size={14} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[200px] border border-white/5 rounded-lg bg-black/20 p-2">
                    <div className="grid grid-cols-5 gap-2">
                        {filteredItems.map(item => (
                            <button 
                                key={item.id} 
                                onClick={() => { item.count = item.maxStack; onGiveItem(item); }}
                                className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 hover:border-white/20 flex items-center justify-center relative group active:scale-95 transition-all"
                                title={item.name}
                            >
                                <ItemIcon item={item} size={24} />
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 rounded transition-opacity pointer-events-none" />
                            </button>
                        ))}
                    </div>
                    {filteredItems.length === 0 && <div className="text-center text-zinc-600 text-xs py-4">No items found</div>}
                </div>
            </div>
        )}

        {activeTab === 'entities' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Spawn Controls</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <ActionBtn label="Slime" onClick={() => onSpawnEntity(EntityType.SLIME, 1)} />
                        <ActionBtn label="Zombie" onClick={() => onSpawnEntity(EntityType.ZOMBIE, 1)} />
                        <ActionBtn label="Guide" onClick={() => onSpawnEntity(EntityType.GUIDE, 1)} />
                        <ActionBtn label="Horde (5x)" onClick={() => onSpawnEntity(EntityType.ZOMBIE, 5)} icon={<Ghost size={12}/>} />
                    </div>
                </div>
                
                <button onClick={onClearEnemies} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
                    <Trash2 size={14} /> Kill All Entities
                </button>
            </div>
        )}

        {activeTab === 'network' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                 <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl space-y-2">
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase text-indigo-300">
                         <span>Session ID</span>
                         <span className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-white">{roomId || 'SINGLEPLAYER'}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase text-indigo-300">
                         <span>Players</span>
                         <span className="text-white">{remotePlayers.length + 1}</span>
                     </div>
                 </div>

                 {remotePlayers.length > 0 ? (
                     <div className="space-y-2">
                         <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Remote Players</h3>
                         {remotePlayers.map((p, i) => (
                             <div key={i} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 rounded">
                                 <span className="text-xs font-bold text-white flex items-center gap-2"><User size={12} className="text-blue-400"/> {p.name || 'Unknown'}</span>
                                 <button onClick={() => onTeleport(p.x, p.y)} className="text-[10px] bg-blue-600 px-2 py-1 rounded text-white font-bold uppercase">TP To</button>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="text-center py-4 border border-dashed border-white/10 rounded-xl text-zinc-600 text-xs">No remote players connected</div>
                 )}
             </div>
        )}

        {activeTab === 'tests' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                <button 
                    onClick={runTests} 
                    disabled={isRunningTests || !testInterface} 
                    className="w-full py-4 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRunningTests ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <PlayCircle size={16} />}
                    <span className="font-black uppercase text-xs tracking-widest">Run System Diagnostics</span>
                </button>

                {testResults && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {testResults.map((r, i) => (
                            <div key={i} className={`p-2 rounded border flex items-start gap-2 ${r.passed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                                <div className={`mt-0.5 ${r.passed ? 'text-emerald-500' : 'text-red-500'}`}>{r.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}</div>
                                <div>
                                    <div className={`text-[10px] font-black uppercase ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>{r.category} / {r.name}</div>
                                    <div className="text-[10px] text-zinc-400 leading-tight">{r.details}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};
