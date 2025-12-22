
import React, { useState } from 'react';
import { Game } from './components/Game';
import { MainMenu } from './components/MainMenu';
import { GameState, InputMode, GameSettings } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.AUTO);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [saveId, setSaveId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<GameSettings>({
    showGrid: true,
    screenShake: true,
    smoothLighting: true,
    audioVolume: 0.5,
    playerName: 'Explorer',
    playerColor: '#3b82f6', 
    playerHair: '#422006',
    playerSkin: '#ffdbac', 
    performanceMode: false,
    renderDistance: 2,
    fov: 1.6,
    uiScale: 1.0,
  });

  const handleStart = (id?: string, localSaveId?: string) => {
    setRoomId(id || null);
    setSaveId(localSaveId || null);
    setGameState(GameState.PLAYING);
  };

  const handleExit = () => {
    setGameState(GameState.MENU);
    setRoomId(null);
    setSaveId(null);
  };

  return (
    <div className="w-screen h-screen bg-[#0b0e14]" style={{ transform: `scale(${settings.uiScale})`, transformOrigin: 'top left', width: `${100/settings.uiScale}%`, height: `${100/settings.uiScale}%` }}>
      {gameState === GameState.MENU ? (
        <MainMenu 
          onStart={handleStart} 
          inputMode={inputMode} 
          onInputModeChange={setInputMode}
          settings={settings}
          onSettingsChange={setSettings}
        />
      ) : (
        <Game 
          key={roomId || saveId || 'game'}
          roomId={roomId}
          saveId={saveId}
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          settings={settings}
          onSettingsChange={setSettings}
          onExit={handleExit} 
          onJoinGame={(id) => { setRoomId(id); setSaveId(null); }}
        />
      )}
    </div>
  );
}
