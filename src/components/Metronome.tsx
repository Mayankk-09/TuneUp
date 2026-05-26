// Metronome.tsx - Audio/Visual Metronome Drawer component

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, ChevronUp, ChevronDown, Flame } from 'lucide-react';
import { playMetronomeTick, initAudio } from '../utils/audioSynth';

interface MetronomeProps {
  externalBpm?: number;
  onBpmChange?: (bpm: number) => void;
}

export const Metronome: React.FC<MetronomeProps> = ({ externalBpm, onBpmChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(externalBpm || 120);
  const [timeSignature, setTimeSignature] = useState<'4/4' | '3/4' | '6/8'>('4/4');
  const [currentBeat, setCurrentBeat] = useState(0);

  const timerRef = useRef<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);
  const beatRef = useRef(0);

  // Sync BPM with external props if provided
  useEffect(() => {
    if (externalBpm !== undefined && externalBpm !== bpm) {
      setBpm(externalBpm);
    }
  }, [externalBpm]);

  // Adjust interval timer when BPM, signature, or playing state changes
  useEffect(() => {
    if (isPlaying) {
      startTickLoop();
    } else {
      stopTickLoop();
    }
    return () => stopTickLoop();
  }, [isPlaying, bpm, timeSignature]);

  function startTickLoop() {
    stopTickLoop();
    initAudio(); // Initialize audio context on click
    
    beatRef.current = 0;
    setCurrentBeat(0);
    
    // Beats per minute conversion to millisecond intervals
    let intervalMs = (60 / bpm) * 1000;
    if (timeSignature === '6/8') {
      // In 6/8, each click is typically an eighth note (BPM measures dotted-quarters or eighths, let's treat BPM as eighth notes for practice ticks, or divide by 2)
      intervalMs = (60 / bpm) * 500; 
    }

    const tick = () => {
      const beatsCount = timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 6;
      const isAccent = beatRef.current === 0;
      
      playMetronomeTick(isAccent);
      setCurrentBeat(beatRef.current);
      
      beatRef.current = (beatRef.current + 1) % beatsCount;
    };

    // Run first tick immediately
    tick();
    timerRef.current = window.setInterval(tick, intervalMs);
  }

  function stopTickLoop() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCurrentBeat(-1);
  }

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open/close drawer when clicking play
    initAudio();
    setIsPlaying(!isPlaying);
  };

  const handleBpmSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value);
    setBpm(newBpm);
    if (onBpmChange) onBpmChange(newBpm);
  };

  const adjustBpm = (amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newBpm = Math.max(40, Math.min(240, bpm + amount));
    setBpm(newBpm);
    if (onBpmChange) onBpmChange(newBpm);
  };

  // Tap tempo calculator
  const handleTapTempo = (e: React.MouseEvent) => {
    e.stopPropagation();
    initAudio();
    const now = Date.now();
    const tapTimes = tapTimesRef.current;
    
    // Add current tap timestamp
    tapTimes.push(now);
    
    // Keep only last 4 taps
    if (tapTimes.length > 5) {
      tapTimes.shift();
    }
    
    if (tapTimes.length >= 2) {
      // Calculate average difference in ms
      let totalDiff = 0;
      for (let i = 1; i < tapTimes.length; i++) {
        totalDiff += (tapTimes[i] - tapTimes[i - 1]);
      }
      const avgDiff = totalDiff / (tapTimes.length - 1);
      const calculatedBpm = Math.round(60000 / avgDiff);
      
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
        if (onBpmChange) onBpmChange(calculatedBpm);
      }
    }
  };

  const renderBeatDots = () => {
    const beatsCount = timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 6;
    const dots = [];
    for (let i = 0; i < beatsCount; i++) {
      const isActive = i === currentBeat;
      const isAccent = i === 0;
      dots.push(
        <div
          key={i}
          className={`beat-dot ${isActive ? (isAccent ? 'active-accent' : 'active') : ''}`}
        />
      );
    }
    return dots;
  };

  return (
    <div className={`metronome-drawer glass-panel ${isOpen ? 'expanded' : 'collapsed'}`}>
      <div className="metronome-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        <span>Metronome: {bpm} BPM</span>
        {isPlaying && <div className="beat-dot active" style={{ width: 8, height: 8, marginLeft: 6 }} />}
      </div>

      <div className="metronome-grid">
        {/* Play Control */}
        <button 
          onClick={togglePlay} 
          className={`btn-cyber ${isPlaying ? 'btn-cyber-magenta' : 'btn-cyber-secondary'}`}
          style={{ minWidth: '80px', padding: '0.5rem 1rem' }}
        >
          {isPlaying ? <Square size={16} /> : <Play size={16} />}
        </button>

        {/* BPM Selector */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div className="flex-between">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TEMPO</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button 
                className="btn-cyber" 
                style={{ padding: '2px 8px', fontSize: '0.75rem' }} 
                onClick={(e) => adjustBpm(-1, e)}
              >
                -
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--neon-cyan)', fontSize: '1rem' }}>
                {bpm} BPM
              </span>
              <button 
                className="btn-cyber" 
                style={{ padding: '2px 8px', fontSize: '0.75rem' }} 
                onClick={(e) => adjustBpm(1, e)}
              >
                +
              </button>
            </div>
          </div>
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={handleBpmSliderChange}
            onClick={(e) => e.stopPropagation()}
            className="cyber-slider"
          />
        </div>

        {/* Tap Tempo */}
        <button
          onClick={handleTapTempo}
          className="btn-cyber"
          style={{ display: 'flex', flexDirection: 'column', padding: '0.4rem 0.8rem', fontSize: '0.7rem', gap: '2px', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Flame size={12} className="neon-text-orange" />
          <span>TAP</span>
        </button>

        {/* Time Signature */}
        <select
          value={timeSignature}
          onChange={(e) => setTimeSignature(e.target.value as any)}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(10, 14, 30, 0.9)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            padding: '0.4rem 0.6rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="4/4">4/4</option>
          <option value="3/4">3/4</option>
          <option value="6/8">6/8</option>
        </select>

        {/* Pulsing visual beats */}
        <div className="metronome-beats" style={{ minWidth: '80px', justifyContent: 'center' }}>
          {renderBeatDots()}
        </div>
      </div>
    </div>
  );
};
