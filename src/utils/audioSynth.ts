// audioSynth.ts - Web Audio API Synthesizer and AI Jam Buddy Engine

import { getChromaticScale, getNotePitch } from './musicEngine';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

// Volumes for Jam Buddy channels
let drumsVolume = 0.6;
let bassVolume = 0.5;
let chordsVolume = 0.4;

export function initAudio() {
  if (!audioCtx) {
    // @ts-ignore
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a single frequency note with an envelope
 */
export function playNote(freq: number, duration: number = 0.5, type: OscillatorType = 'triangle') {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  // ADSR Envelope
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.05); // Attack
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.15); // Decay
  gain.gain.setValueAtTime(0.2, now + duration - 0.1); // Sustain
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Release

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Play multiple notes (a chord) polyphonically
 */
export function playChord(frequencies: number[], duration: number = 1.0, type: OscillatorType = 'sine') {
  const ctx = initAudio();
  if (!ctx || !masterGain || frequencies.length === 0) return;

  const now = ctx.currentTime;
  const chordGain = ctx.createGain();
  // Distribute volume among notes to avoid clipping
  chordGain.gain.setValueAtTime(0, now);
  chordGain.gain.linearRampToValueAtTime(0.4 / frequencies.length, now + 0.1);
  chordGain.gain.setValueAtTime(0.4 / frequencies.length, now + duration - 0.15);
  chordGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  chordGain.connect(masterGain);

  frequencies.forEach(freq => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(chordGain);
    osc.start(now);
    osc.stop(now + duration);
  });
}

/**
 * Play a short click for the Metronome
 */
export function playMetronomeTick(isAccent: boolean) {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  // Accent beat gets 1000Hz, regular beat gets 600Hz
  osc.frequency.setValueAtTime(isAccent ? 1000 : 600, ctx.currentTime);

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.6, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.08);
}

// Noise buffer for synthesized drums (hi-hat, snare)
let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

// DRUM SYNTHESIZERS

/**
 * Synthesizes a kick drum (frequency sweep)
 */
function playSynthKick(ctx: AudioContext, time: number, gainNode: GainNode) {
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  
  osc.type = 'sine';
  // Fast frequency sweep from 150Hz down to 40Hz
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);
  
  oscGain.gain.setValueAtTime(0, time);
  oscGain.gain.linearRampToValueAtTime(drumsVolume * 1.0, time + 0.005);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
  
  osc.connect(oscGain);
  oscGain.connect(gainNode);
  
  osc.start(time);
  osc.stop(time + 0.25);
}

/**
 * Synthesizes a Hi-Hat (filtered white noise)
 */
function playSynthHihat(ctx: AudioContext, time: number, gainNode: GainNode, isOpen: boolean = false) {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 10000;
  
  const oscGain = ctx.createGain();
  const duration = isOpen ? 0.15 : 0.04;
  
  oscGain.gain.setValueAtTime(0, time);
  oscGain.gain.linearRampToValueAtTime(drumsVolume * 0.35, time + 0.002);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  
  source.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(gainNode);
  
  source.start(time);
  source.stop(time + duration + 0.05);
}

/**
 * Synthesizes a Snare Drum (mix of noise and tone)
 */
function playSynthSnare(ctx: AudioContext, time: number, gainNode: GainNode) {
  // Tone component
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.linearRampToValueAtTime(100, time + 0.08);
  
  oscGain.gain.setValueAtTime(0, time);
  oscGain.gain.linearRampToValueAtTime(drumsVolume * 0.4, time + 0.005);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
  
  osc.connect(oscGain);
  oscGain.connect(gainNode);
  
  // Noise component (snare rattle)
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1500;
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, time);
  noiseGain.gain.linearRampToValueAtTime(drumsVolume * 0.65, time + 0.005);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(gainNode);
  
  osc.start(time);
  osc.stop(time + 0.15);
  noise.start(time);
  noise.stop(time + 0.2);
}

// BASS SYNTHESIZER
function playSynthBass(ctx: AudioContext, freq: number, time: number, duration: number, gainNode: GainNode, type: OscillatorType = 'triangle') {
  if (freq <= 0) return;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const oscGain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  
  // Cyberpunk bass gets sawtooth with a filter decay
  if (type === 'sawtooth') {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.15);
    osc.connect(filter);
    filter.connect(oscGain);
  } else {
    osc.connect(oscGain);
  }
  
  oscGain.gain.setValueAtTime(0, time);
  oscGain.gain.linearRampToValueAtTime(bassVolume * 0.7, time + 0.01);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  
  oscGain.connect(gainNode);
  
  osc.start(time);
  osc.stop(time + duration + 0.05);
}

// PLUCKED GUITAR SYNTHESIZER (Quick lowpass decay)
function playPluckedGuitar(ctx: AudioContext, freq: number, time: number, duration: number, gainNode: GainNode) {
  if (freq <= 0) return;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const oscGain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.Q.value = 1;
  filter.frequency.setValueAtTime(3000, time);
  filter.frequency.exponentialRampToValueAtTime(300, time + 0.15);

  oscGain.gain.setValueAtTime(0, time);
  oscGain.gain.linearRampToValueAtTime(chordsVolume * 0.5, time + 0.005);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(gainNode);

  osc.start(time);
  osc.stop(time + duration + 0.05);
}

function playPluckedGuitarChord(ctx: AudioContext, frequencies: number[], time: number, duration: number, gainNode: GainNode) {
  if (frequencies.length === 0) return;
  frequencies.forEach((freq, idx) => {
    const strumDelay = idx * 0.025; // short strum
    playPluckedGuitar(ctx, freq, time + strumDelay, duration, gainNode);
  });
}

// ACOUSTIC PIANO STRIKE SYNTHESIZER (Sine fundamental + sharp triangle strike envelope)
function playPianoStrike(ctx: AudioContext, freq: number, time: number, duration: number, gainNode: GainNode) {
  if (freq <= 0) return;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const oscGain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, time);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, time); // harmonic

  oscGain.gain.setValueAtTime(0, time);
  oscGain.gain.linearRampToValueAtTime(chordsVolume * 0.4, time + 0.003); // sharp hammer hit
  oscGain.gain.exponentialRampToValueAtTime(chordsVolume * 0.1, time + 0.15);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc1.connect(oscGain);
  osc2.connect(oscGain);
  oscGain.connect(gainNode);

  osc1.start(time);
  osc1.stop(time + duration + 0.05);
  osc2.start(time);
  osc2.stop(time + duration + 0.05);
}

function playPianoChord(ctx: AudioContext, frequencies: number[], time: number, duration: number, gainNode: GainNode) {
  if (frequencies.length === 0) return;
  frequencies.forEach(freq => {
    playPianoStrike(ctx, freq, time, duration, gainNode);
  });
}

export function playPianoNote(freq: number, duration: number = 0.8) {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;
  playPianoStrike(ctx, freq, ctx.currentTime, duration, masterGain);
}

export function playGuitarNote(freq: number, duration: number = 0.8) {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;
  playPluckedGuitar(ctx, freq, ctx.currentTime, duration, masterGain);
}

// CHORD SYNTHESIZER (Polyphonic Pad)
function playSynthPad(ctx: AudioContext, frequencies: number[], time: number, duration: number, gainNode: GainNode) {
  if (frequencies.length === 0) return;
  
  const now = time;
  const chordGain = ctx.createGain();
  
  // Nice slow attack for pad swell
  chordGain.gain.setValueAtTime(0, now);
  chordGain.gain.linearRampToValueAtTime(chordsVolume * 0.3 / frequencies.length, now + 0.12);
  chordGain.gain.setValueAtTime(chordsVolume * 0.3 / frequencies.length, now + duration - 0.15);
  chordGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  
  chordGain.connect(gainNode);
  
  frequencies.forEach(freq => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'triangle'; // Warm pad sound
    osc.frequency.setValueAtTime(freq, now);
    
    // Warm low pass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    
    osc.connect(filter);
    filter.connect(chordGain);
    
    osc.start(now);
    osc.stop(now + duration + 0.05);
  });
}

// UI SFX FUNCTIONS
export function playUIClick() {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.06);
}

export function playUIBack() {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.linearRampToValueAtTime(200, now + 0.15);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.16);
}

export function playUISuccess() {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;
  const dest = masterGain;
  const now = ctx.currentTime;
  
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.07;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(start);
    osc.stop(start + 0.3);
  });
}

export function playIntroChime() {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  
  const notes = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const start = now + idx * 0.08;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, start);
    filter.frequency.exponentialRampToValueAtTime(400, start + 0.5);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain!);

    osc.start(start);
    osc.stop(start + 0.8);
  });
}

export function playUIFailure() {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(130, now);
  osc1.frequency.linearRampToValueAtTime(110, now + 0.25);

  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(133, now);
  osc2.frequency.linearRampToValueAtTime(113, now + 0.25);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(masterGain);

  osc1.start(now);
  osc1.stop(now + 0.35);
  osc2.start(now);
  osc2.stop(now + 0.35);
}

// Helper to convert note names (e.g. C3, E3, G3) to frequencies
function getNoteFrequency(noteName: string): number {
  const match = noteName.match(/^([A-G]#?|Bb?|Db?|Eb?|Gb?|Ab?)([0-9])$/);
  if (!match) return 0;
  
  const name = match[1];
  const octave = parseInt(match[2]);
  
  const pitch = getNotePitch(name);
  const midiNote = 12 * (octave + 1) + pitch;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// AI JAM BUDDY SCHEDULER STATE
class JamBuddyManager {
  private bpm: number = 120;
  private chords: string[] = ['A Minor', 'F Major', 'C Major', 'G Major'];
  private style: 'lofi' | 'synthwave' | 'rock' = 'lofi';
  
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private nextNoteTime: number = 0.0; // context time when next grid step is due
  private currentBeatIndex: number = 0; // 0 to 15 (16th notes in a 4-beat bar)
  private currentChordIndex: number = 0;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // seconds
  private onBeat: ((beat: number, chord: string) => void) | null = null;
  
  // Independent instrument channel toggles
  private enabledChannels = {
    drums: true,
    bass: true,
    guitar: true,
    keys: true,
    synth: true
  };
  
  constructor() {}
  
  public start(
    bpm: number,
    chords: string[],
    style: 'lofi' | 'synthwave' | 'rock',
    _keyNotes: string[],
    onBeatCallback: (beat: number, chord: string) => void
  ) {
    const ctx = initAudio();
    if (!ctx) return;
    
    if (this.isPlaying) {
      this.stop();
    }
    
    this.bpm = bpm;
    this.chords = chords.length > 0 ? chords : ['A Minor', 'F Major', 'C Major', 'G Major'];
    this.style = style;
    this.onBeat = onBeatCallback;
    
    this.isPlaying = true;
    this.currentBeatIndex = 0;
    this.currentChordIndex = 0;
    this.nextNoteTime = ctx.currentTime;
    
    this.scheduler();
  }
  
  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
  
  public updateParams(bpm: number, style: 'lofi' | 'synthwave' | 'rock', chords?: string[]) {
    this.bpm = bpm;
    this.style = style;
    if (chords && chords.length > 0) {
      this.chords = chords;
    }
  }
  
  public toggleChannel(channel: 'drums' | 'bass' | 'guitar' | 'keys' | 'synth', enabled: boolean) {
    this.enabledChannels[channel] = enabled;
  }

  public getEnabledChannels() {
    return this.enabledChannels;
  }
  
  private scheduler() {
    const ctx = audioCtx;
    if (!ctx || !this.isPlaying) return;
    
    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentBeatIndex, this.nextNoteTime);
      this.advanceStep();
    }
    
    this.timerId = window.setTimeout(() => this.scheduler(), this.lookahead);
  }
  
  private advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    
    // In Lo-Fi: 16th notes grid. In synthwave: 8th notes. Let's schedule on a 16th note grid (4 steps per beat)
    const stepDuration = 0.25 * secondsPerBeat; // 16th note duration
    this.nextNoteTime += stepDuration;
    
    this.currentBeatIndex = (this.currentBeatIndex + 1) % 16;
    
    // Move to next chord every 4 beats (16 steps)
    if (this.currentBeatIndex === 0) {
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
    }
  }
  
  private scheduleStep(step: number, time: number) {
    const ctx = audioCtx;
    const dest = masterGain;
    if (!ctx || !dest) return;
    
    const activeChord = this.chords[this.currentChordIndex];
    
    // Map activeChord spelling to musical context
    // E.g., 'A Minor' root is A, type is 'minor'
    let rootNote = 'A';
    let chordType = 'minor';
    const split = activeChord.split(' ');
    if (split.length > 0) {
      rootNote = split[0];
      chordType = split[1] ? split[1].toLowerCase() : 'major';
    }
    
    // Form notes of active chord at base voicing (Octave 3/4)
    // E.g., for C Major -> C3, E3, G3
    const chordFrequencies = getChordVoicingFrequencies(rootNote, chordType);
    const bassFreq = getNoteFrequency(`${rootNote}2`); // Deep root bass
    
    // Trigger callbacks on downbeats (every 4 steps is a quarter note)
    if (step % 4 === 0 && this.onBeat) {
      const beatNum = (step / 4) + 1; // 1, 2, 3, 4
      // Callback inside React-safe context
      setTimeout(() => {
        if (this.isPlaying && this.onBeat) this.onBeat(beatNum, activeChord);
      }, 0);
    }
    
    // 1. DRUMS CHANNEL
    if (this.enabledChannels.drums) {
      if (this.style === 'lofi') {
        if (step === 0 || step === 11) {
          playSynthKick(ctx, time, dest);
        }
        if (step === 4 || step === 12) {
          playSynthSnare(ctx, time, dest);
        }
        if (step % 2 === 0) {
          playSynthHihat(ctx, time, dest, false);
        }
      } else if (this.style === 'synthwave') {
        if (step % 4 === 0) {
          playSynthKick(ctx, time, dest);
        }
        if (step === 4 || step === 12) {
          playSynthSnare(ctx, time, dest);
        }
        if (step % 2 === 0) {
          playSynthHihat(ctx, time, dest, step % 4 === 2); // Open hat on upbeat
        }
      } else if (this.style === 'rock') {
        if (step === 0 || step === 8 || step === 10) {
          playSynthKick(ctx, time, dest);
        }
        if (step === 4 || step === 12) {
          playSynthSnare(ctx, time, dest);
        }
        if (step % 2 === 0) {
          playSynthHihat(ctx, time, dest, false);
        }
      }
    }

    // 2. BASS CHANNEL
    if (this.enabledChannels.bass) {
      if (this.style === 'lofi') {
        if (step === 0) {
          playSynthBass(ctx, bassFreq, time, 0.45, dest, 'triangle');
        } else if (step === 8) {
          const fifthPitch = (getNotePitch(rootNote) + 7) % 12;
          const fifthNote = getChromaticScale(rootNote)[fifthPitch];
          const fifthFreq = getNoteFrequency(`${fifthNote}2`);
          playSynthBass(ctx, fifthFreq, time, 0.3, dest, 'triangle');
        }
      } else if (this.style === 'synthwave') {
        if (step % 2 === 0) {
          const isHigh = step % 4 === 2;
          const targetBassFreq = isHigh ? getNoteFrequency(`${rootNote}3`) : bassFreq;
          const duration = 60.0 / this.bpm * 0.22;
          playSynthBass(ctx, targetBassFreq, time, duration, dest, 'sawtooth');
        }
      } else if (this.style === 'rock') {
        if (step === 0 || step === 3 || step === 8 || step === 11) {
          const duration = 60.0 / this.bpm * 0.45;
          playSynthBass(ctx, bassFreq, time, duration, dest, 'sawtooth');
        }
      }
    }

    // 3. RHYTHM GUITAR CHANNEL (Plucked warm steel-string voicings)
    if (this.enabledChannels.guitar) {
      if (this.style === 'lofi') {
        // Arpeggiate chord notes on steps 2, 6, 10, 14
        const noteIdx = (Math.floor(step / 2)) % chordFrequencies.length;
        if (step % 2 === 0 && step !== 0) {
          playPluckedGuitar(ctx, chordFrequencies[noteIdx], time, 0.3, dest);
        }
      } else if (this.style === 'synthwave') {
        // Fast offbeat plucks
        if (step % 4 === 2) {
          playPluckedGuitarChord(ctx, chordFrequencies, time, 0.2, dest);
        }
      } else if (this.style === 'rock') {
        // Rhythmic guitar chord strum on step 2, 6, 10, 14
        if (step % 4 === 2) {
          playPluckedGuitarChord(ctx, chordFrequencies, time, 0.4, dest);
        }
      }
    }

    // 4. KEYS CHANNEL (Acoustic piano arpeggios or chord stabs)
    if (this.enabledChannels.keys) {
      if (this.style === 'lofi') {
        // Staggered arpeggio on 1, 5, 9, 13
        if (step % 4 === 1) {
          const noteIdx = Math.floor(step / 4) % chordFrequencies.length;
          playPianoStrike(ctx, chordFrequencies[noteIdx], time, 0.5, dest);
        }
      } else if (this.style === 'synthwave') {
        // 8th note driving keys arpeggios
        if (step % 2 === 0) {
          const noteIdx = (step / 2) % chordFrequencies.length;
          playPianoStrike(ctx, chordFrequencies[noteIdx], time, 0.2, dest);
        }
      } else if (this.style === 'rock') {
        // Piano chord stabs on downbeats 0, 4, 8, 12
        if (step % 4 === 0) {
          playPianoChord(ctx, chordFrequencies, time, 0.4, dest);
        }
      }
    }

    // 5. SYNTH CHANNEL (Polyphonic Warm Analog Pads)
    if (this.enabledChannels.synth) {
      if (this.style === 'lofi' || this.style === 'rock') {
        if (step === 0) {
          playSynthPad(ctx, chordFrequencies, time, 60.0 / this.bpm * 3.5, dest);
        }
      } else if (this.style === 'synthwave') {
        if (step % 4 === 0) {
          playSynthPad(ctx, chordFrequencies, time, 60.0 / this.bpm * 0.7, dest);
        }
      }
    }
  }
}

// Maps root/type to a set of voicing frequencies in octaves 3 and 4
function getChordVoicingFrequencies(root: string, type: string): number[] {
  let intervals = [0, 4, 7]; // Major default
  if (type === 'minor' || type === 'min') intervals = [0, 3, 7];
  else if (type === 'dim') intervals = [0, 3, 6];
  else if (type === 'aug') intervals = [0, 4, 8];
  else if (type === 'sus4') intervals = [0, 5, 7];
  else if (type === 'sus2') intervals = [0, 2, 7];
  else if (type === '7') intervals = [0, 4, 7, 10];
  else if (type === 'maj7') intervals = [0, 4, 7, 11];
  else if (type === 'min7') intervals = [0, 3, 7, 10];
  
  const rootPitch = getNotePitch(root);
  const scale = getChromaticScale(root);
  
  return intervals.map((semitones, idx) => {
    const pitch = (rootPitch + semitones) % 12;
    const noteName = scale[pitch];
    
    // Voicing strategy:
    // Root goes to octave 3. Other notes go to octave 3 or 4 based on pitch order.
    const octave = (pitch < rootPitch || idx > 1) ? 4 : 3;
    return getNoteFrequency(`${noteName}${octave}`);
  });
}

// Singleton Jam Buddy Manager
export const jamBuddy = new JamBuddyManager();

// Volume adjusters
export function setJamChannelsVolume(drums: number, bass: number, chords: number) {
  drumsVolume = drums;
  bassVolume = bass;
  chordsVolume = chords;
}

export function playTestEndMusic(scorePercentage: number) {
  const ctx = initAudio();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;

  if (scorePercentage >= 70) {
    // Triumphant/very good music: Major arpeggio going up and resolving happily
    const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.12;
      const dur = 0.8;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(masterGain!);

      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  } else if (scorePercentage >= 30) {
    // Normal/neutral music: Calm major or sus2 triad chord
    const freqs = [261.63, 392.00, 587.33];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.1;
      const dur = 1.2;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(masterGain!);

      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  } else {
    // Sad music: slow minor/diminished downward slide
    const notes = [311.13, 293.66, 261.63, 220.00]; // Eb4 -> D4 -> C4 -> A3 (sad flat drop)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.25;
      const dur = 0.9;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.linearRampToValueAtTime(freq * 0.92, start + dur); // flatting pitch

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, start);
      filter.frequency.exponentialRampToValueAtTime(150, start + dur);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain!);

      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }
}

