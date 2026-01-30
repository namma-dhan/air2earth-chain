import React, { useState } from 'react';
import FeatureCard from './FeatureCard';

type LayerType = 'aqi' | 'solar' | 'plant';

interface LayerConfig {
  id: LayerType;
  name: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

const AeroDashboard: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<LayerType>('aqi');
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  const layers: LayerConfig[] = [
    {
      id: 'aqi',
      name: 'AIR QUALITY',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
        </svg>
      ),
      color: 'emerald',
      glowColor: 'shadow-emerald-500/50',
    },
    {
      id: 'solar',
      name: 'SOLAR POTENTIAL',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'yellow',
      glowColor: 'shadow-yellow-500/50',
    },
    {
      id: 'plant',
      name: 'URBAN PLANTING',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'teal',
      glowColor: 'shadow-teal-500/50',
    },
  ];

  const getLayerData = () => {
    switch (activeLayer) {
      case 'aqi':
        return {
          metrics: [
            {
              title: 'AIR QUALITY INDEX',
              value: '42',
              unit: 'AQI',
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ),
              trend: 'down' as const,
              trendValue: '12%',
              description: 'Good air quality - safe for outdoor activities',
            },
            {
              title: 'PM2.5 REDUCTION',
              value: '18.4',
              unit: 'μg/m³',
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              ),
              trend: 'down' as const,
              trendValue: '8%',
              description: 'Inhaled mass reduction vs. baseline',
            },
            {
              title: 'NETWORK ACCURACY',
              value: '94.2',
              unit: '%',
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              ),
              trend: 'up' as const,
              trendValue: '2.1%',
              description: 'Real-time sensor calibration',
            },
          ],
          statusBar: {
            carbonOffset: '2,847 kg CO₂',
            activeSensors: '142',
            coverage: '87%',
          },
        };
      case 'solar':
        return {
          metrics: [
            {
              title: 'SOLAR POTENTIAL',
              value: '8.4',
              unit: 'kWh/m²',
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              ),
              trend: 'up' as const,
              trendValue: '15%',
              description: 'Average daily solar irradiance',
            },
            {
              title: 'ENERGY GENERATION',
              value: '1,247',
              unit: 'MWh',
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 7H7v6h6V7z" />
                  <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                </svg>
              ),
              trend: 'up' as const,
              trendValue: '22%',
              description: 'Monthly renewable energy output',
            },
            {
              title: 'ROOFTOP COVERAGE',
              value: '68',
              unit: '%',
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              ),
              trend: 'up' as const,
              trendValue: '5%',
              description: 'Suitable rooftops with panels',
            },
          ],
          statusBar: {
            carbonOffset: '842 tons CO₂/yr',
            activeSensors: '89',
            coverage: '68%',
          },
        };
      case 'plant':
        return {
          metrics: [
            {
              title: 'GREEN COVERAGE',
              value: '34.2',
              unit: '%',
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              ),
              trend: 'up' as const,
              trendValue: '9%',
              description: 'Urban tree canopy & green infrastructure',
            },
            {
              title: 'RAINWATER CAPTURE',
              value: '4,280',
              unit: 'm³',
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ),
              trend: 'up' as const,
              trendValue: '18%',
              description: 'Monthly stormwater management',
            },
            {
              title: 'BIODIVERSITY INDEX',
              value: '7.8',
              unit: '/10',
              icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ),
              trend: 'up' as const,
              trendValue: '0.4',
              description: 'Native species diversity score',
            },
          ],
          statusBar: {
            carbonOffset: '1,542 kg CO₂',
            activeSensors: '76',
            coverage: '34%',
          },
        };
      default:
        return {
          metrics: [],
          statusBar: { carbonOffset: '0', activeSensors: '0', coverage: '0%' },
        };
    }
  };

  const currentData = getLayerData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Status Bar */}
      <div className="border-b border-emerald-500/20 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-[1920px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center">
                <span className="text-slate-950 font-black text-xl">AE</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-[0.2em] uppercase">
                  AERO-EARTH NEXUS
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Living Urban Intelligence
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Carbon Offset: <span className="text-emerald-400">{currentData.statusBar.carbonOffset}</span>
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase">
                Sensors: <span className="text-teal-400">{currentData.statusBar.activeSensors}</span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase">
                Coverage: <span className="text-emerald-400">{currentData.statusBar.coverage}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Navigation */}
        <div className="w-24 border-r border-emerald-500/20 bg-slate-900/40 backdrop-blur-md flex flex-col items-center py-8 gap-6">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`group relative w-16 h-16 rounded-xl transition-all duration-300 ${
                activeLayer === layer.id
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50'
                  : 'bg-slate-800/50 hover:bg-slate-700/50'
              }`}
            >
              <div className={`flex items-center justify-center w-full h-full ${
                activeLayer === layer.id ? 'text-slate-950' : 'text-slate-400 group-hover:text-emerald-400'
              }`}>
                {layer.icon}
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 border border-emerald-500/30 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
                <span className="text-xs font-bold tracking-wider">{layer.name}</span>
              </div>
            </button>
          ))}

          {/* Sandbox Mode Toggle */}
          <div className="mt-auto">
            <button
              onClick={() => setIsSandboxMode(!isSandboxMode)}
              className={`relative w-16 h-16 rounded-xl transition-all duration-300 ${
                isSandboxMode
                  ? 'bg-gradient-to-br from-purple-500 to-pink-400 shadow-lg shadow-purple-500/50'
                  : 'bg-slate-800/50 hover:bg-slate-700/50'
              }`}
            >
              <div className={`flex items-center justify-center w-full h-full ${
                isSandboxMode ? 'text-slate-950' : 'text-slate-400 hover:text-purple-400'
              }`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Viewport */}
          <div className="flex-1 p-8">
            <div className="h-full bg-slate-900/60 backdrop-blur-md border border-emerald-500/20 rounded-3xl overflow-hidden relative">
              {/* 3D Map Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {isSandboxMode ? (
                    <>
                      <div className="mb-6">
                        <div className="inline-block p-6 bg-purple-500/10 rounded-2xl border border-purple-500/30 mb-4">
                          <svg className="w-16 h-16 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-3xl font-black tracking-[0.2em] uppercase mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        SANDBOX MODE
                      </h2>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">
                        What-If Urban Simulation
                      </p>
                      <p className="text-slate-500 text-xs mt-2 max-w-md">
                        Drag-and-drop green infrastructure, simulate policy changes, and explore urban futures
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-6">
                        <div className="inline-block p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 mb-4">
                          <svg className="w-16 h-16 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-3xl font-black tracking-[0.2em] uppercase mb-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                        3D DIGITAL TWIN
                      </h2>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">
                        {layers.find((l) => l.id === activeLayer)?.name} LAYER
                      </p>
                      <p className="text-slate-500 text-xs mt-2">
                        CesiumJS integration placeholder - Real-time urban visualization
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Layer Indicator */}
              <div className="absolute top-6 left-6">
                <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 rounded-xl px-4 py-2">
                  <span className="text-xs font-black tracking-[0.2em] uppercase text-emerald-400">
                    {layers.find((l) => l.id === activeLayer)?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Analysis Panel */}
          <div className="px-8 pb-8">
            <div className="bg-slate-900/60 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-black tracking-[0.2em] uppercase mb-6 text-emerald-400">
                REAL-TIME ANALYTICS
              </h3>
              
              <div className="grid grid-cols-3 gap-6">
                {currentData.metrics.map((metric, index) => (
                  <FeatureCard key={index} {...metric} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Analysis Panel */}
        <div className="w-96 border-l border-emerald-500/20 bg-slate-900/40 backdrop-blur-md p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black tracking-[0.2em] uppercase mb-2">
                LAYER INSIGHTS
              </h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                {layers.find((l) => l.id === activeLayer)?.name}
              </p>
            </div>

            <div className="space-y-4">
              {activeLayer === 'aqi' && (
                <>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-500/20">
                    <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400 mb-2">
                      Pollutant Breakdown
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">PM2.5</span>
                        <span className="text-slate-200 font-bold">18.4 μg/m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">PM10</span>
                        <span className="text-slate-200 font-bold">32.1 μg/m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">NO₂</span>
                        <span className="text-slate-200 font-bold">24.8 μg/m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">O₃</span>
                        <span className="text-slate-200 font-bold">58.2 μg/m³</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-500/20">
                    <h4 className="text-sm font-black uppercase tracking-wider text-teal-400 mb-2">
                      Health Impact
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Current air quality supports safe outdoor activities. Estimated 8% reduction in respiratory health risks compared to regional baseline.
                    </p>
                  </div>
                </>
              )}

              {activeLayer === 'solar' && (
                <>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-yellow-500/20">
                    <h4 className="text-sm font-black uppercase tracking-wider text-yellow-400 mb-2">
                      Energy Potential
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Peak Generation</span>
                        <span className="text-slate-200 font-bold">248 MW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capacity Factor</span>
                        <span className="text-slate-200 font-bold">18.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ROI Period</span>
                        <span className="text-slate-200 font-bold">7.4 years</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-yellow-500/20">
                    <h4 className="text-sm font-black uppercase tracking-wider text-yellow-400 mb-2">
                      Expansion Opportunity
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      2,847 additional rooftops identified as suitable for solar installation, potential for 420 MWh additional capacity.
                    </p>
                  </div>
                </>
              )}

              {activeLayer === 'plant' && (
                <>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-teal-500/20">
                    <h4 className="text-sm font-black uppercase tracking-wider text-teal-400 mb-2">
                      Green Infrastructure
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tree Coverage</span>
                        <span className="text-slate-200 font-bold">24.8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Green Roofs</span>
                        <span className="text-slate-200 font-bold">142 units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Rain Gardens</span>
                        <span className="text-slate-200 font-bold">89 sites</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bioswales</span>
                        <span className="text-slate-200 font-bold">34 km</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-teal-500/20">
                    <h4 className="text-sm font-black uppercase tracking-wider text-teal-400 mb-2">
                      Ecosystem Services
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Urban greenery provides cooling effect of -2.8°C, captures 4,280m³ stormwater monthly, and supports 142 native species.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* What-If Simulation Button */}
            <button
              onClick={() => setIsSandboxMode(!isSandboxMode)}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 rounded-xl font-black uppercase tracking-[0.2em] text-slate-950 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
            >
              {isSandboxMode ? 'EXIT SANDBOX' : 'WHAT-IF SIMULATION'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AeroDashboard;
