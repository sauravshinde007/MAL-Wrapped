import { useEffect, useState } from 'react';
import StoryView from './components/StoryView';
import AnimatedGradientBackground from './components/ui/AnimatedGradientBackground';
import './App.css';

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
        window.history.replaceState({}, document.title, "/"); 
    } else if (storedToken) {
        setToken(storedToken);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/login';
  };

  const handleLogout = () => {
    localStorage.removeItem('mal_token');
    setToken(null);
  };

  return (
    <div className="app-container">
      {!token ? (
        <div className="home-screen">
            <AnimatedGradientBackground 
                animationSpeed={0.03} 
                breathingRange={10}
            />
            <div className="login-box home-content">
                <h1>MAL Wrapped {currentYear}</h1>
                <p style={{marginBottom: '20px', opacity: 0.8}}>Discover your anime year in review.</p>
                <button onClick={handleLogin}>Connect MyAnimeList</button>
            </div>
        </div>
      ) : (
        /* --- CHANGED HERE: Passed onLogout prop, removed button --- */
        <StoryView token={token} year={currentYear} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;