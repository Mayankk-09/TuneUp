import React from 'react';
import { ArrowLeft, Award, Zap, RefreshCw, Star } from 'lucide-react';
import { Mascot } from './Mascot';
import { playUIClick, playUISuccess, playTestEndMusic } from '../utils/audioSynth';

interface ExerciseWrapperProps {
  title: string;
  subtitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  onDifficultyChange: (diff: 'easy' | 'medium' | 'hard') => void;
  onBack: () => void;
  difficultyDisabled?: boolean;
  answerStatus?: 'unanswered' | 'correct' | 'incorrect';
  userHasSelected?: boolean;
  
  // Game states
  score: number;
  questionIndex: number;
  totalQuestions: number;
  streak: number;
  
  // Quiz completion status
  isComplete: boolean;
  onRestart: () => void;
  correctAnswersCount: number;
  unlockedBadge?: string;
  lyricUnlock?: string;
  
  onStartTest?: (difficulty: 'easy' | 'medium' | 'hard', numQuestions: number) => void;
  children: React.ReactNode;
}

export const ExerciseWrapper: React.FC<ExerciseWrapperProps> = ({
  title,
  subtitle,
  difficulty,
  onBack,
  answerStatus = 'unanswered',
  userHasSelected = false,
  score,
  questionIndex,
  totalQuestions,
  streak,
  isComplete,
  onRestart,
  correctAnswersCount,
  unlockedBadge,
  lyricUnlock,
  onStartTest,
  children
}) => {
  const percentComplete = Math.min(100, Math.round((questionIndex / totalQuestions) * 100));

  const [compress, setCompress] = React.useState(false);
  const [isBriefed, setIsBriefed] = React.useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<'easy' | 'medium' | 'hard'>(difficulty);
  const [selectedNumQuestions, setSelectedNumQuestions] = React.useState<number>(10);

  React.useEffect(() => {
    setSelectedDifficulty(difficulty);
  }, [difficulty]);

  const isEarTraining = title.toLowerCase().includes('interval') || title.toLowerCase().includes('chord quality') || title.toLowerCase().includes('melodic') || title.toLowerCase().includes('ear') || title.toLowerCase().includes('chords');
  const isInstrument = title.toLowerCase().includes('diagram') || title.toLowerCase().includes('fretboard') || title.toLowerCase().includes('transposer') || title.toLowerCase().includes('guitar') || title.toLowerCase().includes('tab') || title.toLowerCase().includes('finder') || title.toLowerCase().includes('riff');

  React.useEffect(() => {
    if (!isComplete) {
      setIsBriefed(false);
    }
  }, [isComplete, difficulty]);

  React.useEffect(() => {
    if (!isBriefed && !isComplete) {
      const timer = setTimeout(() => {
        playUISuccess();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isBriefed, isComplete]);

  React.useEffect(() => {
    if (questionIndex > 0 && !isComplete) {
      setCompress(true);
      const timer = setTimeout(() => setCompress(false), 400);
      return () => clearTimeout(timer);
    }
  }, [questionIndex, isComplete]);

  React.useEffect(() => {
    if (isComplete) {
      const percentage = Math.round((correctAnswersCount / totalQuestions) * 100);
      playTestEndMusic(percentage);
    }
  }, [isComplete, correctAnswersCount, totalQuestions]);

  // Determine card tilt
  let leanClass = '';
  if (userHasSelected || answerStatus !== 'unanswered') {
    leanClass = questionIndex % 2 === 0 ? 'card-lean-left' : 'card-lean-right';
  }

  // Determine active dynamic classes
  const isAnswered = answerStatus !== 'unanswered';
  const contentClass = `card-lean-container ${leanClass} ${compress ? 'card-compress' : ''} ${isAnswered ? 'card-waveform-bg' : ''}`;

  // Determine difficulty styling
  const getDiffColor = (d: 'easy' | 'medium' | 'hard') => {
    if (d === 'easy') return 'cyan';
    if (d === 'medium') return 'orange';
    return 'magenta';
  };

  if (!isBriefed && !isComplete) {
    let instruction = "Practice makes perfect! Spell notes and hit the targets. All the best! 🎼";
    if (isEarTraining) {
      instruction = "Audio check! Listen closely and identify the sound. Turn up your device volume! All the best! 🎧🔊";
    } else if (title.toLowerCase().includes('spelling')) {
      instruction = "Spell note intervals to build the requested chord types. Hit the notes on the keyboard. All the best! 🎹";
    } else if (title.toLowerCase().includes('naming')) {
      instruction = "Identify the chords from their spelled notes. Click the correct chord name to select. All the best! 🎼";
    } else if (title.toLowerCase().includes('families')) {
      instruction = "Diatonic scale family check! Find the chord that doesn't belong or identify the scale degrees. All the best! 🎶";
    } else if (title.toLowerCase().includes('scale')) {
      instruction = "Identify specific note scale degrees. Fill in the correct notes. All the best! 🎵";
    } else if (isInstrument) {
      if (title.toLowerCase().includes('diagrams')) {
        instruction = "Choose the correct fret layout diagrams for guitar/ukulele chord shapes. All the best! 🎸";
      } else if (title.toLowerCase().includes('fretboard') || title.toLowerCase().includes('finder')) {
        instruction = "Find the notes on guitar string frets. Enter note names. All the best! 🎸";
      } else {
        instruction = "Transpose guitar tabs and note sequences to different keys. All the best! 🎚";
      }
    }

    return (
      <div 
        className="view-enter glass-panel" 
        style={{ 
          padding: '2.5rem 2rem', 
          maxWidth: '500px', 
          width: '100%', 
          margin: '2rem auto', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Get ready!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{title}</p>
        </div>

        <Mascot state="celebrating" message={instruction} />

        {/* Start Settings Panel */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Difficulty Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>CHOOSE DIFFICULTY</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {(['easy', 'medium', 'hard'] as const).map(d => {
                const isActive = d === selectedDifficulty;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { playUIClick(); setSelectedDifficulty(d); }}
                    className={`btn-cyber ${isActive ? (d === 'easy' ? 'btn-cyber-secondary' : d === 'medium' ? 'btn-cyber-orange' : 'btn-cyber-magenta') : ''}`}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.5rem 0.25rem',
                      textTransform: 'capitalize',
                      opacity: isActive ? 1 : 0.65,
                      fontWeight: isActive ? 'bold' : 'normal'
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>NUMBER OF QUESTIONS</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {([5, 10] as const).map(q => {
                const isActive = q === selectedNumQuestions;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => { playUIClick(); setSelectedNumQuestions(q); }}
                    className={`btn-cyber ${isActive ? 'btn-cyber-primary' : ''}`}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.5rem 0.25rem',
                      opacity: isActive ? 1 : 0.65,
                      fontWeight: isActive ? 'bold' : 'normal'
                    }}
                  >
                    {q} Questions
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            playUIClick();
            if (onStartTest) {
              onStartTest(selectedDifficulty, selectedNumQuestions);
            }
            setIsBriefed(true);
          }}
          className="neo-btn btn-cyber-primary"
          style={{
            padding: '0.75rem 2.5rem',
            fontSize: '0.95rem',
            borderRadius: '12px',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '0.5rem',
            boxShadow: '0 8px 24px rgba(124, 92, 255, 0.25)'
          }}
        >
          Let's play!
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', maxWidth: '700px', width: '100%', margin: '0 auto' }}>
      
      {/* Decorative Background Textures */}
      <div style={{ position: 'absolute', left: '-120px', top: '10%', opacity: 0.03, pointerEvents: 'none', color: '#fff', zIndex: 0 }}>
        {/* Keyboard SVG */}
        <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M6 3v12" />
          <path d="M10 3v12" />
          <path d="M14 3v12" />
          <path d="M18 3v12" />
          <path d="M2 15h20" />
        </svg>
      </div>
      <div style={{ position: 'absolute', right: '-120px', top: '40%', opacity: 0.03, pointerEvents: 'none', color: '#fff', zIndex: 0 }}>
        {/* Guitar SVG */}
        <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>

      {/* Desktop Mascot on the right */}
      <div className="exercise-mascot-desktop" style={{ position: 'absolute', right: '-120px', bottom: '20px', zIndex: 10 }}>
        <Mascot 
          state={isComplete ? 'celebrating' : answerStatus === 'correct' ? 'celebrating' : answerStatus === 'incorrect' ? 'sleeping' : 'idle'}
          message={
            isComplete 
              ? "Cleared! Rockstar! 🏆" 
              : answerStatus === 'correct' 
                ? "Spot on! ⚡" 
                : answerStatus === 'incorrect' 
                  ? "Ouch! Study this note. 🎧" 
                  : (streak >= 3)
                    ? `🔥 ${streak}-day streak!`
                    : isEarTraining
                      ? "Listening mode active. Focus on the pitch. 🎧"
                      : isInstrument
                        ? "Guitar challenge ready. Find the frets! 🎸"
                        : "Practice makes perfect! 🎼"
          }
        />
      </div>

      <div className={`view-enter glass-panel ${contentClass}`} style={{ padding: '1.5rem', position: 'relative' }}>
        
        {/* Mobile Mascot placed inside card top header */}
        <div className="exercise-mascot-mobile" style={{ display: 'none', textAlign: 'center', marginBottom: '1.5rem' }}>
          <Mascot 
            state={isComplete ? 'celebrating' : answerStatus === 'correct' ? 'celebrating' : answerStatus === 'incorrect' ? 'sleeping' : 'idle'}
            message={
              isComplete 
                ? "Cleared! 🏆" 
                : answerStatus === 'correct' 
                  ? "Correct! ⚡" 
                  : answerStatus === 'incorrect' 
                    ? "Oops! 🎧" 
                    : isEarTraining
                      ? "Listening mode active. 🎧"
                      : isInstrument
                        ? "Guitar challenge ready! 🎸"
                        : "Spell the notes! 🎼"
            }
          />
        </div>

        {/* Quiz Top Header */}
        <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem', position: 'relative', zIndex: 5 }}>
          <button 
            onClick={onBack}
            className="btn-cyber"
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem', textTransform: 'none' }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          {/* Difficulty display badge */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <span className={`quirky-badge ${getDiffColor(difficulty)}`} style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '0.35rem 0.8rem', border: 'none' }}>
              {difficulty}
            </span>
          </div>
        </div>

        {/* Progress & Scores Bar */}
        <div 
          style={{ 
            background: 'rgba(0,0,0,0.2)', 
            padding: '0.75rem 1rem', 
            borderRadius: '8px', 
            border: '1px solid rgba(255,255,255,0.03)',
            marginBottom: '1.5rem'
          }}
        >
          <div className="flex-between" style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Question {Math.min(questionIndex + 1, totalQuestions)} of {totalQuestions}
            </span>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {streak > 2 && (
                <span className="quirky-badge orange" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                  <Zap size={10} fill="currentColor" /> {streak} streak!
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-stats)', fontWeight: 'bold' }}>
                Score: <span className="neon-text-cyan">{score}</span>
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${percentComplete}%`, 
                height: '100%', 
                background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                boxShadow: '0 0 8px rgba(124, 92, 255, 0.3)',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
              }}
            />
          </div>
        </div>

        {/* Volume warning notice for ear training */}
        {isEarTraining && !isComplete && (
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
              marginBottom: '1.25rem',
              lineHeight: 1.4
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>🔊</span>
            <span>Check your device volume to make sure your sound is turned up!</span>
          </div>
        )}

        {/* Exercise Content Area */}
        {!isComplete ? (
          <div style={{ minHeight: '300px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }} className="neon-text-cyan">{title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>{subtitle}</p>
            </div>
            {children}
          </div>
        ) : (
          /* QUIZ COMPLETE SUMMARY VIEW */
          <div className="view-enter" style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            
            <div 
              className="flex-center" 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'rgba(124, 92, 255, 0.1)', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
                color: 'var(--primary)',
                animation: 'pulse 1.5s infinite alternate'
              }}
            >
              <Award size={40} />
            </div>

            <div>
              <h3 style={{ fontSize: '2rem' }}>Round cleared!</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                You correctly answered {correctAnswersCount} out of {totalQuestions} questions.
              </p>
            </div>

            {/* VIBE CHECK / SONG REWARDS CARD */}
            {(unlockedBadge || lyricUnlock) && (
              <div 
                className="glass-card" 
                style={{ 
                  maxWidth: '400px', 
                  width: '100%', 
                  background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.1), rgba(83, 216, 251, 0.05))',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
                  padding: '1.25rem',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <Star size={14} fill="currentColor" /> Unlocked musical vibes
                </div>
                
                {unlockedBadge && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TRACK UNLOCKED:</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>
                      🏆 "{unlockedBadge}"
                    </div>
                  </div>
                )}

                {lyricUnlock && (
                  <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', borderLeft: '3px solid var(--primary)', paddingLeft: '8px', textAlign: 'left' }}>
                    "{lyricUnlock}"
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={onRestart}
                className="btn-cyber btn-cyber-primary"
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 2rem', textTransform: 'none' }}
              >
                <RefreshCw size={16} /> Play again
              </button>
              <button 
                onClick={onBack}
                className="btn-cyber"
                style={{ padding: '0.75rem 1.5rem', textTransform: 'none' }}
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
