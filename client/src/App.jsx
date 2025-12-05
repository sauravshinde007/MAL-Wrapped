import { useEffect, useState } from 'react';
import StoryView from './components/StoryView';
import AnimatedGradientBackground from './components/ui/AnimatedGradientBackground';
import './App.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

function App() {
  const [token, setToken] = useState(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const storedToken = localStorage.getItem('mal_token');
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem('mal_token', urlToken);
      window.history.replaceState({}, document.title, '/');
    } else if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = `${SERVER_URL}/auth/login`;
  };

  const handleLogout = () => {
    localStorage.removeItem('mal_token');
    setToken(null);
  };

  return (
    <>
      {/* LAYER 1: The Fixed Background (Always visible) */}
      <AnimatedGradientBackground
        animationSpeed={0.05}
        breathingRange={10}
        gradientColors={['#2979FF', '#000000']}
      />

      {/* LAYER 2: The Scrollable Content */}
      <div className="app-container">
        {!token ? (
          <div className="login-box home-content">
            <h1>MAL Wrapped {currentYear}</h1>
            <p>Discover your anime year in review.</p>
            <button onClick={handleLogin}>Connect MyAnimeList</button>
          </div>
        ) : (
          <StoryView token={token} year={currentYear} onLogout={handleLogout} />
        )}
      </div>
    </>
  );
}

export default App;
