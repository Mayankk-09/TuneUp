import React, { useEffect, useState } from 'react';

interface MascotProps {
  state?: 'idle' | 'dancing' | 'sleeping' | 'celebrating' | 'fail-guitar' | 'fail-singing' | 'fail-headphones' | 'fail-drums';
  message?: string;
}

export const Mascot: React.FC<MascotProps> = ({ state = 'idle', message }) => {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (state === 'celebrating') {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const getMascotClass = () => {
    let classes = 'mascot-body';
    if (state === 'sleeping') classes += ' mascot-sleep';
    if (state === 'dancing') classes += ' mascot-dance';
    if (bounce || state === 'celebrating') classes += ' mascot-celebrate';
    if (state.startsWith('fail-')) classes += ' mascot-sleep';
    return classes;
  };

  // Eyes renderer based on state
  const renderEyes = () => {
    switch (state) {
      case 'sleeping':
        return (
          <>
            {/* Sleeping closed eye paths */}
            <path d="M34,48 Q39,53 44,48" stroke="#f1f3fa" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M56,48 Q61,53 66,48" stroke="#f1f3fa" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'dancing':
        return (
          <>
            {/* Happy squint eyes */}
            <path d="M34,50 L42,44 L34,38" fill="none" stroke="#53D8FB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-90 38 44)" />
            <path d="M58,50 L66,44 L58,38" fill="none" stroke="#53D8FB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-90 62 44)" />
          </>
        );
      case 'celebrating':
        return (
          <>
            {/* Sparkly Star Eyes */}
            <path d="M38,36 L40,42 L46,44 L40,46 L38,52 L36,46 L30,44 L36,42 Z" fill="#F973C5" stroke="#000" strokeWidth="1" />
            <path d="M62,36 L64,42 L70,44 L64,46 L62,52 L60,46 L54,44 L60,42 Z" fill="#F973C5" stroke="#000" strokeWidth="1" />
          </>
        );
      case 'fail-guitar':
      case 'fail-singing':
      case 'fail-headphones':
      case 'fail-drums':
        return (
          <>
            {/* Cross eyes X_X */}
            <path d="M34,41 L42,49 M42,41 L34,49" stroke="var(--neon-danger)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M58,41 L66,49 M66,41 L58,49" stroke="var(--neon-danger)" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case 'idle':
      default:
        return (
          <>
            {/* Wide cassette wheel eyes */}
            <circle cx="38" cy="45" r="7" fill="#111827" stroke="#000" strokeWidth="1.5" />
            <circle cx="38" cy="45" r="2.5" fill="#f1f3fa" className="mascot-pupil" />
            
            <circle cx="62" cy="45" r="7" fill="#111827" stroke="#000" strokeWidth="1.5" />
            <circle cx="62" cy="45" r="2.5" fill="#f1f3fa" className="mascot-pupil" />
          </>
        );
    }
  };

  // Mouth renderer based on state
  const renderMouth = () => {
    switch (state) {
      case 'sleeping':
        return <circle cx="50" cy="58" r="2.5" fill="#f1f3fa" />;
      case 'dancing':
        return <path d="M46,55 Q50,62 54,55 Z" fill="#F973C5" stroke="#000" strokeWidth="1.5" />;
      case 'celebrating':
        return <path d="M44,54 Q50,65 56,54 Z" fill="#F973C5" stroke="#000" strokeWidth="2" />;
      case 'fail-guitar':
      case 'fail-singing':
      case 'fail-headphones':
      case 'fail-drums':
        return <path d="M44,60 Q50,54 56,60" stroke="#ff0055" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case 'idle':
      default:
        return <path d="M46,56 Q50,60 54,56" stroke="#f1f3fa" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      
      {/* Speech Bubble (Duolingo Style) */}
      {message && (
        <div 
          className="mascot-bubble"
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '0.6rem 0.9rem',
            fontSize: '0.75rem',
            color: 'var(--text-light)',
            fontWeight: 'bold',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
            position: 'relative',
            marginBottom: '15px',
            maxWidth: '180px',
            textAlign: 'center',
            zIndex: 10,
            animation: 'floatMascot 3s ease-in-out infinite alternate'
          }}
        >
          {message}
          {/* Arrow */}
          <div 
            style={{
              position: 'absolute',
              bottom: '-7px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '12px',
              height: '12px',
              background: 'var(--surface)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          />
        </div>
      )}

      {/* Mascot Graphic container */}
      <div 
        className={getMascotClass()} 
        style={{ 
          width: '90px', 
          height: '90px', 
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* zZZ particles for sleeping */}
          {state === 'sleeping' && (
            <g className="mascot-sleep-zzz" fill="var(--neon-secondary)">
              <text x="75" y="15" fontSize="12" fontWeight="bold">Z</text>
              <text x="83" y="27" fontSize="8" fontWeight="bold">z</text>
            </g>
          )}

          {/* Dancing music particles */}
          {state === 'dancing' && (
            <g className="mascot-dance-particles" stroke="var(--neon-highlight)" strokeWidth="1.5" fill="none">
              <path d="M10,25 Q12,18 16,22" />
              <path d="M85,25 Q87,18 91,22" />
            </g>
          )}

          {/* Cassette Shell Body */}
          <rect x="18" y="26" width="64" height="48" rx="6" fill="#2B3445" stroke="#000" strokeWidth="3" />
          
          {/* Label Card */}
          <rect x="25" y="32" width="50" height="26" rx="3" fill="#1B2430" stroke="#000" strokeWidth="2" />
          
          {/* Label lines */}
          <line x1="28" y1="36" x2="72" y2="36" stroke="#f1f3fa" strokeWidth="1" opacity="0.3" />
          <line x1="28" y1="39" x2="72" y2="39" stroke="#f1f3fa" strokeWidth="1" opacity="0.3" />

          {/* Feet */}
          <ellipse cx="34" cy="74" rx="6" ry="3" fill="#1B2430" stroke="#000" strokeWidth="2" />
          <ellipse cx="66" cy="74" rx="6" ry="3" fill="#1B2430" stroke="#000" strokeWidth="2" />

          {/* Eyes & Mouth */}
          {renderEyes()}
          {renderMouth()}

          {/* Cassette Center holes details */}
          <path d="M 45,64 L 55,64" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />

          {/* Neon Headphones */}
          {/* Band */}
          <path d="M 12,45 A 38,38 0 0 1 88,45" fill="none" stroke="#7C5CFF" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 12,45 A 38,38 0 0 1 88,45" fill="none" stroke="#53D8FB" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Earcups */}
          <rect x="9" y="36" width="10" height="20" rx="3" fill="#7C5CFF" stroke="#000" strokeWidth="2.5" />
          <rect x="11" y="40" width="3" height="12" rx="1.5" fill="#53D8FB" />
          
          <rect x="81" y="36" width="10" height="20" rx="3" fill="#7C5CFF" stroke="#000" strokeWidth="2.5" />
          <rect x="86" y="40" width="3" height="12" rx="1.5" fill="#53D8FB" />
          {/* Fail Overlays */}
          {state === 'fail-guitar' && (
            <g key="fail-guitar-overlay">
              {/* Snapped string */}
              <path d="M22,38 Q45,30 46,42 Q47,56 78,50" stroke="var(--neon-orange)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M20,60 Q35,68 32,50" stroke="var(--neon-orange)" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          )}
          {state === 'fail-singing' && (
            <g key="fail-singing-overlay">
              {/* Flames rising */}
              <path d="M48,22 Q50,12 47,15 Q50,8 54,16 Q52,22 50,22 Z" fill="var(--neon-orange)" opacity="0.8" />
              <path d="M38,24 Q40,15 37,18 Q40,11 44,19 Q42,24 40,24 Z" fill="var(--neon-orange)" opacity="0.8" />
              <path d="M58,24 Q60,15 57,18 Q60,11 64,19 Q62,24 60,24 Z" fill="var(--neon-orange)" opacity="0.8" />
            </g>
          )}
          {state === 'fail-headphones' && (
            <g key="fail-headphones-overlay">
              {/* Lightning / sparks near headphones */}
              <path d="M5,35 L12,30 L8,40" stroke="var(--neon-yellow)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M95,35 L88,30 L92,40" stroke="var(--neon-yellow)" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          )}
          {state === 'fail-drums' && (
            <g key="fail-drums-overlay">
              {/* Crack overlay on shell */}
              <path d="M22,50 L30,48 L27,55 L35,53" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
              <path d="M78,50 L70,48 L73,55 L65,53" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
            </g>
          )}
        </svg>
      </div>

    </div>
  );
};
