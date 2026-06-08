// AcousticPitchTrainer.tsx - Browser microphone real-time pitch detector trainer
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Award, ArrowLeft, Loader } from 'lucide-react';
import { playUIClick, playUIBack, playUISuccess, playNote } from '../utils/audioSynth';

interface AcousticPitchTrainerProps {
  user: { username: string; unlockedBadges: string[] } | null;
  onBack: () => void;
  onUpdateStats: (points: number) => void;
}

// target notes pool (easy notes for vocal and guitar EADGBE strings)
const TARGET_NOTES_POOL = [
  { note: 'E3', freq: 164.81, label: 'E string (Low E)' },
  { note: 'A3', freq: 220.00, label: 'A string / Concert A' },
  { note: 'D4', freq: 293.66, label: 'D string / Middle D' },
  { note: 'G4', freq: 392.00, label: 'G string / Standard G' },
  { note: 'B4', freq: 493.88, label: 'B string / Treble B' },
  { note: 'E4', freq: 329.63, label: 'High E string / Vocal Mid-High' },
  { note: 'C4', freq: 261.63, label: 'Middle C' },
  { note: 'F3', freq: 174.61, label: 'Low F' },
  { note: 'G3', freq: 196.00, label: 'Low G' },
  { note: 'A4', freq: 440.00, label: 'High A / Standard A440' }
];

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteFromFrequency(frequency: number) {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const roundedNoteNum = Math.round(noteNum) + 69; // MIDI note number
  const cents = Math.round((noteNum - Math.round(noteNum)) * 100);
  const noteName = NOTE_STRINGS[roundedNoteNum % 12];
  const octave = Math.floor(roundedNoteNum / 12) - 1;
  return {
    note: `${noteName}${octave}`,
    midi: roundedNoteNum,
    cents
  };
}

// Autocorrelation pitch detection algorithm
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.015) {
    return -1; // signal too quiet
  }

  let r1 = 0;
  let r2 = buffer.length - 1;
  const thres = 0.2;
  for (let i = 0; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = buffer.length - 1; i >= buffer.length / 2; i--) {
    if (Math.abs(buffer[i]) < thres) {
      r2 = i;
      break;
    }
  }
  const slicedBuffer = buffer.subarray(r1, r2);
  const len = slicedBuffer.length;

  const c = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i; j++) {
      c[i] = c[i] + slicedBuffer[j] * slicedBuffer[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < len; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export const AcousticPitchTrainer: React.FC<AcousticPitchTrainerProps> = ({ onBack, onUpdateStats }) => {
  const [gameState, setGameState] = useState<'briefing' | 'playing' | 'complete'>('briefing');
  const [micGranted, setMicGranted] = useState(false);
  const [loadingMic, setLoadingMic] = useState(false);

  // Tuner/Pitch tracking states
  const [detectedNote, setDetectedNote] = useState('---');
  const [detectedFreq, setDetectedFreq] = useState(0);
  const [centsDev, setCentsDev] = useState(0);

  // Game tracking
  const [questions, setQuestions] = useState<typeof TARGET_NOTES_POOL>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctHoldProgress, setCorrectHoldProgress] = useState(0); // 0 to 100%

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stabilityTimerRef = useRef<number | null>(null);

  const startPitchTracking = async () => {
    playUIClick();
    setLoadingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      
      analyser.fftSize = 2048;
      source.connect(analyser);

      streamRef.current = stream;
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      setMicGranted(true);
      setLoadingMic(false);

      // Start loop
      const buffer = new Float32Array(analyser.fftSize);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const freq = autoCorrelate(buffer, audioCtx.sampleRate);
        
        if (freq !== -1 && freq > 60 && freq < 800) {
          const noteInfo = getNoteFromFrequency(freq);
          setDetectedNote(noteInfo.note);
          setDetectedFreq(Math.round(freq));
          setCentsDev(noteInfo.cents);
        } else {
          setDetectedNote('---');
          setDetectedFreq(0);
          setCentsDev(0);
        }
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      animationFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('Microphone connection failed:', err);
      setLoadingMic(false);
      alert('Microphone access is required to play the Acoustic Pitch Matcher.');
    }
  };

  const handleStartGame = () => {
    playUIClick();
    // Shuffle and pick 5 notes
    const picked = [...TARGET_NOTES_POOL].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(picked);
    setQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectHoldProgress(0);
    setGameState('playing');
  };

  const handleHearReferenceNote = () => {
    if (gameState !== 'playing' || !questions[questionIndex]) return;
    playUIClick();
    const currentTarget = questions[questionIndex];
    // Play synth sound of the target frequency
    playNote(currentTarget.freq, 0.8, 'sine');
  };

  // Monitor pitch matches
  useEffect(() => {
    if (gameState !== 'playing' || !questions[questionIndex]) return;

    const currentTarget = questions[questionIndex].note;
    // Strip octaves if you want loose octaves (e.g. sing C3 for target C4),
    // but standard strict matching is great for tuning. We will do loose pitch names:
    const targetBaseName = currentTarget.replace(/[0-9]/g, '');
    const detectedBaseName = detectedNote.replace(/[0-9]/g, '');

    const isMatch = targetBaseName === detectedBaseName && Math.abs(centsDev) < 25; // within 25 cents

    if (isMatch) {
      if (!stabilityTimerRef.current) {
        let pct = 0;
        stabilityTimerRef.current = window.setInterval(() => {
          pct += 20; // 5 steps (takes 500ms total to complete)
          setCorrectHoldProgress(pct);
          if (pct >= 100) {
            clearInterval(stabilityTimerRef.current!);
            stabilityTimerRef.current = null;
            handleNoteSuccess();
          }
        }, 100);
      }
    } else {
      if (stabilityTimerRef.current) {
        clearInterval(stabilityTimerRef.current);
        stabilityTimerRef.current = null;
      }
      setCorrectHoldProgress(0);
    }

    return () => {
      if (stabilityTimerRef.current) {
        clearInterval(stabilityTimerRef.current);
        stabilityTimerRef.current = null;
      }
    };
  }, [detectedNote, centsDev, questionIndex, gameState]);

  const handleNoteSuccess = () => {
    playUISuccess();
    setScore(prev => prev + 20);
    setStreak(prev => prev + 1);
    setCorrectHoldProgress(0);

    // Advance
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex(prev => prev + 1);
    } else {
      // Completed!
      setTimeout(() => {
        playUISuccess();
        setGameState('complete');
        onUpdateStats(50); // Award 50 XP
        stopPitchTracking();
      }, 500);
    }
  };

  const stopPitchTracking = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stabilityTimerRef.current) {
      clearInterval(stabilityTimerRef.current);
      stabilityTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setMicGranted(false);
  };

  const handleLeave = () => {
    playUIBack();
    stopPitchTracking();
    onBack();
  };

  useEffect(() => {
    return () => {
      stopPitchTracking();
    };
  }, []);

  const currentTarget = questions[questionIndex];

  return (
    <div className="view-enter glass-panel" style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER */}
      <div className="flex-between" style={{ borderBottom: '2px solid var(--border-dark)', paddingBottom: '0.75rem' }}>
        <button onClick={handleLeave} className="btn-cyber flex-center" style={{ padding: '0.4rem 0.8rem', gap: '4px' }}>
          <ArrowLeft size={14} /> BACK
        </button>
        <span style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>🎤 PITCH MATCH DUEL</span>
      </div>

      {/* 1. BRIEFING MODE */}
      {gameState === 'briefing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', alignItems: 'center', padding: '1.5rem 0' }}>
          
          <div className="flex-center" style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', border: '2px solid var(--primary)' }}>
            <Mic size={32} style={{ color: 'var(--primary)' }} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Acoustic Pitch Matcher</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', maxWidth: '480px' }}>
              Test your physical guitar tuning or singing pitch! Enable your microphone, play the target note, and hold it stable to advance.
            </p>
          </div>

          {!micGranted ? (
            <button
              onClick={startPitchTracking}
              disabled={loadingMic}
              className="btn-cyber btn-cyber-primary"
              style={{ padding: '0.8rem 1.5rem', fontWeight: 'bold', minWidth: '220px' }}
            >
              {loadingMic ? (
                <span className="flex-center gap-2"><Loader className="animate-spin" size={16} /> CONNECTING MIC...</span>
              ) : (
                'ENABLE MICROPHONE'
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>✓ Microphone Active</span>
              <button
                onClick={handleStartGame}
                className="btn-cyber btn-cyber-secondary"
                style={{ padding: '0.8rem 2rem', fontWeight: 'bold' }}
              >
                START TRAINING ROUNDS
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. PLAYING MODE */}
      {gameState === 'playing' && currentTarget && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TOP BAR / PROGRESS */}
          <div className="flex-between" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <span>Note {questionIndex + 1} of {questions.length}</span>
            <span>Streak: {streak} 🔥</span>
          </div>

          {/* DUAL DIAL / TUNER GAUGE */}
          <div 
            style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              border: '2px solid var(--border-dark)', 
              boxShadow: '4px 4px 0 var(--border-dark)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            {/* Deviation gauge arch */}
            <div style={{ width: '100%', maxWidth: '280px', position: 'relative', height: '40px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1.5px solid var(--border-dark)', overflow: 'hidden' }}>
              {/* Center line (perfect tune) */}
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'var(--primary)', zIndex: 5 }} />
              {/* Needle marker */}
              {detectedFreq > 0 && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: `${50 + centsDev}%`, // -50% to +50% range
                    top: 0, 
                    bottom: 0, 
                    width: '6px', 
                    background: Math.abs(centsDev) < 20 ? 'var(--primary)' : 'var(--neon-danger)', 
                    borderRadius: '2px',
                    transition: 'left 0.1s ease',
                    zIndex: 10
                  }} 
                />
              )}
              <div className="flex-between" style={{ position: 'absolute', bottom: '2px', left: '10px', right: '10px', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                <span>FLAT</span>
                <span style={{ color: 'var(--primary)' }}>TUNE</span>
                <span>SHARP</span>
              </div>
            </div>

            {/* Pulsing Heard Note & Frequency */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: detectedNote !== '---' ? 'var(--secondary)' : 'var(--text-muted)' }}>
                {detectedNote}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {detectedFreq > 0 ? `${detectedFreq} Hz` : 'Quiet / No input'}
              </span>
            </div>
          </div>

          {/* TARGET CARD */}
          <div 
            style={{ 
              background: 'var(--card)', 
              border: '2px solid var(--border-dark)', 
              boxShadow: '4px 4px 0 var(--border-dark)',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
              PLAY / SING THIS NOTE:
            </span>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)' }}>
              {currentTarget.note}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({currentTarget.label})
            </span>

            {/* Action helpers */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                onClick={handleHearReferenceNote}
                className="btn-cyber flex-center"
                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', gap: '6px' }}
              >
                <Volume2 size={14} /> HEAR REFERENCE TONE
              </button>
            </div>

            {/* Stable hold progress indicator */}
            <div style={{ width: '100%', marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                STABILIZING PITCH: {correctHoldProgress}%
              </div>
              <div style={{ height: '10px', background: 'rgba(0,0,0,0.1)', border: '1.5px solid var(--border-dark)', borderRadius: '5px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${correctHoldProgress}%`, 
                    height: '100%', 
                    background: 'var(--primary)', 
                    transition: 'width 0.1s linear' 
                  }} 
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3. COMPLETE RESULT SCREEN */}
      {gameState === 'complete' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', alignItems: 'center', padding: '1.5rem 0' }}>
          
          <div className="flex-center" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', border: '2px solid var(--primary)', color: 'var(--primary)' }}>
            <Award size={40} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Practice Session Complete!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Excellent pitch work! You matched all target frequencies.
            </p>
          </div>

          <div style={{ background: 'var(--card)', border: '2px solid var(--border-dark)', padding: '1rem 2rem', borderRadius: '12px', display: 'flex', gap: '1.5rem', alignItems: 'center', boxShadow: '4px 4px 0 var(--border-dark)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REWARD BONUS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--secondary)', marginTop: '4px' }}>+50 XP</div>
            </div>
            
            <div style={{ width: '2px', height: '40px', background: 'var(--border-dark)' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PITCH ACCURACY</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '4px' }}>{score}% Match</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem' }}>
            <button
              onClick={handleStartGame}
              className="btn-cyber btn-cyber-primary"
              style={{ flex: 1, padding: '0.8rem', fontWeight: 'bold' }}
            >
              PLAY AGAIN
            </button>
            <button
              onClick={handleLeave}
              className="btn-cyber"
              style={{ flex: 1, padding: '0.8rem' }}
            >
              DASHBOARD
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
