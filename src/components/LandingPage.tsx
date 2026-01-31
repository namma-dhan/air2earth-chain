import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const letsGoRef = useRef<HTMLDivElement>(null);

  const features = [
    { id: 'aqi', title: 'AQI', description: 'Real-time air quality monitoring and pollution tracking across cities', route: '/aqi' },
    { id: 'water', title: 'Water', description: 'Comprehensive water resource management and quality analysis', route: '/water' },
    { id: 'solar', title: 'Solar', description: 'Solar energy potential mapping and renewable power insights', route: '/solar' },
  ];

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Title animation (letter by letter)
    if (titleRef.current) {
      const letters = titleRef.current.querySelectorAll('.title-letter');
      tl.fromTo(letters,
        { opacity: 0, y: 80, rotateX: -90 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.06 },
        0.2
      );
    }

    // Description animation
    if (descRef.current) {
      tl.fromTo(descRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1 },
        0.8
      );
    }

    // Let's Go animation
    if (letsGoRef.current) {
      tl.fromTo(letsGoRef.current,
        { opacity: 0, scale: 0.8, x: 50 },
        { opacity: 1, scale: 1, x: 0, duration: 1, ease: 'elastic.out(1, 0.6)' },
        1.2
      );
    }
  }, []);

  const handleLetsGoClick = () => {
    setIsPopupOpen(true);
  };

  const handleBackdropClick = () => {
    setIsPopupOpen(false);
  };

  const handleOptionClick = (route: string) => {
    setIsPopupOpen(false);
    setTimeout(() => navigate(route), 200);
  };

  const titleText = 'AEROEARTH';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#000000',
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url("/assets/aqi/nature.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        padding: '4rem',
      }}
    >
      {/* Top Center - AeroEarth Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '6rem',
        }}
      >
        <div
          ref={titleRef}
          style={{
            display: 'flex',
            perspective: '1000px',
          }}
        >
          {titleText.split('').map((letter, index) => (
            <span
              key={index}
              className="title-letter"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(3rem, 10vw, 8rem)',
                fontWeight: 900,
                color: '#00ff55',
                display: 'inline-block',
                textShadow: '0 0 80px rgba(0, 255, 85, 0.4)',
                willChange: 'transform, opacity',
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {/* Content Area - Description (left-center) + Let's Go (right of center) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 1,
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          paddingLeft: '2rem',
          paddingRight: '8rem',
        }}
      >
        {/* Description - Left to Center */}
        <div
          style={{
            maxWidth: '55%',
          }}
        >
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <span
              style={{
                width: '40px',
                height: '2px',
                backgroundColor: '#00ff55',
              }}
            />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.85rem',
                color: '#00ff55',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
              }}
            >
              Earth Intelligence Platform
            </span>
          </motion.div>

          {/* Long Description */}
          <p
            ref={descRef}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.9,
              margin: 0,
              opacity: 0,
            }}
          >
            Experience the future of environmental monitoring with our high-fidelity
            autonomous climate tracking system. We combine advanced geospatial intelligence
            with precision bio-seeding technology to redefine planetary health.
            Monitor air quality, harness solar potential, and track urban ecosystem vitality
            — all through a unified digital twin platform.
          </p>
        </div>

        {/* Let's Go - Slightly left of right edge */}
        <motion.div
          ref={letsGoRef}
          onClick={handleLetsGoClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          style={{
            cursor: 'pointer',
            opacity: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 900,
              color: 'transparent',
              WebkitTextStroke: '2px #00ff55',
              letterSpacing: '-0.02em',
              display: 'block',
              lineHeight: 1.1,
              textAlign: 'right',
            }}
          >
            LET'S
          </span>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 900,
              color: '#00ff55',
              letterSpacing: '-0.02em',
              display: 'block',
              lineHeight: 1.1,
              textAlign: 'right',
              textShadow: '0 0 60px rgba(0, 255, 85, 0.6)',
            }}
          >
            GO.
          </span>
          <motion.div
            animate={{ x: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            style={{
              marginTop: '0.75rem',
            }}
          >
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.75rem',
                color: '#00ff55',
              }}
            >
              →
            </span>
          </motion.div>
        </motion.div>
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
                backgroundImage: 'linear-gradient(rgba(0, 15, 8, 0.85), rgba(0, 15, 8, 0.9)), url("/assets/aqi/nature.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                border: '1px solid rgba(0, 255, 85, 0.3)',
                boxShadow: '0 0 150px rgba(0, 255, 85, 0.15), 0 25px 80px rgba(0, 0, 0, 0.5)',
                maxWidth: '90vw',
                width: '900px',
                height: 'fit-content',
                maxHeight: '80vh',
              }}
            >
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
                }}
              >
                Choose Your Experience
              </motion.h2>

              <div style={{ display: 'flex', gap: '1.5rem', width: '100%', justifyContent: 'center' }}>
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
    </div>
  );
};

export default LandingPage;
