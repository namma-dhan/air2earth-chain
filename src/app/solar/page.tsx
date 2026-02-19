'use client';

import dynamic from 'next/dynamic';

const SolarPage = dynamic(() => import('@/feature/solar/SolarPage'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      Loading Solar Analysis...
    </div>
  ),
});

export default function SolarRoute() {
  return <SolarPage />;
}
