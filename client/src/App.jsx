import { useEffect, useState } from 'react';
import StoryView from './components/StoryView';
import AnimatedGradientBackground from './components/ui/AnimatedGradientBackground'; // Import the component
import './App.css';

function App() {
  const [token, setToken] = useState(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // 1. Check if we already have a token in LocalStorage
    const storedToken = localStorage.getItem('mal_token');
    
    // 2. Check if the URL has a NEW token (coming back from MAL)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
        // We just logged in!
        setToken(urlToken);
        localStorage.setItem('mal_token', urlToken); 
        window.history.replaceState({}, document.title, "/"); 
    } else if (storedToken) {
        // We are revisiting or refreshed the page
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
        /* --- HOME PAGE LAYOUT --- */
        <div className="home-screen">
            
            {/* 1. The Gradient Background */}
            <AnimatedGradientBackground 
                animationSpeed={0.03} 
                breathingRange={10}
                // Optional: Customize colors here if you want
            />

            {/* 2. The Login Box (Centered & On Top) */}
            <div className="login-box home-content">
                <h1>MAL Wrapped {currentYear}</h1>
                <p style={{marginBottom: '20px', opacity: 0.8}}>Discover your anime year in review.</p>
                <button onClick={handleLogin}>Connect MyAnimeList</button>
            </div>

        </div>
      ) : (
        /* --- WRAPPED STORY VIEW --- */
        <>
            <StoryView token={token} year={currentYear}/>
            
            <button 
                onClick={handleLogout} 
                className="logout-btn"
            >
                Logout / Reset
            </button>
        </>
      )}
    </div>
  );
}

export default App;