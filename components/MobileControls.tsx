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
  onMove, onAim, onJumpStart, onJumpEnd, onInventoryToggle, actionMode, onToggleActionMode, onChatToggle,
}) => {
  const onMoveRef = useRef(onMove);
  const onAimRef = useRef(onAim);
  const onJumpStartRef = useRef(onJumpStart);
  const onJumpEndRef = useRef(onJumpEnd);

  useEffect(() => {
    onMoveRef.current = onMove; onAimRef.current = onAim; onJumpStartRef.current = onJumpStart; onJumpEndRef.current = onJumpEnd;
  });

  const [leftActive, setLeftActive] = useState(false);
  const [leftPos, setLeftPos] = useState({ x: 0, y: 0 });
  const [leftBase, setLeftBase] = useState({ x: 0, y: 0 });
  const leftId = useRef<number | null>(null);

  const [rightActive, setRightActive] = useState(false);
  const [rightPos, setRightPos] = useState({ x: 0, y: 0 });
  const [rightBase, setRightBase] = useState({ x: 0, y: 0 });
  const rightId = useRef<number | null>(null);
  const rightVector = useRef({ x: 0, y: 0 });

  const handleLeftStart = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (leftId.current !== null) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    leftId.current = e.pointerId;
    setLeftActive(true);
    setLeftBase({ x: e.clientX, y: e.clientY });
    setLeftPos({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!leftActive) return;
    const handleLeftMove = (e: PointerEvent) => {
        if (e.pointerId !== leftId.current) return;
        e.preventDefault();
        const dx = e.clientX - leftBase.x; const dy = e.clientY - leftBase.y; const dist = Math.sqrt(dx * dx + dy * dy); const maxDist = 50;
        let lx = 0; let ly = 0;
        if (dist > 5) { const angle = Math.atan2(dy, dx); const clampDist = Math.min(dist, maxDist); lx = Math.cos(angle) * clampDist; ly = Math.sin(angle) * clampDist; const normX = lx / maxDist; const normY = ly / maxDist; onMoveRef.current({ x: normX, y: normY }); } else { onMoveRef.current({ x: 0, y: 0 }); }
        setLeftPos({ x: lx, y: ly });
    };
    const handleLeftEnd = (e: PointerEvent) => {
        if (e.pointerId !== leftId.current) return;
        e.preventDefault(); leftId.current = null; setLeftActive(false); setLeftPos({ x: 0, y: 0 }); onMoveRef.current({ x: 0, y: 0 });
    };
    window.addEventListener('pointermove', handleLeftMove); window.addEventListener('pointerup', handleLeftEnd); window.addEventListener('pointercancel', handleLeftEnd);
    return () => { window.removeEventListener('pointermove', handleLeftMove); window.removeEventListener('pointerup', handleLeftEnd); window.removeEventListener('pointercancel', handleLeftEnd); };
  }, [leftActive, leftBase]);

  const handleRightStart = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (rightId.current !== null) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    rightId.current = e.pointerId;
    setRightActive(true);
    setRightBase({ x: e.clientX, y: e.clientY });
    setRightPos({ x: 0, y: 0 });
    rightVector.current = { x: 0, y: 0 };
    onAim({ x: 0, y: 0 }, true);
  };

  useEffect(() => {
    if (!rightActive) return;
    const handleRightMove = (e: PointerEvent) => {
        if (e.pointerId !== rightId.current) return;
        e.preventDefault();
        const dx = e.clientX - rightBase.x; const dy = e.clientY - rightBase.y; const dist = Math.sqrt(dx * dx + dy * dy); const maxDist = 50;
        let rx = 0, ry = 0;
        if (dist > 5) { const angle = Math.atan2(dy, dx); const clampDist = Math.min(dist, maxDist); rx = Math.cos(angle) * clampDist; ry = Math.sin(angle) * clampDist; rightVector.current = { x: rx / maxDist, y: ry / maxDist }; onAimRef.current(rightVector.current, true); } else { rightVector.current = { x: 0, y: 0 }; onAimRef.current({ x: 0, y: 0 }, true); }
        setRightPos({ x: rx, y: ry });
    };
    const handleRightEnd = (e: PointerEvent) => {
        if (e.pointerId !== rightId.current) return;
        e.preventDefault(); rightId.current = null; setRightActive(false); setRightPos({ x: 0, y: 0 }); rightVector.current = { x: 0, y: 0 }; onAimRef.current({ x: 0, y: 0 }, false);
    };
    window.addEventListener('pointermove', handleRightMove); window.addEventListener('pointerup', handleRightEnd); window.addEventListener('pointercancel', handleRightEnd);
    return () => { window.removeEventListener('pointermove', handleRightMove); window.removeEventListener('pointerup', handleRightEnd); window.removeEventListener('pointercancel', handleRightEnd); };
  }, [rightActive, rightBase]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none overflow-hidden touch-none" style={{ touchAction: 'none' }}>
      
      {/* Joystick Zones */}
      <div className="absolute bottom-0 left-0 w-[40%] h-[50%] pointer-events-auto mobile-control-zone touch-none" onPointerDown={handleLeftStart} />
      <div className="absolute bottom-0 right-0 w-[40%] h-[50%] pointer-events-auto mobile-control-zone touch-none" onPointerDown={handleRightStart} />

      {/* ACTIVE JOYSTICKS */}
      {leftActive && (
        <div className="fixed" style={{ left: leftBase.x, top: leftBase.y }}>
             <div className="absolute w-28 h-28 -translate-x-1/2 -translate-y-1/2 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in duration-100">
                <div className="absolute w-12 h-12 bg-white/20 shadow-inner rounded-full border border-white/30 backdrop-blur-md" style={{ transform: `translate(${leftPos.x}px, ${leftPos.y}px)` }} />
             </div>
        </div>
      )}

      {rightActive && (
        <div className="fixed" style={{ left: rightBase.x, top: rightBase.y }}>
             <div className="absolute w-28 h-28 -translate-x-1/2 -translate-y-1/2 bg-red-500/5 border border-red-500/10 rounded-full flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in duration-100">
                <div className="absolute w-12 h-12 bg-red-500/20 shadow-inner rounded-full border border-red-500/30 backdrop-blur-md" style={{ transform: `translate(${rightPos.x}px, ${rightPos.y}px)` }} />
             </div>
        </div>
      )}

      {/* HINTS */}
      {!leftActive && (
         <div className="absolute bottom-16 left-12 w-24 h-24 rounded-full flex items-center justify-center opacity-10 pointer-events-none border-2 border-dashed border-white">
            <div className="text-[10px] font-black uppercase text-white tracking-widest">Move</div>
         </div>
      )}
      {!rightActive && (
         <div className="absolute bottom-16 right-12 w-24 h-24 rounded-full flex items-center justify-center opacity-10 pointer-events-none border-2 border-dashed border-white">
            <div className="text-[10px] font-black uppercase text-white tracking-widest">Aim</div>
         </div>
      )}

      {/* SIDE BUTTONS */}
      <div className="absolute top-24 right-4 flex flex-col items-end gap-3 pointer-events-none">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <button onPointerDown={(e) => { e.stopPropagation(); onToggleActionMode(); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-90 shadow-xl backdrop-blur-xl ${actionMode === 'mine' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-blue-500/20 border-blue-500 text-blue-400'}`}>
            {actionMode === 'mine' ? <Pickaxe size={20} /> : <Hammer size={20} />}
          </button>
          
          <button onPointerDown={(e) => { e.stopPropagation(); onInventoryToggle(); }} className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 text-white flex items-center justify-center backdrop-blur-xl active:scale-90 shadow-xl transition-all">
            <Briefcase size={20} />
          </button>

          <button onPointerDown={(e) => { e.stopPropagation(); onChatToggle(); }} className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 text-white flex items-center justify-center backdrop-blur-xl active:scale-90 shadow-xl transition-all">
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      {/* JUMP */}
      <div className="absolute bottom-48 right-6 pointer-events-auto">
          <button 
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); onJumpStartRef.current(); }}
            onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); onJumpEndRef.current(); }}
            onPointerCancel={(e) => { e.stopPropagation(); e.preventDefault(); onJumpEndRef.current(); }}
            className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-2xl active:scale-90 active:bg-white/20 transition-all"
          >
            <ArrowUp size={28} className="text-white" />
          </button>
      </div>
    </div>
  );
};