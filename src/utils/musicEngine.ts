// musicEngine.ts - Core Music Theory Logic for TuneUp

export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map to handle enharmonic equivalents
export const ENHARMONIC_MAP: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
  'E#': 'F',  'F': 'E#',
  'B#': 'C',  'C': 'B#',
  'Cb': 'B',  'B': 'Cb'
};

// Instrument String tunings (low string to high string)
export const GUITAR_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']; // E A D G B E
export const UKULELE_TUNING = ['G4', 'C4', 'E4', 'A4']; // G C E A

export type InstrumentType = 'guitar' | 'ukulele';

// Chord structures: formulas in semitones relative to Root (0)
export interface ChordFormula {
  name: string;
  displayName: string;
  intervals: number[]; // semitone offsets, e.g. [0, 4, 7]
  degrees: string[];   // e.g. ['1', '3', '5']
  category: 'easy' | 'medium' | 'hard';
}

export const CHORD_FORMULAS: Record<string, ChordFormula> = {
  'major': { name: 'major', displayName: 'Major', intervals: [0, 4, 7], degrees: ['1', '3', '5'], category: 'easy' },
  'minor': { name: 'minor', displayName: 'Minor', intervals: [0, 3, 7], degrees: ['1', 'b3', '5'], category: 'easy' },
  
  'dim': { name: 'dim', displayName: 'Diminished', intervals: [0, 3, 6], degrees: ['1', 'b3', 'b5'], category: 'medium' },
  'aug': { name: 'aug', displayName: 'Augmented', intervals: [0, 4, 8], degrees: ['1', '3', '#5'], category: 'medium' },
  'sus4': { name: 'sus4', displayName: 'Suspended 4th', intervals: [0, 5, 7], degrees: ['1', '4', '5'], category: 'medium' },
  'sus2': { name: 'sus2', displayName: 'Suspended 2nd', intervals: [0, 2, 7], degrees: ['1', '2', '5'], category: 'medium' },
  'add9': { name: 'add9', displayName: 'Add 9th', intervals: [0, 4, 7, 14], degrees: ['1', '3', '5', '9'], category: 'medium' },
  
  '7': { name: '7', displayName: 'Dominant 7th', intervals: [0, 4, 7, 10], degrees: ['1', '3', '5', 'b7'], category: 'hard' },
  'maj7': { name: 'maj7', displayName: 'Major 7th', intervals: [0, 4, 7, 11], degrees: ['1', '3', '5', '7'], category: 'hard' },
  'min7': { name: 'min7', displayName: 'Minor 7th', intervals: [0, 3, 7, 10], degrees: ['1', 'b3', '5', 'b7'], category: 'hard' },
  '9': { name: '9', displayName: 'Dominant 9th', intervals: [0, 4, 7, 10, 14], degrees: ['1', '3', '5', 'b7', '9'], category: 'hard' },
  'maj9': { name: 'maj9', displayName: 'Major 9th', intervals: [0, 4, 7, 11, 14], degrees: ['1', '3', '5', '7', '9'], category: 'hard' },
  'min9': { name: 'min9', displayName: 'Minor 9th', intervals: [0, 3, 7, 10, 14], degrees: ['1', 'b3', '5', 'b7', '9'], category: 'hard' },
  '11': { name: '11', displayName: '11th', intervals: [0, 4, 7, 10, 14, 17], degrees: ['1', '3', '5', 'b7', '9', '11'], category: 'hard' },
  '7sharp9': { name: '7sharp9', displayName: '7#9 (Hendrix)', intervals: [0, 4, 7, 10, 15], degrees: ['1', '3', '5', 'b7', '#9'], category: 'hard' },
  '13': { name: '13', displayName: '13th', intervals: [0, 4, 7, 10, 14, 17, 21], degrees: ['1', '3', '5', 'b7', '9', '11', '13'], category: 'hard' }
};

// Scale structures
export interface ScaleFormula {
  name: string;
  displayName: string;
  steps: number[];
  category: 'easy' | 'medium' | 'hard';
}

export const SCALE_FORMULAS: Record<string, ScaleFormula> = {
  'major': { name: 'major', displayName: 'Major (Ionian)', steps: [2, 2, 1, 2, 2, 2, 1], category: 'easy' },
  'minor': { name: 'minor', displayName: 'Natural Minor (Aeolian)', steps: [2, 1, 2, 2, 1, 2, 2], category: 'easy' },
  
  'harmonic_minor': { name: 'harmonic_minor', displayName: 'Harmonic Minor', steps: [2, 1, 2, 2, 1, 3, 1], category: 'medium' },
  'melodic_minor': { name: 'melodic_minor', displayName: 'Melodic Minor', steps: [2, 1, 2, 2, 2, 2, 1], category: 'medium' },
  'pentatonic_major': { name: 'pentatonic_major', displayName: 'Major Pentatonic', steps: [2, 2, 3, 2, 3], category: 'medium' },
  'pentatonic_minor': { name: 'pentatonic_minor', displayName: 'Minor Pentatonic', steps: [3, 2, 2, 3, 2], category: 'medium' },
  
  'dorian': { name: 'dorian', displayName: 'Dorian Mode', steps: [2, 1, 2, 2, 2, 1, 2], category: 'hard' },
  'phrygian': { name: 'phrygian', displayName: 'Phrygian Mode', steps: [1, 2, 2, 2, 1, 2, 2], category: 'hard' },
  'lydian': { name: 'lydian', displayName: 'Lydian Mode', steps: [2, 2, 2, 1, 2, 2, 1], category: 'hard' },
  'mixolydian': { name: 'mixolydian', displayName: 'Mixolydian Mode', steps: [2, 2, 1, 2, 2, 1, 2], category: 'hard' },
  'locrian': { name: 'locrian', displayName: 'Locrian Mode', steps: [1, 2, 2, 1, 2, 2, 2], category: 'hard' }
};

export const KEYS_USING_FLATS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'];

export function getChromaticScale(key: string): string[] {
  const baseKey = key.split(' ')[0];
  return KEYS_USING_FLATS.includes(baseKey) ? NOTES_FLAT : NOTES_SHARP;
}

export function normalizeNoteName(note: string): string {
  const cleanNote = note.trim();
  if (NOTES_SHARP.includes(cleanNote) || NOTES_FLAT.includes(cleanNote)) {
    return cleanNote;
  }
  if (ENHARMONIC_MAP[cleanNote]) {
    return ENHARMONIC_MAP[cleanNote];
  }
  return cleanNote;
}

export function stripOctave(noteWithOctave: string): string {
  return noteWithOctave.replace(/[0-9]/g, '');
}

export function getNotePitch(note: string): number {
  const cleanNote = stripOctave(note);
  let idx = NOTES_SHARP.indexOf(cleanNote);
  if (idx === -1) idx = NOTES_FLAT.indexOf(cleanNote);
  if (idx === -1) {
    const norm = normalizeNoteName(cleanNote);
    idx = NOTES_SHARP.indexOf(norm);
    if (idx === -1) idx = NOTES_FLAT.indexOf(norm);
  }
  return idx === -1 ? 0 : idx;
}

/**
 * Compare two sets of notes enharmonically (order-independent)
 * E.g., ['Ab', 'C', 'Eb'] matches ['G#', 'C', 'D#']
 */
export function compareNotesEnharmonically(notes1: string[], notes2: string[]): boolean {
  if (notes1.length !== notes2.length) return false;
  const pitches1 = notes1.map(n => getNotePitch(n)).sort((a, b) => a - b);
  const pitches2 = notes2.map(n => getNotePitch(n)).sort((a, b) => a - b);
  return pitches1.every((p, idx) => p === pitches2[idx]);
}

export function getScaleNotes(root: string, scaleType: string): string[] {
  const normalizedRoot = stripOctave(normalizeNoteName(root));
  const scale = SCALE_FORMULAS[scaleType] || SCALE_FORMULAS['major'];
  const pool = getChromaticScale(normalizedRoot);
  
  let currentPitch = getNotePitch(normalizedRoot);
  const notes: string[] = [pool[currentPitch]];
  
  for (let i = 0; i < scale.steps.length - 1; i++) {
    currentPitch = (currentPitch + scale.steps[i]) % 12;
    notes.push(pool[currentPitch]);
  }
  return notes;
}

export function getChordNotes(root: string, chordType: string): string[] {
  const normalizedRoot = stripOctave(normalizeNoteName(root));
  const formula = CHORD_FORMULAS[chordType] || CHORD_FORMULAS['major'];
  const pool = getChromaticScale(normalizedRoot);
  
  const rootPitch = getNotePitch(normalizedRoot);
  return formula.intervals.map(semitones => {
    const pitch = (rootPitch + semitones) % 12;
    return pool[pitch];
  });
}

/**
 * Advanced Chord and Interval Detector for Sandbox Playground
 */
export function detectChordFromNotes(notes: string[], bassNote?: string): string {
  if (notes.length === 0) return 'Play some notes!';
  
  const uniqueNotes = Array.from(new Set(notes.map(n => normalizeNoteName(stripOctave(n)))));
  const uniquePitches = Array.from(new Set(uniqueNotes.map(n => getNotePitch(n)))).sort((a, b) => a - b);
  
  // 1. Two-note Dyads / Intervals
  if (uniquePitches.length === 2) {
    const diff = (uniquePitches[1] - uniquePitches[0] + 12) % 12;
    const rootName = uniqueNotes[0];
    
    switch (diff) {
      case 1: return `${rootName} Minor 2nd (dyad)`;
      case 2: return `${rootName} Major 2nd (dyad)`;
      case 3: return `${rootName} Minor 3rd (dyad)`;
      case 4: return `${rootName} Major 3rd (dyad)`;
      case 5: return `${rootName} Perfect 4th (dyad)`;
      case 6: return `${rootName} Tritone / flat 5th`;
      case 7: return `${rootName} Power Chord (5) / Perfect 5th`;
      case 8: return `${rootName} Minor 6th (dyad)`;
      case 9: return `${rootName} Major 6th (dyad)`;
      case 10: return `${rootName} Minor 7th (dyad)`;
      case 11: return `${rootName} Major 7th (dyad)`;
      default: return `Interval (distance: ${diff} semitones)`;
    }
  }

  // 2. Chords Check (3+ notes)
  const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  for (const r of roots) {
    const rootPitch = getNotePitch(r);
    
    for (const formulaKey of Object.keys(CHORD_FORMULAS)) {
      const formula = CHORD_FORMULAS[formulaKey];
      const formulaPitches = formula.intervals.map(i => (rootPitch + i) % 12);
      
      // Check if uniquePitches contains all formula pitches (subset matching)
      const isSubset = formulaPitches.every(p => uniquePitches.includes(p));
      const isExact = isSubset && formulaPitches.length === uniquePitches.length;
      
      if (isSubset) {
        let label = `${r} ${formula.displayName}`;
        
        // If there's a custom bass note, or the lowest pitch isn't the root, label as slash chord
        const lowestPlayedPitch = uniquePitches[0];
        const lowestPlayedNote = roots[lowestPlayedPitch];
        
        if (bassNote && stripOctave(bassNote) !== r) {
          label += ` / ${stripOctave(bassNote)}`;
        } else if (lowestPlayedPitch !== rootPitch && isExact) {
          label += ` / ${lowestPlayedNote}`;
        }
        
        if (!isExact) {
          label += ` (Voicing)`;
        }
        return label;
      }
    }
  }

  // 3. Fallback: Describe intervals relative to lowest note
  const lowestPitch = uniquePitches[0];
  const rootLabel = roots[lowestPitch];
  const relativeIntervals = uniquePitches.map(p => (p - lowestPitch + 12) % 12).slice(1);
  
  const intervalNames = relativeIntervals.map(i => {
    switch (i) {
      case 1: return 'b2';
      case 2: return '2';
      case 3: return 'b3';
      case 4: return '3';
      case 5: return '4';
      case 6: return 'b5';
      case 7: return '5';
      case 8: return 'b6';
      case 9: return '6';
      case 10: return 'b7';
      case 11: return '7';
      default: return '?';
    }
  });

  return `${rootLabel} cluster (${intervalNames.join(', ')})`;
}

export function getDiatonicChords(keyRoot: string, keyType: 'major' | 'minor'): { Roman: string; chordName: string; notes: string[] }[] {
  const scaleNotes = getScaleNotes(keyRoot, keyType);
  
  if (keyType === 'major') {
    const patterns = [
      { Roman: 'I', type: 'major' },
      { Roman: 'ii', type: 'minor' },
      { Roman: 'iii', type: 'minor' },
      { Roman: 'IV', type: 'major' },
      { Roman: 'V', type: 'major' },
      { Roman: 'vi', type: 'minor' },
      { Roman: 'vii°', type: 'dim' }
    ];
    return patterns.map((p, idx) => {
      const root = scaleNotes[idx];
      const name = `${root} ${CHORD_FORMULAS[p.type].displayName}`;
      return {
        Roman: p.Roman,
        chordName: name,
        notes: getChordNotes(root, p.type)
      };
    });
  } else {
    const patterns = [
      { Roman: 'i', type: 'minor' },
      { Roman: 'ii°', type: 'dim' },
      { Roman: 'III', type: 'major' },
      { Roman: 'iv', type: 'minor' },
      { Roman: 'v', type: 'minor' },
      { Roman: 'VI', type: 'major' },
      { Roman: 'VII', type: 'major' }
    ];
    return patterns.map((p, idx) => {
      const root = scaleNotes[idx];
      const name = `${root} ${CHORD_FORMULAS[p.type].displayName}`;
      return {
        Roman: p.Roman,
        chordName: name,
        notes: getChordNotes(root, p.type)
      };
    });
  }
}

export function getFretNote(
  stringIndex: number,
  fret: number,
  instrument: InstrumentType,
  customTuning?: string[]
): { note: string; pitch: number; frequency: number } {
  const tuning = customTuning || (instrument === 'guitar' ? GUITAR_TUNING : UKULELE_TUNING);
  const stringOpenNote = tuning[stringIndex];
  
  const match = stringOpenNote.match(/^([A-G]#?|Bb?|Db?|Eb?|Gb?|Ab?)([0-9])$/);
  if (!match) return { note: 'C', pitch: 0, frequency: 261.63 };
  
  const openNoteName = match[1];
  const openOctave = parseInt(match[2]);
  
  const openPitch = getNotePitch(openNoteName);
  const totalPitch = openPitch + fret;
  
  const pitchInOctave = totalPitch % 12;
  const octaveShift = Math.floor(totalPitch / 12);
  const resultOctave = openOctave + octaveShift;
  
  const chromatic = getChromaticScale(openNoteName);
  const resultNoteName = chromatic[pitchInOctave];
  
  const midiNote = 12 * (resultOctave + 1) + pitchInOctave;
  const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
  
  return {
    note: `${resultNoteName}${resultOctave}`,
    pitch: pitchInOctave,
    frequency
  };
}

export interface ChordFingering {
  chordName: string;
  frets: number[];
  fingers?: string[];
  barres?: { fret: number; startString: number; endString: number }[];
}

export const GUITAR_CHORD_DIAGRAMS: Record<string, ChordFingering[]> = {
  'C Major': [{ chordName: 'C Major', frets: [-1, 3, 2, 0, 1, 0], fingers: ['', '3', '2', '', '1', ''] }],
  'A Major': [{ chordName: 'A Major', frets: [-1, 0, 2, 2, 2, 0], fingers: ['', '', '1', '2', '3', ''] }],
  'G Major': [{ chordName: 'G Major', frets: [3, 2, 0, 0, 0, 3], fingers: ['3', '2', '', '', '', '4'] }],
  'E Major': [{ chordName: 'E Major', frets: [0, 2, 2, 1, 0, 0], fingers: ['', '2', '3', '1', '', ''] }],
  'D Major': [{ chordName: 'D Major', frets: [-1, -1, 0, 2, 3, 2], fingers: ['', '', '', '1', '3', '2'] }],
  'A Minor': [{ chordName: 'A Minor', frets: [-1, 0, 2, 2, 1, 0], fingers: ['', '', '2', '3', '1', ''] }],
  'E Minor': [{ chordName: 'E Minor', frets: [0, 2, 2, 0, 0, 0], fingers: ['', '1', '2', '', '', ''] }],
  'D Minor': [{ chordName: 'D Minor', frets: [-1, -1, 0, 2, 3, 1], fingers: ['', '', '', '2', '3', '1'] }],
  'F Major': [{ chordName: 'F Major', frets: [1, 3, 3, 2, 1, 1], fingers: ['1', '3', '4', '2', '1', '1'], barres: [{ fret: 1, startString: 0, endString: 5 }] }],
  'B Minor': [{ chordName: 'B Minor', frets: [-1, 2, 4, 4, 3, 2], fingers: ['', '1', '3', '4', '2', '1'], barres: [{ fret: 2, startString: 1, endString: 5 }] }]
};

export const UKULELE_CHORD_DIAGRAMS: Record<string, ChordFingering[]> = {
  'C Major': [{ chordName: 'C Major', frets: [0, 0, 0, 3], fingers: ['', '', '', '3'] }],
  'A Major': [{ chordName: 'A Major', frets: [2, 1, 0, 0], fingers: ['2', '1', '', ''] }],
  'G Major': [{ chordName: 'G Major', frets: [0, 2, 3, 2], fingers: ['', '1', '3', '2'] }],
  'E Major': [{ chordName: 'E Major', frets: [1, 4, 0, 2], fingers: ['1', '4', '', '2'] }],
  'D Major': [{ chordName: 'D Major', frets: [2, 2, 2, 0], fingers: ['1', '2', '3', ''] }],
  'A Minor': [{ chordName: 'A Minor', frets: [2, 0, 0, 0], fingers: ['2', '', '', ''] }],
  'E Minor': [{ chordName: 'E Minor', frets: [0, 4, 3, 2], fingers: ['', '3', '2', '1'] }],
  'D Minor': [{ chordName: 'D Minor', frets: [2, 2, 1, 0], fingers: ['2', '3', '1', ''] }],
  'F Major': [{ chordName: 'F Major', frets: [2, 0, 1, 0], fingers: ['2', '', '1', ''] }],
  'B Minor': [{ chordName: 'B Minor', frets: [4, 2, 2, 2], fingers: ['3', '1', '1', '1'], barres: [{ fret: 2, startString: 1, endString: 3 }] }]
};

export function transposeRiff(frets: number[], semitones: number): number[] {
  return frets.map(f => (f === -1 ? -1 : f + semitones));
}

export interface SongData {
  title: string;
  artist: string;
  chords: string[];
  lyricQuote?: string;
  genre: string;
}

export const SONGS_DB: SongData[] = [
  {
    title: 'Get Lucky',
    artist: 'Daft Punk',
    chords: ['B Minor', 'D Major', 'F# Minor', 'E Major'],
    lyricQuote: "We've come too far to give up who we are...",
    genre: 'Dance / Funk'
  },
  {
    title: 'Zombie',
    artist: 'The Cranberries',
    chords: ['E Minor', 'C Major', 'G Major', 'D Major'],
    lyricQuote: "In your head, in your head, zombie, zombie...",
    genre: 'Alternative Rock'
  },
  {
    title: 'Stand By Me',
    artist: 'Ben E. King',
    chords: ['G Major', 'E Minor', 'C Major', 'D Major'],
    lyricQuote: "No I won't be afraid, just as long as you stand by me...",
    genre: 'Classic Soul'
  },
  {
    title: 'La Bamba',
    artist: 'Richie Valens',
    chords: ['C Major', 'F Major', 'G Major'],
    lyricQuote: "Para bailar la bamba, se necesita una poca de gracia...",
    genre: 'Latin Rock'
  },
  {
    title: 'Imagine',
    artist: 'John Lennon',
    chords: ['C Major', 'F Major', 'G Major', 'E Major', 'A Minor'],
    lyricQuote: "You may say I'm a dreamer, but I'm not the only one...",
    genre: 'Classic Pop'
  },
  {
    title: 'Riptide',
    artist: 'Vance Joy',
    chords: ['A Minor', 'G Major', 'C Major'],
    lyricQuote: "I love you when you're singing that song and I got a lump in my throat...",
    genre: 'Indie Folk'
  },
  {
    title: 'Happy Together',
    artist: 'The Turtles',
    chords: ['E Minor', 'D Major', 'C Major'],
    lyricQuote: "I can't see me loving nobody but you, for all my life...",
    genre: '60s Pop'
  }
];

export function getSongSuggestions(masteredChords: string[]): {
  playable: SongData[];
  almostPlayable: { song: SongData; missing: string[] }[];
} {
  const playable: SongData[] = [];
  const almostPlayable: { song: SongData; missing: string[] }[] = [];
  const mastered = masteredChords.map(c => c.trim().toLowerCase());
  
  for (const song of SONGS_DB) {
    const missing: string[] = [];
    for (const c of song.chords) {
      if (!mastered.includes(c.toLowerCase())) {
        missing.push(c);
      }
    }
    
    if (missing.length === 0) {
      playable.push(song);
    } else if (missing.length <= 2) {
      almostPlayable.push({ song, missing });
    }
  }
  return { playable, almostPlayable };
}
