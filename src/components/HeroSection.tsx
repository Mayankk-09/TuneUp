import React from 'react';
import { Play } from 'lucide-react';
import { playUIClick } from '../utils/audioSynth';

export const HeroSection: React.FC = () => {
  const handleQuickPractice = () => {
    playUIClick();
    const section = document.getElementById('practice-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="hero-section glass-panel"
      style={{
        padding: '3rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2.5rem',
        width: '100%',
        minHeight: '300px',
      }}
    >
      {/* Background Staff Lines & Equalizer Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.08,
          pointerEvents: 'none',
        }}
      >
        <svg viewBox="0 0 800 240" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          {/* Staff lines */}
          <line x1="0" y1="50" x2="800" y2="50" stroke="var(--text-light)" strokeWidth="1" />
          <line x1="0" y1="65" x2="800" y2="65" stroke="var(--text-light)" strokeWidth="1" />
          <line x1="0" y1="80" x2="800" y2="80" stroke="var(--text-light)" strokeWidth="1" />
          <line x1="0" y1="95" x2="800" y2="95" stroke="var(--text-light)" strokeWidth="1" />
          <line x1="0" y1="110" x2="800" y2="110" stroke="var(--text-light)" strokeWidth="1" />

          {/* Equalizer Grid Pattern */}
          <pattern id="hero-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="24" y2="0" stroke="var(--text-light)" strokeWidth="0.5" opacity="0.3" />
            <line x1="0" y1="0" x2="0" y2="24" stroke="var(--text-light)" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />

          {/* Staff Treble Clef path */}
          <path d="M40,120 C45,120 50,100 50,80 C50,60 40,40 40,20 C40,10 45,0 50,10 C55,20 50,45 45,65 C40,85 30,105 30,115 C30,125 37,135 45,135 C55,135 65,120 65,100 C65,80 55,60 55,60" fill="none" stroke="var(--text-light)" strokeWidth="2.5" />
          
          {/* Waveform visualizer representation */}
          <path d="M120,110 Q140,80 160,110 T200,110 T240,110 T280,110 T320,110 T360,110 T400,110" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <path d="M120,110 Q140,130 160,110 T200,110 T240,110 T280,110 T320,110 T360,110 T400,110" fill="none" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        </svg>
      </div>

      {/* Floating subtle note sticker */}
      <div className="quirky-sticker" style={{ top: '25px', left: '35%', opacity: 0.15, fontSize: '1.25rem', pointerEvents: 'none', position: 'absolute' }}>♩</div>
      <div className="quirky-sticker" style={{ bottom: '25px', left: '25%', opacity: 0.15, fontSize: '1.25rem', pointerEvents: 'none', position: 'absolute' }}>♫</div>

      {/* LEFT COLUMN: Text Headline, Subtitle, CTA */}
      <div 
        style={{
          flex: '1 1 450px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          gap: '1.25rem',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.7rem', 
              color: 'var(--secondary)', 
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              background: 'rgba(84, 198, 235, 0.1)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px'
            }}
          >
            ● Studio Lobby
          </span>
        </div>

        <h1 
          style={{ 
            fontFamily: 'var(--font-heading)',
            fontSize: '2.5rem', 
            fontWeight: 800, 
            lineHeight: 1.15,
            color: 'var(--text-light)',
            letterSpacing: '-0.8px'
          }}
        >
          Master music theory.<br />
          <span style={{ color: 'var(--text-muted)' }}>Not by memorising.</span> <span style={{ color: 'var(--primary)' }}>By playing.</span>
        </h1>

        <p 
          style={{ 
            color: 'var(--text-muted)', 
            maxWidth: '520px', 
            fontSize: '0.95rem', 
            lineHeight: 1.6,
            margin: 0
          }}
        >
          Uncover chord structures, map ear intervals, translate fretboards, and jam with custom synthesis loops in our interactive studio.
        </p>

        <button 
          onClick={handleQuickPractice}
          className="neo-btn btn-cyber-primary"
          style={{ 
            padding: '0.8rem 1.6rem', 
            fontSize: '0.85rem', 
            borderRadius: '10px',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '0.5rem'
          }}
        >
          <Play size={16} fill="currentColor" />
          Start quick practice
        </button>
      </div>

      {/* RIGHT COLUMN: Animated Music Object (Spinning Vinyl Record) */}
      <div 
        style={{
          flex: '1 1 200px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
        }}
        className="hero-right-container"
      >
        <div 
          style={{
            position: 'relative',
            width: '180px',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer glow shadow ring */}
          <div 
            style={{
              position: 'absolute',
              width: '190px',
              height: '190px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124, 92, 255, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />
          
          {/* Vinyl Svg */}
          <svg 
            viewBox="0 0 200 200" 
            width="180" 
            height="180" 
            style={{ 
              animation: 'rotateAnimation 15s linear infinite', 
              transformOrigin: 'center',
              filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))'
            }}
          >
            {/* Vinyl Outer Disc */}
            <circle cx="100" cy="100" r="92" fill="#0b0f17" />
            
            {/* Concentric Grooves */}
            <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="74" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="66" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="58" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

            {/* Vinyl Center Label */}
            <circle cx="100" cy="100" r="28" fill="var(--primary)" />
            <circle cx="100" cy="100" r="20" fill="var(--secondary)" opacity="0.8" />
            
            {/* Music Note in Center */}
            <path 
              d="M97,91 L97,105 C97,108 94,109 92,109 C90,109 88,107 88,105 C88,103 90,101 92,101 C94,101 95,102 95,103.5 L95,94 L107,91.5 L107,101 C107,104 104,105 102,105 C100,105 98,103 98,101 C98,99 100,97 102,97 C104,97 105,98 105,99.5 L105,93 L97,91 Z" 
              fill="#111827" 
            />

            {/* Spindle hole */}
            <circle cx="100" cy="100" r="5" fill="#111827" />
          </svg>
        </div>
      </div>
    </div>
  );
};
