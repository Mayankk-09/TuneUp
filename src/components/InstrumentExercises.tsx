// InstrumentExercises.tsx - Guitar & Ukulele Instrument Theory practice exercises

import React, { useState, useEffect } from 'react';
import { ExerciseWrapper } from './ExerciseWrapper';
import { Fretboard } from './Fretboard';
import { 
  getFretNote, stripOctave,
  GUITAR_CHORD_DIAGRAMS, UKULELE_CHORD_DIAGRAMS
} from '../utils/musicEngine';
import type { InstrumentType, ChordFingering } from '../utils/musicEngine';
import { playUIClick, playUIBack, playUISuccess, playUIFailure } from '../utils/audioSynth';

interface InstrumentExercisesProps {
  exerciseId: 'chord-diagrams' | 'fretboard-finder' | 'riff-transposer';
  onBack: () => void;
  onUpdateStats: (points: number) => void;
}

interface Question {
  promptTitle: string;
  promptSubtitle: string;
  correctAnswer: string | any;
  options?: any[]; // Chord diagram fingers list, or MC options
  displayData?: any;
}

export const InstrumentExercises: React.FC<InstrumentExercisesProps> = ({
  exerciseId,
  onBack,
  onUpdateStats
}) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [instrument, setInstrument] = useState<InstrumentType>('guitar');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [shake, setShake] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
  const [clickedOptionIdx, setClickedOptionIdx] = useState<number | null>(null);
  
  // Custom states for note finder
  const [selectedNoteGuess, setSelectedNoteGuess] = useState('');
  
  // Custom unlocks
  const [unlockedBadge, setUnlockedBadge] = useState('');
  const [lyricUnlock, setLyricUnlock] = useState('');

  const [totalQuestions, setTotalQuestions] = useState(10);

  // Key configurations for note finder alternate tunings
  const tunings = {
    standardGuitar: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    dropD: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    dadgad: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
    standardUke: ['G4', 'C4', 'E4', 'A4']
  };



  const generateQuestionsPool = (currentDiff: typeof difficulty, currentInst: typeof instrument, count: number = 10) => {
    setAnswerStatus('unanswered');
    setClickedOptionIdx(null);
    setSelectedNoteGuess('');

    const pool: Question[] = [];
    const usedKeys = new Set<string>();

    const diagramDB = currentInst === 'guitar' ? GUITAR_CHORD_DIAGRAMS : UKULELE_CHORD_DIAGRAMS;
    const keys = Object.keys(diagramDB);
    const numStrings = currentInst === 'guitar' ? 6 : 4;
    const activeTuning = currentInst === 'ukulele' 
      ? tunings.standardUke 
      : (currentDiff === 'hard' ? (Math.random() > 0.5 ? tunings.dropD : tunings.dadgad) : tunings.standardGuitar);

    while (pool.length < count) {
      switch (exerciseId) {
        case 'chord-diagrams': {
          const correctChordName = keys[Math.floor(Math.random() * keys.length)];
          const key = correctChordName;
          
          if (!usedKeys.has(key)) {
            usedKeys.add(key);
            const correctDiagram = diagramDB[correctChordName][0];
            
            const options = [correctDiagram];
            while (options.length < 4) {
              const rName = keys[Math.floor(Math.random() * keys.length)];
              const rDiag = diagramDB[rName][0];
              if (!options.some(o => o.chordName === rDiag.chordName)) {
                options.push(rDiag);
              }
            }
            options.sort(() => Math.random() - 0.5);

            pool.push({
              promptTitle: `Diagram for ${correctChordName}`,
              promptSubtitle: `Select the correct finger board layout diagram matching the chord`,
              correctAnswer: correctChordName,
              options
            });
          }
          break;
        }

        case 'fretboard-finder': {
          let maxFret = 5;
          if (currentDiff === 'medium') maxFret = 12;
          else if (currentDiff === 'hard') maxFret = 15;
          
          const randomString = Math.floor(Math.random() * numStrings);
          const randomFret = Math.floor(Math.random() * maxFret);
          
          const key = `${randomString}-${randomFret}`;
          if (!usedKeys.has(key)) {
            usedKeys.add(key);
            const fretDetails = getFretNote(randomString, randomFret, currentInst, activeTuning);
            const noteName = stripOctave(fretDetails.note);

            const tuningName = currentInst === 'ukulele' 
              ? 'Standard Uke' 
              : (activeTuning === tunings.dropD ? 'Drop D' : activeTuning === tunings.dadgad ? 'DADGAD' : 'Standard Guitar');

            pool.push({
              promptTitle: `Identify the note`,
              promptSubtitle: `What note is at the blinking target? (Tuning: ${tuningName})`,
              correctAnswer: noteName,
              displayData: {
                stringIndex: randomString,
                fret: randomFret,
                tuning: activeTuning
              }
            });
          }
          break;
        }

        case 'riff-transposer':
        default: {
          const variant = Math.random() > 0.5 ? 'transpose' : 'translate';

          if (variant === 'transpose') {
            const notesSeq = [2, 2, 3, 5];
            const offset = Math.random() > 0.5 ? 2 : -2;
            const correctSeq = notesSeq.map(n => n + offset);
            
            const promptRiff = `A-String: ${notesSeq.join('-')}`;
            const correctText = `A-String: ${correctSeq.join('-')}`;
            const key = `transpose-${offset}-${Math.random()}`;
            
            if (!usedKeys.has(key)) {
              usedKeys.add(key);
              
              const options = [correctText];
              while (options.length < 4) {
                const rOffset = Math.random() > 0.5 ? 3 : -1;
                const rSeq = notesSeq.map(n => n + rOffset);
                const rText = `A-String: ${rSeq.join('-')}`;
                if (!options.includes(rText)) {
                  options.push(rText);
                }
              }
              options.sort(() => Math.random() - 0.5);

              pool.push({
                promptTitle: `Transpose Riff`,
                promptSubtitle: `Transpose this riff (${promptRiff}) ${offset > 0 ? 'UP' : 'DOWN'} by ${Math.abs(offset)} semitones:`,
                correctAnswer: correctText,
                options
              });
            }
          } else {
            // Generate dynamic fret translation questions based on pitch offsets
            const fromStr = Math.floor(Math.random() * numStrings);
            let toStr = Math.floor(Math.random() * numStrings);
            while (toStr === fromStr) {
              toStr = Math.floor(Math.random() * numStrings);
            }
            const fromFret = Math.floor(Math.random() * 8) + 1; // fret 1 to 8

            const noteDetails = getFretNote(fromStr, fromFret, currentInst, activeTuning);
            const noteName = stripOctave(noteDetails.note);

            // Find corresponding fret on toStr
            let targetFret = -1;
            for (let f = 0; f <= 15; f++) {
              const checkDetails = getFretNote(toStr, f, currentInst, activeTuning);
              if (stripOctave(checkDetails.note) === noteName) {
                targetFret = f;
                break;
              }
            }

            if (targetFret !== -1) {
              const key = `translate-dyn-${fromStr}-${fromFret}-${toStr}`;
              if (!usedKeys.has(key)) {
                usedKeys.add(key);

                const stringNames = currentInst === 'ukulele' ? ['G', 'C', 'E', 'A'] : ['E', 'A', 'D', 'G', 'B', 'E'];
                const prompt = `Play fret ${fromFret} of the ${stringNames[fromStr]} string on the ${stringNames[toStr]} string.`;
                const correctText = `Fret ${targetFret}`;

                const options = [
                  `Fret ${targetFret}`,
                  `Fret ${(targetFret + 2) % 12}`,
                  `Fret ${(targetFret + 5) % 12}`,
                  `Fret ${(targetFret + 7) % 12}`
                ].filter((v, i, self) => self.indexOf(v) === i); // deduplicate

                while (options.length < 4) {
                  const rFret = Math.floor(Math.random() * 12);
                  const opt = `Fret ${rFret}`;
                  if (!options.includes(opt)) {
                    options.push(opt);
                  }
                }
                options.sort(() => Math.random() - 0.5);

                pool.push({
                  promptTitle: `Fret Translation`,
                  promptSubtitle: prompt,
                  correctAnswer: correctText,
                  options
                });
              }
            }
          }
          break;
        }
      }
    }

    setQuestions(pool);
    setQuestion(pool[0]);
  };

  useEffect(() => {
    generateQuestionsPool(difficulty, instrument, 10);
  }, []);

  // Diagram MC submit handler
  const handleDiagramSubmit = (diag: ChordFingering, idx: number) => {
    if (answerStatus !== 'unanswered' || !question) return;

    setClickedOptionIdx(idx);
    const isCorrect = diag.chordName === question.correctAnswer;

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
        setQuestionIndex(prev => prev + 1);
        setQuestion(questions[questionIndex + 1]);
        setAnswerStatus('unanswered');
        setClickedOptionIdx(null);
        setSelectedNoteGuess('');
      } else {
        triggerEndRoundRewards();
        setIsComplete(true);
      }
    }, 1800);
  };

  // Note Guess submit handler
  const handleNoteGuessSubmit = (note: string) => {
    if (answerStatus !== 'unanswered' || !question) return;
    
    setSelectedNoteGuess(note);
    const isCorrect = note.toUpperCase() === (question.correctAnswer as string).toUpperCase();

    if (isCorrect) {
      playUISuccess();
      setAnswerStatus('correct');
      setCorrectAnswersCount(prev => prev + 1);
      const points = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 25 : 35;
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
        setQuestionIndex(prev => prev + 1);
        setQuestion(questions[questionIndex + 1]);
        setAnswerStatus('unanswered');
        setClickedOptionIdx(null);
        setSelectedNoteGuess('');
      } else {
        triggerEndRoundRewards();
        setIsComplete(true);
      }
    }, 1500);
  };

  // Riff MC submit handler
  const handleRiffSubmit = (option: string, idx: number) => {
    if (answerStatus !== 'unanswered' || !question) return;

    setClickedOptionIdx(idx);
    const isCorrect = option === question.correctAnswer;

    if (isCorrect) {
      playUISuccess();
      setAnswerStatus('correct');
      setCorrectAnswersCount(prev => prev + 1);
      const points = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 25 : 35;
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
        setQuestionIndex(prev => prev + 1);
        setQuestion(questions[questionIndex + 1]);
        setAnswerStatus('unanswered');
        setClickedOptionIdx(null);
        setSelectedNoteGuess('');
      } else {
        triggerEndRoundRewards();
        setIsComplete(true);
      }
    }, 1500);
  };

  const triggerEndRoundRewards = () => {
    const requiredCorrect = questions.length === 5 ? 4 : 8;
    if (correctAnswersCount >= requiredCorrect) {
      setUnlockedBadge('Fretboard Master');
      setLyricUnlock("Now you're playing with power! You unlocked the fretboard secrets!");
    } else {
      setLyricUnlock("Practice makes perfect. Strum it out one more time!");
    }
    onUpdateStats(50); // round cleared flat XP
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
    generateQuestionsPool(chosenDiff, instrument, count);
  };

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectAnswersCount(0);
    setIsComplete(false);
    setUnlockedBadge('');
    setLyricUnlock('');
    generateQuestionsPool(difficulty, instrument, totalQuestions);
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
      userHasSelected={clickedOptionIdx !== -1 || selectedNoteGuess !== ''}
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
      
      {/* Instrument Toggle (For Chord Diagrams & Finder) */}
      {!isComplete && exerciseId !== 'riff-transposer' && (
        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
          {(['guitar', 'ukulele'] as const).map(inst => (
            <button
              key={inst}
              onClick={() => { playUIClick(); setInstrument(inst); handleRestart(); }}
              className={`btn-cyber ${instrument === inst ? 'btn-cyber-primary' : ''}`}
              style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
            >
              {inst.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div className={shake ? 'shake-element' : ''}>

        {/* 1. CHORD DIAGRAM SELECTOR */}
        {exerciseId === 'chord-diagrams' && question.options && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {question.options.map((diagOption, idx) => {
              const isClicked = idx === clickedOptionIdx;
              const isCorrectAnswer = diagOption.chordName === question.correctAnswer;
              
              let borderStyle = '1px solid rgba(255,255,255,0.08)';
              let bg = 'rgba(0,0,0,0.2)';
              if (answerStatus !== 'unanswered') {
                if (isCorrectAnswer) {
                  borderStyle = '2px solid var(--neon-success)';
                  bg = 'rgba(57, 255, 20, 0.05)';
                } else if (isClicked) {
                  borderStyle = '2px solid var(--neon-danger)';
                  bg = 'rgba(255, 0, 85, 0.05)';
                }
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleDiagramSubmit(diagOption, idx)}
                  style={{
                    border: borderStyle,
                    background: bg,
                    borderRadius: '12px',
                    padding: '0.75rem',
                    cursor: answerStatus === 'unanswered' ? 'pointer' : 'default',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    OPTION {idx + 1}
                  </span>
                  <Fretboard
                    instrument={instrument}
                    mode="diagram"
                    chordFingering={diagOption}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* 2. FRETBOARD NOTE FINDER */}
        {exerciseId === 'fretboard-finder' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            
            {/* SVG Fretboard with quizTarget */}
            <div style={{ width: '100%' }}>
              <Fretboard
                instrument={instrument}
                customTuning={question.displayData.tuning}
                mode="quiz"
                quizTarget={{
                  stringIndex: question.displayData.stringIndex,
                  fret: question.displayData.fret
                }}
                showNoteLabels={false}
              />
            </div>

            {/* Note Selector input pad */}
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
                GUESS THE TARGET NOTE:
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
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'].map(note => {
                  const isGuess = note === selectedNoteGuess;
                  const isCorrectAnswer = note.toUpperCase() === (question.correctAnswer as string).toUpperCase();
                  
                  let btnStyleClass = 'btn-cyber';
                  if (answerStatus !== 'unanswered') {
                    if (isCorrectAnswer) btnStyleClass = 'btn-cyber btn-cyber-primary';
                    else if (isGuess) btnStyleClass = 'btn-cyber btn-cyber-magenta';
                  }

                  return (
                    <button
                      key={note}
                      onClick={() => handleNoteGuessSubmit(note)}
                      disabled={answerStatus !== 'unanswered'}
                      className={btnStyleClass}
                      style={{ 
                        padding: '0.6rem 0',
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {note}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedbacks */}
            {answerStatus === 'correct' && (
              <div className="neon-text-success" style={{ fontWeight: 'bold' }}>✓ Exactly! You have a good eye for the fretboard.</div>
            )}
            {answerStatus === 'incorrect' && (
              <div style={{ color: 'var(--neon-danger)', fontWeight: 'bold' }}>
                ✗ Incorrect. That is a {question.correctAnswer} note.
              </div>
            )}

          </div>
        )}

        {/* 3. RIFF TRANSPOSER / TRANSLATION */}
        {exerciseId === 'riff-transposer' && question.options && (
          <div className="options-grid">
            {question.options.map((optText, idx) => {
              const isClicked = idx === clickedOptionIdx;
              const isCorrectAnswer = optText === question.correctAnswer;
              
              let optClass = 'option-btn';
              if (answerStatus !== 'unanswered') {
                if (isCorrectAnswer) optClass += ' correct';
                else if (isClicked) optClass += ' incorrect';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleRiffSubmit(optText, idx)}
                  disabled={answerStatus !== 'unanswered'}
                  className={optClass}
                >
                  {optText}
                </button>
              );
            })}
          </div>
        )}

        {/* MC feedbacks */}
        {exerciseId === 'riff-transposer' && answerStatus === 'correct' && (
          <div style={{ textAlign: 'center', color: 'var(--neon-success)', fontWeight: 'bold', marginTop: '1rem' }}>
            ✓ Correct transposing values!
          </div>
        )}
        {exerciseId === 'riff-transposer' && answerStatus === 'incorrect' && (
          <div style={{ textAlign: 'center', color: 'var(--neon-danger)', fontWeight: 'bold', marginTop: '1rem' }}>
            ✗ Incorrect. Correct transposing structure: {question.correctAnswer}
          </div>
        )}

      </div>

    </ExerciseWrapper>
  );
};
