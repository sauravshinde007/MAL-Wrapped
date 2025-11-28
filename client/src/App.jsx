import { useEffect, useState } from 'react';
import StoryView from './components/StoryView';
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
        localStorage.setItem('mal_token', urlToken); // Save it for later
        window.history.replaceState({}, document.title, "/"); // Clean the URL
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
        <div className="login-box">
          <h1>MAL Wrapped {currentYear}</h1>
          <button onClick={handleLogin}>Connect MyAnimeList</button>
        </div>
      ) : (
        <>
            <StoryView token={token} year={currentYear}/>
            {/* Optional: Add a small reset button in the corner */}
            <button 
                onClick={handleLogout} 
                style={{position: 'fixed', top: 10, right: 10, zIndex: 1000, padding: '5px 10px', fontSize: '12px'}}
            >
                Logout / Reset
            </button>
        </>
      )}
    </div>
  );
}

export default App;