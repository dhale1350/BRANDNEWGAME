
import React from 'react';
import { X, Calendar, GitCommit, Zap, Shield, Globe } from 'lucide-react';

interface ChangeLogEntry {
    version: string;
    date: string;
    title: string;
    changes: string[];
    highlight?: boolean;
}

const CHANGELOG: ChangeLogEntry[] = [
    {
        version: "1.2.0",
        date: "2024-05-22",
        title: "Durability & Polish",
        highlight: true,
        changes: [
            "Implemented tool durability system",
            "Tools now lose durability when mining blocks or hitting enemies",
            "Items break and vanish when durability reaches zero",
            "Added visual durability bars to inventory icons",
            "Added tool stats (Durability, Damage, Speed) to item tooltips",
            "Fixed tool animations and hit detection"
        ]
    },
    {
        version: "1.1.5",
        date: "2024-05-21",
        title: "Mobile Revolution",
        changes: [
            "Added dual virtual joysticks for mobile movement and aiming",
            "Implemented 'Tap to Mine/Place' for touch screens",
            "Added dedicated jump and action buttons for mobile",
            "Optimized UI layout for smaller screens",
            "Added smart reach clamping for mobile joystick aiming"
        ]
    },
    {
        version: "1.1.0",
        date: "2024-05-21",
        title: "Life & Death Update",
        changes: [
            "Added enemy mobs: Green Slimes and Zombies",
            "Implemented Player Health and damage mechanics",
            "Added combat knockback and invulnerability frames",
            "Added death screen and respawn logic",
            "Added Friendly Guide NPC with helpful tips",
            "Added particle effects for mining and combat"
        ]
    },
    {
        version: "1.0.0",
        date: "2024-05-20",
        title: "Genesis Release",
        changes: [
            "Procedural World Generation (Terrain, Caves, Ores)",
            "Dynamic Lighting System with Day/Night cycle",
            "Peer-to-Peer Multiplayer (Join via ID)",
            "Inventory and Crafting Systems",
            "Save/Load System for local worlds",
            "Basic Physics Engine (Gravity, Collision, Friction)",
            "Parallax Backgrounds"
        ]
    }
];

interface ChangelogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#0b0e14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                            <GitCommit size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wide">Patch Notes</h2>
                            <p className="text-xs text-zinc-400 font-medium">Latest Updates & Changes</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-[#0b0e14]">
                    {CHANGELOG.map((entry, i) => (
                        <div key={i} className={`relative pl-6 border-l-2 ${entry.highlight ? 'border-blue-500' : 'border-zinc-800'}`}>
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-[#0b0e14] ${entry.highlight ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-zinc-700'}`} />
                            
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-3">
                                <span className={`text-2xl font-black ${entry.highlight ? 'text-blue-400' : 'text-white'}`}>{entry.version}</span>
                                <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                    {entry.title}
                                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                    <span className="flex items-center gap-1"><Calendar size={10} /> {entry.date}</span>
                                </span>
                            </div>

                            <ul className="space-y-2">
                                {entry.changes.map((change, idx) => (
                                    <li key={idx} className="text-sm text-zinc-300 flex items-start gap-3 leading-relaxed">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                                        {change}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    
                    <div className="pt-8 text-center">
                        <div className="inline-block px-4 py-2 bg-white/5 rounded-full text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                            End of Log
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/40 border-t border-white/5 flex justify-end shrink-0">
                    <button onClick={onClose} className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-colors shadow-lg active:scale-95">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
