import React, { useEffect, useState, useRef } from 'react';
import Stories from 'react-insta-stories';
import axios from 'axios';
import html2canvas from 'html2canvas';
// --- Import Custom Slide Components ---
import { 
    IntroSlide, 
    MessageSlide, 
    GenreRevealSlide, 
    HeroSlide, 
    AuthorHeroSlide, // Using the new visual hero slide for authors
} from './slides/Slides';
import ListSlide from './slides/ListSlide';
import EvolutionChart from './slides/EvolutionChart';
import SummarySlide from './slides/SummarySlide';
import { getThemeSong } from '../utils/musicMap.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// --- Import UI & Utils ---
const getStorySize = () => {
  if (typeof window === 'undefined') {
    return { width: 350, height: 622 };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Define margins/spacing we want around the card
  const horizontalMargin = 30; // 15px on each side
  const verticalMargin = 100; // Space for header/buttons/browser bars

  // Calculate available space
  const availableWidth = vw - horizontalMargin;
  const availableHeight = vh - verticalMargin;

  // Target aspect ratio (9:16)
  const targetRatio = 9 / 16;
  // Logic: "Contain" the card within the available space
  let storyHeight = availableHeight;
  let storyWidth = storyHeight * targetRatio;

  // If the calculated width is wider than available width, scale down based on width
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
  // --- STATE MANAGEMENT ---
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [readyToPlay, setReadyToPlay] = useState(false);
  
  // Controls visibility of the Share/Download button
  const [showShare, setShowShare] = useState(false); 
  
  // --- RESPONSIVE DIMENSIONS STATE ---
  const [windowSize, setWindowSize] = useState(getStorySize);

  // Initialize ref as null (attached to <audio> element later)
  const audioRef = useRef(null);

  // --- HANDLE WINDOW RESIZE ---
  useEffect(() => {
    const handleResize = () => {
      setWindowSize(getStorySize());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- MUSIC & END LOGIC ---
  const handleStoriesEnd = () => {
    const audio = audioRef.current;
    if (audio) {
        console.log('Story finished. Fading out music...');
        const fadeAudio = setInterval(() => {
          if (audio.volume > 0.05) {
            audio.volume -= 0.05;
          } else {
            audio.volume = 0;
            audio.pause();
            clearInterval(fadeAudio);
          }
        }, 100);
    }
    
    // Fix: Defer state update to next tick to avoid React render conflict error
    setTimeout(() => {
        setShowShare(true);
    }, 0);
  };

  // --- DATA PROCESSING HELPER ---
  // Transforms raw API data into Slide components
  const processDataIntoStories = (data) => {
      // Setup Audio
      if (audioRef.current) {
          const songUrl = getThemeSong(data.topGenre);
          audioRef.current.src = songUrl;
          audioRef.current.loop = true;
          audioRef.current.volume = 0.5;
          audioRef.current.load(); // Vital for mobile autoplay policies
      }

      // Construct the Story Array
      const storyData = [
          { content: () => <IntroSlide username={data.username} />, duration: 6000 },

          { content: () => (
              <MessageSlide
                mainText="There was one vibe that defined your year..."
                subText="Any guesses?"
              />
            ), duration: 4000 },

          { content: () => <GenreRevealSlide genre={data.topGenre} />, duration: 4000 },

          { content: () => (
              <MessageSlide
                mainText={`You wasted ${data.totalHours} hours watching anime.`}
                subText="Where do you find the time?"
              />
            ), duration: 4000 },

          { content: () => (
              <MessageSlide
                mainText={`You watched ${data.totalAnime} series.`}
                subText="That's a lot of intros skipped."
              />
            ), duration: 4000 },

          { content: () => <HeroSlide anime={data.topRated[0]} />, duration: 5000 },

          { content: () => (
              <MessageSlide
                mainText="While it's not a competition..."
                subText="There is a leaderboard."
              />
            ), duration: 4000 },

          { content: () => (
              <ListSlide title="Your Top Rated" list={data.topRated} />
            ), duration: 7000 },

          { content: () => (
              <MessageSlide
                mainText="You've changed."
                subText="And so has your taste..."
              />
            ), duration: 4000 },

          { content: () => (
              <EvolutionChart
                evolutionData={data.genreEvolution}
                topGenre={data.topGenre}
              />
            ), duration: 6000 },

          // --- AUTHOR SECTION ---
          // 1. Hero Slide for Favorite Author
          { content: () => (
              <AuthorHeroSlide 
                  authorName={data.favoriteAuthor} 
                  // Pass the image of the #1 author from the list
                  authorImage={data.topAuthors.length > 0 ? data.topAuthors[0].image : null} 
              />
            ), duration: 4000 },

          // 2. Top Authors List (Reusing ListSlide with subtitles hidden)
          { content: () => {
              const authorList = data.topAuthors.map(a => ({
                  title: a.name,
                  image: a.image, 
                  customSubtitle: "HIDE" // Tells ListSlide to render just the name
              }));

              return (
                  <ListSlide 
                      title="Top Mangakas" 
                      list={authorList} 
                  />
              );
            }, duration: 5000 },
          // -----------------------

          { content: () => (
              <MessageSlide
                mainText="But what did you ACTUALLY watch?"
                subText="Based on pure screen time..."
              />
            ), duration: 4000 },

          { content: () => (
              <ListSlide title="Most Watched" list={data.mostWatched} />
            ), duration: 7000 },

          { content: () => <SummarySlide stats={data} />, duration: 1000 }, 
      ];
      
      setStories(storyData);
      setLoading(false);
  };

  // --- MAIN EFFECT: FETCH OR LOAD CACHE ---
  useEffect(() => {
    const fetchData = async () => {
      const cacheKey = `mal_wrapped_cache_${year}`;
      
      // 1. Check LocalStorage Cache
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
          try {
              const parsed = JSON.parse(cached);
              const now = new Date().getTime();
              // Cache valid for 24 hours (86400000 ms)
              if (now - parsed.timestamp < 86400000) {
                  console.log("Loading from Local Storage Cache");
                  setStatsData(parsed.data);
                  processDataIntoStories(parsed.data);
                  return; // EXIT EARLY - DO NOT FETCH
              }
          } catch (e) {
              console.error("Cache parse error", e);
              localStorage.removeItem(cacheKey);
          }
      }

      // 2. Fetch from API if no cache
      try {
        const { data } = await axios.get(
          `${SERVER_URL}/api/wrapped?token=${token}&year=${year}`
        );
        
        if (data.empty) {
          alert(`No Anime completed in ${year}!`);
          setLoading(false);
          return;
        }

        // 3. Save to Cache
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: new Date().getTime(),
            data: data
        }));

        setStatsData(data);
        processDataIntoStories(data);

      } catch (err) {
        console.error('Fetch error', err);
        alert('Failed to load your Wrapped data.');
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [token, year]);

  // --- HANDLERS ---
  const handleStart = () => {
    setReadyToPlay(true);
    if (audioRef.current) {
        // Safe play call to avoid AbortError if loading isn't done
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Audio playback interrupted (Mobile auto-play policy):", error);
            });
        }
    }
  };

  // Improved Share Logic using Web Share API
  const handleShare = async () => {
    const element = document.getElementById('summary-card-to-download');
    if (!element) return;

    try {
      // 1. Generate the canvas (High Quality)
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2, // Retain high resolution for stories
        backgroundColor: null,
      });

      // 2. Convert Canvas to Blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // 3. Create a File object (Required for Web Share API)
        const file = new File([blob], `MAL-Wrapped-${year}.png`, {
          type: 'image/png',
        });

        // 4. Check if the browser supports sharing files (Mobile mostly)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Anime Year in Review',
              text: 'Check out my MAL Wrapped! 🎬 #MALWrapped',
            });
            console.log('Shared successfully');
          } catch (error) {
            // User cancelled the share or an error occurred
            if (error.name !== 'AbortError') {
              console.error('Error sharing:', error);
            }
          }
        } else {
          // 5. Fallback for Desktop: Download the image
          const link = document.createElement('a');
          link.download = `MAL-Wrapped-${year}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          alert("Image downloaded! You can now manually post it to your story.");
        }
      }, 'image/png');

    } catch (e) {
      console.error('Screenshot failed:', e);
    }
  };

  const handleStoryStart = (index) => {
    // If user goes back from the end, hide share button
    if (index < stories.length - 1) {
        setShowShare(false);
    }
  }

  // Wrapper to clear cache on logout
  const handleLogoutWrapper = () => {
      localStorage.removeItem(`mal_wrapped_cache_${year}`);
      onLogout();
  };

  if (loading) {
    return (
      <div className="loading">
        Analyzing your {year} history...<br/>
        <span style={{fontSize: '0.8rem', opacity: 0.7}}>Checking Top Creators (this may take a moment)</span>
      </div>
    );
  }

  return (
    <div className="story-wrapper" style={{ position: 'relative', zIndex: 1 }}>
      
      {/* Hidden Audio Element attached to DOM */}
      <audio 
        ref={audioRef} 
        preload="auto" 
        playsInline 
        style={{ display: 'none' }} 
      />

      {/* 1. OVERLAY */}
      {!readyToPlay && (
        <div className="start-overlay" onClick={handleStart} style={{ zIndex: 9999 }}>
          <div className="play-button">
            <h1>▶</h1>
            <p>Tap to start your Wrapped</p>
          </div>
        </div>
      )}

      {/* 2. MAIN CONTENT */}
      {readyToPlay && (
        <>
          <div
            className="stories-container"
            style={{
                position: 'relative',
                zIndex: 2,
                width: windowSize.width,
                height: windowSize.height,
                margin: '0 auto',
            }}
          >
            <Stories
                stories={stories}
                width={windowSize.width}
                height={windowSize.height}
                defaultInterval={5000}
                loop={false}
                onAllStoriesEnd={handleStoriesEnd}
                onStoryStart={handleStoryStart} 
                storyStyles={{
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                    backgroundColor: 'transparent',
                }}
                storyContainerStyles={{
                    background: 'transparent',
                    backgroundColor: 'transparent',
                    borderRadius: '15px', 
                    overflow: 'hidden'
                }}
            />
          </div>

           <div className="controls">
            {/* Share Button: Only shows at the end */}
            {statsData && showShare && (
              <button className="share-btn" onClick={handleShare}>
                {navigator.canShare ? 'Share Wrapped' : 'Download Summary'}
              </button>
            )}
          </div>

          <div className="footer-actions">
            <button className="text-logout-btn" onClick={handleLogoutWrapper}>
              Logout / Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StoryView;