import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, Sparkles } from 'lucide-react';

export const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight Executive',
    tagline: 'Deep obsidian & sky cyan (Default)',
    swatches: ['#0a0e17', '#121a2e', '#38bdf8'],
    accent: '#38bdf8',
    isDark: true
  },
  {
    id: 'emerald',
    name: 'Emerald Wealth',
    tagline: 'Swiss banking forest green & gold',
    swatches: ['#05140d', '#0c261a', '#10b981'],
    accent: '#10b981',
    isDark: true
  },
  {
    id: 'sapphire',
    name: 'Royal Sapphire',
    tagline: 'Institutional navy & electric cobalt',
    swatches: ['#050b18', '#0d1b38', '#3b82f6'],
    accent: '#3b82f6',
    isDark: true
  },
  {
    id: 'amethyst',
    name: 'Amethyst Luxe',
    tagline: 'Imperial violet & velvet plum',
    swatches: ['#0c0817', '#1c1334', '#a855f7'],
    accent: '#a855f7',
    isDark: true
  },
  {
    id: 'gold',
    name: 'Obsidian Gold',
    tagline: 'Warm onyx & 24K radiant gold',
    swatches: ['#110e0a', '#241c13', '#f59e0b'],
    accent: '#f59e0b',
    isDark: true
  },
  {
    id: 'nordic',
    name: 'Nordic Clean',
    tagline: 'Crisp daylight alabaster & frosted slate',
    swatches: ['#f8fafc', '#ffffff', '#0284c7'],
    accent: '#0284c7',
    isDark: false
  }
];

export const ThemePicker = ({ theme = 'midnight', setTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (themeId) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="theme-picker-container" ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary"
        title="Change Visual Theme"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.85rem',
          borderColor: isOpen ? 'var(--border-focus)' : 'var(--border-glass)'
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Palette size={16} color={currentTheme.accent} />
          <span
            style={{
              position: 'absolute',
              bottom: -2,
              right: -3,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: currentTheme.accent,
              boxShadow: `0 0 6px ${currentTheme.accent}`
            }}
          />
        </div>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{currentTheme.name.split(' ')[0]}</span>
        <ChevronDown
          size={13}
          color="var(--text-muted)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="theme-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '290px',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border-glass-bright)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1000,
            animation: 'slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div
            style={{
              padding: '0.5rem 0.75rem 0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-glass)',
              marginBottom: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={13} color="var(--accent-primary)" />
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)'
                }}
              >
                Color Atmosphere
              </span>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--accent-primary)',
                fontWeight: 600
              }}
            >
              6 Styles
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {THEMES.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--bg-pill-active)' : 'transparent',
                    border: isSelected
                      ? '1px solid var(--border-focus)'
                      : '1px solid transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {/* 3-dot color swatch preview */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '2px',
                        borderRadius: '999px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-glass)'
                      }}
                    >
                      {t.swatches.map((color, idx) => (
                        <span
                          key={idx}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: color,
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            display: 'inline-block'
                          }}
                        />
                      ))}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: isSelected ? 700 : 500,
                          lineHeight: 1.2
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px'
                        }}
                      >
                        {t.tagline}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: t.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Check size={12} color="#ffffff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
