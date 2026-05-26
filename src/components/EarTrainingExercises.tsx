// EarTrainingExercises.tsx - Audio Ear Training exercises

import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { ExerciseWrapper } from './ExerciseWrapper';
import { Piano } from './Piano';
import { playNote, playChord, initAudio, playUIClick, playUIBack, playUISuccess, playUIFailure } from '../utils/audioSynth';
import { getChromaticScale } from '../utils/musicEngine';

interface EarTrainingExercisesProps {
  exerciseId: 'ear-intervals' | 'ear-chords' | 'ear-melody';
  onBack: () => void;
  onUpdateStats: (points: number) => void;
}

interface Question {
  promptTitle: string;
  promptSubtitle: string;
  correctAnswer: string | string[]; // interval name, chord name, or melody note names list
  options?: string[]; // MC options
  displayData?: any; // frequencies and timings of notes to play
}

// Semitone definitions for intervals
const INTERVALS_DB = [
  { name: 'Minor 2nd', semitones: 1, category: 'hard' },
  { name: 'Major 2nd', semitones: 2, category: 'hard' },
  { name: 'Minor 3rd', semitones: 3, category: 'medium' },
  { name: 'Major 3rd', semitones: 4, category: 'easy' },
  { name: 'Perfect 4th', semitones: 5, category: 'medium' },
  { name: 'Tritone', semitones: 6, category: 'hard' },
  { name: 'Perfect 5th', semitones: 7, category: 'easy' },
  { name: 'Minor 6th', semitones: 8, category: 'hard' },
  { name: 'Major 6th', semitones: 9, category: 'medium' },
  { name: 'Minor 7th', semitones: 10, category: 'hard' },
  { name: 'Major 7th', semitones: 11, category: 'medium' },
  { name: 'Perfect Octave', semitones: 12, category: 'easy' }
];

export const EarTrainingExercises: React.FC<EarTrainingExercisesProps> = ({
  exerciseId,
  onBack,
  onUpdateStats
}) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [shake, setShake] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
  const [clickedOption, setClickedOption] = useState<string>('');
  
  // Custom states for melodic playback
  const [userMelodyGuess, setUserMelodyGuess] = useState<string[]>([]);
  const [melodyPlaying, setMelodyPlaying] = useState(false);

  const [unlockedBadge, setUnlockedBadge] = useState('');
  const [lyricUnlock, setLyricUnlock] = useState('');

  const [totalQuestions, setTotalQuestions] = useState(10);
  const isMelodyMode = exerciseId === 'ear-melody';

  // MIDI Note to frequency calculator
  const getFreqFromMidi = (midi: number) => {
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const playQuestionAudio = (currQ: Question | null) => {
    if (!currQ || melodyPlaying) return;
    initAudio();

    const data = currQ.displayData;
    
    if (exerciseId === 'ear-intervals') {
      if (data.playType === 'harmonic') {
        playChord(data.frequencies, 1.2, 'sine');
      } else {
        // Play melodic (first then second)
        playNote(data.frequencies[0], 0.6, 'sine');
        setTimeout(() => {
          playNote(data.frequencies[1], 0.8, 'sine');
        }, 600);
      }
    } else if (exerciseId === 'ear-chords') {
      playChord(data.frequencies, 1.5, 'triangle');
    } else if (exerciseId === 'ear-melody') {
      // Play notes staggered
      setMelodyPlaying(true);
      data.frequencies.forEach((freq: number, idx: number) => {
        setTimeout(() => {
          playNote(freq, 0.45, 'sine');
          if (idx === data.frequencies.length - 1) {
            setMelodyPlaying(false);
          }
        }, idx * 600);
      });
    }
  };

  const generateQuestionsPool = (currentDiff: typeof difficulty, count: number = 10) => {
    setAnswerStatus('unanswered');
    setClickedOption('');
    setUserMelodyGuess([]);
    setMelodyPlaying(false);

    const pool: Question[] = [];
    const usedKeys = new Set<string>();

    const chordTypes = [
      { name: 'major', display: 'Major Triad', category: 'easy' },
      { name: 'minor', display: 'Minor Triad', category: 'easy' },
      { name: 'dim', display: 'Diminished Triad', category: 'medium' },
      { name: 'aug', display: 'Augmented Triad', category: 'medium' },
      { name: 'sus4', display: 'Suspended 4th', category: 'medium' },
      { name: 'maj7', display: 'Major 7th', category: 'hard' },
      { name: 'min7', display: 'Minor 7th', category: 'hard' },
      { name: '7', display: 'Dominant 7th', category: 'hard' },
    ];

    while (pool.length < count) {
      const baseMidi = 60 + Math.floor(Math.random() * 8); // C4 to G4

      switch (exerciseId) {
        case 'ear-intervals': {
          const matchingIntervals = INTERVALS_DB.filter(i => i.category === currentDiff);
          const interval = matchingIntervals[Math.floor(Math.random() * matchingIntervals.length)];
          const key = `${interval.name}-${baseMidi}`;
          
          if (!usedKeys.has(key)) {
            usedKeys.add(key);
            const freq1 = getFreqFromMidi(baseMidi);
            const freq2 = getFreqFromMidi(baseMidi + interval.semitones);
            const playType = Math.random() > 0.5 ? 'harmonic' : 'melodic';

            const options = [interval.name];
            while (options.length < 4) {
              const rInterval = INTERVALS_DB[Math.floor(Math.random() * INTERVALS_DB.length)];
              if (!options.includes(rInterval.name)) {
                options.push(rInterval.name);
              }
            }
            options.sort(() => Math.random() - 0.5);

            pool.push({
              promptTitle: `Identify the interval`,
              promptSubtitle: `Listen to the notes. Are they a Major 3rd, Perfect 5th, or something else?`,
              correctAnswer: interval.name,
              options,
              displayData: {
                frequencies: [freq1, freq2],
                playType
              }
            });
          }
          break;
        }

        case 'ear-chords': {
          const matchingChords = chordTypes.filter(c => c.category === currentDiff);
          const choice = matchingChords[Math.floor(Math.random() * matchingChords.length)];
          const key = `${choice.display}-${baseMidi}`;
          
          if (!usedKeys.has(key)) {
            usedKeys.add(key);
            
            let intervals = [0, 4, 7];
            if (choice.name === 'minor') intervals = [0, 3, 7];
            else if (choice.name === 'dim') intervals = [0, 3, 6];
            else if (choice.name === 'aug') intervals = [0, 4, 8];
            else if (choice.name === 'sus4') intervals = [0, 5, 7];
            else if (choice.name === 'maj7') intervals = [0, 4, 7, 11];
            else if (choice.name === 'min7') intervals = [0, 3, 7, 10];
            else if (choice.name === '7') intervals = [0, 4, 7, 10];
            
            const freqs = intervals.map(semi => getFreqFromMidi(baseMidi + semi));

            const options = [choice.display];
            while (options.length < 4) {
              const rChord = chordTypes[Math.floor(Math.random() * chordTypes.length)];
              if (!options.includes(rChord.display)) {
                options.push(rChord.display);
              }
            }
            options.sort(() => Math.random() - 0.5);

            pool.push({
              promptTitle: `Identify chord quality`,
              promptSubtitle: `Listen to the block chord. What is its harmonic quality?`,
              correctAnswer: choice.display,
              options,
              displayData: {
                frequencies: freqs
              }
            });
          }
          break;
        }

        case 'ear-melody':
        default: {
          let melodyLength = 3;
          if (currentDiff === 'medium') melodyLength = 4;
          else if (currentDiff === 'hard') melodyLength = 5;
          
          const scaleSteps = [0, 2, 4, 5, 7, 9, 11, 12];
          const notesSeq: number[] = [];
          const scaleNotes = getChromaticScale('C');

          for (let i = 0; i < melodyLength; i++) {
            const step = scaleSteps[Math.floor(Math.random() * scaleSteps.length)];
            notesSeq.push(baseMidi + step);
          }

          const noteNames = notesSeq.map(midi => {
            const pitch = midi % 12;
            return scaleNotes[pitch];
          });

          const key = noteNames.join('-');
          if (!usedKeys.has(key)) {
            usedKeys.add(key);

            pool.push({
              promptTitle: `Repeat the melody`,
              promptSubtitle: `Listen to the ${melodyLength}-note melody. Repeat it by clicking keys on the piano.`,
              correctAnswer: noteNames,
              displayData: {
                frequencies: notesSeq.map(m => getFreqFromMidi(m))
              }
            });
          }
          break;
        }
      }
    }

    setQuestions(pool);
    setQuestion(pool[0]);
    
    // Auto play audio upon question loading
    setTimeout(() => {
      if (pool[0]) playQuestionAudio(pool[0]);
    }, 400);
  };

  useEffect(() => {
    generateQuestionsPool(difficulty, 10);
  }, []);

  const handleOptionSubmit = (option: string) => {
    if (answerStatus !== 'unanswered' || !question) return;

    setClickedOption(option);
    const isCorrect = option === question.correctAnswer;

    if (isCorrect) {
      playUISuccess();
      setAnswerStatus('correct');
      setCorrectAnswersCount(prev => prev + 1);
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      onUpdateStats(points);
    } else {
      playUIFailure();
      setAnswerStatus('incorrect');
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    setTimeout(() => {
      if (questionIndex + 1 < questions.length) {
        const nextQ = questions[questionIndex + 1];
        setQuestionIndex(prev => prev + 1);
        setQuestion(nextQ);
        setAnswerStatus('unanswered');
        setClickedOption('');
        setUserMelodyGuess([]);
        setMelodyPlaying(false);
        setTimeout(() => {
          playQuestionAudio(nextQ);
        }, 400);
      } else {
        triggerEndRoundRewards();
        setIsComplete(true);
      }
    }, 1800);
  };

  // Piano key clicks for Melodic Playback Guess
  const handlePianoKeyClick = (note: string) => {
    if (answerStatus !== 'unanswered' || !question || melodyPlaying) return;

    playUIClick();
    const correctNotesList = question.correctAnswer as string[];
    
    // Add guessed note, up to maximum length needed
    if (userMelodyGuess.length < correctNotesList.length) {
      setUserMelodyGuess(prev => [...prev, note]);
    }
  };

  const handleMelodyBackspace = () => {
    if (answerStatus !== 'unanswered') return;
    playUIBack();
    setUserMelodyGuess(prev => prev.slice(0, -1));
  };

  const handleMelodyClear = () => {
    if (answerStatus !== 'unanswered') return;
    playUIBack();
    setUserMelodyGuess([]);
  };

  const handleMelodySubmit = () => {
    if (answerStatus !== 'unanswered' || !question) return;

    const correctNotesList = question.correctAnswer as string[];

    if (userMelodyGuess.length !== correctNotesList.length) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const isCorrect = correctNotesList.every((val, idx) => val === userMelodyGuess[idx]);

    if (isCorrect) {
      playUISuccess();
      setAnswerStatus('correct');
      setCorrectAnswersCount(prev => prev + 1);
      const points = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 30 : 40;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      onUpdateStats(points);
    } else {
      playUIFailure();
      setAnswerStatus('incorrect');
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    // Stagger loading next question
    setTimeout(() => {
      if (questionIndex + 1 < questions.length) {
        const nextQ = questions[questionIndex + 1];
        setQuestionIndex(prev => prev + 1);
        setQuestion(nextQ);
        setAnswerStatus('unanswered');
        setClickedOption('');
        setUserMelodyGuess([]);
        setMelodyPlaying(false);
        setTimeout(() => {
          playQuestionAudio(nextQ);
        }, 400);
      } else {
        triggerEndRoundRewards();
        setIsComplete(true);
      }
    }, 2000);
  };

  const triggerEndRoundRewards = () => {
    const requiredCorrect = questions.length === 5 ? 4 : 8;
    if (correctAnswersCount >= requiredCorrect) {
      setUnlockedBadge('Perfect Pitch');
      setLyricUnlock("I want to break free! Your ears are sharp as diamonds.");
    } else {
      setLyricUnlock("Practice tuning in. You'll catch the rhythm next round!");
    }
    onUpdateStats(50); // cleared round XP
  };

  const handleStartTest = (chosenDiff: 'easy' | 'medium' | 'hard', count: number) => {
    setDifficulty(chosenDiff);
    setTotalQuestions(count);
    setQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectAnswersCount(0);
    setIsComplete(false);
    setUnlockedBadge('');
    setLyricUnlock('');
    generateQuestionsPool(chosenDiff, count);
  };

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectAnswersCount(0);
    setIsComplete(false);
    setUnlockedBadge('');
    setLyricUnlock('');
    generateQuestionsPool(difficulty, totalQuestions);
  };

  if (!question) return null;

  return (
    <ExerciseWrapper
      title={question.promptTitle}
      subtitle={question.promptSubtitle}
      difficulty={difficulty}
      onDifficultyChange={(d) => { playUIClick(); setDifficulty(d); handleRestart(); }}
      onBack={() => { playUIBack(); onBack(); }}
      difficultyDisabled={questionIndex > 0 && !isComplete}
      answerStatus={answerStatus}
      userHasSelected={isMelodyMode ? userMelodyGuess.length > 0 : clickedOption !== ''}
      score={score}
      questionIndex={questionIndex}
      totalQuestions={totalQuestions}
      streak={streak}
      isComplete={isComplete}
      onRestart={handleRestart}
      onStartTest={handleStartTest}
      correctAnswersCount={correctAnswersCount}
      unlockedBadge={unlockedBadge}
      lyricUnlock={lyricUnlock}
    >
      <div className={shake ? 'shake-element' : ''}>
        
        {/* Play Sound Trigger Button */}
        {!isComplete && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <button
              onClick={() => playQuestionAudio(question)}
              disabled={melodyPlaying}
              className="btn-cyber btn-cyber-primary"
              style={{ padding: '1rem 2rem', display: 'flex', gap: '0.5rem', alignItems: 'center', borderRadius: '12px' }}
            >
              <Play size={20} fill="currentColor" /> {melodyPlaying ? 'PLAYING...' : 'LISTEN AGAIN'}
            </button>
          </div>
        )}

        {/* A. MULTIPLE CHOICE MODE (Intervals & Chords) */}
        {!isMelodyMode && question.options && (
          <div className="options-grid">
            {question.options.map((optText, idx) => {
              const isClicked = optText === clickedOption;
              const isCorrectAnswer = optText === question.correctAnswer;
              
              let optClass = 'option-btn';
              if (answerStatus !== 'unanswered') {
                if (isCorrectAnswer) optClass += ' correct';
                else if (isClicked) optClass += ' incorrect';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSubmit(optText)}
                  disabled={answerStatus !== 'unanswered'}
                  className={optClass}
                >
                  {optText}
                </button>
              );
            })}
          </div>
        )}

        {/* B. MELODIC Dictation PIANO INTERFACE */}
        {isMelodyMode && !isComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            
            {/* Visualizer showing entered notes boxes */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(question.correctAnswer as string[]).map((correctNote, idx) => {
                const guess = userMelodyGuess[idx];
                const isCheck = answerStatus !== 'unanswered';
                const isCorrect = isCheck && correctNote === guess;

                let border = '1px solid rgba(255,255,255,0.08)';
                let bg = 'rgba(0,0,0,0.2)';
                
                if (isCheck) {
                  border = isCorrect ? '2px solid var(--neon-success)' : '2px solid var(--neon-danger)';
                  bg = isCorrect ? 'rgba(57, 255, 20, 0.05)' : 'rgba(255, 0, 85, 0.05)';
                } else if (guess) {
                  border = '1.5px solid var(--neon-cyan)';
                  bg = 'rgba(0, 242, 254, 0.05)';
                }

                return (
                  <div
                    key={idx}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      border,
                      background: bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: guess ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {guess || '?'}
                  </div>
                );
              })}
            </div>

            {/* Melody Controls */}
            {answerStatus === 'unanswered' && (
              <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center' }}>
                <button
                  onClick={handleMelodyClear}
                  disabled={userMelodyGuess.length === 0}
                  className="btn-cyber btn-cyber-magenta"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  CLEAR
                </button>
                <button
                  onClick={handleMelodyBackspace}
                  disabled={userMelodyGuess.length === 0}
                  className="btn-cyber btn-cyber-orange"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  BACKSPACE
                </button>
                <button
                  onClick={handleMelodySubmit}
                  disabled={userMelodyGuess.length === 0}
                  className="btn-cyber btn-cyber-primary"
                  style={{ padding: '0.4rem 1.5rem', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                  SUBMIT
                </button>
              </div>
            )}

            {/* Interactive Keyboard */}
            <div style={{ width: '100%' }}>
              <Piano
                mode="quiz"
                onKeyClick={handlePianoKeyClick}
                showNoteLabels={true}
              />
            </div>
          </div>
        )}

        {/* FEEDBACK LABELS */}
        {answerStatus === 'correct' && (
          <div style={{ textAlign: 'center', color: 'var(--neon-success)', fontWeight: 'bold', marginTop: '1.5rem' }}>
            ✓ Correct! Your ears are perfect!
          </div>
        )}
        {answerStatus === 'incorrect' && (
          <div style={{ textAlign: 'center', color: 'var(--neon-danger)', fontWeight: 'bold', marginTop: '1.5rem' }}>
            ✗ Incorrect! Correct notes: {isMelodyMode ? (question.correctAnswer as string[]).join(' - ') : (question.correctAnswer as string)}
          </div>
        )}

      </div>
    </ExerciseWrapper>
  );
};
