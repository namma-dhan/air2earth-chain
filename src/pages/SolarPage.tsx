import React from 'react';
import { useNavigate } from 'react-router-dom';

const SolarPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-yellow-500/20 bg-slate-900/40 backdrop-blur-md px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-slate-400 hover:text-yellow-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wider">Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
              <span className="text-slate-950 font-black text-sm">AE</span>
            </div>
            <span className="text-sm font-bold text-slate-400 tracking-wider">AERO-EARTH NEXUS</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-500">Live</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-3xl shadow-lg shadow-yellow-500/30 mb-8">
            <svg className="w-12 h-12 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black tracking-[0.15em] uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            SOLAR POTENTIAL
          </h1>

          <p className="text-slate-400 text-lg mb-8">
            Urban solar energy intelligence and optimization
          </p>

          {/* Placeholder Content */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-yellow-500/20 rounded-2xl p-8">
            <p className="text-slate-300 text-lg mb-4">
              ☀️ Solar Analytics Dashboard Coming Soon
            </p>
            <p className="text-slate-500 text-sm">
              This page will display solar irradiance maps, rooftop potential analysis, 
              energy generation forecasts, and ROI calculations for solar installations.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
              <p className="text-2xl font-black text-yellow-400">8.4</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">kWh/m²/day</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
              <p className="text-2xl font-black text-orange-400">1,247</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">MWh Monthly</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
              <p className="text-2xl font-black text-yellow-400">68%</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Rooftop Coverage</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SolarPage;
