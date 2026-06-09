// App.tsx - Main Controller and Layout Orchestrator for TuneUp

import { useState, useEffect } from 'react';
import { Music, RefreshCw, Zap, Award } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TheoryExercises } from './components/TheoryExercises';
import { InstrumentExercises } from './components/InstrumentExercises';
import { EarTrainingExercises } from './components/EarTrainingExercises';
import { JamBuddy } from './components/JamBuddy';
import { SandboxPlayground } from './components/SandboxPlayground';
import { MultiplayerBattle } from './components/MultiplayerBattle';
import { Sidebar } from './components/Sidebar';
import { Profile } from './components/Profile';
import { SongLyricsView } from './components/SongLyricsView';
import { AcousticPitchTrainer } from './components/AcousticPitchTrainer';
import { playUIClick, playUIBack, playIntroChime } from './utils/audioSynth';
import { FloatingMusicParticles } from './components/FloatingMusicParticles';
import { Mascot } from './components/Mascot';
import { getApiUrl } from './utils/api';
import { useUser, useAuth } from '@clerk/clerk-react';

const BACKGROUND_MUSIC_URL = "/music/background_music.mp3";

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sandbox' | 'jambuddy' | 'multiplayer' | 'profile'>('dashboard');
  const [currentExercise, setCurrentExercise] = useState<string | null>(null);
  const [bpm, setBpm] = useState<number>(120);
  const [presetChord, setPresetChord] = useState<string | null>(null);
  const [jamPresetSong, setJamPresetSong] = useState<string | null>(null);
  const [selectedSongForLyrics, setSelectedSongForLyrics] = useState<string | null>(null);
  const [showDevPage, setShowDevPage] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('tuneup_theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tuneup_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // App Welcome loading/intro states
  const [showIntro, setShowIntro] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Background Music state/ref
  const [bgAudio] = useState(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.15; // Set volume lower than standard sound effects
    return audio;
  });

  useEffect(() => {
    if (!BACKGROUND_MUSIC_URL) return;
    bgAudio.src = BACKGROUND_MUSIC_URL;
  }, [bgAudio]);

  useEffect(() => {
    if (!BACKGROUND_MUSIC_URL || showIntro) {
      bgAudio.pause();
      return;
    }

    const isJamBuddyActive = activeTab === 'jambuddy';
    const isEarTrainingActive = currentExercise && ['ear-intervals', 'ear-chords', 'ear-melody'].includes(currentExercise);

    if (isJamBuddyActive || isEarTrainingActive) {
      bgAudio.pause();
    } else {
      bgAudio.play().catch(err => {
        console.log('BGM autoplay blocked or deferred until user interaction:', err.message);
      });
    }
  }, [activeTab, currentExercise, showIntro, bgAudio]);

  useEffect(() => {
    if (!showIntro) return;
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [showIntro]);

  const { isLoaded: isClerkLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();

  // Authenticated user state
  const [user, setUser] = useState<{
    username: string;
    xp: number;
    streak: number;
    masteredChords: string[];
    unlockedBadges: string[];
  } | null>(null);

  // Guest stats state
  const [stats, setStats] = useState({
    streak: 0,
    score: 0,
    completed: 0,
    masteredChords: [] as string[]
  });

  // Load/sync Clerk session details when user signs in
  useEffect(() => {
    if (!isClerkLoaded) return;

    if (isSignedIn && clerkUser) {
      const loadClerkSession = async () => {
        try {
          const token = await getToken();
          const headers: Record<string, string> = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const pendingAvatar = localStorage.getItem('tuneup_pending_avatar') || undefined;
          if (pendingAvatar) {
            localStorage.removeItem('tuneup_pending_avatar');
          }

          const res = await fetch(getApiUrl('/api/users/stats'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            body: JSON.stringify({ avatarId: pendingAvatar })
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('tuneup_user_session', JSON.stringify(data.user));
            
            // If there were guest stats accumulated, we merge them into the profile
            if (stats.score > 0 || stats.streak > 0 || stats.masteredChords.length > 0) {
              await handleLoginSuccess(data.user);
            }
          }
        } catch (err) {
          console.error('Failed to initialize Clerk session with backend:', err);
        }
      };

      loadClerkSession();
    } else {
      setUser(null);
      localStorage.removeItem('tuneup_user_session');
    }
  }, [isClerkLoaded, isSignedIn, clerkUser]);

  // Synchronize stats with server when updated
  const syncStatsWithServer = async (updatedUser: any) => {
    if (!updatedUser) return;
    if (!isSignedIn) return;

    try {
      const token = await getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(getApiUrl('/api/users/stats'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          xp: updatedUser.xp,
          streak: updatedUser.streak,
          masteredChords: updatedUser.masteredChords,
          unlockedBadges: updatedUser.unlockedBadges
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('tuneup_user_session', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to sync stats with server:', err);
    }
  };

  const handleUpdateStats = (pointsEarned: number, masteredChord?: string) => {
    if (user) {
      // 1. Authenticated user update
      const updatedChords = [...user.masteredChords];
      if (masteredChord && !updatedChords.includes(masteredChord)) {
        updatedChords.push(masteredChord);
      }

      const updatedBadges = [...user.unlockedBadges];
      if (masteredChord) {
        const songBadgesMap: Record<string, string> = {
          'C Major': 'La Bamba',
          'A Minor': 'Riptide',
          'E Minor': 'Zombie',
          'B Minor': 'Get Lucky'
        };
        const songCandidate = songBadgesMap[masteredChord];
        if (songCandidate && !updatedBadges.includes(songCandidate)) {
          updatedBadges.push(songCandidate);
        }
      }

      // Simple streak increment for daily exercises
      const newStreak = user.streak === 0 ? 1 : user.streak;

      const updatedUser = {
        ...user,
        xp: user.xp + pointsEarned,
        streak: newStreak,
        masteredChords: updatedChords,
        unlockedBadges: updatedBadges
      };

      setUser(updatedUser);
      localStorage.setItem('tuneup_user_session', JSON.stringify(updatedUser));
      syncStatsWithServer(updatedUser);
    } else {
      // 2. Guest user update (localStorage saving disabled per requirements)
      const updatedChords = [...stats.masteredChords];
      if (masteredChord && !updatedChords.includes(masteredChord)) {
        updatedChords.push(masteredChord);
      }

      const newStats = {
        streak: stats.streak === 0 ? 1 : stats.streak,
        score: stats.score + pointsEarned,
        completed: stats.completed + (pointsEarned === 50 ? 1 : 0),
        masteredChords: updatedChords
      };

      setStats(newStats);
    }
  };

  const handleResetStats = () => {
    playUIBack();
    if (window.confirm('Reset all your setlist unlocks and scores?')) {
      if (user) {
        const resetUser = {
          ...user,
          xp: 0,
          streak: 0,
          masteredChords: [],
          unlockedBadges: [user.unlockedBadges[0] || 'mic']
        };
        setUser(resetUser);
        localStorage.setItem('tuneup_user_session', JSON.stringify(resetUser));
        syncStatsWithServer(resetUser);
      } else {
        const resetStats = {
          streak: 0,
          score: 0,
          completed: 0,
          masteredChords: []
        };
        setStats(resetStats);
      }
    }
  };

  const handleLoginSuccess = async (userData: any, token?: string) => {
    if (token) {
      localStorage.setItem('tuneup_jwt_token', token);
    }
    // Merge guest active session stats into logged in profile
    const mergedXp = userData.xp + stats.score;
    const mergedStreak = Math.max(userData.streak, stats.streak);
    const mergedCompleted = (userData.unlockedBadges.includes('La Bamba') ? 5 : 0) + stats.completed;
    const mergedChords = Array.from(new Set([...userData.masteredChords, ...stats.masteredChords]));
    const mergedBadges = [...userData.unlockedBadges];
    if (mergedXp >= 100 && !mergedBadges.includes('Get Lucky')) mergedBadges.push('Get Lucky');
    if (mergedXp >= 250 && !mergedBadges.includes('Zombie')) mergedBadges.push('Zombie');
    if (mergedCompleted >= 5 && !mergedBadges.includes('La Bamba')) mergedBadges.push('La Bamba');
    if (mergedStreak >= 5 && !mergedBadges.includes('Space Oddity')) mergedBadges.push('Space Oddity');

    const mergedUser = {
      ...userData,
      xp: mergedXp,
      streak: mergedStreak,
      masteredChords: mergedChords,
      unlockedBadges: mergedBadges
    };

    setUser(mergedUser);
    localStorage.setItem('tuneup_user_session', JSON.stringify(mergedUser));
    await syncStatsWithServer(mergedUser);

    // Reset guest stats
    setStats({
      streak: 0,
      score: 0,
      completed: 0,
      masteredChords: []
    });

    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    localStorage.removeItem('tuneup_user_session');
    setActiveTab('profile');
  };

  const getDisplayStats = () => {
    if (user) {
      return {
        streak: user.streak,
        score: user.xp,
        completed: user.unlockedBadges.length - 1, // Exclude avatar sticker
        masteredChords: user.masteredChords
      };
    }
    return stats;
  };

  const handleSidebarTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentExercise(null); // Reset active exercises
  };

  if (showIntro) {
    return (
      <div 
        className="flex-center" 
        style={{ 
          height: '100vh', 
          width: '100vw', 
          background: 'linear-gradient(135deg, #111827 0%, #161d2d 50%, #232d3f 100%)',
          flexDirection: 'column',
          gap: '2.5rem',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 10000,
          overflow: 'hidden'
        }}
      >
        {/* Vinyl background grooves visual decoration */}
        <div 
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.02)',
            background: 'radial-gradient(circle, transparent 30%, rgba(255,255,255,0.01) 40%, transparent 41%)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
          <Mascot 
            state={loadingProgress >= 100 ? 'celebrating' : 'idle'}
            message={loadingProgress >= 100 ? "Ready to rock! 🎸" : "Tuning inputs... 🎧"}
          />
          
          <div style={{ marginTop: '1rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-1.5px', margin: 0 }}>
              Tune<span style={{ color: 'var(--primary)' }}>Up</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
              Master music theory by playing.
            </p>
          </div>
        </div>

        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {loadingProgress < 100 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              {/* Outer Bar */}
              <div style={{ width: '220px', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                {/* Inner Bar */}
                <div 
                  style={{ 
                    width: `${loadingProgress}%`, 
                    height: '100%', 
                    background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                    transition: 'width 0.08s linear'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-stats)' }}>
                {loadingProgress}%
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                playIntroChime();
                setShowIntro(false);
              }}
              className="neo-btn btn-cyber-primary"
              style={{
                padding: '0.8rem 2.2rem',
                fontSize: '1rem',
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(124, 92, 255, 0.3)',
                animation: 'pulse 1.8s infinite alternate',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Music size={18} fill="currentColor" /> Enter Studio
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Drifting musical background particles */}
      <FloatingMusicParticles />

      <Sidebar
        activeView={activeTab}
        onViewChange={handleSidebarTabChange}
        user={user ? { username: user.username, xp: user.xp, streak: user.streak } : null}
        onLogout={handleLogout}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <div className="main-content">
        {/* Top Header */}
        <header className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Music size={24} style={{ color: 'var(--primary)', animation: 'pulse 1.5s infinite alternate' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>
              TuneUp
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Guest alert if not authenticated */}
            {!user && activeTab !== 'profile' && (
              <span 
                className="quirky-badge orange" 
                style={{ cursor: 'pointer', fontSize: '0.7rem', textTransform: 'none' }}
                onClick={() => handleSidebarTabChange('profile')}
              >
                ⚠️ Guest Mode (click to sync online)
              </span>
            )}
            
            <div className={`stat-item ${getDisplayStats().streak > 0 ? 'streak-stat-active' : ''}`} style={{ fontFamily: 'var(--font-stats)', color: getDisplayStats().streak > 0 ? 'var(--neon-yellow)' : 'var(--text-light)', borderColor: getDisplayStats().streak > 0 ? 'rgba(255, 230, 0, 0.3)' : 'rgba(255, 255, 255, 0.08)', boxShadow: getDisplayStats().streak > 0 ? '0 0 10px rgba(255, 230, 0, 0.15)' : 'none' }}>
              <Zap size={14} className={getDisplayStats().streak > 0 ? 'blink-thunderbolt' : ''} style={{ color: getDisplayStats().streak > 0 ? 'var(--neon-yellow)' : 'var(--text-muted)' }} />
              <span>Streak: {getDisplayStats().streak}</span>
            </div>
            
            <div className="stat-item" style={{ fontFamily: 'var(--font-stats)' }}>
              <Award size={14} className="neon-text-purple" />
              <span>XP: {getDisplayStats().score}</span>
            </div>

            <button 
              onClick={handleResetStats}
              className="btn-cyber" 
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.7rem', border: '1px dashed var(--neon-danger)', color: 'var(--neon-danger)', fontWeight: 'bold', textTransform: 'none' }}
              title="Reset Progress"
            >
              <RefreshCw size={10} /> Reset
            </button>
          </div>
        </header>

        {/* View Router */}
        <div style={{ paddingBottom: '100px' }}>
          
          {/* A. DASHBOARD VIEW (Pathways / Exercises list) */}
          {activeTab === 'dashboard' && !currentExercise && (
            <Dashboard 
              stats={getDisplayStats()} 
              onSelectExercise={(exId, presetName) => { 
                playUIClick();
                if (exId === 'jam-buddy') {
                  setActiveTab('jambuddy');
                  if (presetName) {
                    setJamPresetSong(presetName);
                  }
                } else if (exId === 'sandbox') {
                  setActiveTab('sandbox');
                } else {
                  setCurrentExercise(exId);
                  if (presetName) {
                    setPresetChord(presetName);
                  }
                }
              }} 
              onSelectSong={(title) => {
                playUIClick();
                setSelectedSongForLyrics(title);
              }}
            />
          )}

          {/* Core Theory Exercises */}
          {activeTab === 'dashboard' && currentExercise && ['chord-spelling', 'chord-naming', 'chord-families', 'scale-degrees'].includes(currentExercise) && (
            <TheoryExercises
              exerciseId={currentExercise as any}
              onBack={() => { playUIBack(); setCurrentExercise(null); }}
              onUpdateStats={handleUpdateStats}
              presetChord={presetChord}
              clearPresetChord={() => setPresetChord(null)}
            />
          )}

          {/* Instrument Exercises */}
          {activeTab === 'dashboard' && currentExercise && ['chord-diagrams', 'fretboard-finder', 'riff-transposer'].includes(currentExercise) && (
            <InstrumentExercises
              exerciseId={currentExercise as any}
              onBack={() => { playUIBack(); setCurrentExercise(null); }}
              onUpdateStats={(pts) => handleUpdateStats(pts)}
            />
          )}

          {/* Ear Training Exercises */}
          {activeTab === 'dashboard' && currentExercise && ['ear-intervals', 'ear-chords', 'ear-melody'].includes(currentExercise) && (
            <EarTrainingExercises
              exerciseId={currentExercise as any}
              onBack={() => { playUIBack(); setCurrentExercise(null); }}
              onUpdateStats={(pts) => handleUpdateStats(pts)}
            />
          )}

          {/* Acoustic Pitch Matcher */}
          {activeTab === 'dashboard' && currentExercise === 'ear-acoustic' && (
            <AcousticPitchTrainer
              user={user}
              onBack={() => { playUIBack(); setCurrentExercise(null); }}
              onUpdateStats={(pts) => handleUpdateStats(pts)}
            />
          )}

          {/* B. SANDBOX PLAYGROUND */}
          {activeTab === 'sandbox' && (
            <SandboxPlayground onBack={() => handleSidebarTabChange('dashboard')} />
          )}

          {/* C. AI JAM BUDDY */}
          {activeTab === 'jambuddy' && (
            <JamBuddy
              globalBpm={bpm}
              onBpmChange={setBpm}
              onBack={() => handleSidebarTabChange('dashboard')}
              presetSongName={jamPresetSong}
              clearPresetSongName={() => setJamPresetSong(null)}
            />
          )}

          {/* D. ARENA SIMULATED MULTIPLAYER */}
          {activeTab === 'multiplayer' && (
            <MultiplayerBattle
              user={user}
              onBack={() => handleSidebarTabChange('dashboard')}
              onUpdateStats={(pts) => handleUpdateStats(pts)}
            />
          )}

          {/* E. MY PROFILE STATS */}
          {activeTab === 'profile' && (
            <Profile
              user={user}
              onLogout={handleLogout}
            />
          )}

        </div>
      </div>

      {/* Song Lyrics Sheet Modal */}
      {selectedSongForLyrics && (
        <SongLyricsView
          songTitle={selectedSongForLyrics}
          user={user}
          onClose={() => setSelectedSongForLyrics(null)}
        />
      )}

      {/* About the Developer Drawer Trigger Button */}
      <button
        onClick={() => { playUIClick(); setShowDevPage(true); }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'rgba(24, 33, 49, 0.85)',
          border: '1.5px solid var(--primary)',
          borderRadius: '50px',
          padding: '0.6rem 1.2rem',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          fontFamily: 'var(--font-heading)',
          boxShadow: '0 0 15px rgba(124, 92, 255, 0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(124, 92, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(124, 92, 255, 0.25)';
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>👨‍💻</span> About the Developer
      </button>

      {/* Developer Credits Drawer Overlay */}
      {showDevPage && (
        <div 
          className="modal-overlay" 
          onClick={() => { playUIBack(); setShowDevPage(false); }}
          style={{ zIndex: 11000 }}
        >
          <div 
            className="glass-panel view-enter"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '420px',
              width: '100%',
              padding: '2rem',
              border: '2px solid var(--primary)',
              boxShadow: '0 10px 40px rgba(124, 92, 255, 0.3)',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #111827 0%, var(--surface) 100%)',
              textAlign: 'center'
            }}
          >
            {/* Close */}
            <button 
              onClick={() => { playUIBack(); setShowDevPage(false); }} 
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.25rem'
              }}
            >
              ✕
            </button>

            {/* Avatar / Profile Graphic */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  boxShadow: '0 0 20px rgba(84, 198, 235, 0.4)'
                }}
              >
                🎸
              </div>
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.25rem' }}>Mayank Khanna</h3>
            <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', marginBottom: '1rem' }}>
              Creator & Lead Developer
            </p>

            <div 
              style={{ 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '10px', 
                padding: '1rem', 
                fontSize: '0.8rem', 
                lineHeight: '1.5', 
                color: 'var(--text-muted)',
                textAlign: 'left',
                border: '1px solid rgba(255,255,255,0.04)',
                marginBottom: '1.25rem'
              }}
            >
              TuneUp Lab is created and developed by <strong>Mayank Khanna</strong>. It represents a premium neobrutalist practice space equipping musicians with:
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>🎹 Smart chord & ear quality trainers</li>
                <li>🎸 High-contrast interactive fretboards</li>
                <li>✉️ Passwordless Nodemailer OTP auth</li>
                <li>📝 Contributed song lyrics transposer tools</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span className="quirky-badge cyan" style={{ fontSize: '0.65rem' }}>React</span>
              <span className="quirky-badge magenta" style={{ fontSize: '0.65rem' }}>TypeScript</span>
              <span className="quirky-badge orange" style={{ fontSize: '0.65rem' }}>Web Audio API</span>
              <span className="quirky-badge" style={{ fontSize: '0.65rem', background: '#475569', color: '#fff' }}>MongoDB</span>
            </div>

            <button
              onClick={() => { playUIBack(); setShowDevPage(false); }}
              className="btn-cyber btn-cyber-primary"
              style={{ width: '100%', padding: '0.65rem', fontWeight: 'bold', fontSize: '0.8rem' }}
            >
              Rock On! 🎸
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
