import React, { useState, useEffect } from 'react';
import { 
    Play, Settings, Globe, Box, Hash, Edit3, Plus, Trash2, Clock, GitCommit, Gamepad2, Layers
} from 'lucide-react';
import { InputMode, GameSettings } from '../types';
import { SettingsOverlay } from './SettingsOverlay';
import { CharacterPreview } from './CharacterPreview';
import { ChangelogModal } from './ChangelogModal';
import { getSaveList, deleteWorld, SaveSummary } from '../utils/storage';

interface MainMenuProps {
  onStart: (roomId?: string, saveId?: string) => void;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#0f172a', '#ffffff'
];
const HAIR_COLORS = [
  '#422006', '#0f172a', '#facc15', '#a16207', '#dc2626', '#ffffff', '#57534e', '#3b82f6'
];
const SKIN_COLORS = [
  '#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#c68642', '#593b2b', '#3e2723', '#2d2d2d'
];

export const MainMenu: React.FC<MainMenuProps> = ({ 
    onStart, inputMode, onInputModeChange, settings, onSettingsChange
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [activeTab, setActiveTab] = useState<'play' | 'custom'>('play');
  const [customizeTab, setCustomizeTab] = useState<'skin' | 'outfit' | 'hair'>('outfit');
  const [saves, setSaves] = useState<SaveSummary[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorldName, setNewWorldName] = useState('');

  useEffect(() => {
      setSaves(getSaveList());
  }, []);

  const refreshSaves = () => setSaves(getSaveList());

  const handleCreateWorld = () => {
      const id = `world_${Date.now()}`;
      const name = newWorldName.trim() || `New World ${saves.length + 1}`;
      onStart(undefined, id);
  };

  const handleDeleteWorld = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm('Delete this world permanently?')) {
          deleteWorld(id);
          refreshSaves();
      }
  };

  const currentPalette = 
    customizeTab === 'skin' ? SKIN_COLORS : 
    customizeTab === 'hair' ? HAIR_COLORS : COLORS;

  const currentColor = 
    customizeTab === 'skin' ? settings.playerSkin :
    customizeTab === 'hair' ? settings.playerHair : settings.playerColor;

  const handleColorSelect = (color: string) => {
      if (customizeTab === 'skin') onSettingsChange({...settings, playerSkin: color});
      else if (customizeTab === 'hair') onSettingsChange({...settings, playerHair: color});
      else onSettingsChange({...settings, playerColor: color});
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020408] font-sans selection:bg-blue-500/30 text-slate-200">
      
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[#05080f]">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                    <Box className="text-blue-500" size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-xl font-black tracking-widest text-white leading-none">TERRARIUM<span className="text-blue-500">JS</span></h1>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alpha Build</span>
                </div>
            </div>
            
            <button 
                onClick={() => setShowSettings(true)} 
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-slate-400 hover:text-white transition-all active:scale-95"
            >
                <Settings size={20} />
            </button>
        </header>

        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            
            {/* Left: Character Customization */}
            <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                <div className="flex-1 bg-[#0b0e14]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden group">
                    
                    {/* Character Name */}
                    <div className="w-full relative group/input mb-6">
                        <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                            <UserIcon /> Identity
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={settings.playerName}
                                onChange={(e) => onSettingsChange({...settings, playerName: e.target.value})}
                                maxLength={12}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all uppercase text-center tracking-wider"
                            />
                            <Edit3 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 w-full relative flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent rounded-2xl mb-6 border border-white/5">
                        <div className="scale-150 hover:scale-[1.6] transition-transform duration-500">
                             <CharacterPreview settings={settings} />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="w-full space-y-4">
                        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                             {(['skin', 'outfit', 'hair'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setCustomizeTab(tab)}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${customizeTab === tab ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center p-2">
                            {currentPalette.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleColorSelect(c)}
                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 relative ${currentColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b0e14] scale-110 z-10' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Game Modes */}
            <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
                {/* Mode Tabs */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar shrink-0 pb-2">
                    <ModeTab 
                        active={activeTab === 'play'} 
                        onClick={() => setActiveTab('play')}
                        icon={<Gamepad2 size={20}/>}
                        title="Singleplayer"
                        desc="Local World"
                    />
                    <ModeTab 
                        active={activeTab === 'custom'} 
                        onClick={() => setActiveTab('custom')}
                        icon={<Globe size={20}/>}
                        title="Multiplayer"
                        desc="Join Session"
                    />
                </div>

                {/* Main Action Area */}
                <div className="flex-1 bg-[#0b0e14]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col min-h-[300px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                    {activeTab === 'play' ? (
                        <div className="flex flex-col h-full">
                            {isCreating ? (
                                <div className="flex-1 flex flex-col justify-center gap-6 animate-in slide-in-from-right-4 fade-in">
                                    <div className="space-y-2 text-center sm:text-left">
                                        <h3 className="text-3xl font-black text-white tracking-tight">New Expedition</h3>
                                        <p className="text-slate-400">Generate a unique procedural world.</p>
                                    </div>
                                    
                                    <input 
                                        type="text" 
                                        value={newWorldName}
                                        onChange={(e) => setNewWorldName(e.target.value)}
                                        placeholder="World Name"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-xl font-bold text-white placeholder:text-zinc-700 outline-none focus:border-blue-500 transition-all"
                                        autoFocus
                                    />

                                    <div className="flex gap-4 mt-auto pt-4">
                                        <button onClick={() => setIsCreating(false)} className="px-6 py-4 rounded-xl font-bold uppercase text-xs tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                                        <button onClick={handleCreateWorld} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]">
                                            Create & Play
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6 shrink-0">
                                        <div>
                                            <h3 className="text-2xl font-black text-white tracking-tight">Select World</h3>
                                            <p className="text-slate-400 text-xs mt-1">Stored locally in your browser.</p>
                                        </div>
                                        <button 
                                            onClick={() => { setNewWorldName(''); setIsCreating(true); }} 
                                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                                        >
                                            <Plus size={16} /> <span className="hidden sm:inline">New World</span>
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-3">
                                        {saves.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-2xl min-h-[200px]">
                                                <Layers size={48} className="mb-4 opacity-20" />
                                                <span className="text-xs font-bold uppercase tracking-widest">No Worlds Found</span>
                                            </div>
                                        ) : (
                                            saves.map((save) => (
                                                <div 
                                                    key={save.id} 
                                                    onClick={() => onStart(undefined, save.id)} 
                                                    className="group relative bg-[#13161c]/50 border border-white/5 hover:border-blue-500/50 p-4 rounded-2xl cursor-pointer transition-all hover:bg-[#1a1e26] active:scale-[0.99] flex justify-between items-center"
                                                >
                                                    <div>
                                                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{save.name}</h4>
                                                        <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 mt-1">
                                                            <span className="flex items-center gap-1.5"><Clock size={12}/> {new Date(save.lastPlayed).toLocaleDateString()}</span>
                                                            <span className="bg-white/5 px-2 py-0.5 rounded">SEED: {save.seed}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={(e) => handleDeleteWorld(save.id, e)} 
                                                            className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
                                                            <Play size={20} fill="currentColor" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center h-full gap-8 animate-in slide-in-from-right-4 fade-in max-w-lg mx-auto w-full">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
                                    <Globe size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-white">Join Frequency</h2>
                                <p className="text-slate-400">Connect to a friend's P2P session.</p>
                            </div>
                            
                            <div className="bg-[#050608] border border-white/10 p-2 rounded-2xl flex items-center focus-within:border-indigo-500/50 transition-colors">
                                <div className="w-14 h-14 rounded-xl bg-[#13161c] flex items-center justify-center text-slate-500 border border-white/5">
                                    <Hash size={24} />
                                </div>
                                <input 
                                    type="text" 
                                    value={roomIdInput}
                                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                                    placeholder="PASTE ROOM ID"
                                    className="flex-1 bg-transparent px-4 py-2 font-mono text-xl text-white placeholder:text-slate-700 focus:outline-none uppercase tracking-wider text-center sm:text-left"
                                />
                            </div>

                            <button 
                                onClick={() => onStart(roomIdInput)} 
                                disabled={!roomIdInput} 
                                className="w-full bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-indigo-900/20"
                            >
                                Connect
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center text-[10px] font-mono font-bold text-slate-700 w-full shrink-0">
             <span>TERRARIUM ENGINE v1.3</span>
             <button 
                onClick={() => setShowChangelog(true)}
                className="flex items-center gap-2 hover:text-blue-500 transition-colors cursor-pointer group px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
                <GitCommit size={12} />
                <span>CHANGELOG</span>
            </button>
        </div>

      </div>

      <SettingsOverlay 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        inputMode={inputMode}
        onInputModeChange={onInputModeChange}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <ChangelogModal 
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />
    </div>
  );
};

const ModeTab = ({ active, onClick, icon, title, desc }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 min-w-[160px] p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 text-left ${active ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-900/10' : 'bg-[#0b0e14]/50 border-white/5 text-slate-500 hover:bg-[#13161c] hover:text-slate-300'}`}
    >
        <div className={`${active ? 'text-blue-400' : 'opacity-50'}`}>{icon}</div>
        <div>
            <div className={`font-black uppercase tracking-wide text-sm ${active ? 'text-white' : 'text-slate-400'}`}>{title}</div>
            <div className="text-[10px] opacity-60 font-medium">{desc}</div>
        </div>
    </button>
);

const UserIcon = () => (
    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);