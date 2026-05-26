import React, { useState } from 'react';
import { Trash2, HelpCircle, Activity, ArrowLeft } from 'lucide-react';
import { Piano } from './Piano';
import { Fretboard } from './Fretboard';
import { Metronome } from './Metronome';
import { stripOctave, detectChordFromNotes, getChordNotes, CHORD_FORMULAS } from '../utils/musicEngine';
import type { InstrumentType } from '../utils/musicEngine';
import { playUIClick, playUIBack } from '../utils/audioSynth';

interface SandboxPlaygroundProps {
  onBack: () => void;
}

export const SandboxPlayground: React.FC<SandboxPlaygroundProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'piano' | 'fretboard'>('piano');
  const [instrument, setInstrument] = useState<InstrumentType>('guitar');
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [fretSelection, setFretSelection] = useState<{ stringIndex: number; fret: number }[]>([]);
  
  const [chordRoot, setChordRoot] = useState('C');
  const [chordFormula, setChordFormula] = useState('major');

  const handleHighlightChord = (root: string, formula: string) => {
    setChordRoot(root);
    setChordFormula(formula);
    const notes = getChordNotes(root, formula);
    setSelectedNotes(notes);
    setFretSelection([]); // Clear fret selection coordinates
  };


  const handleKeyClick = (note: string) => {
    // Toggle note in sandbox selection
    setSelectedNotes(prev => {
      if (prev.includes(note)) {
        return prev.filter(n => n !== note);
      } else {
        return [...prev, note];
      }
    });
  };

  const handleFretClick = (stringIndex: number, fret: number, _note: string) => {
    // In fretboard mode, track string and fret coordinates
    const existsIdx = fretSelection.findIndex(f => f.stringIndex === stringIndex && f.fret === fret);
    
    let newFretSel = [...fretSelection];
    if (existsIdx > -1) {
      newFretSel.splice(existsIdx, 1);
    } else {
      // Typically on a guitar/uke you can play only 1 note per string!
      // Filter out any prior notes on the same string first to make it realistic
      newFretSel = newFretSel.filter(f => f.stringIndex !== stringIndex);
      newFretSel.push({ stringIndex, fret });
    }
    setFretSelection(newFretSel);

    // Calculate corresponding notes list from frets selection
    const calculatedNotes = newFretSel.map(f => {
      // Get note pitch and strip octave
      const details = getFretNote(f.stringIndex, f.fret, instrument);
      return stripOctave(details.note);
    });

    // Remove duplicates
    const unique = Array.from(new Set(calculatedNotes));
    setSelectedNotes(unique);
  };

  const handleClear = () => {
    setSelectedNotes([]);
    setFretSelection([]);
  };

  // Chord spelling detection logic
  const detectChord = (): string => {
    return detectChordFromNotes(selectedNotes);
  };

  // Import local helper to get frequency for guitar tuning offsets
  const getFretNote = (sIndex: number, fret: number, inst: InstrumentType) => {
    const scale = inst === 'guitar' ? ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] : ['G4', 'C4', 'E4', 'A4'];
    const openNote = scale[sIndex];
    const match = openNote.match(/^([A-G]#?|Bb?|Db?|Eb?|Gb?|Ab?)([0-9])$/);
    if (!match) return { note: 'C', frequency: 261 };
    
    const rootName = match[1];
    const octave = parseInt(match[2]);
    
    // Chromatic offset
    const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let oIndex = chromatic.indexOf(rootName);
    if (oIndex === -1) {
      // flat mapping
      const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
      oIndex = flats.indexOf(rootName);
    }
    
    const targetIdx = oIndex + fret;
    const finalNote = chromatic[targetIdx % 12];
    const finalOct = octave + Math.floor(targetIdx / 12);
    
    const midi = 12 * (finalOct + 1) + (targetIdx % 12);
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    
    return {
      note: `${finalNote}${finalOct}`,
      frequency: freq
    };
  };

  return (
    <div className="view-enter glass-panel" style={{ padding: '2rem', maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
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

      {/* Header */}
      <div className="flex-between">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', color: 'var(--text-light)', fontWeight: 600 }}>
            <Activity size={24} style={{ color: 'var(--primary)' }} /> Free Sandbox Playground
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Click keys or frets to test voicings, play notes, and auto-detect chord structures!
          </p>
        </div>

        <button 
          onClick={() => { playUIClick(); handleClear(); }}
          className="btn-cyber btn-cyber-magenta"
          style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', textTransform: 'none' }}
        >
          <Trash2 size={14} /> Clear
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
        <span>Check your device volume to make sure your sound is turned up so you can hear the notes!</span>
      </div>

      {/* Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          onClick={() => { playUIClick(); setActiveTab('piano'); setSelectedNotes([]); setFretSelection([]); }}
          className={`btn-cyber ${activeTab === 'piano' ? 'btn-cyber-secondary' : ''}`}
          style={{ width: '130px', fontSize: '0.8rem', textTransform: 'none' }}
        >
          Piano keys
        </button>
        <button
          onClick={() => { playUIClick(); setActiveTab('fretboard'); setSelectedNotes([]); setFretSelection([]); }}
          className={`btn-cyber ${activeTab === 'fretboard' ? 'btn-cyber-secondary' : ''}`}
          style={{ width: '130px', fontSize: '0.8rem', textTransform: 'none' }}
        >
          Fretboard
        </button>
      </div>

      {/* Chord Highlight Option (Vice Versa Selection) */}
      <div 
        style={{ 
          background: 'rgba(124, 92, 255, 0.04)', 
          border: '1px solid rgba(124, 92, 255, 0.08)', 
          padding: '1rem', 
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
          🔍 Chord Selector (Highlight notes on keyboard/frets)
        </span>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Root Note Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '100px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Root Note</span>
            <select
              value={chordRoot}
              onChange={(e) => {
                playUIClick();
                handleHighlightChord(e.target.value, chordFormula);
              }}
              style={{
                background: 'rgba(10, 14, 30, 0.9)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '0.5rem',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Quality Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 2, minWidth: '150px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chord Type</span>
            <select
              value={chordFormula}
              onChange={(e) => {
                playUIClick();
                handleHighlightChord(chordRoot, e.target.value);
              }}
              style={{
                background: 'rgba(10, 14, 30, 0.9)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '0.5rem',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {Object.entries(CHORD_FORMULAS).map(([key, f]) => (
                <option key={key} value={key}>{f.displayName}</option>
              ))}
            </select>
          </div>

          {/* Clear button shortcut */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => {
                playUIClick();
                handleHighlightChord(chordRoot, chordFormula);
              }}
              className="btn-cyber btn-cyber-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', textTransform: 'none', height: '36px' }}
            >
              Highlight Chord
            </button>
          </div>
        </div>
      </div>

      {/* Instrument Selection for Fretboard */}
      {activeTab === 'fretboard' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>INSTRUMENT:</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => { playUIClick(); setInstrument('guitar'); setSelectedNotes([]); setFretSelection([]); }}
              className={`btn-cyber ${instrument === 'guitar' ? 'btn-cyber-primary' : ''}`}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
            >
              GUITAR
            </button>
            <button
              onClick={() => { playUIClick(); setInstrument('ukulele'); setSelectedNotes([]); setFretSelection([]); }}
              className={`btn-cyber ${instrument === 'ukulele' ? 'btn-cyber-primary' : ''}`}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
            >
              UKULELE
            </button>
          </div>
        </div>
      )}

      {/* Active Interface Render */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
        {activeTab === 'piano' ? (
          <Piano
            mode="playground"
            selectedNotes={selectedNotes}
            onKeyClick={handleKeyClick}
            showNoteLabels={true}
          />
        ) : (
          <Fretboard
            instrument={instrument}
            mode="playground"
            selectedFret={fretSelection[fretSelection.length - 1]} // highlights last touched
            onFretClick={handleFretClick}
            showNoteLabels={true}
            highlightedNotes={selectedNotes}
          />
        )}
      </div>


      {/* Real-time spelling analysis panel */}
      <div 
        style={{ 
          background: 'rgba(255, 107, 53, 0.05)', 
          border: '1px solid rgba(255, 107, 53, 0.15)', 
          borderRadius: '12px', 
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div className="flex-between">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            DETECTED CHORD
          </span>
          <span className="quirky-badge orange" style={{ fontSize: '0.65rem' }}>
            AUTO ANALYSIS
          </span>
        </div>

        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--neon-orange)', textShadow: '0 0 10px var(--neon-orange-glow)' }}>
          {detectChord()}
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 107, 53, 0.1)', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SELECTED NOTES:</span>
          {selectedNotes.length === 0 ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
          ) : (
            selectedNotes.map(n => (
              <span key={n} className="quirky-badge cyan" style={{ padding: '2px 8px' }}>{n}</span>
            ))
          )}
        </div>
      </div>

      {/* Local Metronome Widget */}
      <div style={{ marginTop: '0.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
          ⏱️ Practice Metronome
        </h4>
        <Metronome />
      </div>

      {/* Small Help Tip */}
      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px' }}>
        <HelpCircle size={14} style={{ flexShrink: 0, color: 'var(--neon-cyan)' }} />
        <span>
          Tip: In Piano mode, you can toggle multiple keys to see what chords they make. In Fretboard mode, clicking any string/fret sets a finger. You can place one finger on each of the strings to build complex chord voicings.
        </span>
      </div>

    </div>

  );
};
