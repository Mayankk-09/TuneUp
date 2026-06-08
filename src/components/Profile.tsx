// Profile.tsx - Authentication, Stats Dashboard, Custom Avatars, and Profile Sharing

import React, { useState } from 'react';
import { ShieldAlert, Award, Calendar, Copy, Check, Info } from 'lucide-react';
import { playUIClick, playUIBack, playUISuccess } from '../utils/audioSynth';

// 10 Detailed Custom SVG Avatars
export const AVATARS_DB = [
  {
    id: 'mic',
    name: 'Retro Mic',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#18132B" stroke="#000" strokeWidth="3" />
        {/* Floating notes */}
        <path d="M25,25 Q30,20 35,25 M25,25 L25,35" stroke="#00F2FE" strokeWidth="2" fill="none" />
        <circle cx="35" cy="25" r="3" fill="#00F2FE" />
        <path d="M70,30 Q75,25 80,30 M70,30 L70,40" stroke="#F857A6" strokeWidth="2" fill="none" />
        <circle cx="80" cy="30" r="3" fill="#F857A6" />
        {/* Mic base */}
        <path d="M47,75 L53,75 L55,90 L45,90 Z" fill="#666" stroke="#000" strokeWidth="2" />
        <rect x="49" y="60" width="2" height="15" fill="#444" />
        {/* Grille */}
        <rect x="40" y="25" width="20" height="30" rx="10" fill="#AAA" stroke="#000" strokeWidth="3" />
        <line x1="40" y1="35" x2="60" y2="35" stroke="#000" strokeWidth="2" />
        <line x1="40" y1="45" x2="60" y2="45" stroke="#000" strokeWidth="2" />
        <line x1="50" y1="25" x2="50" y2="55" stroke="#000" strokeWidth="2" />
      </svg>
    )
  },
  {
    id: 'electric_guitar',
    name: 'Thunder Axe',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#2B1313" stroke="#000" strokeWidth="3" />
        {/* Lightning bolts */}
        <path d="M15,40 L30,30 L25,50 L40,40" stroke="#00F2FE" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M85,40 L70,30 L75,50 L60,40" stroke="#00F2FE" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Guitar neck */}
        <line x1="50" y1="25" x2="50" y2="70" stroke="#FFE600" strokeWidth="4" />
        {/* Body */}
        <path d="M35,65 Q35,55 50,65 Q65,55 65,65 Q65,85 50,88 Q35,85 35,65 Z" fill="#FF0055" stroke="#000" strokeWidth="3" />
        <circle cx="50" cy="73" r="5" fill="#000" />
      </svg>
    )
  },
  {
    id: 'acoustic_guitar',
    name: 'Fedora Folk',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#2C2013" stroke="#000" strokeWidth="3" />
        {/* Guitar Body */}
        <path d="M38,55 Q30,55 35,70 Q35,85 50,85 Q65,85 65,70 Q70,55 62,55 Z" fill="#D4A373" stroke="#000" strokeWidth="3" />
        <circle cx="50" cy="70" r="6" fill="#1A120B" stroke="#000" strokeWidth="2" />
        {/* Cowboy Hat sitting on top */}
        <path d="M30,38 Q50,30 70,38 L72,42 Q50,35 28,42 Z" fill="#8C6239" stroke="#000" strokeWidth="2" />
        <path d="M38,36 Q50,20 62,36 Z" fill="#5C3F21" stroke="#000" strokeWidth="2.5" />
      </svg>
    )
  },
  {
    id: 'tabla',
    name: 'Tabla Mystic',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#132B1B" stroke="#000" strokeWidth="3" />
        {/* Mandala circles */}
        <circle cx="50" cy="50" r="35" stroke="#FF6B35" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.4" />
        <circle cx="50" cy="50" r="28" stroke="#FFE600" strokeWidth="1" strokeDasharray="4,4" fill="none" opacity="0.3" />
        {/* Tabla Drums */}
        {/* Bayan (Left Drum) */}
        <path d="M22,60 L38,60 L40,82 L20,82 Z" fill="#9A7B56" stroke="#000" strokeWidth="2.5" />
        <ellipse cx="30" cy="60" rx="8" ry="4" fill="#3E2723" stroke="#000" strokeWidth="2" />
        <circle cx="30" cy="60" r="3" fill="#1A1110" />
        {/* Dayan (Right Drum) */}
        <path d="M54,55 L70,55 L68,82 L56,82 Z" fill="#BCAAA4" stroke="#000" strokeWidth="2.5" />
        <ellipse cx="62" cy="55" rx="7" ry="3.5" fill="#4E342E" stroke="#000" strokeWidth="2" />
        <circle cx="62" cy="55" r="2.5" fill="#1A1110" />
      </svg>
    )
  },
  {
    id: 'drums',
    name: 'Neon Beat',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#13242B" stroke="#000" strokeWidth="3" />
        {/* Sonic Waves */}
        <circle cx="50" cy="45" r="30" stroke="#FFE600" strokeWidth="2" fill="none" strokeDasharray="5,10" opacity="0.5" />
        {/* Snare */}
        <rect x="30" y="45" width="40" height="20" rx="3" fill="#90A4AE" stroke="#000" strokeWidth="2.5" />
        <ellipse cx="50" cy="45" rx="20" ry="5" fill="#ECEFF1" stroke="#000" strokeWidth="2.5" />
        {/* Crossed drumsticks */}
        <line x1="20" y1="35" x2="80" y2="75" stroke="#FFE600" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="35" x2="20" y2="75" stroke="#FFE600" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'vinyl_record',
    name: 'Lofi Spinner',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#1C1B1A" stroke="#000" strokeWidth="3" />
        {/* Vinyl grooves */}
        <circle cx="50" cy="50" r="32" stroke="#444" strokeWidth="1.5" fill="none" />
        <circle cx="50" cy="50" r="25" stroke="#333" strokeWidth="1.5" fill="none" />
        {/* Center label */}
        <circle cx="50" cy="50" r="12" fill="#F857A6" stroke="#000" strokeWidth="2" />
        <circle cx="50" cy="50" r="3" fill="#FFF" />
        {/* Smiley Face */}
        <path d="M44,48 Q44,45 46,45 C48,45 48,48 48,48" stroke="#FFF" strokeWidth="1.5" fill="none" />
        <path d="M52,48 Q52,45 54,45 C56,45 56,48 56,48" stroke="#FFF" strokeWidth="1.5" fill="none" />
        <path d="M43,54 Q50,60 57,54" stroke="#FFF" strokeWidth="2" fill="none" />
        {/* Headphones */}
        <path d="M22,50 A28,28 0 0,1 78,50" fill="none" stroke="#00F2FE" strokeWidth="5" />
        <rect x="18" y="44" width="8" height="15" rx="3" fill="#00F2FE" stroke="#000" strokeWidth="2" />
        <rect x="74" y="44" width="8" height="15" rx="3" fill="#00F2FE" stroke="#000" strokeWidth="2" />
      </svg>
    )
  },
  {
    id: 'sax',
    name: 'Jazz Smoke',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#2B1324" stroke="#000" strokeWidth="3" />
        {/* Steam smoke */}
        <path d="M65,30 Q60,15 50,20 Q40,25 45,10" stroke="rgba(248,87,166,0.3)" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Sax body */}
        <path d="M30,30 L38,30 L42,65 Q45,80 62,80 Q72,80 75,65 L70,62" fill="none" stroke="#FFE600" strokeWidth="5" strokeLinecap="round" />
        <path d="M60,65 L78,52 L83,57 Z" fill="#FFE600" stroke="#000" strokeWidth="2.5" />
        {/* Keys */}
        <circle cx="39" cy="40" r="2.5" fill="#FFF" stroke="#000" />
        <circle cx="41" cy="50" r="2.5" fill="#FFF" stroke="#000" />
      </svg>
    )
  },
  {
    id: 'flute',
    name: 'Wind Swirl',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#132B29" stroke="#000" strokeWidth="3" />
        {/* Wind Swirls */}
        <path d="M15,65 Q30,55 50,65 T85,65" fill="none" stroke="rgba(0,242,254,0.3)" strokeWidth="3" strokeLinecap="round" />
        {/* Flute */}
        <rect x="15" y="42" width="70" height="5" transform="rotate(-20 50 50)" fill="#CFD8DC" stroke="#000" strokeWidth="2" />
        {/* Flute Holes */}
        <circle cx="35" cy="42" r="1.5" fill="#000" />
        <circle cx="45" cy="38" r="1.5" fill="#000" />
        <circle cx="55" cy="34" r="1.5" fill="#000" />
        <circle cx="65" cy="31" r="1.5" fill="#000" />
      </svg>
    )
  },
  {
    id: 'bass',
    name: 'Sub Cab',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#1A1D20" stroke="#000" strokeWidth="3" />
        {/* Cabinet Speaker */}
        <rect x="25" y="40" width="50" height="48" rx="4" fill="#343A40" stroke="#000" strokeWidth="2.5" />
        <circle cx="50" cy="64" r="18" fill="#212529" stroke="#000" strokeWidth="2" />
        <circle cx="50" cy="64" r="8" fill="#00F2FE" />
        {/* Bass Body */}
        <path d="M15,20 L35,50 L25,55 Z" fill="#000" stroke="#00F2FE" strokeWidth="1" />
        <line x1="22" y1="25" x2="35" y2="48" stroke="#FFF" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'piano',
    name: 'Wave Keys',
    svg: (
      <svg viewBox="0 0 100 100" className="avatar-svg">
        <circle cx="50" cy="50" r="45" fill="#1C182B" stroke="#000" strokeWidth="3" />
        {/* Wave keys */}
        <path d="M12,65 C25,55 35,75 50,65 C65,55 75,75 88,65 L88,85 L12,85 Z" fill="#FFF" stroke="#000" strokeWidth="2.5" />
        {/* Black keys */}
        <rect x="20" y="58" width="5" height="12" fill="#000" transform="rotate(-10 20 58)" />
        <rect x="38" y="64" width="5" height="12" fill="#000" transform="rotate(5 38 64)" />
        <rect x="58" y="60" width="5" height="12" fill="#000" transform="rotate(-5 58 60)" />
        <rect x="74" y="62" width="5" height="12" fill="#000" transform="rotate(10 74 62)" />
      </svg>
    )
  }
];

interface ProfileProps {
  user: {
    username: string;
    xp: number;
    streak: number;
    masteredChords: string[];
    unlockedBadges: string[];
  } | null;
  onLoginSuccess: (userData: any, token?: string) => void;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLoginSuccess, onLogout }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toggle active tab
  const handleTabChange = (isLogin: boolean) => {
    playUIClick();
    setIsLoginTab(isLogin);
    setErrorMsg('');
    setOtpSent(false);
    setOtpSuccessMsg('');
    setOtpInput('');
  };

  const handleRequestOtp = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address!');
      return;
    }
    setErrorMsg('');
    setOtpLoading(true);
    setOtpSuccessMsg('');
    try {
      const res = await fetch('https://tuneup-fb4s.onrender.com//api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }
      playUISuccess();
      setOtpSent(true);
      setOtpSuccessMsg('Verification code sent! Check your inbox (or console logs).');
      setTimeout(() => setOtpSuccessMsg(''), 5000);
    } catch (err: any) {
      playUIBack();
      setErrorMsg(err.message || 'Failed to send verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !otpInput) {
      setErrorMsg('Email and Verification OTP are required!');
      return;
    }
    if (!isLoginTab && !usernameInput) {
      setErrorMsg('Username is required for registration!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const endpoint = isLoginTab ? '/api/auth/login' : '/api/auth/register';
      const bodyPayload = isLoginTab 
        ? { email: emailInput, otp: otpInput } 
        : { username: usernameInput, email: emailInput, otp: otpInput, avatarId: AVATARS_DB[avatarIndex].id };

      // We contact our Express API server (usually running on port 5000)
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Something went wrong!');
      }

      playUISuccess();
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      playUIBack();
      setErrorMsg(err.message || 'Network connection failed to backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Profile Copy to Share function
  const handleShareProfile = () => {
    if (!user) return;
    playUIClick();

    const textReport = `🎵 TuneUp Profile Report:
👤 Username: ${user.username}
🏆 Music Rank: ${getRankName(user.xp)}
🔥 Learning Streak: ${user.streak} days
⚡ Experience: ${user.xp} XP
🎸 Mastered Chords: ${user.masteredChords.join(', ') || 'Triads learning'}
🏅 Song Setlist Badges: ${user.unlockedBadges.join(', ') || 'Get Lucky badge pending'}

Practice your theory on TuneUp Cyberpunk Lab! 🚀`;

    navigator.clipboard.writeText(textReport).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getRankName = (xp: number) => {
    if (xp < 200) return 'Garage Guitarist 🎸';
    if (xp < 500) return 'Busker Apprentice 🎵';
    if (xp < 1000) return 'Club Headliner 🎹';
    if (xp < 2000) return 'Chart Topper ⚡';
    return 'Rock Legend 🏆';
  };

  const getAvatarSvg = (avatarId?: string) => {
    const found = AVATARS_DB.find(a => a.id === avatarId);
    return found ? found.svg : AVATARS_DB[0].svg;
  };

  return (
    <div style={{ maxWidth: '650px', width: '100%', margin: '0 auto' }}>
      
      {/* 1. AUTHENTICATED PANEL */}
      {user ? (
        <div className="view-enter glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Header block with avatar */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '12px', border: '3px solid #000', overflow: 'hidden', boxShadow: '4px 4px 0 #000' }}>
              {getAvatarSvg(user.unlockedBadges[0] || 'mic')} {/* badges holds avatarId at [0] usually */}
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{user.username}</h2>
              <div className="quirky-badge orange" style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.75rem' }}>
                {getRankName(user.xp)}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '2px solid #000', padding: '1rem', borderRadius: '10px', textAlign: 'center', boxShadow: '3px 3px 0 rgba(0,242,254,0.3)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>TOTAL XP</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-cyan)', marginTop: '4px' }}>{user.xp}</div>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '2px solid #000', padding: '1rem', borderRadius: '10px', textAlign: 'center', boxShadow: '3px 3px 0 rgba(248,87,166,0.3)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>ACTIVE STREAK</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-magenta)', marginTop: '4px' }}>{user.streak} 🔥</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', border: '2px solid #000', padding: '1rem', borderRadius: '10px', textAlign: 'center', boxShadow: '3px 3px 0 rgba(255,230,0,0.3)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>MASTERED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-yellow)', marginTop: '4px' }}>
                {user.masteredChords.length} Chords
              </div>
            </div>
          </div>

          {/* Unlocked Song badges list */}
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Award size={16} /> UNLOCKED SETLIST BADGES
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Skip first badge as it's the avatar id */}
              {user.unlockedBadges.slice(1).length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No songs unlocked yet. Complete spelling exercises with 80%+ scores to claim tracks!
                </p>
              ) : (
                user.unlockedBadges.slice(1).map(badge => (
                  <div 
                    key={badge} 
                    className="quirky-badge magenta" 
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '0.8rem', 
                      border: '2px solid #000', 
                      boxShadow: '2px 2px 0 #000' 
                    }}
                  >
                    🏆 {badge} Badge
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mastered chords details */}
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Calendar size={16} /> MASTERED CHORDS LOG
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {user.masteredChords.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Keep practicing spelling exercises to log mastered chord speller formulas.
                </p>
              ) : (
                user.masteredChords.map(chord => (
                  <span key={chord} className="quirky-badge cyan" style={{ fontSize: '0.75rem' }}>
                    {chord}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Share Profile button */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={handleShareProfile}
              className="btn-cyber btn-cyber-primary"
              style={{ flex: 1, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}
            >
              {copied ? (
                <>
                  <Check size={18} /> COPIED TO CLIPBOARD
                </>
              ) : (
                <>
                  <Copy size={18} /> SHARE MY PROFILE CARD
                </>
              )}
            </button>
            <button
              onClick={() => { playUIBack(); onLogout(); }}
              className="btn-cyber btn-cyber-magenta"
              style={{ padding: '0.8rem 1.5rem' }}
            >
              LOG OUT
            </button>
          </div>
        </div>
      ) : (
        <div className="view-enter game-console-panel">
          
          {/* Tabs */}
          <div className="game-console-tab-container">
            <button
              onClick={() => handleTabChange(true)}
              className={`game-console-tab ${isLoginTab ? 'active-login' : ''}`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => handleTabChange(false)}
              className={`game-console-tab ${!isLoginTab ? 'active-register' : ''}`}
            >
              CREATE LAB ACCOUNT
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Input field username (Registration only) */}
            {!isLoginTab && (
              <div className="game-console-input-wrapper">
                <label style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>USERNAME</label>
                <input
                  type="text"
                  placeholder="Enter cyberpunk handle..."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="game-console-input"
                  required
                />
              </div>
            )}

            {/* Input field email (Required for both) */}
            <div className="game-console-input-wrapper">
              <label style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>EMAIL ADDRESS</label>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="game-console-input"
                  style={{ flex: 1 }}
                  required
                />
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpLoading || !emailInput}
                  className="btn-cyber btn-cyber-primary"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', textTransform: 'none', borderRadius: '8px', flexShrink: 0 }}
                >
                  {otpLoading ? 'SENDING...' : otpSent ? 'RESEND OTP' : 'SEND OTP'}
                </button>
              </div>
            </div>

            {/* Input field OTP verification code (Required for both) */}
            <div className="game-console-input-wrapper" style={{ opacity: otpSent ? 1 : 0.65 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                VERIFICATION CODE {otpSent && <span style={{ color: 'var(--neon-success)' }}>(OTP SENT)</span>}
              </label>
              <input
                type="text"
                placeholder="6-digit OTP code"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="game-console-input"
                style={{ letterSpacing: '0.2em', textAlign: 'center', fontWeight: 'bold' }}
                required
              />
            </div>

            {/* OTP sent success message */}
            {otpSuccessMsg && (
              <div className="neon-text-success" style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.5rem' }}>
                ✓ {otpSuccessMsg}
              </div>
            )}

            {/* Registration Avatar grid */}
            {!isLoginTab && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>SELECT LAB AVATAR STICKER</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {AVATARS_DB.map((avatar, idx) => {
                    const isSelected = avatarIndex === idx;
                    return (
                      <div
                        key={avatar.id}
                        onClick={() => { playUIClick(); setAvatarIndex(idx); }}
                        style={{
                          borderRadius: '12px',
                          border: isSelected ? '2.5px solid var(--neon-magenta)' : '1px solid rgba(255,255,255,0.08)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(248,87,166,0.1)' : 'rgba(0,0,0,0.2)',
                          boxShadow: isSelected ? '0 0 12px rgba(248,87,166,0.3)' : 'none',
                          transform: isSelected ? 'scale(1.05)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                        title={avatar.name}
                      >
                        {avatar.svg}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  Selected: {AVATARS_DB[avatarIndex].name}
                </div>
              </div>
            )}

            {/* Error prompt */}
            {errorMsg && (
              <div 
                style={{ 
                  background: 'rgba(255, 0, 85, 0.05)', 
                  border: '1px solid var(--neon-danger)', 
                  color: 'var(--neon-danger)',
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ShieldAlert size={14} /> {errorMsg}
              </div>
            )}

            {/* Info warning */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,230,0,0.02)', border: '1px solid rgba(255,230,0,0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              <Info size={14} style={{ color: 'var(--neon-yellow)', flexShrink: 0 }} />
              <span>
                Note: In Guest Mode, stats are NOT saved to local storage and will be lost on refresh. Register a free account to permanently sync and save your progress to the cloud database!
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`game-console-button ${isLoginTab ? 'btn-secondary' : 'btn-primary'}`}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'SYNCHRONIZING LAB...' : isLoginTab ? 'LOG IN' : 'REGISTER PROFILE'}
            </button>

          </form>

        </div>
      )}

    </div>
  );
};
