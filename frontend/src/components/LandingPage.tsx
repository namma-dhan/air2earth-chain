'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import HeroHUD from '@/components/HeroHUD';
import HeroFeatureOverlay from '@/components/HeroFeatureOverlay';
import { useLenis } from '@/hooks/useLenis';

const HeroTreeScene = dynamic(() => import('@/components/HeroTreeScene'), { ssr: false });

const LandingPage = () => {
  const router = useRouter();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Lenis smooth scroll (also drives GSAP ScrollTrigger)
  useLenis();

  // scrollRef feeds the Three.js camera zoom each frame (no React re-renders)
  const scrollRef = useRef(0);
  const heroContainerRef = useRef<HTMLDivElement>(null);

  // Called by HeroFeatureOverlay's ScrollTrigger on every scroll tick
  const onScrollProgress = useCallback((p: number) => {
    scrollRef.current = p;
  }, []);


  const features = [
    { id: 'aqi', title: 'AQI', description: 'Real-time air quality monitoring and pollution tracking across cities', route: '/aqi' },
    { id: 'water', title: 'Water', description: 'Comprehensive water resource management and quality analysis', route: '/water' },
    { id: 'solar', title: 'Solar', description: 'Solar energy potential mapping and renewable power insights', route: '/solar' },
  ];

  const handleLetsGoClick = () => setIsPopupOpen(true);
  const handleBackdropClick = () => setIsPopupOpen(false);
  const handleOptionClick = (route: string) => {
    setIsPopupOpen(false);
    setTimeout(() => router.push(route), 200);
  };

  return (
    <>
      {/* ── HERO SECTION – 400vh sticky scroll ── */}
      <div
        ref={heroContainerRef}
        style={{ position: 'relative', width: '100%', height: '400vh' }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            width: '100%',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: '#040b06',
          }}
        >
          <HeroTreeScene scrollProgress={scrollRef} />
          <HeroHUD onLetsGo={handleLetsGoClick} />
          <HeroFeatureOverlay heroRef={heroContainerRef} onScrollProgress={onScrollProgress} />
        </div>
      </div>



      {/* Popup Menu */}
      <AnimatePresence>
        {isPopupOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleBackdropClick}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.92)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                zIndex: 40,
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                inset: 0,
                margin: 'auto',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3rem',
                padding: '4rem 5rem',
                borderRadius: '32px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 255, 85, 0.3)',
                boxShadow: '0 0 150px rgba(0, 255, 85, 0.15), 0 25px 80px rgba(0, 0, 0, 0.5)',
                maxWidth: '90vw',
                width: '900px',
                height: 'fit-content',
                maxHeight: '80vh',
              }}
            >
              {/* Video Background for Popup */}
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                }}
              >
                <source src="/assets/aqi/nature.mp4" type="video/mp4" />
              </video>
              {/* Dark Overlay for Popup */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(rgba(0, 15, 8, 0.85), rgba(0, 15, 8, 0.9))',
                  zIndex: 1,
                }}
              />
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                  fontWeight: 700,
                  color: '#00ff55',
                  margin: 0,
                  letterSpacing: '0.05em',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                Choose Your Experience
              </motion.h2>

              <div style={{ display: 'flex', gap: '1.5rem', width: '100%', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                {features.map((feature, index) => (
                  <motion.button
                    key={feature.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{
                      scale: 1.03,
                      backgroundColor: 'rgba(0, 255, 85, 0.12)',
                      borderColor: '#00ff55',
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleOptionClick(feature.route)}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 255, 85, 0.05)',
                      border: '1px solid rgba(0, 255, 85, 0.2)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      padding: '2rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.3s ease',
                      minHeight: '180px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                        fontWeight: 800,
                        color: '#00ff55',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {feature.title}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                        fontWeight: 400,
                        color: 'rgba(255, 255, 255, 0.6)',
                        lineHeight: 1.6,
                        textAlign: 'center',
                      }}
                    >
                      {feature.description}
                    </span>
                  </motion.button>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.5 }}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.85rem',
                  color: '#00ff55',
                  margin: 0,
                  letterSpacing: '0.1em',
                }}
              >
                Click outside to close
              </motion.p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingPage;
