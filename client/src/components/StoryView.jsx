import React, { useEffect, useState, useRef } from 'react';
import Stories from 'react-insta-stories';
import axios from 'axios';
import html2canvas from 'html2canvas';

// --- Import Custom Slide Components ---
import { IntroSlide, MessageSlide, HeroSlide } from './slides/Slides';
import ListSlide from './slides/ListSlide';
import EvolutionChart from './slides/EvolutionChart';
import SummarySlide from './slides/SummarySlide';

// --- Import UI & Utils ---
import AnimatedGradientBackground from './ui/AnimatedGradientBackground';
import { getThemeSong } from '../utils/musicMap';

const StoryView = ({ token, year }) => {
    // --- STATE MANAGEMENT ---
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState(null);
    const [readyToPlay, setReadyToPlay] = useState(false); // Controls the "Tap to Start" overlay
    const [isMuted, setIsMuted] = useState(false);

    // Audio Reference
    const audioRef = useRef(new Audio());

    // --- MUSIC LOGIC ---
    const fadeOutMusic = () => {
        const audio = audioRef.current;
        if (!audio) return;

        console.log("Story finished. Fading out music...");
        const fadeAudio = setInterval(() => {
            // Check if volume is high enough to decrease
            if (audio.volume > 0.05) {
                audio.volume -= 0.05;
            } else {
                // Cleanup
                audio.volume = 0;
                audio.pause();
                clearInterval(fadeAudio);
            }
        }, 100); // Reduce volume every 100ms
    };

    // --- MAIN DATA FETCH & SETUP ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Data from Backend
                const { data } = await axios.get(`http://localhost:5000/api/wrapped?token=${token}&year=${year}`);
                setStatsData(data);

                if (data.empty) { 
                    alert(`No Anime completed in ${year}!`); 
                    return; 
                }

                // 2. Setup Audio based on Top Genre
                const songUrl = getThemeSong(data.topGenre);
                audioRef.current.src = songUrl;
                audioRef.current.loop = true;
                audioRef.current.volume = 0.5; // Start at 50%

                // 3. Construct the 11-Page Story
                const storyData = [
                    // Slide 1: Intro
                    { content: () => <IntroSlide username={data.username} />, duration: 6000 },

                    // Slide 2: Time Wasted Message
                    { content: () => <MessageSlide 
                        mainText={`You wasted ${data.totalHours} hours watching anime.`} 
                        subText="Where do you find the time?" 
                    />, duration: 6000 },

                    // Slide 3: Total Count Message
                    { content: () => <MessageSlide 
                        mainText={`You watched ${data.totalAnime} series.`} 
                        subText="That's a lot of intros skipped." 
                    />, duration: 6000 },

                    // Slide 4: Hero Slide (Top #1 Anime)
                    { content: () => <HeroSlide anime={data.topRated[0]} />, duration: 7000 },

                    // Slide 5: Leaderboard Tease
                    { content: () => <MessageSlide 
                        mainText="While it's not a competition..." 
                        subText="There is a leaderboard." 
                    />, duration: 4000 },

                    // Slide 6: Top Rated List
                    { content: () => <ListSlide title="Your Top Rated" list={data.topRated} />, duration: 10000 },

                    // Slide 7: Evolution Tease
                    { content: () => <MessageSlide 
                        mainText="You've changed." 
                        subText="And so has your taste..." 
                    />, duration: 4000 },

                    // Slide 8: Evolution Chart
                    { content: () => <EvolutionChart evolutionData={data.genreEvolution} topGenre={data.topGenre} />, duration: 8000 },

                    // Slide 9: Most Watched Tease
                    { content: () => <MessageSlide 
                        mainText="But what did you ACTUALLY watch?" 
                        subText="Based on pure screen time..." 
                    />, duration: 5000 },

                    // Slide 10: Most Watched List (Duration based)
                    { content: () => <ListSlide title="Most Watched" list={data.mostWatched} />, duration: 10000 },

                    // Slide 11: Summary Card
                    { content: () => <SummarySlide stats={data} />, duration: 15000 }
                ];

                setStories(storyData);
                setLoading(false);

            } catch (err) {
                console.error("Fetch error", err);
                alert("Failed to load your Wrapped data.");
            }
        };

        fetchData();

        // Cleanup: Stop music immediately if user leaves page
        return () => {
            if(audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, [token, year]);

    // --- HANDLERS ---

    const handleStart = () => {
        setReadyToPlay(true);
        // Browser requires interaction to play audio
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    };

    const toggleMute = () => {
        audioRef.current.muted = !audioRef.current.muted;
        setIsMuted(audioRef.current.muted);
    };

    const downloadSummary = async () => {
        // Target the specific summary card ID, fallback to container if missing
        const element = document.getElementById('summary-card') || document.querySelector('.stories-container');
        
        if (!element) {
            alert("Wait for the Summary Slide to appear!");
            return;
        }

        try {
            const canvas = await html2canvas(element, { 
                useCORS: true, // Crucial for external images (MAL posters)
                scale: 2       // High resolution for sharing
            });
            const link = document.createElement('a');
            link.download = `MAL-Wrapped-${statsData?.year || year}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) { 
            console.error("Screenshot failed:", e); 
        }
    };

    if (loading) return <div className="loading">Analyzing your {year} history...</div>;

    // --- RENDER ---
    return (
        <div className="story-wrapper" style={{ position: 'relative', zIndex: 1 }}>
            
            {/* 1. BACKGROUND GRADIENT */}
            {/* FIXED: Changed zIndex from -1 to 0 to sit ON TOP of body background */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <AnimatedGradientBackground 
                    animationSpeed={0.05} 
                    breathingRange={10}
                    gradientColors={["#2979FF", "#000000"]} // Blue to Black
                />
            </div>

            {/* 2. OVERLAY */}
            {!readyToPlay && (
                <div className="start-overlay" onClick={handleStart} style={{ zIndex: 9999 }}>
                    <div className="play-button">
                        <h1>▶</h1>
                        <p>Tap to start your Wrapped</p>
                    </div>
                </div>
            )}

            {/* 3. MAIN CONTENT */}
            {readyToPlay && (
                <>
                    {/* FIXED: Added zIndex: 2 to ensure stories sit ABOVE the gradient */}
                    <div className="stories-container" style={{ position: 'relative', zIndex: 2 }}>
                        <Stories
                            stories={stories}
                            defaultInterval={5000}
                            width={400}
                            height={700}
                            loop={false}
                            onAllStoriesEnd={fadeOutMusic}
                            // FIXED: Explicitly pass object styles for transparency
                            storyStyles={{ 
                                width: '100%', 
                                height: '100%', 
                                background: 'transparent',
                                backgroundColor: 'transparent' 
                            }}
                            storyContainerStyles={{ 
                                background: 'transparent',
                                backgroundColor: 'transparent'
                            }}
                        />
                    </div>
                    
                    {/* 4. CONTROLS */}
                    <div className="controls" style={{ position: 'relative', zIndex: 100 }}>
                        <button className="icon-btn" onClick={toggleMute}>
                            {isMuted ? "🔇" : "🔊"}
                        </button>

                        {statsData && (
                            <button className="share-btn" onClick={downloadSummary}>
                                Share
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default StoryView;