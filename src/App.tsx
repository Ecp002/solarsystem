import React, { useState, useEffect } from 'react';
import './App.css';
import SpaceCanvas from './components/SpaceCanvas';
import UIOverlay from './components/UIOverlay';
import InfoPanel from './components/InfoPanel';
import { PlanetData } from './data/planets';
import { AudioEngine } from './utils/AudioEngine';

function App() {
  const [started, setStarted] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);

  const handleStart = () => {
    setStarted(true);
    AudioEngine.init();
    setAudioMuted(AudioEngine.getMutedState());
  };

  const handleSelectPlanet = (planet: PlanetData | null) => {
    setSelectedPlanet(planet);
  };

  const handleToggleMute = () => {
    const isMuted = AudioEngine.toggleMute();
    setAudioMuted(isMuted);
  };

  useEffect(() => {
    return () => {
      AudioEngine.pauseBackground();
    };
  }, []);

  return (
    <div className="app-container">
      {/* 3D WebGL Space Exploration Environment */}
      <SpaceCanvas
        started={started}
        selectedPlanet={selectedPlanet}
        onSelectPlanet={handleSelectPlanet}
        setHoveredPlanet={setHoveredPlanet}
      />

      {/* Futuristic settings, volumes, and hover tooltips overlay */}
      <UIOverlay
        started={started}
        onStart={handleStart}
        hoveredPlanet={hoveredPlanet}
        audioMuted={audioMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Glassmorphic detailed tab info panel */}
      <InfoPanel
        planet={selectedPlanet}
        onClose={() => handleSelectPlanet(null)}
      />
    </div>
  );
}

export default App;
