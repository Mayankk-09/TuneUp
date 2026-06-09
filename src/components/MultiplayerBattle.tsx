// MultiplayerBattle.tsx - Speed Theory Duels against Simulated bots or Online PvP Opponents

import React, { useState, useEffect, useRef } from 'react';
import { Swords, Heart, Trophy, Zap, Loader2, ShieldAlert } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { playUIClick, playUIBack, playUISuccess, playUIFailure } from '../utils/audioSynth';
import { getChordNotes, CHORD_FORMULAS, getScaleNotes, SCALE_FORMULAS } from '../utils/musicEngine';
import { getSocketUrl } from '../utils/api';

interface MultiplayerBattleProps {
  user: { username: string; unlockedBadges: string[] } | null;
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
  return Math.floor(Math.random() * 3) + 1; // 2nd, 3rd, 5th
};

const shuffleOptions = <T,>(arr: T[]): T[] => {
  return [...arr].sort(() => Math.random() - 0.5);
};

const getAiResponseDelay = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min)) + min;
};

export const MultiplayerBattle: React.FC<MultiplayerBattleProps> = ({ user, onBack, onUpdateStats }) => {
  const [battleState, setBattleState] = useState<'lobby' | 'fighting' | 'won' | 'lost'>('lobby');
  const [selectedOpponentIdx, setSelectedOpponentIdx] = useState(0);
  
  // Game mode
  const [isOnline, setIsOnline] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [searchTimeoutAlert, setSearchTimeoutAlert] = useState(false);

  // HP bars
  const [userHp, setUserHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  
  // Game states
  const [question, setQuestion] = useState<BattleQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(12);
  const [answerStatus, setAnswerStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
  const [clickedOption, setClickedOption] = useState('');
  
  // Battle log history
  const [battleLog, setBattleLog] = useState<string[]>(['Match initialized.']);
  
  // Sockets references
  const socketRef = useRef<Socket | null>(null);
  const searchTimeIntervalRef = useRef<number | null>(null);

  // AI Timing references
  const aiTimerRef = useRef<number | null>(null);
  const activeOpponent = AI_OPPONENTS[selectedOpponentIdx];

  // Online opponent info
  const [opponentInfo, setOpponentInfo] = useState<{ username: string; avatarId: string; hp: number } | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const username = user?.username || 'Guest Player';
  const avatarId = user?.unlockedBadges?.[0] || 'mic';

  // --- ONLINE SOCKET LOBBY CONTROL ---
  const handleStartQueue = () => {
    playUIClick();
    setIsSearching(true);
    setSearchTime(0);
    setSearchTimeoutAlert(false);

    // 10s counter interval
    searchTimeIntervalRef.current = window.setInterval(() => {
      setSearchTime(prev => {
        if (prev >= 10) {
          setSearchTimeoutAlert(true);
        }
        return prev + 1;
      });
    }, 1000);

    // Initialize socket connection
    if (!socketRef.current) {
      socketRef.current = io(getSocketUrl(), {
        transports: ['websocket'],
        timeout: 5000
      });
    }

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Socket] Connected to battle arena!');
      socket.emit('join_queue', { username, avatarId });
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err);
      handleCancelQueue();
      alert('Could not reach Online PvP Server. Defaulting to Simulated AI Bot match!');
    });

    // Match found listener
    socket.on('match_found', ({ roomId, players, question, totalQuestions }) => {
      playUISuccess();
      if (searchTimeIntervalRef.current) window.clearInterval(searchTimeIntervalRef.current);
      
      const opp = players.find((p: any) => p.socketId !== socket.id);
      setOpponentInfo({ username: opp.username, avatarId: opp.avatarId, hp: 100 });
      setRoomId(roomId);
      setQuestion(question);
      setTotalQuestions(totalQuestions);
      setQuestionIndex(0);
      setUserHp(100);
      setOpponentHp(100);
      setIsOnline(true);
      setIsSearching(false);
      setBattleState('fighting');
      setBattleLog([`⚔️ PvP Match found against ${opp.username}! Get ready.`]);
    });

    // Battle update listener
    socket.on('battle_update', ({ players, actionLog, question: nextQuestion, currentQuestionIndex, isOver, winnerSocketId }) => {
      const me = players.find((p: any) => p.socketId === socket.id);
      const opp = players.find((p: any) => p.socketId !== socket.id);

      if (me) setUserHp(me.hp);
      if (opp) {
        setOpponentHp(opp.hp);
        setOpponentInfo(prev => prev ? { ...prev, hp: opp.hp } : null);
      }

      setBattleLog(prev => [actionLog, ...prev]);
      setAnswerStatus('unanswered');
      setClickedOption('');

      if (isOver) {
        const userWon = winnerSocketId === socket.id;
        triggerEndBattle(userWon);
      } else {
        setQuestion(nextQuestion);
        if (currentQuestionIndex !== undefined) setQuestionIndex(currentQuestionIndex);
      }
    });

    // Opponent disconnected listener
    socket.on('opponent_disconnected', ({ message }) => {
      playUISuccess();
      setBattleLog(prev => [message, ...prev]);
      triggerEndBattle(true);
    });

    // Trigger initial connection if socket was already created but offline
    if (socket.connected) {
      socket.emit('join_queue', { username, avatarId });
    } else {
      socket.connect();
    }
  };

  const handleCancelQueue = () => {
    playUIBack();
    setIsSearching(false);
    if (searchTimeIntervalRef.current) window.clearInterval(searchTimeIntervalRef.current);
    if (socketRef.current) {
      socketRef.current.emit('leave_lobby');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // --- LOCAL OFFLINE SIMULATION CONTROL ---
  const generateBattleQuestion = () => {
    setAnswerStatus('unanswered');
    setClickedOption('');

    const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#'];
    const randomRoot = getRandomElement(roots);
    const isChord = getIsChordQuestion();

    let promptText = '';
    let correct = '';
    let opts: string[] = [];

    if (isChord) {
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
      const degree = getRandomDegree();
      
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

    scheduleAiMove();
  };

  const scheduleAiMove = () => {
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);

    const [minTime, maxTime] = activeOpponent.responseTimeRange;
    const aiResponseDelay = getAiResponseDelay(minTime, maxTime);

    aiTimerRef.current = window.setTimeout(() => {
      handleAiStrike();
    }, aiResponseDelay);
  };

  const handleAiStrike = () => {
    if (battleState !== 'fighting' || answerStatus !== 'unanswered') return;

    playUIFailure();
    setAnswerStatus('incorrect');
    
    const damageDealt = activeOpponent.damage;
    setUserHp(prev => {
      const nextHp = Math.max(0, prev - damageDealt);
      if (nextHp <= 0) {
        triggerEndBattle(false);
      }
      return nextHp;
    });

    setBattleLog(prev => [`💥 ${activeOpponent.name} answered faster and hit you for ${damageDealt} DMG!`, ...prev]);

    setTimeout(() => {
      if (userHp > damageDealt && opponentHp > 0) {
        setQuestionIndex(prev => prev + 1);
        generateBattleQuestion();
      }
    }, 1500);
  };

  const handleUserAnswerClick = (option: string) => {
    if (answerStatus !== 'unanswered' || !question) return;

    setClickedOption(option);

    if (isOnline && socketRef.current && roomId) {
      setAnswerStatus('incorrect'); // lock input immediately while submitting
      socketRef.current.emit('submit_answer', { roomId, option });
      return;
    }

    // Offline logic
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    const isCorrect = option === question.correctAnswer;

    if (isCorrect) {
      playUISuccess();
      setAnswerStatus('correct');
      const damageDealt = 25;
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

    setTimeout(() => {
      if (userHp > 0 && opponentHp > 25) {
        setQuestionIndex(prev => prev + 1);
        generateBattleQuestion();
      }
    }, 1500);
  };

  const triggerEndBattle = (userWon: boolean) => {
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    
    if (userWon) {
      playUISuccess();
      setBattleState('won');
      onUpdateStats(isOnline ? 100 : activeOpponent.xpReward); // Claim XP
    } else {
      playUIFailure();
      setBattleState('lost');
    }

    // Clean up online sockets
    if (isOnline && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const handleStartFightOffline = () => {
    playUIClick();
    setIsOnline(false);
    setUserHp(100);
    setOpponentHp(100);
    setQuestionIndex(0);
    setTotalQuestions(12);
    setBattleLog(['Offline practice match started! Answer questions quickly.']);
    setBattleState('fighting');
    setTimeout(() => {
      generateBattleQuestion();
    }, 500);
  };

  const handleLeaveBattle = () => {
    playUIBack();
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    if (searchTimeIntervalRef.current) window.clearInterval(searchTimeIntervalRef.current);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    onBack();
  };

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
      if (searchTimeIntervalRef.current) window.clearInterval(searchTimeIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="view-enter glass-panel" style={{ padding: '2rem', maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. LOBBY SCREEN */}
      {battleState === 'lobby' && !isSearching && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', alignItems: 'center' }}>
          
          <div className="flex-center" style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(124,92,255,0.1)', border: '2px solid var(--primary)' }}>
            <Swords size={32} style={{ color: 'var(--primary)' }} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Cyber Arena Duels</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Speed theory match. Duel real online players or train offline with simulated bots!
            </p>
          </div>

          {/* PvP Matchmaking Button */}
          <div style={{ width: '100%', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1.5px dashed var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>⚡ Live Matchmaking</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Match with another player online to test your skills (+100 XP)</p>
            <button
              onClick={handleStartQueue}
              className="btn-cyber btn-cyber-primary"
              style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}
            >
              SEARCH FOR ONLINE MATCH
            </button>
          </div>

          {/* Opponent Selection list */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'left', fontWeight: 'bold' }}>
              SELECT OFFLINE PRACTICE BOT:
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
                    border: '2px solid var(--border-dark)',
                    background: isSelected ? 'rgba(124,92,255,0.08)' : 'var(--card)',
                    boxShadow: isSelected ? '4px 4px 0px var(--border-dark)' : '2px 2px 0px var(--border-dark)',
                    transform: isSelected ? 'translate(-2px, -2px)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{bot.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      DIFFICULTY: {bot.difficulty} • Counter-ATK: {bot.damage} HP
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--secondary)' }}>
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
              onClick={handleStartFightOffline}
              className="btn-cyber btn-cyber-secondary"
              style={{ flex: 2, padding: '0.8rem', fontWeight: 'bold' }}
            >
              PLAY OFFLINE BOT
            </button>
          </div>

        </div>
      )}

      {/* 1b. MATCHMAKING SEARCH SCREEN */}
      {battleState === 'lobby' && isSearching && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', alignItems: 'center', padding: '2rem 1rem' }}>
          
          <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)' }} />

          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Searching for Opponent...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              Queue Time: {searchTime} seconds
            </p>
          </div>

          {searchTimeoutAlert && (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', border: '2px solid var(--border-dark)', borderRadius: '8px', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <ShieldAlert size={20} style={{ color: 'var(--neon-danger)' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                No active online players found in the arena queue right now. You can continue waiting or practice offline against an AI bot!
              </p>
              <button
                onClick={() => { handleCancelQueue(); handleStartFightOffline(); }}
                className="btn-cyber btn-cyber-secondary"
                style={{ fontSize: '0.7rem', padding: '0.4rem 1rem' }}
              >
                PRACTICE OFFLINE INSTEAD
              </button>
            </div>
          )}

          <button
            onClick={handleCancelQueue}
            className="btn-cyber"
            style={{ width: '100%', maxWidth: '240px', padding: '0.75rem', fontWeight: 'bold', marginTop: '1rem' }}
          >
            CANCEL SEARCH
          </button>
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
                <span>🛡5 {username.toUpperCase()}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{userHp}%</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid var(--border-dark)' }}>
                <div style={{ width: `${userHp}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s ease' }} />
              </div>
            </div>

            {/* VS */}
            <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', padding: '0.3rem 0.6rem', background: 'var(--bg)', borderRadius: '4px', border: '1.5px solid var(--border-dark)' }}>
              VS
            </div>

            {/* Opponent HP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="flex-between" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <span>👾 {isOnline ? (opponentInfo?.username || 'OPPONENT').toUpperCase() : activeOpponent.name.split(' ')[0].toUpperCase()}</span>
                <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{opponentHp}%</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid var(--border-dark)' }}>
                <div style={{ width: `${opponentHp}%`, height: '100%', background: 'var(--secondary)', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          </div>

          <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
            <span>Round {questionIndex + 1} of {totalQuestions}</span>
            <span>Mode: {isOnline ? 'Online PvP Duel' : 'Simulated AI Practice'}</span>
          </div>

          {/* Active Question Box */}
          <div 
            style={{ 
              background: 'var(--card)', 
              borderRadius: '12px', 
              border: '2px solid var(--border-dark)', 
              boxShadow: '4px 4px 0 var(--border-dark)',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <Zap size={10} fill="currentColor" /> FAST RESPONSE ACTIVE
            </div>
            
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
              SPEED QUESTION:
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-light)' }}>
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
                  style={{
                    border: '2px solid var(--border-dark)',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 'bold',
                    cursor: answerStatus === 'unanswered' ? 'pointer' : 'default',
                    background: isClicked ? 'var(--primary)' : 'var(--card)',
                    color: isClicked ? '#fff' : 'var(--text-light)',
                    boxShadow: '2px 2px 0 var(--border-dark)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Battle Logs ticker */}
          <div style={{ background: 'rgba(0,0,0,0.1)', border: '2px solid var(--border-dark)', borderRadius: '10px', padding: '0.75rem', height: '80px', overflowY: 'auto' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              BATTLE LOGS:
            </span>
            {battleLog.map((log, index) => (
              <div key={index} style={{ fontSize: '0.75rem', color: index === 0 ? 'var(--text-light)' : 'var(--text-muted)', marginTop: '2px' }}>
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
              background: 'rgba(22, 163, 74, 0.1)', 
              border: '2px solid var(--primary)',
              color: 'var(--primary)',
              boxShadow: '0 0 20px rgba(22, 163, 74, 0.3)',
              animation: 'pulse 1.5s infinite alternate'
            }}
          >
            <Trophy size={40} />
          </div>

          <div>
            <h2 className="neon-text-success" style={{ fontSize: '2rem', color: 'var(--primary)' }}>Victory Claimed!</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              You defeated your opponent in speed musical theory combat!
            </p>
          </div>

          <div style={{ background: 'var(--card)', border: '2px solid var(--border-dark)', padding: '1rem 2rem', borderRadius: '12px', display: 'flex', gap: '1.5rem', alignItems: 'center', boxShadow: '4px 4px 0 var(--border-dark)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EXPERIENCE CLAIMED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--secondary)', marginTop: '4px' }}>+{isOnline ? 100 : activeOpponent.xpReward} XP</div>
            </div>
            
            <div style={{ width: '2px', height: '40px', background: 'var(--border-dark)' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DUEL STATUS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '4px' }}>Level Complete!</div>
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
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '2px solid var(--neon-danger)',
              color: 'var(--neon-danger)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Heart size={40} style={{ opacity: 0.3 }} />
          </div>

          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--neon-danger)' }}>You Were Defeated</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              Your opponent was faster. Don't sweat it, study your scales and try again!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem' }}>
            <button
              onClick={isOnline ? handleStartQueue : handleStartFightOffline}
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
              CHANGE MODE
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
