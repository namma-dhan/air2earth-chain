'use client';

import dynamic from 'next/dynamic';

const LandingPage = dynamic(() => import('@/components/LandingPage'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '2rem',
          fontWeight: 900,
          color: '#00ff55',
          textShadow: '0 0 80px rgba(0, 255, 85, 0.4)',
        }}
      >
        AEROEARTH
      </div>
    </div>
  ),
});

export default function Home() {
  return <LandingPage />;
}
