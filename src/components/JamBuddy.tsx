import React, { useState, useEffect } from 'react';
import { Play, Square, Music, Volume2, Star, ArrowLeft } from 'lucide-react';
import { jamBuddy, setJamChannelsVolume, initAudio, playUIClick, playUIBack } from '../utils/audioSynth';
import { getDiatonicChords, getScaleNotes, SONGS_DB } from '../utils/musicEngine';
import { Metronome } from './Metronome';

interface JamBuddyProps {
  globalBpm: number;
  onBpmChange: (bpm: number) => void;
  onBack: () => void;
  presetSongName?: string | null;
  clearPresetSongName?: () => void;
}


const PRESET_PROGRESSIONS = [
  {
    name: 'Lo-Fi Chill (i-VI-III-VII)',
    key: 'A',
    scale: 'minor',
    style: 'lofi' as const,
    chords: ['A Minor', 'F Major', 'C Major', 'G Major']
  },
  {
    name: 'Cyberpunk Driver (i-iv-VII-v)',
    key: 'E',
    scale: 'minor',
    style: 'synthwave' as const,
    chords: ['E Minor', 'A Minor', 'D Major', 'B Minor']
  },
  {
    name: 'Stadium Rock (I-V-vi-IV)',
    key: 'G',
    scale: 'major',
    style: 'rock' as const,
    chords: ['G Major', 'D Major', 'E Minor', 'C Major']
  },
  {
    name: 'Jazz ii-V-I Swing',
    key: 'C',
    scale: 'major',
    style: 'lofi' as const,
    chords: ['D Minor', 'G Major', 'C Major', 'C Major']
  }
];

export const JamBuddy: React.FC<JamBuddyProps> = ({
  globalBpm,
  onBpmChange,
  onBack,
  presetSongName = null,
  clearPresetSongName
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [style, setStyle] = useState<'lofi' | 'synthwave' | 'rock'>('lofi');
  const [keyRoot, setKeyRoot] = useState('A');
  const [keyType, setKeyType] = useState<'major' | 'minor'>('minor');
  
  // Custom chords currently in loop
  const [chords, setChords] = useState<string[]>(['A Minor', 'F Major', 'C Major', 'G Major']);
  
  // Mixer Volumes
  const [volDrums, setVolDrums] = useState(60);
  const [volBass, setVolBass] = useState(50);
  const [volChords, setVolChords] = useState(40);

  // Backing track preset song load effect
  useEffect(() => {
    if (presetSongName && clearPresetSongName) {
      const songDbMatch = SONGS_DB.find(s => s.title.toLowerCase() === presetSongName.toLowerCase());
      if (songDbMatch) {
        const firstChord = songDbMatch.chords[0];
        const parts = firstChord.split(' ');
        const root = parts[0];
        const scale = firstChord.toLowerCase().includes('minor') ? 'minor' : 'major';
        
        setKeyRoot(root);
        setKeyType(scale as any);
        setChords(songDbMatch.chords);
        
        if (songDbMatch.genre.toLowerCase().includes('rock')) {
          setStyle('rock');
        } else if (songDbMatch.genre.toLowerCase().includes('dance')) {
          setStyle('synthwave');
        } else {
          setStyle('lofi');
        }
      }
      clearPresetSongName();
    }
  }, [presetSongName, clearPresetSongName]);

  
  // Channels Enabled state
  const [channels, setChannels] = useState({
    drums: true,
    bass: true,
    guitar: true,
    keys: true,
    synth: true
  });

  // Visualizer beat tracking
  const [activeBeat, setActiveBeat] = useState(0); // 1, 2, 3, 4
  const [activeChord, setActiveChord] = useState('');

  // Sync initial toggles to jam buddy singleton
  useEffect(() => {
    Object.entries(channels).forEach(([chan, val]) => {
      jamBuddy.toggleChannel(chan as any, val);
    });
  }, []);

  // Handle updates to volume
  useEffect(() => {
    setJamChannelsVolume(volDrums / 100, volBass / 100, volChords / 100);
  }, [volDrums, volBass, volChords]);

  useEffect(() => {
    if (isPlaying) {
      jamBuddy.updateParams(globalBpm, style, chords);
    }
  }, [globalBpm, style, chords, isPlaying]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      jamBuddy.stop();
    };
  }, []);

  const handleTogglePlay = () => {
    initAudio();
    if (isPlaying) {
      playUIBack();
      jamBuddy.stop();
      setIsPlaying(false);
      setActiveBeat(0);
      setActiveChord('');
    } else {
      playUIClick();
      const scaleNotes = getScaleNotes(keyRoot, keyType);
      setIsPlaying(true);
      
      // Start loop
      jamBuddy.start(
        globalBpm,
        chords,
        style,
        scaleNotes,
        (beat, chord) => {
          setActiveBeat(beat);
          setActiveChord(chord);
        }
      );
    }
  };

  const handleToggleChannel = (chan: 'drums' | 'bass' | 'guitar' | 'keys' | 'synth') => {
    playUIClick();
    const updated = { ...channels, [chan]: !channels[chan] };
    setChannels(updated);
    jamBuddy.toggleChannel(chan, updated[chan]);
  };

  // Re-generate diatonic chords based on Key
  const handleKeyChange = (root: string, type: 'major' | 'minor') => {
    setKeyRoot(root);
    setKeyType(type);
    
    // Auto populate chord progression with standard diatonic progression (I - V - vi - IV for Major, i - VI - III - VII for Minor)
    const diatonic = getDiatonicChords(root, type);
    let path: string[] = [];
    if (type === 'major') {
      // G Major diatonic chords: G, D, Em, C (I, V, vi, IV)
      const cI = diatonic[0]?.chordName || `${root} Major`;
      const cV = diatonic[4]?.chordName || `${root} Major`;
      const cvi = diatonic[5]?.chordName || `${root} Minor`;
      const cIV = diatonic[3]?.chordName || `${root} Major`;
      path = [cI, cV, cvi, cIV];
    } else {
      // A Minor diatonic chords: Am, F, C, G (i, VI, III, VII)
      const ci = diatonic[0]?.chordName || `${root} Minor`;
      const cVI = diatonic[5]?.chordName || `${root} Major`;
      const cIII = diatonic[2]?.chordName || `${root} Major`;
      const cVII = diatonic[6]?.chordName || `${root} Major`;
      path = [ci, cVI, cIII, cVII];
    }
    
    setChords(path);
    if (isPlaying) {
      // Force update
      setTimeout(() => {
        jamBuddy.updateParams(globalBpm, style, path);
      }, 0);
    }
  };

  const loadPreset = (preset: typeof PRESET_PROGRESSIONS[0]) => {
    setKeyRoot(preset.key);
    setKeyType(preset.scale as any);
    setStyle(preset.style);
    setChords(preset.chords);
    
    if (isPlaying) {
      // Force stop and restart to sync
      jamBuddy.stop();
      setIsPlaying(false);
      setTimeout(() => {
        setIsPlaying(true);
        const scaleNotes = getScaleNotes(preset.key, preset.scale);
        jamBuddy.start(
          globalBpm,
          preset.chords,
          preset.style,
          scaleNotes,
          (beat, chord) => {
            setActiveBeat(beat);
            setActiveChord(chord);
          }
        );
      }, 100);
    }
  };

  // Get helpful scale jam tips
  const getJamTips = () => {
    if (keyType === 'minor') {
      return `Practice the ${keyRoot} Minor Pentatonic scale or the ${keyRoot} Natural Minor scale! Notes: ${getScaleNotes(keyRoot, 'pentatonic_minor').join(' - ')}`;
    } else {
      return `Practice the ${keyRoot} Major Pentatonic scale or the ${keyRoot} Major scale! Notes: ${getScaleNotes(keyRoot, 'pentatonic_major').join(' - ')}`;
    }
  };

  return (
    <div className="view-enter glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Back Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button 
          onClick={() => { playUIBack(); onBack(); }}
          className="btn-cyber"
          style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem', textTransform: 'none' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Title */}
      <div className="flex-between">
        <div>
          <h2 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontWeight: 600 }}>
            <Music size={24} style={{ color: 'var(--primary)' }} /> AI Jam Buddy
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Procedural synthesized backing tracks. Strum your real guitar or piano along!
          </p>
        </div>
        
        <button
          onClick={handleTogglePlay}
          className={`btn-cyber ${isPlaying ? 'btn-cyber-magenta' : 'btn-cyber-primary'}`}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '12px', textTransform: 'none' }}
        >
          {isPlaying ? (
            <>
              <Square size={18} fill="currentColor" /> Stop jam
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" /> Start jam
            </>
          )}
        </button>
      </div>

      {/* Device volume warning banner */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          background: 'rgba(84, 198, 235, 0.05)', 
          border: '1px solid rgba(84, 198, 235, 0.12)', 
          padding: '0.5rem 0.8rem', 
          borderRadius: '8px', 
          fontSize: '0.75rem', 
          color: 'var(--secondary)',
          lineHeight: 1.4
        }}
      >
        <span style={{ fontSize: '0.95rem' }}>🔊</span>
        <span>Check your device volume to make sure your sound is turned up so you can hear the backing track!</span>
      </div>

      {/* Preset Selectors */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
          Load backing track presets
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PRESET_PROGRESSIONS.map((preset, idx) => (
            <button
              key={idx}
              className="btn-cyber"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', textTransform: 'none' }}
              onClick={() => { playUIClick(); loadPreset(preset); }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-cols-2">
        {/* Left column - Engine controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            SESSION SETUP
          </h3>

          {/* Key and Scale */}
          <div className="flex-between">
            <span style={{ fontSize: '0.85rem' }}>KEY SCALE</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <select
                value={keyRoot}
                onChange={(e) => { playUIClick(); handleKeyChange(e.target.value, keyType); }}
                style={{
                  background: 'rgba(10, 14, 30, 0.9)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '0.4rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <select
                value={keyType}
                onChange={(e) => { playUIClick(); handleKeyChange(keyRoot, e.target.value as any); }}
                style={{
                  background: 'rgba(10, 14, 30, 0.9)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '0.4rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <option value="major">Major (Ionian)</option>
                <option value="minor">Minor (Aeolian)</option>
              </select>
            </div>
          </div>

          {/* Groove Feel Style */}
          <div className="flex-between">
            <span style={{ fontSize: '0.85rem' }}>GROOVE STYLE</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['lofi', 'synthwave', 'rock'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { playUIClick(); setStyle(s); }}
                  className={`btn-cyber ${style === s ? 'btn-cyber-secondary' : ''}`}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo Sync */}
          <div className="flex-between">
            <span style={{ fontSize: '0.85rem' }}>TEMPO</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="range"
                min="60"
                max="180"
                value={globalBpm}
                onChange={(e) => onBpmChange(parseInt(e.target.value))}
                className="cyber-slider"
                style={{ width: '100px' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                {globalBpm} BPM
              </span>
            </div>
          </div>

          {/* Scale Solos Cheat-sheet */}
          <div style={{ background: 'rgba(248,87,166,0.04)', border: '1px solid rgba(248,87,166,0.15)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: 'var(--neon-magenta)', fontWeight: 'bold', marginBottom: '4px' }}>
              <Star size={12} fill="currentColor" /> Solo Jam Tips
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>{getJamTips()}</span>
          </div>
        </div>

        {/* Right column - Mixer and active state */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            CHANNEL MIXER
          </h3>

          {/* Instrument toggles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ gridColumn: 'span 2', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ACTIVE INSTRUMENTS:
            </span>
            {(['drums', 'bass', 'guitar', 'keys', 'synth'] as const).map(chan => (
              <label 
                key={chan} 
                className="flex-center" 
                style={{ 
                  justifyContent: 'flex-start', 
                  gap: '0.5rem', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  background: channels[chan] ? 'rgba(0, 242, 254, 0.05)' : 'transparent',
                  border: channels[chan] ? '1px solid rgba(0, 242, 254, 0.15)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={channels[chan]} 
                  onChange={() => handleToggleChannel(chan)}
                  style={{ accentColor: 'var(--neon-cyan)', cursor: 'pointer' }}
                />
                <span style={{ textTransform: 'capitalize' }}>
                  {chan === 'guitar' ? 'Rhythm Guitar' : chan === 'keys' ? 'Piano Keys' : chan}
                </span>
              </label>
            ))}
          </div>

          {/* Drums volume slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className="flex-between" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>DRUMS VOLUME</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{volDrums}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="range"
                min="0"
                max="100"
                value={volDrums}
                onChange={(e) => setVolDrums(parseInt(e.target.value))}
                className="cyber-slider"
              />
            </div>
          </div>

          {/* Bass volume slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className="flex-between" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>BASS VOLUME</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{volBass}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="range"
                min="0"
                max="100"
                value={volBass}
                onChange={(e) => setVolBass(parseInt(e.target.value))}
                className="cyber-slider"
              />
            </div>
          </div>

          {/* Chords volume slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className="flex-between" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>CHORDS / INSTRUMENTS VOLUME</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{volChords}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="range"
                min="0"
                max="100"
                value={volChords}
                onChange={(e) => setVolChords(parseInt(e.target.value))}
                className="cyber-slider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* active cycle visualizer */}
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        
        {/* Chord loop highlights */}
        <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
          {chords.map((c, idx) => {
            const isCurrent = isPlaying && c === activeChord;
            return (
              <div
                key={idx}
                className="glass-card"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '1rem',
                  borderWidth: isCurrent ? '2px' : '1px',
                  borderColor: isCurrent ? 'var(--neon-magenta)' : 'rgba(255,255,255,0.05)',
                  boxShadow: isCurrent ? '0 0 15px var(--neon-magenta-glow)' : 'none',
                  transform: isCurrent ? 'scale(1.05)' : 'none',
                  cursor: 'default'
                }}
              >
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  CHORD {idx + 1}
                </div>
                <div style={{ fontWeight: 'bold', color: isCurrent ? 'var(--neon-magenta)' : 'var(--text-primary)', fontSize: '1.1rem' }}>
                  {c}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pulse indicators (1 2 3 4 beats) */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
          {[1, 2, 3, 4].map(b => {
            const isCurrent = activeBeat === b;
            return (
              <div
                key={b}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <div
                  className={`beat-dot ${isCurrent ? (b === 1 ? 'active-accent' : 'active') : ''}`}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: isCurrent ? 'var(--neon-cyan)' : 'var(--text-muted)' }}>
                  BEAT {b}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Local Metronome Widget */}
      <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>
          ⏱️ SESSION METRONOME
        </h4>
        <Metronome externalBpm={globalBpm} onBpmChange={onBpmChange} />
      </div>

    </div>
  );
};

