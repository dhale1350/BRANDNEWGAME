
import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, Briefcase, Pickaxe, Hammer, Zap, Crosshair, MessageSquare } from 'lucide-react';

interface MobileControlsProps {
  onMove: (vector: { x: number; y: number }) => void;
  onAim: (vector: { x: number; y: number }, active: boolean) => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onInventoryToggle: () => void;
  actionMode: 'mine' | 'place';
  onToggleActionMode: () => void;
  onChatToggle: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onAim,
  onJumpStart,
  onJumpEnd,
  onInventoryToggle,
  actionMode,
  onToggleActionMode,
  onChatToggle,
}) => {
  // LEFT STICK (Movement)
  const [leftActive, setLeftActive] = useState(false);
  const [leftPos, setLeftPos] = useState({ x: 0, y: 0 });
  const [leftBase, setLeftBase] = useState({ x: 0, y: 0 });
  const leftId = useRef<number | null>(null);

  // RIGHT STICK (Aim/Action)
  const [rightActive, setRightActive] = useState(false);
  const [rightPos, setRightPos] = useState({ x: 0, y: 0 });
  const [rightBase, setRightBase] = useState({ x: 0, y: 0 });
  const rightId = useRef<number | null>(null);
  const rightVector = useRef({ x: 0, y: 0 });

  // --- Left Stick Handlers ---
  const handleLeftStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (leftId.current !== null) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    leftId.current = e.pointerId;
    setLeftActive(true);
    setLeftBase({ x: e.clientX, y: e.clientY });
    setLeftPos({ x: 0, y: 0 });
  };

  const handleLeftMove = (e: PointerEvent) => {
    if (!leftActive || e.pointerId !== leftId.current) return;
    e.preventDefault();
    const dx = e.clientX - leftBase.x;
    const dy = e.clientY - leftBase.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 50;
    
    let lx = 0;
    let ly = 0;
    if (dist > 5) {
      const angle = Math.atan2(dy, dx);
      const clampDist = Math.min(dist, maxDist);
      lx = Math.cos(angle) * clampDist;
      ly = Math.sin(angle) * clampDist;
      
      const normX = lx / maxDist;
      const normY = ly / maxDist;
      onMove({ x: normX, y: normY });
    } else {
      onMove({ x: 0, y: 0 });
    }
    setLeftPos({ x: lx, y: ly });
  };

  const handleLeftEnd = (e: PointerEvent) => {
    if (e.pointerId !== leftId.current) return;
    e.preventDefault();
    leftId.current = null;
    setLeftActive(false);
    setLeftPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  // --- Right Stick Handlers ---
  const handleRightStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (rightId.current !== null) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    rightId.current = e.pointerId;
    setRightActive(true);
    setRightBase({ x: e.clientX, y: e.clientY });
    setRightPos({ x: 0, y: 0 });
    // Start aiming immediately to allow tap-to-mine
    rightVector.current = { x: 0, y: 0 };
    onAim({ x: 0, y: 0 }, true);
  };

  const handleRightMove = (e: PointerEvent) => {
    if (!rightActive || e.pointerId !== rightId.current) return;
    e.preventDefault();
    const dx = e.clientX - rightBase.x;
    const dy = e.clientY - rightBase.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 50;

    let rx = 0, ry = 0;
    if (dist > 5) {
       const angle = Math.atan2(dy, dx);
       const clampDist = Math.min(dist, maxDist);
       rx = Math.cos(angle) * clampDist;
       ry = Math.sin(angle) * clampDist;
       
       rightVector.current = { x: rx / maxDist, y: ry / maxDist };
       onAim(rightVector.current, true);
    } else {
       // Keep aiming but centered if dragging very close to center
       rightVector.current = { x: 0, y: 0 };
       onAim({ x: 0, y: 0 }, true);
    }
    setRightPos({ x: rx, y: ry });
  };

  const handleRightEnd = (e: PointerEvent) => {
    if (e.pointerId !== rightId.current) return;
    e.preventDefault();
    rightId.current = null;
    setRightActive(false);
    setRightPos({ x: 0, y: 0 });
    rightVector.current = { x: 0, y: 0 };
    onAim({ x: 0, y: 0 }, false);
  };

  // Global listeners for sticks
  useEffect(() => {
    if (leftActive) {
        window.addEventListener('pointermove', handleLeftMove);
        window.addEventListener('pointerup', handleLeftEnd);
        window.addEventListener('pointercancel', handleLeftEnd);
    }
    return () => {
        window.removeEventListener('pointermove', handleLeftMove);
        window.removeEventListener('pointerup', handleLeftEnd);
        window.removeEventListener('pointercancel', handleLeftEnd);
    };
  }, [leftActive, leftBase]);

  useEffect(() => {
    if (rightActive) {
        window.addEventListener('pointermove', handleRightMove);
        window.addEventListener('pointerup', handleRightEnd);
        window.addEventListener('pointercancel', handleRightEnd);
    }
    return () => {
        window.removeEventListener('pointermove', handleRightMove);
        window.removeEventListener('pointerup', handleRightEnd);
        window.removeEventListener('pointercancel', handleRightEnd);
    };
  }, [rightActive, rightBase]);


  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none overflow-hidden touch-none" style={{ touchAction: 'none' }}>
      
      {/* LEFT JOYSTICK ZONE (Bottom Left 40%) */}
      <div 
        className="absolute bottom-0 left-0 w-[40%] h-[50%] pointer-events-auto mobile-control-zone touch-none"
        onPointerDown={handleLeftStart}
      />
      
      {/* RIGHT JOYSTICK ZONE (Bottom Right 40%) */}
      <div 
        className="absolute bottom-0 right-0 w-[40%] h-[50%] pointer-events-auto mobile-control-zone touch-none"
        onPointerDown={handleRightStart}
      />

      {/* VISUALS */}
      {leftActive && (
        <div className="fixed" style={{ left: leftBase.x, top: leftBase.y }}>
             <div className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 bg-white/5 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <div 
                  className="absolute w-12 h-12 bg-white/80 shadow-lg rounded-full border-2 border-white"
                  style={{ transform: `translate(${leftPos.x}px, ${leftPos.y}px)` }}
                />
             </div>
        </div>
      )}

      {rightActive && (
        <div className="fixed" style={{ left: rightBase.x, top: rightBase.y }}>
             <div className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 bg-red-500/5 border border-red-400/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <div 
                  className="absolute w-12 h-12 bg-red-500/80 shadow-lg rounded-full border-2 border-white"
                  style={{ transform: `translate(${rightPos.x}px, ${rightPos.y}px)` }}
                />
             </div>
        </div>
      )}

      {/* Static Visual Hints if inactive */}
      {!leftActive && (
         <div className="absolute bottom-16 left-16 w-20 h-20 border-2 border-white/10 rounded-full flex items-center justify-center opacity-30 pointer-events-none">
            <div className="w-2 h-2 bg-white rounded-full" />
         </div>
      )}
      {!rightActive && (
         <div className="absolute bottom-16 right-16 w-20 h-20 border-2 border-red-400/10 rounded-full flex items-center justify-center opacity-30 pointer-events-none">
            <Crosshair size={24} className="text-red-400/50" />
         </div>
      )}


      {/* UTILITY BUTTONS (Top Right / Sides) */}
      <div className="absolute top-20 right-4 flex flex-col items-end gap-3 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          <button 
            onPointerDown={(e) => { e.stopPropagation(); onToggleActionMode(); }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all active:scale-90 shadow-lg backdrop-blur-lg ui-interactive ${actionMode === 'mine' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-blue-500/20 border-blue-500 text-blue-400'}`}
          >
            {actionMode === 'mine' ? <Pickaxe size={20} /> : <Hammer size={20} />}
          </button>
          
          <button 
            onPointerDown={(e) => { e.stopPropagation(); onInventoryToggle(); }}
            className="w-12 h-12 rounded-xl bg-slate-800/80 border-2 border-white/10 text-white flex items-center justify-center backdrop-blur-lg active:scale-90 shadow-lg transition-all ui-interactive"
          >
            <Briefcase size={20} />
          </button>

          <button 
            onPointerDown={(e) => { e.stopPropagation(); onChatToggle(); }}
            className="w-12 h-12 rounded-xl bg-slate-800/80 border-2 border-white/10 text-white flex items-center justify-center backdrop-blur-lg active:scale-90 shadow-lg transition-all ui-interactive"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      {/* JUMP BUTTON (Above Right Stick Area) */}
      <div className="absolute bottom-48 right-8 pointer-events-auto">
          <button 
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); onJumpStart(); }}
            onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); onJumpEnd(); }}
            onPointerCancel={(e) => { e.stopPropagation(); e.preventDefault(); onJumpEnd(); }}
            className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl shadow-2xl active:scale-90 active:bg-white/20 transition-all mobile-control-zone touch-none"
          >
            <ArrowUp size={28} className="text-white" />
          </button>
      </div>

    </div>
  );
};
