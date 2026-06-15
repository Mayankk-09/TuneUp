// Sidebar.tsx - Responsive navigation shell for TuneUp

import React from 'react';
import { LayoutDashboard, Music, Flame, Users, User, LogOut } from 'lucide-react';
import { playUIClick } from '../utils/audioSynth';

export type ActiveView = 'dashboard' | 'sandbox' | 'jambuddy' | 'multiplayer' | 'profile';

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  user: { username: string; xp: number; streak: number } | null;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  user,
  onLogout,
  theme,
  onThemeToggle
}) => {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, color: 'var(--neon-cyan)' },
    { id: 'sandbox' as const, label: 'Sandbox', icon: Music, color: 'var(--neon-orange)' },
    { id: 'jambuddy' as const, label: 'Jam Buddy', icon: Flame, color: 'var(--neon-magenta)' },
    { id: 'multiplayer' as const, label: 'Arena Duels', icon: Users, color: 'var(--neon-purple)' },
    { id: 'profile' as const, label: 'My Stats', icon: User, color: 'var(--neon-success)' }
  ];

  const handleNavClick = (viewId: ActiveView) => {
    playUIClick();
    onViewChange(viewId);
  };

  return (
    <aside className="cyber-sidebar">
      {/* Brand logo */}
      <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', overflow: 'hidden' }}>
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'rotateAnimation 6s linear infinite', flexShrink: 0 }}>
          <circle cx="16" cy="16" r="14" fill="#0f172a" stroke="var(--primary)" strokeWidth="2.5" />
          <circle cx="16" cy="16" r="10" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
          <circle cx="16" cy="16" r="7" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
          <circle cx="16" cy="16" r="4" fill="var(--secondary)" />
          <circle cx="16" cy="16" r="1.5" fill="#fff" />
        </svg>
        <span className="label" style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text-light)' }}>
          Tune<span style={{ color: 'var(--primary)' }}>Up</span>
        </span>
      </div>

      {/* Nav List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', flex: 1 }}>
        {menuItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <item.icon size={18} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span className="label" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.85rem' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle Button */}
      <div style={{ width: '100%', padding: '0.25rem 0' }} className="sidebar-theme-toggle-container">
        <button
          onClick={() => { playUIClick(); onThemeToggle(); }}
          className="sidebar-footer-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '0.6rem',
            borderRadius: '8px',
            color: 'var(--text-light)',
            cursor: 'pointer',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <span style={{ fontSize: '0.95rem' }}>☀️</span>
              <span className="label" style={{ marginLeft: '6px' }}>Light Mode</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.95rem' }}>🌙</span>
              <span className="label" style={{ marginLeft: '6px' }}>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* User Info & Logout footer */}
      {user ? (
        <div 
          style={{ 
            marginTop: 'auto', 
            paddingTop: '1rem', 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.75rem' 
          }}
          className="sidebar-user-footer"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
            <div 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '8px', 
                background: 'rgba(124, 92, 255, 0.15)', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                color: 'var(--primary)',
                flexShrink: 0
              }}
            >
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="label" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-stats)', color: 'var(--text-muted)' }}>
                {user.xp} XP • {user.streak}🔥
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => { playUIClick(); onLogout(); }} 
            className="sidebar-footer-btn logout-btn"
            title="Log out"
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            <span className="label">Log out</span>
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', width: '100%' }} className="sidebar-user-footer">
          <button 
            onClick={() => handleNavClick('profile')} 
            className="sidebar-footer-btn primary-btn" 
            title="Sign in to save"
          >
            <User size={16} style={{ flexShrink: 0 }} />
            <span className="label">Sign in to save</span>
          </button>
        </div>
      )}
    </aside>
  );
};
