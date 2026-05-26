import React from 'react';
import { stripOctave, getFretNote } from '../utils/musicEngine';
import type { InstrumentType, ChordFingering } from '../utils/musicEngine';
import { playGuitarNote } from '../utils/audioSynth';

interface FretboardProps {
  instrument: InstrumentType;
  customTuning?: string[];
  mode: 'playground' | 'diagram' | 'quiz';
  
  // For 'diagram' mode: chord fingering to display
  chordFingering?: ChordFingering;
  
  // For 'quiz' mode: target coordinates to highlight or click handlers
  quizTarget?: { stringIndex: number; fret: number }; // E.g., highlight this location
  selectedFret?: { stringIndex: number; fret: number }; // Currently selected coordinates
  correctFret?: { stringIndex: number; fret: number }; // Correct answer to highlight
  incorrectFret?: { stringIndex: number; fret: number }; // User's wrong click to highlight
  highlightedNotes?: string[];
  
  // Callbacks
  onFretClick?: (stringIndex: number, fret: number, noteName: string) => void;
  showNoteLabels?: boolean;
}

export const Fretboard: React.FC<FretboardProps> = ({
  instrument,
  customTuning,
  mode,
  chordFingering,
  quizTarget,
  selectedFret,
  correctFret,
  incorrectFret,
  onFretClick,
  showNoteLabels = true,
  highlightedNotes = []
}) => {
  const isGuitar = instrument === 'guitar';
  const numStrings = isGuitar ? 6 : 4;
  const numFrets = 13; // Nut (0) + 12 frets is perfect for quiz/play
  
  // Coordinates mapping: strings from low to high.
  // Standard guitar tuning strings: 0: E2, 1: A2, 2: D3, 3: G3, 4: B3, 5: E4
  // In tabs, String 1 is high E4, String 6 is low E2.
  // On our fretboard drawing:
  // Low string is drawn at the bottom, High string at the top.
  // So stringIndex 0 (low E) will be at the bottom, index (numStrings - 1) at the top.
  
  const stringLabels = customTuning || (isGuitar ? ['E', 'A', 'D', 'G', 'B', 'E'] : ['G', 'C', 'E', 'A']);

  // Dimensions
  const boardWidth = 850;
  const boardHeight = isGuitar ? 180 : 120;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 15;
  const paddingBottom = 15;
  
  const fretAreaWidth = boardWidth - paddingLeft - paddingRight;
  const stringAreaHeight = boardHeight - paddingTop - paddingBottom;
  
  // Calculate X coordinate for each fret line.
  // Using standard logarithmic spacing (fret spacing shrinks as pitch increases)
  const getFretX = (fretNum: number): number => {
    if (fretNum === 0) return paddingLeft;
    // Logarithmic scale formula: L_n = L * (1 - (1/2)^(n/12))
    const scaleFactor = 1 - Math.pow(0.5, fretNum / 12);
    // Adjust scale factor to fit maximum frets inside fretAreaWidth
    const maxScaleFactor = 1 - Math.pow(0.5, numFrets / 12);
    return paddingLeft + (scaleFactor / maxScaleFactor) * fretAreaWidth;
  };

  // Calculate Y coordinate for a string index
  const getStringY = (stringIdx: number): number => {
    // StringIndex 0 is low pitch (bottom), last index is high pitch (top).
    // So reverse index mapping to draw high strings on top
    const relativeIndex = numStrings - 1 - stringIdx;
    return paddingTop + (relativeIndex / (numStrings - 1)) * stringAreaHeight;
  };

  // Fret markers positions (dots on 3rd, 5th, 7th, 9th, and double-dot on 12th fret)
  const markerFrets = [3, 5, 7, 9];

  const handleFretClick = (stringIdx: number, fretNum: number) => {
    const fretDetails = getFretNote(stringIdx, fretNum, instrument, customTuning);
    
    // Play sound feedback
    playGuitarNote(fretDetails.frequency);

    if (onFretClick) {
      // Return stripped note e.g. "C#" instead of "C#4"
      onFretClick(stringIdx, fretNum, stripOctave(fretDetails.note));
    }
  };

  return (
    <div className="fretboard-wrapper">
      <svg 
        viewBox={`0 0 ${boardWidth} ${boardHeight}`} 
        className="fretboard-svg"
        style={{
          background: 'rgba(5, 7, 15, 0.4)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Fretboard Wood Background */}
        <rect 
          x={paddingLeft} 
          y={paddingTop} 
          width={fretAreaWidth} 
          height={stringAreaHeight} 
          fill="#2a2c38" 
          opacity="0.95"
        />

        {/* Fret Markers (Dots) */}
        {markerFrets.map(f => {
          const x1 = getFretX(f - 1);
          const x2 = getFretX(f);
          const centerX = x1 + (x2 - x1) / 2;
          const centerY = paddingTop + stringAreaHeight / 2;
          return (
            <circle
              key={f}
              cx={centerX}
              cy={centerY}
              r={isGuitar ? 6 : 4}
              className="fret-marker"
            />
          );
        })}

        {/* 12th Fret Double Dot */}
        {(() => {
          const x1 = getFretX(11);
          const x2 = getFretX(12);
          const centerX = x1 + (x2 - x1) / 2;
          const offset = isGuitar ? 20 : 14;
          return (
            <g key="double-dot">
              <circle
                cx={centerX}
                cy={(paddingTop + stringAreaHeight / 2) - offset}
                r={isGuitar ? 6 : 4}
                className="fret-marker"
              />
              <circle
                cx={centerX}
                cy={(paddingTop + stringAreaHeight / 2) + offset}
                r={isGuitar ? 6 : 4}
                className="fret-marker"
              />
            </g>
          );
        })()}

        {/* Fret Lines */}
        {Array.from({ length: numFrets + 1 }).map((_, f) => {
          const x = getFretX(f);
          const isNut = f === 0;
          return (
            <line
              key={f}
              x1={x}
              y1={paddingTop}
              x2={x}
              y2={paddingTop + stringAreaHeight}
              className={isNut ? 'fret-nut' : 'fret-line'}
            />
          );
        })}

        {/* String Lines */}
        {Array.from({ length: numStrings }).map((_, s) => {
          const y = getStringY(s);
          // High strings are thinner, low strings are thicker
          const strokeWidth = isGuitar ? (1 + (s * 0.4)) : (1 + ((3 - s) % 4) * 0.3);
          return (
            <line
              key={s}
              x1={paddingLeft}
              y1={y}
              x2={boardWidth - paddingRight}
              y2={y}
              className="string-line"
              style={{ strokeWidth }}
            />
          );
        })}

        {/* Left String Tuning Labels */}
        {stringLabels.map((label, s) => {
          const y = getStringY(s);
          return (
            <text
              key={s}
              x={20}
              y={y + 4}
              fill="var(--text-secondary)"
              fontFamily="var(--font-mono)"
              fontSize="12px"
              fontWeight="bold"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* CLICKABLE / DRAWABLE NOTE DOTS (Iterating all frets and strings) */}
        {mode !== 'diagram' && Array.from({ length: numStrings }).map((_, s) => {
          return Array.from({ length: numFrets }).map((_, f) => {
            const fretDetails = getFretNote(s, f, instrument, customTuning);
            const x1 = getFretX(f - 1);
            const x2 = getFretX(f);
            
            // Placed in center of fret block, or on the line for open string (f=0)
            const cx = f === 0 ? (paddingLeft - 15) : (x1 + (x2 - x1) / 2);
            const cy = getStringY(s);
            const r = f === 0 ? 10 : 12;
            
            // Check status overlays
            const isQuizTarget = mode === 'quiz' && quizTarget?.stringIndex === s && quizTarget?.fret === f;
            const isSelected = selectedFret?.stringIndex === s && selectedFret?.fret === f;
            const isCorrect = correctFret?.stringIndex === s && correctFret?.fret === f;
            const isIncorrect = incorrectFret?.stringIndex === s && incorrectFret?.fret === f;
            const noteText = stripOctave(fretDetails.note);
            const isHighlighted = highlightedNotes && (highlightedNotes.includes(noteText) || highlightedNotes.includes(fretDetails.note));

            // Highlight conditions
            let dotClass = 'note-dot';
            if (isCorrect) dotClass += ' correct';
            else if (isIncorrect) dotClass += ' incorrect';
            else if (isSelected) dotClass += ' selected';
            else if (isHighlighted) dotClass += ' highlighted';

            return (
              <g 
                key={`${s}-${f}`} 
                className={dotClass}
                onClick={() => handleFretClick(s, f)}
              >
                {/* Click target helper */}
                <rect
                  x={f === 0 ? (paddingLeft - 30) : x1}
                  y={cy - 15}
                  width={f === 0 ? 30 : (x2 - x1)}
                  height={30}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                />
                
                {/* Visible node circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={f === 0 ? 'rgba(30, 35, 60, 0.9)' : 'rgba(15, 20, 42, 0.85)'}
                  stroke={isQuizTarget ? 'var(--neon-magenta)' : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isQuizTarget ? 2.5 : 1}
                  style={{
                    animation: isQuizTarget ? 'pulse 1s infinite alternate' : 'none',
                    filter: isQuizTarget ? 'drop-shadow(0 0 5px var(--neon-magenta))' : 'none'
                  }}
                />

                {/* Blinking quiz target or active labels */}
                {isQuizTarget ? (
                  <text
                    x={cx}
                    y={cy + 4}
                    fill="var(--neon-magenta)"
                    fontSize="11px"
                    fontFamily="var(--font-heading)"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ?
                  </text>
                ) : (showNoteLabels || isSelected || isCorrect || isIncorrect || isHighlighted) ? (
                  <text
                    x={cx}
                    y={cy + 4}
                    fill={f === 0 ? 'var(--neon-cyan)' : 'var(--text-primary)'}
                    fontSize="10px"
                    fontFamily="var(--font-mono)"
                    fontWeight="bold"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {noteText}
                  </text>
                ) : null}

              </g>
            );
          });
        })}

        {/* CHORD DIAGRAM OVERLAY MODE */}
        {mode === 'diagram' && chordFingering && (
          <g key="diagram-overlay">
            {chordFingering.frets.map((fret, stringIdx) => {
              const cy = getStringY(stringIdx);
              
              if (fret === -1) {
                // Draw 'X' for muted string
                return (
                  <g key={`mute-${stringIdx}`}>
                    <text
                      x={paddingLeft - 20}
                      y={cy + 5}
                      fill="var(--neon-danger)"
                      fontSize="14px"
                      fontFamily="var(--font-mono)"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ×
                    </text>
                  </g>
                );
              }
              
              if (fret === 0) {
                // Draw 'O' for open played string
                return (
                  <g key={`open-${stringIdx}`}>
                    <circle
                      cx={paddingLeft - 20}
                      cy={cy}
                      r={6}
                      fill="none"
                      stroke="var(--neon-success)"
                      strokeWidth={2}
                    />
                  </g>
                );
              }

              // Draw fret finger dot
              const x1 = getFretX(fret - 1);
              const x2 = getFretX(fret);
              const cx = x1 + (x2 - x1) / 2;
              
              // Get finger label
              const fingerLabel = chordFingering.fingers ? chordFingering.fingers[stringIdx] : '';

              return (
                <g key={`finger-${stringIdx}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={10}
                    fill="var(--neon-cyan)"
                    stroke="#fff"
                    strokeWidth={1.5}
                    style={{ filter: 'drop-shadow(0 0 6px var(--neon-cyan-glow))' }}
                  />
                  {fingerLabel && (
                    <text
                      x={cx}
                      y={cy + 3.5}
                      fill="var(--text-dark)"
                      fontSize="10px"
                      fontFamily="var(--font-heading)"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {fingerLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
