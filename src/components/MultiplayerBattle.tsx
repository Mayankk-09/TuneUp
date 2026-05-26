// MultiplayerBattle.tsx - Speed Theory Duels against Simulated AI Opponents

import React, { useState, useEffect, useRef } from 'react';
import { Swords, Heart, Trophy, Zap } from 'lucide-react';
import { playUIClick, playUIBack, playUISuccess, playUIFailure } from '../utils/audioSynth';
import { getChordNotes, CHORD_FORMULAS, getScaleNotes, SCALE_FORMULAS } from '../utils/musicEngine';

interface MultiplayerBattleProps {
  onBack: () => void;
  onUpdateStats: (points: number) => void;
}

interface BattleQuestion {
  prompt: string;
  correctAnswer: string;
  options: string[];
}

const AI_OPPONENTS = [
  { name: 'Synth Cat 🐱', difficulty: 'easy', responseTimeRange: [4000, 6000], damage: 10, xpReward: 40 },
  { name: 'Dr. Saxophone 🎷', difficulty: 'medium', responseTimeRange: [3000, 4500], damage: 15, xpReward: 60 },
  { name: 'Duolingo Rockstar Owl 🦉', difficulty: 'hard', responseTimeRange: [2000, 3200], damage: 20, xpReward: 100 }
];

const getRandomElement = <T,>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const getIsChordQuestion = (): boolean => {
  return Math.random() > 0.5;
};

const getRandomDegree = (): number => {
  return Math.floor(Math.random() * 4) + 1;
};

const shuffleOptions = <T,>(arr: T[]): T[] => {
  return [...arr].sort(() => Math.random() - 0.5);
};

const getAiResponseDelay = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min)) + min;
};

export const MultiplayerBattle: React.FC<MultiplayerBattleProps> = ({ onBack, onUpdateStats }) => {
  const [battleState, setBattleState] = useState<'lobby' | 'fighting' | 'won' | 'lost'>('lobby');
  const [selectedOpponentIdx, setSelectedOpponentIdx] = useState(0);
  
  // HP bars
  const [userHp, setUserHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  
  // Game states
  const [question, setQuestion] = useState<BattleQuestion | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
  const [clickedOption, setClickedOption] = useState('');
  
  // Battle log history
  const [battleLog, setBattleLog] = useState<string[]>(['Match initialized.']);
  
  // Timing references
  const aiTimerRef = useRef<number | null>(null);
  const activeOpponent = AI_OPPONENTS[selectedOpponentIdx];

  const generateBattleQuestion = () => {
    setAnswerStatus('unanswered');
    setClickedOption('');

    // Generate random scale degree or chord speller questions
    const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#'];
    const randomRoot = getRandomElement(roots);
    const isChordQuestion = getIsChordQuestion();

    let promptText = '';
    let correct = '';
    let opts: string[] = [];

    if (isChordQuestion) {
      const formulas = Object.values(CHORD_FORMULAS);
      const randomFormula = getRandomElement(formulas);
      const notes = getChordNotes(randomRoot, randomFormula.name);
      
      promptText = `Spell the root notes of: ${randomRoot} ${randomFormula.displayName}`;
      correct = notes.join(' - ');
      
      opts = [correct];
      while (opts.length < 4) {
        const rRoot = getRandomElement(roots);
        const rNotes = getChordNotes(rRoot, randomFormula.name).join(' - ');
        if (!opts.includes(rNotes)) {
          opts.push(rNotes);
        }
      }
    } else {
      const formulas = Object.values(SCALE_FORMULAS);
      const randomFormula = getRandomElement(formulas);
      const notes = getScaleNotes(randomRoot, randomFormula.name);
      const degree = getRandomDegree(); // 1st to 5th notes
      
      promptText = `Identify note degree ${degree + 1} of scale: ${randomRoot} ${randomFormula.displayName}`;
      correct = notes[degree];
      
      opts = [correct];
      while (opts.length < 4) {
        const rNote = getRandomElement(roots);
        if (!opts.includes(rNote)) {
          opts.push(rNote);
        }
      }
    }

    const shuffled = shuffleOptions(opts);
    setQuestion({ prompt: promptText, correctAnswer: correct, options: shuffled });

    // Schedule AI's next move
    scheduleAiMove();
  };

  const scheduleAiMove = () => {
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);

    const [minTime, maxTime] = activeOpponent.responseTimeRange;
    const aiResponseDelay = getAiResponseDelay(minTime, maxTime);

    aiTimerRef.current = window.setTimeout(() => {
      // AI hits user
      handleAiStrike();
    }, aiResponseDelay);
  };

  const handleAiStrike = () => {
    if (battleState !== 'fighting' || answerStatus !== 'unanswered') return;

    playUIFailure();
    setAnswerStatus('incorrect');
    
    // User takes damage
    const damageDealt = activeOpponent.damage;
    setUserHp(prev => {
      const nextHp = Math.max(0, prev - damageDealt);
      if (nextHp <= 0) {
        triggerEndBattle(false);
      }
      return nextHp;
    });

    setBattleLog(prev => [`💥 ${activeOpponent.name} answered faster and hit you for ${damageDealt} DMG!`, ...prev]);

    // Next round delay
    setTimeout(() => {
      if (userHp > damageDealt && opponentHp > 0) {
        generateBattleQuestion();
      }
    }, 1500);
  };

  const handleUserAnswerClick = (option: string) => {
    if (answerStatus !== 'unanswered' || !question) return;
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);

    setClickedOption(option);
    const isCorrect = option === question.correctAnswer;

    if (isCorrect) {
      playUISuccess();
      setAnswerStatus('correct');
      
      // Opponent takes damage
      const damageDealt = 20; // flat user strike power
      setOpponentHp(prev => {
        const nextHp = Math.max(0, prev - damageDealt);
        if (nextHp <= 0) {
          triggerEndBattle(true);
        }
        return nextHp;
      });

      setBattleLog(prev => [`⚔️ You answered correctly! You strike ${activeOpponent.name} for ${damageDealt} DMG!`, ...prev]);
    } else {
      playUIFailure();
      setAnswerStatus('incorrect');
      
      // User fumbles and takes counter attack damage
      const counterDmg = Math.round(activeOpponent.damage * 0.75);
      setUserHp(prev => {
        const nextHp = Math.max(0, prev - counterDmg);
        if (nextHp <= 0) {
          triggerEndBattle(false);
        }
        return nextHp;
      });

      setBattleLog(prev => [`💥 Wrong answer! ${activeOpponent.name} counter-attacks for ${counterDmg} DMG!`, ...prev]);
    }

    // Move to next question after brief delay
    setTimeout(() => {
      if (userHp > 0 && opponentHp > 20) { // check if opponent is still alive
        generateBattleQuestion();
      }
    }, 1500);
  };

  const triggerEndBattle = (userWon: boolean) => {
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    
    if (userWon) {
      playUISuccess();
      setBattleState('won');
      onUpdateStats(activeOpponent.xpReward); // Claim XP
    } else {
      playUIFailure();
      setBattleState('lost');
    }
  };

  const handleStartFight = () => {
    playUIClick();
    setUserHp(100);
    setOpponentHp(100);
    setBattleLog(['Duel started! Answer theory questions as fast as you can.']);
    setBattleState('fighting');
    setTimeout(() => {
      generateBattleQuestion();
    }, 500);
  };

  const handleLeaveBattle = () => {
    playUIBack();
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    onBack();
  };

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    };
  }, []);

  return (
    <div className="view-enter glass-panel" style={{ padding: '2rem', maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. LOBBY SCREEN */}
      {battleState === 'lobby' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', alignItems: 'center' }}>
          
          <div className="flex-center" style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(157,78,221,0.1)', border: '2px solid var(--neon-purple)' }}>
            <Swords size={32} style={{ color: 'var(--neon-purple)' }} />
          </div>

          <div>
            <h2 className="neon-text-purple" style={{ fontSize: '1.75rem' }}>Cyber Arena Duels</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Speed theory match. Battle simulated AI bots to claim large XP rewards!
            </p>
          </div>

          {/* Opponent Selection list */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
              SELECT BATTLE OPPONENT:
            </span>
            {AI_OPPONENTS.map((bot, idx) => {
              const isSelected = selectedOpponentIdx === idx;
              return (
                <div
                  key={bot.name}
                  onClick={() => { playUIClick(); setSelectedOpponentIdx(idx); }}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    cursor: 'pointer',
                    borderWidth: isSelected ? '2px' : '1px',
                    borderColor: isSelected ? 'var(--neon-purple)' : 'rgba(255,255,255,0.05)',
                    background: isSelected ? 'rgba(157,78,221,0.05)' : 'rgba(0,0,0,0.15)',
                    boxShadow: isSelected ? '0 0 10px rgba(157,78,221,0.2)' : 'none',
                    transform: isSelected ? 'scale(1.02)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{bot.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      DIFFICULTY: {bot.difficulty} • ATK: {bot.damage} HP
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>
                    +{bot.xpReward} XP
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
            <button
              onClick={handleLeaveBattle}
              className="btn-cyber"
              style={{ flex: 1, padding: '0.8rem' }}
            >
              LEAVE ARENA
            </button>
            <button
              onClick={handleStartFight}
              className="btn-cyber btn-cyber-primary"
              style={{ flex: 2, padding: '0.8rem', fontWeight: 'bold' }}
            >
              ENTER BATTLE
            </button>
          </div>

        </div>
      )}

      {/* 2. FIGHTING ACTIVE BATTLE */}
      {battleState === 'fighting' && question && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Health bars section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>
            {/* User HP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="flex-between" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <span>🛡️ PLAYER HP</span>
                <span style={{ color: 'var(--neon-success)', fontWeight: 'bold' }}>{userHp}%</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid #000' }}>
                <div style={{ width: `${userHp}%`, height: '100%', background: 'var(--neon-success)', transition: 'width 0.2s ease' }} />
              </div>
            </div>

            {/* VS */}
            <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', padding: '0.3rem 0.6rem', background: '#000', borderRadius: '4px', border: '1.5px solid var(--neon-purple)' }}>
              VS
            </div>

            {/* Opponent HP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="flex-between" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <span>👾 {activeOpponent.name.split(' ')[0].toUpperCase()} HP</span>
                <span style={{ color: 'var(--neon-danger)', fontWeight: 'bold' }}>{opponentHp}%</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid #000' }}>
                <div style={{ width: `${opponentHp}%`, height: '100%', background: 'var(--neon-danger)', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          </div>

          {/* Active Question Box */}
          <div 
            style={{ 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '12px', 
              border: '2.5px solid #000', 
              boxShadow: '4px 4px 0 #000',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <Zap size={10} fill="currentColor" /> FAST RESPONSE ACTIVE
            </div>
            
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
              SPEED QUESTION:
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {question.prompt}
            </h3>
          </div>

          {/* Multi choice Grid */}
          <div className="options-grid">
            {question.options.map((option, idx) => {
              const isClicked = option === clickedOption;
              const isCorrectAnswer = option === question.correctAnswer;
              
              let optClass = 'option-btn';
              if (answerStatus !== 'unanswered') {
                if (isCorrectAnswer) optClass += ' correct';
                else if (isClicked) optClass += ' incorrect';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleUserAnswerClick(option)}
                  disabled={answerStatus !== 'unanswered'}
                  className={optClass}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Battle Logs ticker */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.75rem', height: '80px', overflowY: 'auto' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              BATTLE LOGS:
            </span>
            {battleLog.map((log, index) => (
              <div key={index} style={{ fontSize: '0.75rem', color: index === 0 ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                {log}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 3. BATTLE WON RESULT */}
      {battleState === 'won' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', alignItems: 'center', padding: '2rem 1rem' }}>
          
          <div 
            className="flex-center" 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(57, 255, 20, 0.1)', 
              border: '2px solid var(--neon-success)',
              color: 'var(--neon-success)',
              boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)',
              animation: 'pulse 1.5s infinite alternate'
            }}
          >
            <Trophy size={40} />
          </div>

          <div>
            <h2 className="neon-text-success" style={{ fontSize: '2rem' }}>Victory Claimed!</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
              You defeated {activeOpponent.name} in speed musical theory combat!
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', border: '2.5px solid #000', padding: '1rem 2rem', borderRadius: '12px', display: 'flex', gap: '1.5rem', alignItems: 'center', boxShadow: '4px 4px 0 #000' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>EXPERIENCE CLAIMED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--neon-cyan)', marginTop: '4px' }}>+{activeOpponent.xpReward} XP</div>
            </div>
            
            <div style={{ width: '2px', height: '40px', background: '#000' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>DUEL STATUS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--neon-purple)', marginTop: '4px' }}>Level Complete!</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem' }}>
            <button
              onClick={() => setBattleState('lobby')}
              className="btn-cyber btn-cyber-primary"
              style={{ flex: 1, padding: '0.8rem', fontWeight: 'bold' }}
            >
              NEXT MATCH
            </button>
            <button
              onClick={handleLeaveBattle}
              className="btn-cyber"
              style={{ padding: '0.8rem 1.5rem' }}
            >
              LEAVE ARENA
            </button>
          </div>

        </div>
      )}

      {/* 4. BATTLE LOST RESULT */}
      {battleState === 'lost' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', alignItems: 'center', padding: '2rem 1rem' }}>
          
          <div 
            className="flex-center" 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(255, 0, 85, 0.1)', 
              border: '2px solid var(--neon-danger)',
              color: 'var(--neon-danger)',
              boxShadow: '0 0 20px rgba(255, 0, 85, 0.3)'
            }}
          >
            <Heart size={40} style={{ opacity: 0.3 }} />
          </div>

          <div>
            <h2 className="neon-text-magenta" style={{ fontSize: '2rem' }}>You Were Defeated</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
              {activeOpponent.name} answered faster. Don't sweat it, study your scales and try again!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem' }}>
            <button
              onClick={handleStartFight}
              className="btn-cyber btn-cyber-primary"
              style={{ flex: 1, padding: '0.8rem', fontWeight: 'bold' }}
            >
              REMATCH
            </button>
            <button
              onClick={() => setBattleState('lobby')}
              className="btn-cyber"
              style={{ flex: 1, padding: '0.8rem' }}
            >
              CHANGE OPPONENT
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
