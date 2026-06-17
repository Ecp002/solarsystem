import React, { useState } from 'react';
import { Volume2, VolumeX, Settings, Music, HelpCircle } from 'lucide-react';
import { AudioEngine } from '../utils/AudioEngine';

interface UIOverlayProps {
  started: boolean;
  onStart: () => void;
  hoveredPlanet: string | null;
  audioMuted: boolean;
  onToggleMute: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  started,
  onStart,
  hoveredPlanet,
  audioMuted,
  onToggleMute
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(40); // 40%

  const handleStartCosmos = () => {
    AudioEngine.playButtonClick();
    onStart();
  };

  const handleToggleSettings = () => {
    AudioEngine.playButtonClick();
    setShowSettings(!showSettings);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    AudioEngine.setVolume(vol / 100);
  };

  return (
    <>
      {/* 1. Landing Screen Gateway */}
      {!started && (
        <div className="landing-screen-gate">
          <div className="landing-content">
            <h1 className="cinematic-gold-title">
              EVENT HORIZON
            </h1>
            <p className="cinematic-subtitle">
              An Interactive Cinematic Journey Through The Solar System
            </p>
            <div className="headphones-tip">
              [ Use Headphones For Full Audio Immersion ]
            </div>
            <button 
              className="enter-btn" 
              onClick={handleStartCosmos}
              onMouseEnter={() => AudioEngine.playButtonHover()}
            >
              Enter The Cosmos
            </button>
          </div>
        </div>
      )}

      {/* 2. Top-Right Audio & Settings Controls */}
      {started && (
        <div className="controls-hud">
          {/* Mute/Unmute Quick Trigger */}
          <button 
            className="control-icon-btn" 
            onClick={() => {
              AudioEngine.playButtonClick();
              onToggleMute();
            }}
            onMouseEnter={() => AudioEngine.playButtonHover()}
            title={audioMuted ? "Unmute Music" : "Mute Music"}
          >
            {audioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Settings Trigger */}
          <button 
            className="control-icon-btn" 
            onClick={handleToggleSettings}
            onMouseEnter={() => AudioEngine.playButtonHover()}
            title="Audio Settings"
          >
            <Settings size={18} />
          </button>

          {/* Audio Settings Menu Card */}
          {showSettings && (
            <div className="settings-menu-card animate-fade">
              <h3>Audio Matrix</h3>
              
              <div className="settings-row">
                <Music size={14} />
                <span>Interstellar Theme</span>
              </div>
              
              <div className="settings-slider-container">
                <label>Volume: {volume}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider-input"
                />
              </div>

              <div className="settings-checkbox-container" onClick={onToggleMute}>
                <input 
                  type="checkbox" 
                  checked={audioMuted} 
                  readOnly
                />
                <span>Mute All Audio</span>
              </div>

              <div className="sfx-indicator">
                <HelpCircle size={10} /> Synthesized SFX Active
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Glowing Hovered Planet Tooltip (Bottom Center) */}
      {started && hoveredPlanet && (
        <div className="hovered-planet-tooltip animate-fade">
          <span className="tooltip-indicator">TARGET FOCUS:</span>
          <span className="tooltip-name">{hoveredPlanet}</span>
        </div>
      )}
    </>
  );
};

export default UIOverlay;
