
import React, { useState, useEffect } from 'react';
import { 
    Play, Settings, User, Globe, Box, ArrowRight, Hash, Edit3, Sparkles, Plus, Trash2, Clock, GitCommit
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
  
  // World Selection State
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
      // Note: We don't save immediately here, we start the game with a new ID
      // and let the Game component handle the initial save generation/logic
      onStart(undefined, id);
  };

  const handleDeleteWorld = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm('Are you sure you want to delete this world? This cannot be undone.')) {
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
    <div className="relative w-full h-full overflow-y-auto overflow-x-hidden bg-[#020408] font-sans selection:bg-blue-500/30 touch-auto text-slate-200">
      
      {/* Deep Atmospheric Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020408] to-[#000000] z-0" />
      <div className="fixed top-[-10%] right-[-5%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col p-4 sm:p-8 min-h-full">
        
        {/* Minimal Header */}
        <header className="flex justify-between items-center mb-8 lg:mb-12 w-full shrink-0">
            <div className="flex items-center gap-3 select-none opacity-80 hover:opacity-100 transition-opacity">
                <Box className="text-blue-500" size={24} strokeWidth={2.5} />
                <h1 className="text-lg font-black tracking-widest text-white leading-none">TERRARIUM<span className="text-blue-500">JS</span></h1>
            </div>
            
            <button onClick={() => setShowSettings(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95">
                <Settings size={20} />
            </button>
        </header>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1 min-h-0 items-start">
            
            {/* Left Column: Character Pedestal */}
            <div className="w-full lg:w-[420px] flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
                
                {/* Character Name Input - Floating & Clean */}
                <div className="relative group px-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Explorer Identity</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={settings.playerName}
                            onChange={(e) => onSettingsChange({...settings, playerName: e.target.value})}
                            placeholder="NAME"
                            maxLength={12}
                            className="w-full bg-transparent text-3xl font-black text-white placeholder:text-slate-800 focus:outline-none transition-all uppercase tracking-tighter"
                        />
                        <Edit3 size={16} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                    </div>
                    <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/50 to-transparent mt-2 opacity-50 group-focus-within:opacity-100 transition-opacity" />
                </div>

                {/* Pedestal Card */}
                <div className="relative bg-[#0a0c10] rounded-[2rem] p-6 shadow-2xl flex flex-col items-center">
                    
                    {/* Preview */}
                    <div className="relative h-64 w-full flex items-center justify-center mb-6">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-t-[2rem]" />
                        <div className="relative z-10 scale-110 lg:scale-125">
                             <CharacterPreview settings={settings} />
                        </div>
                    </div>

                    {/* Customization Tabs */}
                    <div className="w-full flex gap-2 p-1 bg-black/20 rounded-xl mb-6">
                         {(['skin', 'outfit', 'hair'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setCustomizeTab(tab)}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${customizeTab === tab ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Color Swatches - Fixed Clipping */}
                    <div className="w-full px-2 pb-2">
                        <div className="flex flex-wrap gap-3 justify-center">
                            {currentPalette.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleColorSelect(c)}
                                    className={`w-10 h-10 rounded-full transition-all duration-300 relative group ${currentColor === c ? 'scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                >
                                    {currentColor === c && (
                                        <div className="absolute inset-0 rounded-full ring-2 ring-white ring-offset-2 ring-offset-black/50" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Right Column: Game Mode & Launch */}
            <div className="flex-1 w-full flex flex-col gap-6 pt-4 animate-in slide-in-from-right-8 duration-700 fade-in delay-100">
                
                {/* Mode Selector - Big Pills */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={() => setActiveTab('play')}
                        className={`flex-1 p-6 rounded-3xl text-left transition-all duration-300 border ${activeTab === 'play' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30' : 'bg-[#0a0c10] border-white/5 text-slate-500 hover:bg-[#13161c] hover:text-slate-300'}`}
                    >
                        <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                            <Play size={20} fill="currentColor" />
                        </div>
                        <div className="font-black text-lg uppercase tracking-wide">Singleplayer</div>
                        <div className="text-xs opacity-70 mt-1 font-medium">Select World</div>
                    </button>

                    <button 
                        onClick={() => setActiveTab('custom')}
                        className={`flex-1 p-6 rounded-3xl text-left transition-all duration-300 border ${activeTab === 'custom' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30' : 'bg-[#0a0c10] border-white/5 text-slate-500 hover:bg-[#13161c] hover:text-slate-300'}`}
                    >
                        <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                            <Globe size={20} />
                        </div>
                        <div className="font-black text-lg uppercase tracking-wide">Multiplayer</div>
                        <div className="text-xs opacity-70 mt-1 font-medium">Join P2P Session</div>
                    </button>
                </div>

                {/* Content & Action Area */}
                <div className="flex-1 bg-[#0a0c10] border border-white/5 rounded-[2.5rem] p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden min-h-[400px]">
                    <div className="absolute top-0 right-0 p-40 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />

                    <div className="relative z-10 w-full h-full flex flex-col">
                         {activeTab === 'play' ? (
                            <div className="flex flex-col h-full gap-4">
                                {isCreating ? (
                                    <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-4">
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-white">Create New World</h3>
                                            <p className="text-slate-400 text-sm">Enter a name for your new adventure.</p>
                                        </div>
                                        
                                        <input 
                                            type="text" 
                                            value={newWorldName}
                                            onChange={(e) => setNewWorldName(e.target.value)}
                                            placeholder="World Name"
                                            className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xl font-bold text-white placeholder:text-zinc-700 outline-none focus:border-blue-500 transition-all"
                                            autoFocus
                                        />

                                        <div className="flex gap-4 mt-auto">
                                            <button onClick={() => setIsCreating(false)} className="px-6 py-4 rounded-xl font-bold uppercase text-xs tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                                            <button onClick={handleCreateWorld} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all active:scale-[0.99]">Generate World</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <h3 className="text-2xl font-black text-white">Select World</h3>
                                                <p className="text-slate-400 text-xs mt-1">Local saves stored in browser.</p>
                                            </div>
                                            <button onClick={() => { setNewWorldName(''); setIsCreating(true); }} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                                                <Plus size={14} /> New World
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4 space-y-2 max-h-[300px]">
                                            {saves.length === 0 ? (
                                                <div className="h-40 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-2xl">
                                                    <Box size={32} className="mb-2 opacity-50" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">No Worlds Found</span>
                                                </div>
                                            ) : (
                                                saves.map((save) => (
                                                    <div key={save.id} onClick={() => onStart(undefined, save.id)} className="group relative bg-[#13161c] border border-white/5 hover:border-blue-500/50 p-4 rounded-2xl cursor-pointer transition-all hover:bg-[#1a1e26] active:scale-[0.99]">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{save.name}</h4>
                                                                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 mt-1">
                                                                    <span className="flex items-center gap-1"><Clock size={10}/> {new Date(save.lastPlayed).toLocaleDateString()}</span>
                                                                    <span className="opacity-50">SEED: {save.seed}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={(e) => handleDeleteWorld(save.id, e)} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                                    <Play size={14} fill="currentColor" />
                                                                </div>
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
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div>
                                    <div className="flex items-center gap-2 text-indigo-500 mb-2">
                                        <Globe size={16} />
                                        <span className="text-xs font-bold uppercase tracking-widest">P2P Network</span>
                                    </div>
                                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
                                        Join a <br/>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Frequency</span>
                                    </h2>
                                    <p className="text-slate-400 text-base leading-relaxed">
                                        Connect directly to a friend's instance using their unique Room ID. Low latency, decentralized multiplayer.
                                    </p>
                                </div>
                                
                                <div className="bg-[#050608] border border-white/5 p-2 rounded-2xl flex items-center">
                                    <div className="w-12 h-12 rounded-xl bg-[#13161c] flex items-center justify-center text-slate-500">
                                        <Hash size={20} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={roomIdInput}
                                        onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                                        placeholder="ENTER ROOM ID"
                                        className="flex-1 bg-transparent px-4 py-2 font-mono text-xl text-white placeholder:text-slate-700 focus:outline-none uppercase tracking-wider"
                                    />
                                </div>

                                <button onClick={() => onStart(roomIdInput)} disabled={!roomIdInput} className="w-full group flex items-center justify-center gap-4 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-indigo-900/20">
                                    <span>Connect to Session</span>
                                </button>
                            </div>
                         )}
                    </div>
                </div>

            </div>

        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center text-[10px] font-mono font-bold text-slate-800 w-full shrink-0">
                <div className="flex gap-4">
                    <span>TERRARIUM ENGINE</span>
                </div>
                <button 
                    onClick={() => setShowChangelog(true)}
                    className="flex items-center gap-2 hover:text-blue-500 transition-colors cursor-pointer group"
                >
                    <GitCommit size={12} className="group-hover:text-blue-500" />
                    <span>v1.2.0</span>
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
