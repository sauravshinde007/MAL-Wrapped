import React, { useEffect, useState, useRef } from 'react';
import Stories from 'react-insta-stories';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { 
    IntroSlide, 
    MessageSlide, 
    GenreRevealSlide, 
    HeroSlide, 
    AuthorHeroSlide, 
} from './slides/Slides';
import ListSlide from './slides/ListSlide';
import EvolutionChart from './slides/EvolutionChart';
import SummarySlide from './slides/SummarySlide';
import Footer from './ui/Footer'; // <--- IMPORT FOOTER HERE
import { getThemeSong } from '../utils/musicMap.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const getStorySize = () => {
  if (typeof window === 'undefined') {
    return { width: 350, height: 622 };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const horizontalMargin = 30; 
  const verticalMargin = 100; 

  const availableWidth = vw - horizontalMargin;
  const availableHeight = vh - verticalMargin;

  const targetRatio = 9 / 16;
  let storyHeight = availableHeight;
  let storyWidth = storyHeight * targetRatio;

  if (storyWidth > availableWidth) {
    storyWidth = availableWidth;
    storyHeight = storyWidth / targetRatio;
  }

  return {
    width: Math.floor(storyWidth),
    height: Math.floor(storyHeight),
  };
};

const StoryView = ({ token, year, onLogout }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [readyToPlay, setReadyToPlay] = useState(false);
  const [showShare, setShowShare] = useState(false); 
  const [windowSize, setWindowSize] = useState(getStorySize);

  const audioRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(getStorySize());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- AUDIO SETUP ---
  useEffect(() => {
    if (!loading && statsData && audioRef.current) {
        const songUrl = getThemeSong(statsData.topGenre);
        audioRef.current.src = songUrl;
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioRef.current.load();
    }
  }, [loading, statsData]);

  const processDataIntoStories = (data) => {
      const storyData = [
          { content: () => <IntroSlide username={data.username} />, duration: 6000 },
          { content: () => <MessageSlide mainText="There was one vibe that defined your year..." subText="Any guesses?" />, duration: 4000 },
          { content: () => <GenreRevealSlide genre={data.topGenre} />, duration: 4000 },
          { content: () => <MessageSlide mainText={`You wasted ${data.totalHours} hours watching anime.`} subText="Where do you find the time?" />, duration: 4000 },
          { content: () => <MessageSlide mainText={`You watched ${data.totalAnime} series.`} subText="That's a lot of intros skipped." />, duration: 4000 },
          { content: () => <HeroSlide anime={data.topRated[0]} />, duration: 5000 },
          { content: () => <MessageSlide mainText="While it's not a competition..." subText="There is a leaderboard." />, duration: 4000 },
          { content: () => <ListSlide title="Your Top Rated" list={data.topRated} />, duration: 7000 },
          { content: () => <MessageSlide mainText="You've changed." subText="And so has your taste..." />, duration: 4000 },
          { content: () => <EvolutionChart evolutionData={data.genreEvolution} topGenre={data.topGenre} />, duration: 6000 },
          { content: () => <AuthorHeroSlide authorName={data.favoriteAuthor} authorImage={data.topAuthors.length > 0 ? data.topAuthors[0].image : null} />, duration: 4000 },
          { content: () => {
              const authorList = data.topAuthors.map(a => ({ title: a.name, image: a.image, customSubtitle: "HIDE" }));
              return <ListSlide title="Your Top Mangakas" list={authorList} />;
            }, duration: 5000 },
          { content: () => <MessageSlide mainText="But what did you ACTUALLY watch?" subText="Based on pure screen time..." />, duration: 4000 },
          { content: () => <ListSlide title="Most Watched" list={data.mostWatched} />, duration: 7000 },
          { content: () => <SummarySlide stats={data} />, duration: 7000 }, 
      ];
      setStories(storyData);
      setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const cacheKey = `mal_wrapped_cache_${year}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
          try {
              const parsed = JSON.parse(cached);
              const now = new Date().getTime();
              if (now - parsed.timestamp < 86400000) {
                  setStatsData(parsed.data);
                  processDataIntoStories(parsed.data);
                  return; 
              }
          } catch (e) {
              localStorage.removeItem(cacheKey);
          }
      }

      try {
        const { data } = await axios.get(`${SERVER_URL}/api/wrapped?token=${token}&year=${year}`);
        if (data.empty) {
          alert(`No Anime completed in ${year}!`);
          setLoading(false);
          return;
        }
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: new Date().getTime(), data: data }));
        setStatsData(data);
        processDataIntoStories(data);
      } catch (err) {
        console.error('Fetch error', err);
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    };
  }, [token, year]);

  const handleStart = () => {
    setReadyToPlay(true);
    if (audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.log("Audio playback interrupted:", error));
        }
    }
  };

  const handleShare = async () => {
    const element = document.getElementById('summary-card-to-download');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { useCORS: true, scale: 2, backgroundColor: null });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `MAL-Wrapped-${year}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'My Anime Year in Review', text: 'Check out my MAL Wrapped! 🎬 #MALWrapped' });
          } catch (error) { if (error.name !== 'AbortError') console.error('Error sharing:', error); }
        } else {
          const link = document.createElement('a');
          link.download = `MAL-Wrapped-${year}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          alert("Image downloaded!");
        }
      }, 'image/png');
    } catch (e) { console.error('Screenshot failed:', e); }
  };

  const handleStoryStart = (index) => {
    if (index === stories.length - 1) {
        setShowShare(true);
    } else {
        setShowShare(false);
    }
  };

  const handleStoriesEnd = () => {
    const audio = audioRef.current;
    if (audio) {
        const fadeAudio = setInterval(() => {
          if (audio.volume > 0.05) { audio.volume -= 0.05; } else { audio.volume = 0; audio.pause(); clearInterval(fadeAudio); }
        }, 100);
    }
    setTimeout(() => { setShowShare(true); }, 0);
  };

  const handleLogoutWrapper = () => {
      localStorage.removeItem(`mal_wrapped_cache_${year}`);
      onLogout();
  };

  if (loading) {
    return <div className="loading">Analyzing your {year} history...</div>;
  }

  return (
    <div className="story-wrapper" style={{ position: 'relative', zIndex: 1 }}>
      <audio ref={audioRef} preload="auto" playsInline style={{ display: 'none' }} />

      {!readyToPlay && (
        <div className="start-overlay" onClick={handleStart} style={{ zIndex: 9999 }}>
          <div className="play-button"><h1>▶</h1><p>Tap to start your Wrapped</p></div>
        </div>
      )}

      {readyToPlay && (
        <>
          <div className="stories-container" style={{ position: 'relative', zIndex: 2, width: windowSize.width, height: windowSize.height, margin: '0 auto' }}>
            <Stories
                stories={stories}
                width={windowSize.width}
                height={windowSize.height}
                defaultInterval={5000}
                loop={false}
                onAllStoriesEnd={handleStoriesEnd}
                onStoryStart={handleStoryStart} 
                storyStyles={{ width: '100%', height: '100%', background: 'transparent', backgroundColor: 'transparent' }}
                storyContainerStyles={{ background: 'transparent', backgroundColor: 'transparent', borderRadius: '15px', overflow: 'hidden' }}
            />
          </div>

           <div className="controls">
            {statsData && showShare && (
              <button className="share-btn" onClick={handleShare}>
                {(navigator.share && navigator.canShare) ? 'Share Wrapped' : 'Download Card'}
              </button>
            )}
          </div>

          <div className="footer-actions">
            <button className="text-logout-btn" onClick={handleLogoutWrapper}>
              Logout / Reset
            </button>
          </div>

          {/* FIX: Footer added here, gated by showShare */}
          {showShare && <Footer />}
        </>
      )}
    </div>
  );
};

export default StoryView;