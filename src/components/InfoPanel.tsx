import React, { useState } from 'react';
import { PlanetData } from '../data/planets';
import { X, Sparkles, Compass, Moon, Orbit } from 'lucide-react';
import { AudioEngine } from '../utils/AudioEngine';

interface InfoPanelProps {
  planet: PlanetData | null;
  onClose: () => void;
}

type TabType = 'overview' | 'facts' | 'moons' | 'missions';

const InfoPanel: React.FC<InfoPanelProps> = ({ planet, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!planet) return null;

  const handleTabClick = (tab: TabType) => {
    AudioEngine.playButtonClick();
    setActiveTab(tab);
  };

  const handleCloseClick = () => {
    AudioEngine.playButtonClick();
    onClose();
  };

  return (
    <div className="info-panel-container">
      {/* 1. Header with Close Button */}
      <div className="info-panel-header">
        <h2>{planet.name}</h2>
        <button 
          className="panel-close-btn" 
          onClick={handleCloseClick}
          onMouseEnter={() => AudioEngine.playButtonHover()}
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Physical Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <label>Diameter</label>
          <span>{planet.stats.diameter}</span>
        </div>
        <div className="stat-card">
          <label>Distance from Sun</label>
          <span>{planet.stats.distance}</span>
        </div>
        <div className="stat-card">
          <label>Gravity</label>
          <span>{planet.stats.gravity}</span>
        </div>
        <div className="stat-card">
          <label>Avg Temperature</label>
          <span>{planet.stats.temp}</span>
        </div>
        <div className="stat-card">
          <label>Day Length</label>
          <span>{planet.stats.dayLength}</span>
        </div>
        <div className="stat-card">
          <label>Year Length</label>
          <span>{planet.stats.yearLength}</span>
        </div>
        <div className="stat-card full-width">
          <label>Mass</label>
          <span>{planet.stats.mass}</span>
        </div>
      </div>

      {/* 3. Interactive Tab Buttons */}
      <div className="tab-headers">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabClick('overview')}
          onMouseEnter={() => AudioEngine.playButtonHover()}
        >
          <Compass size={14} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'facts' ? 'active' : ''}`}
          onClick={() => handleTabClick('facts')}
          onMouseEnter={() => AudioEngine.playButtonHover()}
        >
          <Sparkles size={14} />
          Facts
        </button>
        <button
          className={`tab-btn ${activeTab === 'moons' ? 'active' : ''}`}
          onClick={() => handleTabClick('moons')}
          onMouseEnter={() => AudioEngine.playButtonHover()}
        >
          <Moon size={14} />
          Moons ({planet.moons.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'missions' ? 'active' : ''}`}
          onClick={() => handleTabClick('missions')}
          onMouseEnter={() => AudioEngine.playButtonHover()}
        >
          <Orbit size={14} />
          Missions
        </button>
      </div>

      {/* 4. Tab Content Window */}
      <div className="tab-content-box">
        {activeTab === 'overview' && (
          <div className="tab-pane animate-fade">
            <p className="pane-paragraph">{planet.overview}</p>
          </div>
        )}

        {activeTab === 'facts' && (
          <div className="tab-pane animate-fade">
            <ul className="pane-list">
              {planet.funFacts.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'moons' && (
          <div className="tab-pane animate-fade">
            {planet.moons.length > 0 ? (
              <div className="moons-flex">
                {planet.moons.map((moon, idx) => (
                  <span className="moon-badge" key={idx}>
                    {moon}
                  </span>
                ))}
              </div>
            ) : (
              <p className="pane-paragraph-dim">No natural satellites revolve around {planet.name}.</p>
            )}
          </div>
        )}

        {activeTab === 'missions' && (
          <div className="tab-pane animate-fade">
            {planet.missions.length > 0 ? (
              <ul className="pane-list list-ordered">
                {planet.missions.map((mission, idx) => (
                  <li key={idx}>{mission}</li>
                ))}
              </ul>
            ) : (
              <p className="pane-paragraph-dim">No human spacecraft have visited {planet.name} yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;
