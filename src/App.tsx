import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AqiPage from './pages/AqiPage';
import SolarPage from './pages/SolarPage';
import WaterPage from './pages/WaterPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/aqi" element={<AqiPage />} />
        <Route path="/solar" element={<SolarPage />} />
        <Route path="/water" element={<WaterPage />} />
      </Routes>
    </Router>
  );
}

export default App;

