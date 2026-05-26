import React, { useState, useEffect } from 'react';
import { Music, X, Edit, Save, ShieldAlert, Award } from 'lucide-react';
import { playUIClick, playUIBack, playUISuccess } from '../utils/audioSynth';
import { SONG_LYRICS_DB } from '../utils/songLyrics';

interface SongLyricsViewProps {
  songTitle: string;
  user: any; // Logged in user info
  onClose: () => void;
}

export const SongLyricsView: React.FC<SongLyricsViewProps> = ({ songTitle, user, onClose }) => {
  const songData = SONG_LYRICS_DB[songTitle] || {
    title: songTitle,
    artist: 'Unknown Artist',
    defaultSheet: '[C] Lyics not loaded yet. [G] Add them below!'
  };

  const [sheetContent, setSheetContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditorRole, setIsEditorRole] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Load contributed sheet if it exists, or fallback
  useEffect(() => {
    const saved = localStorage.getItem(`tuneup_lyrics_${songTitle}`);
    if (saved) {
      setSheetContent(saved);
    } else {
      setSheetContent(songData.defaultSheet);
    }
  }, [songTitle, songData.defaultSheet]);

  const handleSave = () => {
    playUISuccess();
    localStorage.setItem(`tuneup_lyrics_${songTitle}`, sheetContent);
    setIsEditing(false);
    setStatusMsg('Chord sheet contribution saved successfully!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset this song chord sheet to default?')) {
      playUIBack();
      localStorage.removeItem(`tuneup_lyrics_${songTitle}`);
      setSheetContent(songData.defaultSheet);
      setIsEditing(false);
    }
  };

  const renderParsedLine = (line: string, lineIdx: number) => {
    if (!line.trim()) return <div key={lineIdx} style={{ height: '1.2rem' }} />;
    // Split by brackets e.g. "Imagine [Em] me loving [D] you"
    const parts = line.split(/(\[[^\]]+\])/g);
    
    return (
      <div 
        key={lineIdx} 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'flex-start', 
          lineHeight: '2.5', 
          marginBottom: '0.8rem', 
          fontSize: '1rem', 
          color: 'var(--text-light)',
          position: 'relative'
        }}
      >
        {parts.map((part, index) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const chordName = part.slice(1, -1);
            return (
              <span key={index} style={{ position: 'relative', width: '0px', display: 'inline-block', overflow: 'visible' }}>
                <span 
                  className="quirky-badge cyan" 
                  style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    left: 0, 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold', 
                    padding: '1px 5px', 
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    lineHeight: '1',
                    zIndex: 2,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                    background: 'rgba(84, 198, 235, 0.2)'
                  }}
                >
                  {chordName}
                </span>
              </span>
            );
          }
          return <span key={index} style={{ whiteSpace: 'pre' }}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div 
        className="modal-content glass-panel view-enter" 
        style={{ 
          maxWidth: '650px', 
          width: '100%', 
          padding: '2rem', 
          textAlign: 'left',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header */}
        <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(124, 92, 255, 0.1)', border: '1px solid var(--primary)' }}>
              <Music size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{songData.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{songData.artist}</p>
            </div>
          </div>
          <button 
            onClick={() => { playUIBack(); onClose(); }} 
            className="btn-cyber" 
            style={{ padding: '0.4rem', borderRadius: '50%' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Banner & Status Messages */}
        {statusMsg && (
          <div className="neon-text-success" style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            ✓ {statusMsg}
          </div>
        )}

        {/* Main View Area */}
        {!isEditing ? (
          /* DISPLAY LYRICS SHEET */
          <div 
            style={{ 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              minHeight: '220px', 
              maxHeight: '340px',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.03)',
              marginBottom: '1.5rem'
            }}
          >
            {sheetContent.split('\n').map((line, idx) => renderParsedLine(line, idx))}
          </div>
        ) : (
          /* EDIT SHEET CONTENT */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              EDIT MODE: Use brackets for chord placement (e.g. [Em] Hello)
            </span>
            <textarea
              value={sheetContent}
              onChange={(e) => setSheetContent(e.target.value)}
              style={{
                width: '100%',
                height: '240px',
                background: 'rgba(0,0,0,0.4)',
                border: '1.5px solid var(--primary)',
                borderRadius: '10px',
                padding: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>
        )}

        {/* Editor Controls Section */}
        <div 
          style={{ 
            background: 'rgba(0,0,0,0.15)', 
            borderRadius: '12px', 
            padding: '1rem', 
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          {/* Editor Mode Header */}
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Award size={16} style={{ color: isEditorRole ? 'var(--neon-yellow)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                CONTRIBUTOR ACCESS: {isEditorRole ? 'EDITOR ROLE' : 'VIEWER'}
              </span>
            </div>
            
            {/* Editor Role Switcher */}
            {user ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                <input 
                  type="checkbox" 
                  checked={isEditorRole} 
                  onChange={(e) => { playUIClick(); setIsEditorRole(e.target.checked); if(!e.target.checked) setIsEditing(false); }}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Become Song Editor
              </label>
            ) : (
              <span style={{ fontSize: '0.7rem', color: 'var(--neon-danger)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <ShieldAlert size={12} /> Log in to contribute chords
              </span>
            )}
          </div>

          {/* Action buttons */}
          {isEditorRole && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              {!isEditing ? (
                <button
                  onClick={() => { playUIClick(); setIsEditing(true); }}
                  className="btn-cyber btn-cyber-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                >
                  <Edit size={12} /> EDIT CHORDS
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="btn-cyber btn-cyber-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                  >
                    <Save size={12} /> SAVE EDITS
                  </button>
                  <button
                    onClick={() => { playUIBack(); setIsEditing(false); }}
                    className="btn-cyber"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn-cyber"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', marginLeft: 'auto', border: '1px dashed var(--neon-danger)', color: 'var(--neon-danger)' }}
                  >
                    Reset Default
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
