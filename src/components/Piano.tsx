// Piano.tsx - Interactive 2-Octave Piano Keyboard component

import React from 'react';
import { stripOctave } from '../utils/musicEngine';
import { playPianoNote } from '../utils/audioSynth';

interface PianoProps {
  mode: 'playground' | 'quiz' | 'display';
  
  // Highlight maps: key: note name (e.g. "C4", "F#4")
  highlightedNotes?: string[]; 
  correctNotes?: string[];
  incorrectNotes?: string[];
  selectedNotes?: string[];
  
  onKeyClick?: (noteName: string) => void;
  showNoteLabels?: boolean;
}

// 2 Octaves starting from C4
const PIANO_KEYS_SCHEMA = [
  { note: 'C4', isBlack: false, freq: 261.63 },
  { note: 'C#4', isBlack: true, freq: 277.18 },
  { note: 'D4', isBlack: false, freq: 293.66 },
  { note: 'D#4', isBlack: true, freq: 311.13 },
  { note: 'E4', isBlack: false, freq: 329.63 },
  { note: 'F4', isBlack: false, freq: 349.23 },
  { note: 'F#4', isBlack: true, freq: 369.99 },
  { note: 'G4', isBlack: false, freq: 392.00 },
  { note: 'G#4', isBlack: true, freq: 415.30 },
  { note: 'A4', isBlack: false, freq: 440.00 },
  { note: 'A#4', isBlack: true, freq: 466.16 },
  { note: 'B4', isBlack: false, freq: 493.88 },
  
  { note: 'C5', isBlack: false, freq: 523.25 },
  { note: 'C#5', isBlack: true, freq: 554.37 },
  { note: 'D5', isBlack: false, freq: 587.33 },
  { note: 'D#5', isBlack: true, freq: 622.25 },
  { note: 'E5', isBlack: false, freq: 659.25 },
  { note: 'F5', isBlack: false, freq: 698.46 },
  { note: 'F#5', isBlack: true, freq: 739.99 },
  { note: 'G5', isBlack: false, freq: 783.99 },
  { note: 'G#5', isBlack: true, freq: 830.61 },
  { note: 'A5', isBlack: false, freq: 880.00 },
  { note: 'A#5', isBlack: true, freq: 932.33 },
  { note: 'B5', isBlack: false, freq: 987.77 }
];

export const Piano: React.FC<PianoProps> = ({
  highlightedNotes = [],
  correctNotes = [],
  incorrectNotes = [],
  selectedNotes = [],
  onKeyClick,
  showNoteLabels = true
}) => {

  const handleKeyClick = (note: string, freq: number) => {
    // Play synthesizer tone
    playPianoNote(freq);
    
    if (onKeyClick) {
      // Strip octave for parent (returns "C#", "F", etc.)
      onKeyClick(stripOctave(note));
    }
  };

  const getKeyStatus = (noteName: string) => {
    const noteWithoutOctave = stripOctave(noteName);
    
    // Check exact note name or stripped name matching
    const checkMatch = (list: string[]) => {
      return list.includes(noteName) || list.includes(noteWithoutOctave);
    };

    if (checkMatch(correctNotes)) return 'correct';
    if (checkMatch(incorrectNotes)) return 'incorrect';
    if (checkMatch(selectedNotes)) return 'active';
    if (checkMatch(highlightedNotes)) return 'active';
    return '';
  };

  return (
    <div className="piano-container">
      {PIANO_KEYS_SCHEMA.map((key) => {
        const keyStatus = getKeyStatus(key.note);
        const classes = `piano-key ${key.isBlack ? 'black' : 'white'} ${keyStatus}`;
        
        // Inline spacing offset logic for overlapping black keys in flex row
        // Black keys are absolute with negative margins, fitting neatly in between white keys
        let style: React.CSSProperties = {};
        
        return (
          <div
            key={key.note}
            className={classes}
            style={style}
            onClick={() => handleKeyClick(key.note, key.freq)}
          >
            {showNoteLabels && (
              <span className="piano-note-label">
                {stripOctave(key.note)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
