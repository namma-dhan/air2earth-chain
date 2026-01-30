import { useNavigate } from 'react-router-dom';

const SolarPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-green-100 py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-green-700">Aero-Earth Nexus</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-green-700 mb-4">Solar Potential</h2>
          <p className="text-green-600">Urban solar energy intelligence and optimization</p>
        </div>

        {/* Content Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <p className="text-green-700 text-lg mb-4">☀️ Solar Analytics</p>
          <p className="text-green-600">
            Analyze solar irradiance, rooftop potential, and energy forecasts.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">8.4</p>
            <p className="text-green-600 text-sm">kWh/m²/day</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">1,247</p>
            <p className="text-green-600 text-sm">MWh Monthly</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">68%</p>
            <p className="text-green-600 text-sm">Rooftop Coverage</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SolarPage;
