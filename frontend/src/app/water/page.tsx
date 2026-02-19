'use client';

import dynamic from 'next/dynamic';

const WaterPage = dynamic(() => import('@/feature/water/WaterPage'), {
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
      Loading Water Analysis...
    </div>
  ),
});

export default function WaterRoute() {
  return <WaterPage />;
}
