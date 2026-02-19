'use client';

import dynamic from 'next/dynamic';

const AqiCesiumApp = dynamic(() => import('@/feature/aqi/AqiCesiumApp'), {
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
      Loading AQI Globe...
    </div>
  ),
});

export default function AqiPage() {
  return <AqiCesiumApp />;
}
