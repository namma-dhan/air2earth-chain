import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const layers = [
    {
      id: 'aqi',
      name: 'AIR QUALITY',
      subtitle: 'Real-time AQI Monitoring',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-400',
      hoverGlow: 'hover:shadow-emerald-500/40',
      route: '/aqi',
    },
    {
      id: 'solar',
      name: 'SOLAR POTENTIAL',
      subtitle: 'Energy Intelligence',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: 'from-yellow-400 to-orange-400',
      hoverGlow: 'hover:shadow-yellow-500/40',
      route: '/solar',
    },
    {
      id: 'water',
      name: 'WATER & GREENERY',
      subtitle: 'Urban Ecosystem Health',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      gradient: 'from-teal-400 to-cyan-400',
      hoverGlow: 'hover:shadow-teal-500/40',
      route: '/water',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-8 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl shadow-lg shadow-emerald-500/30 mb-6">
            <span className="text-slate-950 font-black text-3xl">AE</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-black tracking-[0.15em] uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400">
          AERO-EARTH NEXUS
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg md:text-xl font-medium tracking-wide mb-4">
          Living Digital Twin for Urban Intelligence
        </p>
        <p className="text-slate-500 text-sm max-w-lg mx-auto mb-16">
          Monitor air quality, harness solar potential, and optimize urban greenery — all from one unified platform.
        </p>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => navigate(layer.route)}
              className={`group relative bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 transition-all duration-500 hover:border-transparent hover:shadow-2xl ${layer.hoverGlow} hover:-translate-y-2`}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${layer.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`relative mb-6 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${layer.gradient} text-slate-950 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {layer.icon}
              </div>

              {/* Text */}
              <h3 className="relative text-lg font-black tracking-[0.1em] uppercase text-slate-100 mb-2">
                {layer.name}
              </h3>
              <p className="relative text-sm text-slate-500 group-hover:text-slate-400 transition-colors">
                {layer.subtitle}
              </p>

              {/* Arrow indicator */}
              <div className="relative mt-6 flex items-center justify-center text-slate-600 group-hover:text-emerald-400 transition-colors">
                <span className="text-xs font-bold uppercase tracking-wider mr-2">Enter</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-8 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Systems Online</span>
          </div>
          <span>•</span>
          <span>v2.0.26</span>
          <span>•</span>
          <span>Urban Intelligence Platform</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
