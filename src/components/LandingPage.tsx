import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 'aqi',
      title: 'Air Quality',
      description: 'Monitor real-time air quality index',
      route: '/aqi',
    },
    {
      id: 'solar',
      title: 'Solar Potential',
      description: 'Analyze solar energy opportunities',
      route: '/solar',
    },
    {
      id: 'water',
      title: 'Water & Greenery',
      description: 'Track urban ecosystem health',
      route: '/water',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-green-100 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold text-green-700">Aero-Earth Nexus</h1>
          <p className="text-green-600 mt-2">Urban Intelligence Platform</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">
            Welcome to the Digital Twin
          </h2>
          <p className="text-green-600">
            Monitor air quality, solar potential, and urban greenery from one platform.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => navigate(feature.route)}
              className="bg-green-50 border border-green-200 rounded-lg p-6 text-left hover:bg-green-100 hover:border-green-300 transition-colors"
            >
              <h3 className="text-lg font-semibold text-green-700 mb-2">
                {feature.title}
              </h3>
              <p className="text-green-600 text-sm">{feature.description}</p>
              <span className="inline-block mt-4 text-green-500 text-sm font-medium">
                Enter →
              </span>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-green-100 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-green-500 text-sm">© 2026 Aero-Earth Nexus</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
