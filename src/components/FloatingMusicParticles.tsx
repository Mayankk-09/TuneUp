import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  type: 'note' | 'staff' | 'knob' | 'cassette' | 'vinyl' | 'headphone' | 'waveform';
  left: number;
  top: number;
  scale: number;
  opacity: number;
  speed: number; // in seconds
  delay: number; // in seconds
}

export const FloatingMusicParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const types: Particle['type'][] = ['note', 'staff', 'knob', 'cassette', 'vinyl', 'headphone', 'waveform'];
    const list: Particle[] = Array.from({ length: 18 }).map((_, idx) => ({
      id: idx,
      type: types[idx % types.length],
      left: Math.random() * 100, // percentage
      top: Math.random() * 100,  // percentage
      scale: 0.5 + Math.random() * 0.7,
      opacity: 0.05 + Math.random() * 0.08, // Very subtle, cute, almost hidden
      speed: 25 + Math.random() * 35, // slow drift
      delay: -(Math.random() * 30), // negative delay so they start scattered
    }));
    setParticles(list);
  }, []);

  const renderShape = (type: Particle['type']) => {
    switch (type) {
      case 'note':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3h-8z"/>
          </svg>
        );
      case 'staff':
        return (
          <svg viewBox="0 0 40 20" width="40" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6">
            <line x1="0" y1="4" x2="40" y2="4" />
            <line x1="0" y1="8" x2="40" y2="8" />
            <line x1="0" y1="12" x2="40" y2="12" />
            <line x1="0" y1="16" x2="40" y2="16" />
            <path d="M8,18 C12,12 8,6 14,8" strokeWidth="1" />
          </svg>
        );
      case 'knob':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="12" x2="12" y2="6" transform="rotate(45 12 12)" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        );
      case 'cassette':
        return (
          <svg viewBox="0 0 32 20" width="32" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round">
            <rect x="2" y="2" width="28" height="16" rx="2" />
            <rect x="6" y="5" width="20" height="7" rx="1" />
            <circle cx="11" cy="8.5" r="2" />
            <circle cx="21" cy="8.5" r="2" />
            <path d="M11,15 L21,15" strokeWidth="1" />
          </svg>
        );
      case 'vinyl':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="1.5" fill="none">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="7" strokeDasharray="3 3" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        );
      case 'headphone':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9" />
            <rect x="2" y="13" width="3" height="6" rx="1.5" fill="currentColor" />
            <rect x="19" y="13" width="3" height="6" rx="1.5" fill="currentColor" />
          </svg>
        );
      case 'waveform':
        return (
          <svg viewBox="0 0 30 16" width="30" height="16" fill="currentColor">
            <rect x="2" y="6" width="2" height="4" rx="1" />
            <rect x="6" y="4" width="2" height="8" rx="1" />
            <rect x="10" y="2" width="2" height="12" rx="1" />
            <rect x="14" y="5" width="2" height="6" rx="1" />
            <rect x="18" y="3" width="2" height="10" rx="1" />
            <rect x="22" y="6" width="2" height="4" rx="1" />
            <rect x="26" y="7" width="2" height="2" rx="1" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="particles-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {particles.map(p => (
        <div
          key={p.id}
          className="drifting-particle"
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            transform: `scale(${p.scale})`,
            opacity: p.opacity,
            color: 'var(--neon-secondary)', // Midnight sky cyan accent
            animation: `driftAnimation ${p.speed}s linear infinite, rotateAnimation ${p.speed * 1.5}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {renderShape(p.type)}
        </div>
      ))}
    </div>
  );
};
