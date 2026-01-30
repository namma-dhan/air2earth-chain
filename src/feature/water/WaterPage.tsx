import { useNavigate } from 'react-router-dom';

const WaterPage = () => {
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
          <h2 className="text-3xl font-bold text-green-700 mb-4">Water & Greenery</h2>
          <p className="text-green-600">Urban ecosystem health and rainwater management</p>
        </div>

        {/* Content Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <p className="text-green-700 text-lg mb-4">🌿 Ecosystem Dashboard</p>
          <p className="text-green-600">
            Track green coverage, rainwater capture, and biodiversity indices.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">34.2%</p>
            <p className="text-green-600 text-sm">Green Coverage</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">4,280</p>
            <p className="text-green-600 text-sm">m³ Captured</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">7.8</p>
            <p className="text-green-600 text-sm">Biodiversity Index</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WaterPage;
