'use client';
import { useTheme } from '../lib/theme';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div style={{ width: 64, height: 32 }} />; // placeholder to prevent layout shift
    }

    const isLight = theme === 'light';

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '64px',
                height: '32px',
                borderRadius: '16px',
                background: isLight
                    ? 'linear-gradient(135deg, #f0f9ff, #e0f2fe)'
                    : 'linear-gradient(135deg, #1e1e2e, #16161f)',
                border: `1px solid ${isLight ? '#bae6fd' : 'var(--border-strong)'}`,
                boxShadow: isLight
                    ? 'inset 0 2px 4px rgba(0,0,0,0.05), 0 2px 8px rgba(56, 189, 248, 0.2)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 8px rgba(124, 58, 237, 0.2)',
                cursor: 'pointer',
                padding: '4px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
            }}
        >
            {/* Stars background for dark mode */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                opacity: isLight ? 0 : 1,
                transition: 'opacity 0.4s ease',
                pointerEvents: 'none'
            }}>
                <div style={{ position: 'absolute', top: '6px', left: '12px', width: '2px', height: '2px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 4px #fff' }} />
                <div style={{ position: 'absolute', top: '20px', left: '26px', width: '1px', height: '1px', background: '#fff', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', top: '10px', left: '32px', width: '2px', height: '2px', background: '#e2e8f0', borderRadius: '50%', boxShadow: '0 0 2px #fff' }} />
            </div>

            {/* Clouds background for light mode */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                opacity: isLight ? 1 : 0,
                transition: 'opacity 0.4s ease',
                pointerEvents: 'none'
            }}>
                <div style={{ position: 'absolute', top: '18px', right: '12px', width: '12px', height: '6px', background: '#fff', borderRadius: '6px' }} />
                <div style={{ position: 'absolute', top: '14px', right: '16px', width: '10px', height: '10px', background: '#fff', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', top: '8px', right: '28px', width: '18px', height: '6px', background: '#fff', borderRadius: '6px', opacity: 0.8 }} />
            </div>

            {/* Toggle Switch */}
            <div
                style={{
                    position: 'absolute',
                    top: '2px',
                    left: isLight ? '34px' : '2px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: isLight
                        ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' // Sun color
                        : 'linear-gradient(135deg, #e2e8f0, #94a3b8)', // Moon color
                    boxShadow: isLight
                        ? '0 0 10px rgba(251, 191, 36, 0.6), inset 0 -2px 4px rgba(0,0,0,0.1)'
                        : '0 0 10px rgba(226, 232, 240, 0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                }}
            >
                {/* Moon craters */}
                <div style={{
                    position: 'absolute',
                    top: '6px', right: '6px',
                    width: '6px', height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.15)',
                    opacity: isLight ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '6px', left: '8px',
                    width: '4px', height: '4px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.15)',
                    opacity: isLight ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                }} />
                <div style={{
                    position: 'absolute',
                    top: '12px', left: '4px',
                    width: '3px', height: '3px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.1)',
                    opacity: isLight ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                }} />

                {/* Sun rays (hidden inside button, animated via scale if necessary) */}
                <div style={{
                    position: 'absolute',
                    fontSize: '12px',
                    opacity: isLight ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                }}>
                    ☀️
                </div>
                <div style={{
                    position: 'absolute',
                    fontSize: '11px',
                    opacity: isLight ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                    filter: 'brightness(0) invert(1) opacity(0.8)',
                    transform: 'translateY(-1px)'
                }}>
                    🌙
                </div>
            </div>
        </button>
    );
}
