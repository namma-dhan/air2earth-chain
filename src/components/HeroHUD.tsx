
'use client';

import { useEffect, useState } from 'react';

// ────────────────────────────────────────────────────────────────────────────
// Floating reticle  [ + ] — follows the mouse cursor exactly
// ────────────────────────────────────────────────────────────────────────────
function Reticle() {
    const [pos, setPos] = useState({ x: -200, y: -200 });
    const [coord, setCoord] = useState({ x: 0.50, y: 0.50 });

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            setPos({ x: e.clientX, y: e.clientY });
            setCoord({
                x: +(e.clientX / window.innerWidth).toFixed(3),
                y: +(e.clientY / window.innerHeight).toFixed(3),
            });
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 9999,
            }}
        >
            {/* corner bracket reticle */}
            <div style={{ position: 'relative', width: 24, height: 24 }}>
                {(['tl', 'tr', 'bl', 'br'] as const).map(p => (
                    <span
                        key={p}
                        style={{
                            position: 'absolute',
                            top: p.startsWith('t') ? 0 : 'auto',
                            bottom: p.startsWith('b') ? 0 : 'auto',
                            left: p.endsWith('l') ? 0 : 'auto',
                            right: p.endsWith('r') ? 0 : 'auto',
                            width: 7,
                            height: 7,
                            borderTop: p.startsWith('t') ? '1.5px solid rgba(255,255,255,0.85)' : 'none',
                            borderBottom: p.startsWith('b') ? '1.5px solid rgba(255,255,255,0.85)' : 'none',
                            borderLeft: p.endsWith('l') ? '1.5px solid rgba(255,255,255,0.85)' : 'none',
                            borderRight: p.endsWith('r') ? '1.5px solid rgba(255,255,255,0.85)' : 'none',
                        }}
                    />
                ))}
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '8px' }}>+</span>
            </div>
            <div style={{ marginTop: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {coord.x.toFixed(3)},{coord.y.toFixed(3)}
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// HUD export — pure static UI (text content is now in HeroFeatureOverlay)
// ────────────────────────────────────────────────────────────────────────────
export default function HeroHUD({ onLetsGo }: { onLetsGo: () => void }) {
    const mono: React.CSSProperties = {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.06em',
    };

    return (
        <div style={{
            position: 'absolute', inset: 0,
            pointerEvents: 'none',
            display: 'flex', flexDirection: 'column',
            padding: '1.6rem 2rem',
            zIndex: 10,
        }}>
            {/* ── TOP BAR ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Brand label */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ ...mono, fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
                        Air2Earth Chain
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 20, height: '1px', background: 'rgba(255,255,255,0.25)' }} />
                        <span style={{ ...mono, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                            ENV — 01
                        </span>
                    </div>
                </div>
            </div>

            {/* ── FLOATING RETICLE ── */}
            <Reticle />

            {/* ── LEFT EDGE DEPTH LABEL ── */}
            <div style={{ position: 'absolute', left: '1.6rem', top: '58%', ...mono, fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
                0.28
            </div>

            {/* ── BOTTOM BUTTON ("Enter Platform") ── */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <button
                        onClick={onLetsGo}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: 0,
                        }}
                        onMouseEnter={e => {
                            const el = e.currentTarget.querySelector('span.lbl') as HTMLElement;
                            if (el) el.style.color = '#00ff55';
                        }}
                        onMouseLeave={e => {
                            const el = e.currentTarget.querySelector('span.lbl') as HTMLElement;
                            if (el) el.style.color = 'rgba(255,255,255,0.6)';
                        }}
                    >
                        <span
                            className="lbl"
                            style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '11px',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.6)',
                                transition: 'color 0.2s',
                            }}
                        >
                            Enter Platform
                        </span>
                        <span style={{ fontSize: '14px', color: '#00ff55', lineHeight: 1 }}>→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
