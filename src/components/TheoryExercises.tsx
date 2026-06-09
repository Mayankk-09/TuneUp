// TheoryExercises.tsx - Core Music Theory Practice exercises

import React, { useState, useEffect } from 'react';
import { ExerciseWrapper } from './ExerciseWrapper';
import { 
  getChordNotes, CHORD_FORMULAS, getScaleNotes, SCALE_FORMULAS,
  getDiatonicChords, getChromaticScale, compareNotesEnharmonically
} from '../utils/musicEngine';
import { playUIClick, playUIBack, playUISuccess, playUIFailure } from '../utils/audioSynth';

interface TheoryExercisesProps {
  exerciseId: 'chord-spelling' | 'chord-naming' | 'chord-families' | 'scale-degrees';
  onBack: () => void;
  onUpdateStats: (points: number, masteredChord?: string) => void;
  presetChord?: string | null;
  clearPresetChord?: () => void;
}

interface Question {
  promptTitle: string;
  promptSubtitle: string;
  correctAnswer: string | string[]; // Single string or array of notes
  options?: string[]; // Multiple choice options
  displayData?: any; // Custom data context
}

export const TheoryExercises: React.FC<TheoryExercisesProps> = ({
  exerciseId,
  onBack,
  onUpdateStats,
  presetChord = null,
  clearPresetChord
}) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [shake, setShake] = useState(false);

  // Active question state
  const [questions, setQuestions] = useState<Question[]>([]);
  const question = questions[questionIndex] || null;
  const [userSpelledNotes, setUserSpelledNotes] = useState<string[]>([]); // For note spelling
  const [answerStatus, setAnswerStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
  const [clickedOption, setClickedOption] = useState<string>('');
  
  // Song unlocks/rewards upon round completion
  const [unlockedBadge, setUnlockedBadge] = useState('');
  const [lyricUnlock, setLyricUnlock] = useState('');

  const [totalQuestions, setTotalQuestions] = useState(10);

  // Generate a list of unique questions at the start
  const generateQuestionsPool = (currentDiff: typeof difficulty, count: number = 10) => {
    setAnswerStatus('unanswered');
    setClickedOption('');
    setUserSpelledNotes([]);

    const pool: Question[] = [];
    const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#', 'C#', 'Ab'];
    const usedKeys = new Set<string>();

    // 1. If presetChord is provided, prepopulate the first question
    if (presetChord && exerciseId === 'chord-spelling') {
      const parts = presetChord.split(' ');
      const presetRoot = parts[0];
      const formulaDisplayName = parts.slice(1).join(' ');
      
      const formulaKey = Object.keys(CHORD_FORMULAS).find(k => 
        CHORD_FORMULAS[k].displayName.toLowerCase() === formulaDisplayName.toLowerCase() || 
        k.toLowerCase() === formulaDisplayName.toLowerCase()
      ) || 'major';
      
      const formula = CHORD_FORMULAS[formulaKey];
      const spelling = getChordNotes(presetRoot, formulaKey);
      
      pool.push({
        promptTitle: `Spell the ${presetChord} chord`,
        promptSubtitle: `Fill in the ${formula.degrees.length} scale degrees: ${formula.degrees.join(' - ')}`,
        correctAnswer: spelling,
        displayData: {
          chordName: presetChord,
          formulaDegrees: formula.degrees,
          spellingLength: spelling.length
        }
      });
      usedKeys.add(`${presetRoot}-${formulaKey}`);
      if (clearPresetChord) clearPresetChord();
    }

    while (pool.length < count) {
      const randomRoot = roots[Math.floor(Math.random() * roots.length)];

      switch (exerciseId) {
        case 'chord-spelling': {
          const matchingFormulas = Object.values(CHORD_FORMULAS).filter(f => f.category === currentDiff);
          const formula = matchingFormulas[Math.floor(Math.random() * matchingFormulas.length)];
          const key = `${randomRoot}-${formula.name}`;
          if (!usedKeys.has(key)) {
            usedKeys.add(key);
            const chordName = `${randomRoot} ${formula.displayName}`;
            const spelling = getChordNotes(randomRoot, formula.name);
            pool.push({
              promptTitle: `Spell the ${chordName} chord`,
              promptSubtitle: `Fill in the ${formula.degrees.length} scale degrees: ${formula.degrees.join(' - ')}`,
              correctAnswer: spelling,
              displayData: {
                chordName,
                formulaDegrees: formula.degrees,
                spellingLength: spelling.length
              }
            });
          }
          break;
        }
        case 'chord-naming': {
          const matchingFormulas = Object.values(CHORD_FORMULAS).filter(f => f.category === currentDiff);
          const formula = matchingFormulas[Math.floor(Math.random() * matchingFormulas.length)];
          const key = `${randomRoot}-${formula.name}`;
          if (!usedKeys.has(key)) {
            usedKeys.add(key);
            const chordName = `${randomRoot} ${formula.displayName}`;
            const spelling = getChordNotes(randomRoot, formula.name);
            
            const options = [chordName];

            // Option 2: Same root note, different formula to test quality recognition
            const otherFormulas = Object.values(CHORD_FORMULAS).filter(f => f.name !== formula.name);
            if (otherFormulas.length > 0) {
              const f2 = otherFormulas[Math.floor(Math.random() * otherFormulas.length)];
              options.push(`${randomRoot} ${f2.displayName}`);
            }

            // Option 3: Neighbor root note (e.g. semitone/fifth/third away), same formula
            const rootIdx = roots.indexOf(randomRoot);
            const neighborRoots = [
              roots[(rootIdx + 1) % roots.length],
              roots[(rootIdx + 11) % roots.length],
              roots[(rootIdx + 3) % roots.length],
              roots[(rootIdx + 7) % roots.length]
            ].filter(r => r && r !== randomRoot);
            
            if (neighborRoots.length > 0) {
              const rRoot = neighborRoots[Math.floor(Math.random() * neighborRoots.length)];
              options.push(`${rRoot} ${formula.displayName}`);
            }

            // Option 4: Another random neighbor or chord type
            while (options.length < 4) {
              const rRoot = roots[Math.floor(Math.random() * roots.length)];
              const rFormula = Object.values(CHORD_FORMULAS)[Math.floor(Math.random() * Object.values(CHORD_FORMULAS).length)];
              const name = `${rRoot} ${rFormula.displayName}`;
              if (!options.includes(name)) {
                options.push(name);
              }
            }
            options.sort(() => Math.random() - 0.5);

            pool.push({
              promptTitle: 'Name this chord',
              promptSubtitle: `What chord is built from these notes: ${spelling.join(' - ')}?`,
              correctAnswer: chordName,
              options
            });
          }
          break;
        }
        case 'chord-families': {
          const keyRoot = roots[Math.floor(Math.random() * roots.length)];
          const keyType: 'major' | 'minor' = Math.random() > 0.5 ? 'major' : 'minor';
          const variant = Math.floor(Math.random() * 3);
          const key = `${keyRoot}-${keyType}-${variant}`;
          
          if (!usedKeys.has(key)) {
            usedKeys.add(key);
            const diatonic = getDiatonicChords(keyRoot, keyType);
            if (variant === 0) {
              const inKeyChords = diatonic.map(d => d.chordName);
              const foreignRoots = ['C#', 'F#', 'G#', 'Eb', 'Bb'].filter(r => r !== keyRoot);
              const rForeign = foreignRoots[Math.floor(Math.random() * foreignRoots.length)];
              const outsideChord = `${rForeign} diminished`;
              const options = [inKeyChords[0], inKeyChords[2], inKeyChords[4], outsideChord].sort(() => Math.random() - 0.5);
              pool.push({
                promptTitle: `Scale family check`,
                promptSubtitle: `Which of these chords does NOT belong to the key of ${keyRoot} ${keyType === 'major' ? 'Major' : 'Minor'}?`,
                correctAnswer: outsideChord,
                options
              });
            } else if (variant === 1) {
              const degreeIdx = keyType === 'major' ? [3, 4, 5][Math.floor(Math.random() * 3)] : [0, 3, 4][Math.floor(Math.random() * 3)];
              const targetChord = diatonic[degreeIdx];
              const degreeNames = keyType === 'major' 
                ? ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
                : ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
              const options = [targetChord.chordName];
              while (options.length < 4) {
                const rChord = diatonic[Math.floor(Math.random() * diatonic.length)].chordName;
                if (!options.includes(rChord)) {
                  options.push(rChord);
                }
              }
              options.sort(() => Math.random() - 0.5);
              pool.push({
                promptTitle: `Name the degree chord`,
                promptSubtitle: `What is the ${degreeNames[degreeIdx]} chord in the key of ${keyRoot} ${keyType === 'major' ? 'Major' : 'Minor'}?`,
                correctAnswer: targetChord.chordName,
                options
              });
            } else {
              const inKeyChords = diatonic.map(d => d.chordName);
              const correct = inKeyChords[0];
              const options = [correct];
              while (options.length < 4) {
                const fRoot = roots.filter(r => r !== keyRoot)[Math.floor(Math.random() * (roots.length - 1))];
                const name = `${fRoot} diminished`;
                if (!options.includes(name)) {
                  options.push(name);
                }
              }
              options.sort(() => Math.random() - 0.5);
              pool.push({
                promptTitle: `Identify chord family`,
                promptSubtitle: `Which of the following is the tonic (i / I) chord in the key of ${keyRoot} ${keyType === 'major' ? 'Major' : 'Minor'}?`,
                correctAnswer: correct,
                options
              });
            }
          }
          break;
        }
        case 'scale-degrees':
        default: {
          const formulaKey = Object.keys(SCALE_FORMULAS).filter(f => SCALE_FORMULAS[f].category === currentDiff)[0] || 'major';
          const scaleNotes = getScaleNotes(randomRoot, formulaKey);
          const degree = Math.floor(Math.random() * (scaleNotes.length - 1)) + 2;
          const key = `${randomRoot}-${formulaKey}-${degree}`;
          
          if (!usedKeys.has(key)) {
            usedKeys.add(key);
            const scaleName = SCALE_FORMULAS[formulaKey].displayName;
            const correctAnswer = scaleNotes[degree - 1];
            const scaleNotesSet = new Set(scaleNotes.map(n => n.toUpperCase()));
            const chromatic = getChromaticScale(randomRoot);
            const options = [correctAnswer];
            while (options.length < 4) {
              const note = chromatic[Math.floor(Math.random() * 12)];
              if (!options.includes(note) && !scaleNotesSet.has(note.toUpperCase())) {
                options.push(note);
              }
            }
            options.sort(() => Math.random() - 0.5);
            const suffix = degree === 2 ? 'nd' : degree === 3 ? 'rd' : 'th';
            pool.push({
              promptTitle: `${scaleName} Degrees`,
              promptSubtitle: `What is the ${degree}${suffix} note of the ${randomRoot} ${scaleName} scale?`,
              correctAnswer,
              options
            });
          }
          break;
        }
      }
    }
    setQuestions(pool);
  };

  useEffect(() => {
    generateQuestionsPool(difficulty, 10);
  }, []);

  const handleOptionSubmit = (option: string) => {
    if (answerStatus !== 'unanswered') return;
    
    setClickedOption(option);
    const isCorrect = option.toLowerCase() === (question?.correctAnswer as string).toLowerCase();

    if (isCorrect) {
      playUISuccess();
      setAnswerStatus('correct');
      setCorrectAnswersCount(prev => prev + 1);
      const pointsEarned = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      setScore(prev => prev + pointsEarned);
      setStreak(prev => prev + 1);
      
      // Update global states
      onUpdateStats(pointsEarned);
    } else {
      playUIFailure();
      setAnswerStatus('incorrect');
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    // Move to next question after delay
    setTimeout(() => {
      if (questionIndex + 1 < questions.length) {
        setQuestionIndex(prev => prev + 1);
        setAnswerStatus('unanswered');
        setClickedOption('');
        setUserSpelledNotes([]);
      } else {
        // Complete! Trigger Unlocks
        triggerEndRoundRewards();
        setIsComplete(true);
      }
    }, 1500);
  };

  const handleSpellingNoteClick = (note: string) => {
    if (answerStatus !== 'unanswered' || !question) return;

    playUIClick();
    const lengthNeeded = question.displayData.spellingLength;
    const currentSpelled = [...userSpelledNotes];
    
    // Toggle note in selection
    const existsIdx = currentSpelled.indexOf(note);
    if (existsIdx > -1) {
      currentSpelled.splice(existsIdx, 1);
    } else {
      if (currentSpelled.length < lengthNeeded) {
        currentSpelled.push(note);
      }
    }
    setUserSpelledNotes(currentSpelled);
  };

  const handleSpellingClear = () => {
    if (answerStatus !== 'unanswered') return;
    playUIBack();
    setUserSpelledNotes([]);
  };

  const handleSpellingSubmit = () => {
    if (answerStatus !== 'unanswered' || !question) return;

    const correctNotes = question.correctAnswer as string[];
    const isCorrect = compareNotesEnharmonically(correctNotes, userSpelledNotes);

    if (isCorrect) {
      playUISuccess();
      setAnswerStatus('correct');
      setCorrectAnswersCount(prev => prev + 1);
      const pointsEarned = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 25 : 35;
      setScore(prev => prev + pointsEarned);
      setStreak(prev => prev + 1);
      
      // Update stats and add to mastered chords list
      onUpdateStats(pointsEarned, question.displayData.chordName);
    } else {
      playUIFailure();
      setAnswerStatus('incorrect');
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    // Transition
    setTimeout(() => {
      if (questionIndex + 1 < questions.length) {
        setQuestionIndex(prev => prev + 1);
        setAnswerStatus('unanswered');
        setClickedOption('');
        setUserSpelledNotes([]);
      } else {
        triggerEndRoundRewards();
        setIsComplete(true);
      }
    }, 1800);
  };

  const triggerEndRoundRewards = () => {
    // Generate quirky unlocks based on score/difficulty (80%+ correct answers)
    const requiredCorrect = questions.length === 5 ? 4 : 8;
    if (correctAnswersCount >= requiredCorrect) {
      if (difficulty === 'easy') {
        setUnlockedBadge('Get Lucky');
        setLyricUnlock("We've come too far to give up who we are. So let's raise the bar!");
      } else if (difficulty === 'medium') {
        setUnlockedBadge('Zombie');
        setLyricUnlock("In your head, they are fighting... What's in your head?");
      } else {
        setUnlockedBadge('Space Oddity');
        setLyricUnlock("Ground control to Major Tom, lock your visor on and check your ignition!");
      }
    } else {
      setLyricUnlock("Another one bites the dust! Keep practicing to claim your setlist badge!");
    }

    onUpdateStats(50); // Cleared round flat bonus XP!
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
      userHasSelected={exerciseId === 'chord-spelling' ? userSpelledNotes.length > 0 : clickedOption !== ''}
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
        
        {/* EXERCISE 1: SPELLING LAYOUT */}
        {exerciseId === 'chord-spelling' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
            
            {/* Blank Boxes */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {Array.from({ length: question.displayData.spellingLength }).map((_, i) => {
                const note = userSpelledNotes[i];
                return (
                  <div
                    key={i}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: answerStatus === 'correct' 
                        ? 'var(--neon-success)' 
                        : answerStatus === 'incorrect' 
                        ? 'var(--neon-danger)' 
                        : note 
                        ? 'var(--neon-cyan)' 
                        : 'rgba(255,255,255,0.08)',
                      background: note ? 'rgba(0,242,254,0.05)' : 'rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: note ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: note ? '0 0 10px var(--neon-cyan-glow)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {note || '?'}
                  </div>
                );
              })}
            </div>

            {/* Note Clicker Pool */}
            <div 
              style={{ 
                background: 'rgba(0,0,0,0.15)', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                width: '100%',
                border: '1px solid rgba(255,255,255,0.02)'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                SELECT CHROMATIC NOTES:
              </span>
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(6, 1fr)', 
                  gap: '0.5rem',
                  maxWidth: '500px',
                  margin: '0 auto' 
                }}
              >
                {/* 12 standard notes pool */}
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'].map(note => {
                  const isSelected = userSpelledNotes.includes(note);
                  return (
                    <button
                      key={note}
                      onClick={() => handleSpellingNoteClick(note)}
                      disabled={answerStatus !== 'unanswered'}
                      className={`btn-cyber ${isSelected ? 'btn-cyber-primary' : ''}`}
                      style={{ 
                        padding: '0.6rem 0',
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        fontFamily: 'var(--font-mono)',
                        borderWidth: isSelected ? '0' : '1px'
                      }}
                    >
                      {note}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Spelling Controls */}
            {answerStatus === 'unanswered' && (
              <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                <button
                  onClick={handleSpellingClear}
                  className="btn-cyber btn-cyber-magenta"
                  style={{ padding: '0.6rem 1.5rem', fontWeight: 'bold' }}
                >
                  CLEAR
                </button>
                <button
                  onClick={handleSpellingSubmit}
                  disabled={userSpelledNotes.length === 0}
                  className="btn-cyber btn-cyber-primary"
                  style={{ padding: '0.6rem 2rem', fontWeight: 'bold' }}
                >
                  SUBMIT
                </button>
              </div>
            )}

            {/* Feedbacks */}
            {answerStatus === 'correct' && (
              <div className="neon-text-success" style={{ fontWeight: 'bold' }}>✓ Correct spelling! Unlocking song potential...</div>
            )}
            {answerStatus === 'incorrect' && (
              <div style={{ color: 'var(--neon-danger)', fontWeight: 'bold' }}>
                ✗ Incorrect. Correct spelling: { (question.correctAnswer as string[]).join(' - ') }
              </div>
            )}
          </div>
        )}

        {/* MULTIPLE CHOICE LAYOUT (Naming, Families, Degrees) */}
        {exerciseId !== 'chord-spelling' && question.options && (
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
                  onClick={() => handleOptionSubmit(option)}
                  disabled={answerStatus !== 'unanswered'}
                  className={optClass}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* Feedbacks for standard MC */}
        {exerciseId !== 'chord-spelling' && answerStatus === 'correct' && (
          <div style={{ textAlign: 'center', color: 'var(--neon-success)', fontWeight: 'bold', marginTop: '1rem' }}>
            ✓ Awesome! Keep it rolling.
          </div>
        )}
        {exerciseId !== 'chord-spelling' && answerStatus === 'incorrect' && (
          <div style={{ textAlign: 'center', color: 'var(--neon-danger)', fontWeight: 'bold', marginTop: '1rem' }}>
            ✗ Oops! Correct answer is: {question.correctAnswer as string}
          </div>
        )}

      </div>
    </ExerciseWrapper>
  );
};
