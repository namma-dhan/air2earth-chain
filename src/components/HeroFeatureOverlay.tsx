'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ──────────────────────────────────────────────────────────────────────────
// 4 slide definitions (one per scroll section)
// ──────────────────────────────────────────────────────────────────────────
const SLIDES = [
    {
        index: '01',
        title: ['AIR2EARTH', 'CHAIN'],
        desc: 'A next-generation environmental intelligence platform combining real-time AQI monitoring, water resource management, and solar energy mapping into one unified ecosystem.',
        stats: [
            { label: 'Coverage', value: 'Pan-India' },
            { label: 'Data Sources', value: '12 layers' },
            { label: 'Uptime', value: '99.97%' },
        ],
        dotX: '58%', dotY: '40%',
    },
    {
        index: '02',
        title: ['AQI', 'MONITORING'],
        desc: 'Real-time tracking of PM2.5, PM10, CO₂ and NO₂ at hyperlocal resolution. Detects air quality changes 15 minutes before they reach ground level.',
        stats: [
            { label: 'PM2.5 Reduction', value: '-0.33 µg/m³' },
            { label: 'CO₂ Absorbed', value: '18 kg/year' },
            { label: 'Coverage', value: '20 m radius' },
        ],
        dotX: '64%', dotY: '34%',
    },
    {
        index: '03',
        title: ['WATER', 'HARVESTING'],
        desc: 'Forests orchestrate precipitation cycles at continental scale. Each tree channels 4,492 L through its root network daily, feeding aquifers far below.',
        stats: [
            { label: 'Daily Collection', value: '4,492 L' },
            { label: 'Efficiency', value: '85%' },
            { label: 'Annual Savings', value: '₹42,000' },
        ],
        dotX: '44%', dotY: '62%',
    },
    {
        index: '04',
        title: ['SOLAR', 'SYSTEM'],
        desc: 'Leaves are nature\'s solar panels. Photosynthesis converts peak irradiance into biomass — our AI maps this potential to right-size urban solar deployments.',
        stats: [
            { label: 'System Size', value: '19.66 kW' },
            { label: 'Monthly Savings', value: '₹21,045' },
            { label: 'Payback Period', value: '~4 years' },
        ],
        dotX: '56%', dotY: '24%',
    },
] as const;

// ──────────────────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────────────────
interface Props {
    /** ref to the 400vh hero container (used as ScrollTrigger scroller) */
    heroRef: React.RefObject<HTMLDivElement | null>;
    /** Lenis-driven scroll progress [0,1] – used only for camera zoom in HeroTreeScene */
    onScrollProgress: (p: number) => void;
}

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────
export default function HeroFeatureOverlay({ heroRef, onScrollProgress }: Props) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
    const counterRef = useRef<HTMLSpanElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!heroRef.current || !wrapperRef.current) return;

        const totalSlides = SLIDES.length;
        const trigger = heroRef.current;

        // Master timeline — pinned for the full hero scroll height
        const ctx = gsap.context(() => {
            // ── Initial state: all slides hidden except first ──
            slideRefs.current.forEach((el, i) => {
                if (!el) return;
                gsap.set(el, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 40 });
            });
            dotRefs.current.forEach((el, i) => {
                if (!el) return;
                gsap.set(el, { opacity: i === 0 ? 1 : 0, scale: i === 0 ? 1 : 0.5 });
            });

            // ── ScrollTrigger driving everything ──
            ScrollTrigger.create({
                trigger,
                start: 'top top',
                end: 'bottom bottom',
                scrub: true,
                onUpdate: (self) => {
                    const progress = self.progress;
                    onScrollProgress(progress);

                    // Which slide? (0-indexed)
                    const rawIdx = progress * totalSlides;
                    const idx = Math.min(Math.floor(rawIdx), totalSlides - 1);
                    const local = rawIdx - idx; // 0→1 within this slide zone

                    // Progress bar
                    if (progressRef.current) {
                        progressRef.current.style.width = `${progress * 100}%`;
                    }

                    // Counter
                    if (counterRef.current) {
                        counterRef.current.textContent =
                            `${String(idx + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
                    }

                    // Animate slides
                    slideRefs.current.forEach((el, i) => {
                        if (!el) return;
                        const isActive = i === idx;
                        const isPrev = i < idx;
                        const targetO = isActive ? 1 : 0;
                        const targetY = isPrev ? -30 : isActive ? 0 : 40;
                        const targetSc = isActive ? 1 : 0.97;
                        gsap.to(el, {
                            opacity: targetO,
                            y: targetY,
                            scale: targetSc,
                            duration: 0.4,
                            ease: 'power2.out',
                            overwrite: 'auto',
                        });
                    });

                    // Animate dots
                    dotRefs.current.forEach((el, i) => {
                        if (!el) return;
                        const isActive = i === idx;
                        gsap.to(el, {
                            opacity: isActive ? 1 : 0,
                            scale: isActive ? 1 : 0.4,
                            duration: 0.35,
                            ease: 'back.out(1.4)',
                            overwrite: 'auto',
                        });
                    });
                },
            });
        }, wrapperRef);

        return () => ctx.revert();
    }, [heroRef, onScrollProgress]);

    return (
        <div
            ref={wrapperRef}
            style={{
                position: 'absolute', inset: 0,
                pointerEvents: 'none',
                zIndex: 20,
                fontFamily: "'Outfit', sans-serif",
            }}
        >
            {/* ── Top-right counter ── */}
            <span
                ref={counterRef}
                style={{
                    position: 'absolute', top: '1.6rem', right: '2rem',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.45)',
                    letterSpacing: '0.08em',
                }}
            >
                01 / 04
            </span>

            {/* ── Progress bar (top) ── */}
            <div
                style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '1px',
                    background: 'rgba(255,255,255,0.06)',
                }}
            >
                <div
                    ref={progressRef}
                    style={{
                        height: '100%', width: '0%',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.15))',
                        transition: 'none',
                    }}
                />
            </div>

            {/* ── Per-slide annotation dots ── */}
            {SLIDES.map((slide, i) => (
                <div
                    key={slide.index}
                    ref={el => { dotRefs.current[i] = el; }}
                    style={{
                        position: 'absolute',
                        left: slide.dotX,
                        top: slide.dotY,
                        transform: 'translate(-50%, -50%)',
                        opacity: 0,
                    }}
                >
                    {/* Pulsing rings — CSS animation so they always pulse when visible */}
                    <div
                        style={{
                            position: 'absolute', inset: -8,
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.35)',
                            animation: 'pulse-ring 2s ease-out infinite',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute', inset: -16,
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.15)',
                            animation: 'pulse-ring 2s ease-out infinite 0.8s',
                        }}
                    />
                    {/* Dot */}
                    <div
                        style={{
                            width: 9, height: 9,
                            borderRadius: '50%',
                            background: '#ffffff',
                            boxShadow: '0 0 12px 3px rgba(255,255,255,0.45)',
                        }}
                    />
                    {/* Connecting line */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 4, left: 9,
                            width: 56, height: 1,
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.55), transparent)',
                        }}
                    />
                </div>
            ))}

            {/* ── Per-slide content (title + desc + stats) ── */}
            {SLIDES.map((slide, i) => (
                <div
                    key={slide.index}
                    ref={el => { slideRefs.current[i] = el; }}
                    style={{ position: 'absolute', inset: 0, opacity: 0 }}
                >
                    {/* Description card — right */}
                    <div
                        style={{
                            position: 'absolute',
                            right: '5%', top: '50%',
                            transform: 'translateY(-50%)',
                            width: 'clamp(230px, 25vw, 300px)',
                        }}
                    >
                        <div
                            style={{
                                background: 'rgba(4, 11, 6, 0.75)',
                                backdropFilter: 'blur(18px)',
                                WebkitBackdropFilter: 'blur(18px)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '3px',
                                padding: '1.4rem 1.6rem',
                                position: 'relative',
                            }}
                        >
                            {/* Corner ticks */}
                            {(['tl', 'tr', 'bl', 'br'] as const).map(c => (
                                <div key={c} style={{
                                    position: 'absolute',
                                    width: 5, height: 5,
                                    top: c.startsWith('t') ? 5 : 'auto',
                                    bottom: c.startsWith('b') ? 5 : 'auto',
                                    left: c.endsWith('l') ? 5 : 'auto',
                                    right: c.endsWith('r') ? 5 : 'auto',
                                    borderTop: c.startsWith('t') ? '1px solid rgba(255,255,255,0.4)' : 'none',
                                    borderBottom: c.startsWith('b') ? '1px solid rgba(255,255,255,0.4)' : 'none',
                                    borderLeft: c.endsWith('l') ? '1px solid rgba(255,255,255,0.4)' : 'none',
                                    borderRight: c.endsWith('r') ? '1px solid rgba(255,255,255,0.4)' : 'none',
                                }} />
                            ))}

                            <p style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.75)',
                                lineHeight: 1.75,
                                margin: '0 0 1.1rem',
                            }}>
                                {slide.desc}
                            </p>

                            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: '0.9rem' }} />

                            {slide.stats.map(s => (
                                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.66rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                        {s.label}
                                    </span>
                                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.86)' }}>
                                        {s.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Large title — bottom-left */}
                    <div style={{ position: 'absolute', left: '4%', bottom: '12%' }}>
                        <div style={{
                            width: 28, height: 28,
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.62rem',
                            color: 'rgba(255,255,255,0.6)',
                            marginBottom: '0.55rem',
                        }}>
                            {slide.index}
                        </div>
                        {slide.title.map((line, li) => (
                            <div key={li} style={{
                                fontSize: 'clamp(3.5rem, 8vw, 7.5rem)',
                                fontWeight: 800,
                                color: '#ffffff',
                                lineHeight: 0.92,
                                letterSpacing: '-0.025em',
                            }}>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Pulse-ring keyframes */}
            <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.8); opacity: 0;   }
        }
      `}</style>
        </div>
    );
}
