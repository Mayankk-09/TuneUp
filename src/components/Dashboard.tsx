// Dashboard.tsx - Main Hub Page for TuneUp Music Theory App

import React, { useState, useEffect } from 'react';
import { 
  Music, BookOpen, Guitar, 
  Play, Radio, Award, Smile 
} from 'lucide-react';
import { getSongSuggestions } from '../utils/musicEngine';
import { HeroSection } from './HeroSection';
import { Mascot } from './Mascot';

interface DashboardProps {
  stats: {
    streak: number;
    score: number;
    completed: number;
    masteredChords: string[];
  };
  onSelectExercise: (exerciseId: string, presetName?: string) => void;
  onSelectSong?: (title: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, onSelectExercise, onSelectSong }) => {
  const [mascotState, setMascotState] = useState<'sleeping' | 'dancing' | 'fail-guitar' | 'fail-singing' | 'fail-headphones' | 'fail-drums'>('sleeping');

  useEffect(() => {
    if (stats.streak === 0) {
      setMascotState('sleeping');
      return;
    }

    setMascotState('dancing');
    
    const cycle = () => {
      const failStates: ('fail-guitar' | 'fail-singing' | 'fail-headphones' | 'fail-drums')[] = [
        'fail-guitar', 'fail-singing', 'fail-headphones', 'fail-drums'
      ];
      
      const timerToFail = setTimeout(() => {
        const randomFail = failStates[Math.floor(Math.random() * failStates.length)];
        setMascotState(randomFail);
        
        const timerToDance = setTimeout(() => {
          setMascotState('dancing');
          cycle();
        }, 4000);
        
        return () => clearTimeout(timerToDance);
      }, 10000);

      return () => clearTimeout(timerToFail);
    };

    const cleanup = cycle();
    return () => {
      if (cleanup) cleanup();
    };
  }, [stats.streak]);

  const getMascotMessage = () => {
    if (stats.streak === 0) {
      return "Start a practice round to wake me up! 💤";
    }
    switch (mascotState) {
      case 'fail-guitar':
        return "Oh snap! Snapped guitar string! 🎸";
      case 'fail-singing':
        return "Too hot! Microphone burning up! 🎤";
      case 'fail-headphones':
        return "Ouch! Headphone static spark! ⚡";
      case 'fail-drums':
        return "Boom! Drumskin cracked! 🥁";
      case 'dancing':
      default:
        return `🔥 ${stats.streak}-day streak! Let's rock! 🕺`;
    }
  };

  // Calculate suggestions based on mastered chords list
  const { playable, almostPlayable } = getSongSuggestions(stats.masteredChords);

  // Define achievements/badges and their unlocking rules
  const BADGES = [
    { id: 'lucky', title: 'Get Lucky', artist: 'Daft Punk', condition: 'Score 100+ points', isUnlocked: stats.score >= 100 },
    { id: 'zombie', title: 'Zombie', artist: 'The Cranberries', condition: 'Score 250+ points', isUnlocked: stats.score >= 250 },
    { id: 'bamba', title: 'La Bamba', artist: 'Richie Valens', condition: 'Complete 5 exercises', isUnlocked: stats.completed >= 5 },
    { id: 'space', title: 'Space Oddity', artist: 'David Bowie', condition: 'Reach a 5-streak', isUnlocked: stats.streak >= 5 },
  ];

  return (
    <div className="view-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Dynamic Soundwave Hero Section */}
      <HeroSection />

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '2rem'
        }}
        className="grid-cols-2" // responsiveness helper class
      >
        {/* LEFT COLUMN: PRACTICE AREAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }} id="practice-section">
          
          {/* 1. Core Theory */}
          <div>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-light)' }}>
              <BookOpen size={20} style={{ color: 'var(--primary)' }} /> Core music theory
            </h3>
            <div className="grid-cols-2">
              <div className="glass-card" onClick={() => onSelectExercise('chord-spelling')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--secondary)', background: 'rgba(83, 216, 251, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Practice
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Chord Spelling</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Given a chord name, spell the notes (e.g. 1st, 3rd, 5th).
                  </p>
                </div>
              </div>

              <div className="glass-card" onClick={() => onSelectExercise('chord-naming')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--secondary)', background: 'rgba(83, 216, 251, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Practice
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Chord Naming</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Look at notes, guess the exact chord name.
                  </p>
                </div>
              </div>

              <div className="glass-card" onClick={() => onSelectExercise('chord-families')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--neon-orange)', background: 'rgba(255, 140, 97, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Understand
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Chord Families</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Diatonic chord groups, scale degrees, and finding the odd chord out.
                  </p>
                </div>
              </div>

              <div className="glass-card" onClick={() => onSelectExercise('scale-degrees')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--neon-orange)', background: 'rgba(255, 140, 97, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Understand
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Scale Notes</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Find specific degrees (e.g. what is the 5th notes of A major scale).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Instrument Based */}
          <div>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-light)' }}>
              <Guitar size={20} style={{ color: 'var(--secondary)' }} /> Instrument theory
            </h3>
            <div className="grid-cols-2">
              <div className="glass-card" onClick={() => onSelectExercise('chord-diagrams')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--neon-orange)', background: 'rgba(255, 140, 97, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Understand
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Chord Diagrams</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Select the correct fretboard layout shape for a given chord.
                  </p>
                </div>
              </div>

              <div className="glass-card" onClick={() => onSelectExercise('fretboard-finder')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--secondary)', background: 'rgba(83, 216, 251, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Practice
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Fretboard Note Finder</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    "What is the 5th fret of the B string?" No options, text input.
                  </p>
                </div>
              </div>

              <div className="glass-card" onClick={() => onSelectExercise('riff-transposer')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--neon-orange)', background: 'rgba(255, 140, 97, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Understand
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Tab Transposer</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Transpose guitar tabs to another key or translate notes to another string.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Ear Training */}
          <div>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-light)' }}>
              <Radio size={20} style={{ color: 'var(--primary)' }} /> Ear training room
            </h3>
            <div className="grid-cols-2">
              <div className="glass-card" onClick={() => onSelectExercise('ear-intervals')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--primary)', background: 'rgba(124, 92, 255, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Hear
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Interval Guesser</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Listen to two notes played sequentially or together, guess the interval.
                  </p>
                </div>
              </div>

              <div className="glass-card" onClick={() => onSelectExercise('ear-chords')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--primary)', background: 'rgba(124, 92, 255, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Hear
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Chord Quality Trainer</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Listen to a chord block, identify Major, Minor, Diminished, etc.
                  </p>
                </div>
              </div>

              <div className="glass-card" onClick={() => onSelectExercise('ear-melody')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--primary)', background: 'rgba(124, 92, 255, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Hear
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Melodic Dictation</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Listen to a melody line, repeat the notes on the interactive keyboard.
                  </p>
                </div>
              </div>

              <div className="glass-card" onClick={() => onSelectExercise('ear-acoustic')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.03) 0%, var(--card) 100%)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--primary)', background: 'rgba(22, 163, 74, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Mic Input
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Acoustic Pitch Matcher</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Enable your microphone, play/sing pitches, and verify notes dynamically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Playgrounds & Utilities */}
          <div>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-light)' }}>
              <Play size={20} style={{ color: 'var(--secondary)' }} /> Studios & jam rooms
            </h3>
            <div className="grid-cols-2">
              <div className="glass-card" onClick={() => onSelectExercise('jam-buddy')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', background: 'linear-gradient(135deg, rgba(89, 217, 142, 0.04) 0%, var(--card) 100%)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--neon-success)', background: 'rgba(89, 217, 142, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Play
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>AI Jam Buddy Studio</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Set up a scale key, pick backing tracks, and jam over procedural live synth tracks!
                  </p>
                </div>
              </div>

              <div className="glass-card" onClick={() => onSelectExercise('sandbox')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--neon-success)', background: 'rgba(89, 217, 142, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Play
                    </span>
                  </div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '1.05rem', fontWeight: 600 }}>Free Sandbox Playground</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    Free-play instrument board (piano & fretboards) with live chord spelling detector!
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REWARDS, SONGS & UNLOCKS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Mascot Vibe Check Card */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: '1.75rem', 
              display: 'flex',
              flexDirection: 'row', 
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem',
              background: 'var(--surface)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
              borderRadius: '16px',
              minHeight: '220px'
            }}
          >
            {/* Left side: Mascot & message bubble */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '130px' }}>
              <Mascot 
                state={mascotState}
                message={getMascotMessage()}
              />
            </div>
            
            {/* Divider */}
            <div style={{ width: '1px', height: '120px', background: 'rgba(255, 255, 255, 0.08)' }} />
            
            {/* Right side: Streak Flame & Title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: '120px' }}>
              <div className="streak-flame-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="blink-thunderbolt" style={{ fontSize: '3.5rem', filter: stats.streak > 0 ? 'drop-shadow(0 0 10px rgba(255, 230, 0, 0.5))' : 'grayscale(1)', opacity: stats.streak > 0 ? 1 : 0.4 }}>🔥</span>
                {stats.streak > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '55%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    fontSize: '1.4rem', 
                    fontWeight: 900, 
                    color: '#fff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)' 
                  }}>
                    {stats.streak}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: stats.streak > 0 ? 'var(--neon-yellow)' : 'var(--text-muted)', fontFamily: 'var(--font-heading)', marginTop: '8px', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center' }}>
                {stats.streak > 0 ? `${stats.streak}-DAY STREAK` : 'STREAK INACTIVE'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px', lineHeight: 1.35 }}>
                {stats.streak > 0 ? 'Daily learning is active!' : 'Practice chords to wake me up.'}
              </p>
            </div>
          </div>

          {/* Song Recommendation Feed */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-light)', fontWeight: 600 }}>
              <Music size={16} style={{ color: 'var(--primary)' }} /> Songs you can play
            </h3>
            
            {stats.masteredChords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Smile size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                Practice spelling chords! Once you master them, real-world songs will appear here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* 1. Playable now */}
                {playable.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--neon-success)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                      Ready to play now (100% Mastered)
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {playable.map((song, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => onSelectSong?.(song.title)}
                          style={{ 
                            background: 'rgba(89, 217, 142, 0.05)', 
                            border: '1px solid rgba(89, 217, 142, 0.15)', 
                            padding: '0.6rem', 
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(89, 217, 142, 0.1)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(89, 217, 142, 0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{song.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{song.artist}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>"{song.lyricQuote}"</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Almost Playable */}
                {almostPlayable.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--neon-orange)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                      Almost playable (Need 1-2 chords)
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {almostPlayable.map((item, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => onSelectSong?.(item.song.title)}
                          style={{ 
                            background: 'rgba(255, 140, 97, 0.03)', 
                            border: '1px solid rgba(255, 140, 97, 0.08)', 
                            padding: '0.6rem', 
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 140, 97, 0.06)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 140, 97, 0.03)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{item.song.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.song.artist}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--neon-orange)', marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span>Learn:</span>
                            {item.missing.map(chord => (
                              <button
                                key={chord}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectExercise('chord-spelling', chord);
                                }}
                                style={{
                                  background: 'rgba(255, 140, 97, 0.1)',
                                  border: '1px solid rgba(255, 140, 97, 0.3)',
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  fontSize: '0.65rem',
                                  color: 'var(--neon-orange)',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  outline: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 140, 97, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 140, 97, 0.1)';
                                }}
                              >
                                {chord}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Setlist Achievements Progress */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-light)', fontWeight: 600 }}>
              <Award size={16} style={{ color: 'var(--secondary)' }} /> Setlist track unlocks
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {BADGES.map((b, idx) => {
                const handleClick = () => {
                  if (b.isUnlocked) {
                    onSelectSong?.(b.title);
                  }
                };
                return (
                  <div 
                    key={idx} 
                    onClick={handleClick}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      background: b.isUnlocked ? 'rgba(124, 92, 255, 0.04)' : 'rgba(0,0,0,0.15)',
                      border: b.isUnlocked ? '1px solid rgba(124, 92, 255, 0.2)' : '1px solid rgba(255,255,255,0.03)',
                      opacity: b.isUnlocked ? 1 : 0.6,
                      cursor: b.isUnlocked ? 'pointer' : 'default',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (b.isUnlocked) {
                        e.currentTarget.style.background = 'rgba(124, 92, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (b.isUnlocked) {
                        e.currentTarget.style.background = 'rgba(124, 92, 255, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(124, 92, 255, 0.2)';
                      }
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: b.isUnlocked ? 'var(--text-light)' : 'var(--text-secondary)' }}>
                        {b.isUnlocked ? '🎵' : '🔒'} {b.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.artist}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--secondary)', marginTop: '2px' }}>Requires: {b.condition}</div>
                    </div>
                    
                    {b.isUnlocked && (
                      <span className="quirky-badge" style={{ fontSize: '0.6rem', color: 'var(--primary)', background: 'rgba(124, 92, 255, 0.15)', border: 'none' }}>
                        Unlocked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
