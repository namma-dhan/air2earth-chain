'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Initialises a Lenis smooth-scroll instance and hooks it into
 * GSAP ScrollTrigger so all ScrollTrigger animations are driven
 * by the Lenis virtual scroll position.
 *
 * Returns the Lenis instance so callers can subscribe to scroll events.
 */
export function useLenis() {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.4,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        lenisRef.current = lenis;

        // Sync Lenis → GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        const raf = gsap.ticker.add((time: number) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(raf);
            ScrollTrigger.getAll().forEach(t => t.kill());
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return lenisRef;
}
