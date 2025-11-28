import React, { useEffect, useState } from 'react';
import Stories from 'react-insta-stories';
import axios from 'axios';
import html2canvas from 'html2canvas';

import SummarySlide from './slides/SummarySlide';

// --- CUSTOM SLIDE COMPONENTS ---
const IntroSlide = ({ stats }) => (
    <div className="slide intro">
        {/* DYNAMIC YEAR from API Data */}
        <h1>Your {stats.year} in Anime</h1>
        <p>You watched <span>{stats.totalAnime}</span> series!</p>
        <p>That's <span>{stats.totalHours}</span> hours of content.</p>
    </div>
);

const GenreSlide = ({ stats }) => (
    <div className="slide genre">
        <h2>Your Vibe</h2>
        <p>You were really into</p>
        <h1 style={{ fontSize: '3rem' }}>{stats.topGenre}</h1>
    </div>
);

const TopAnimeSlide = ({ anime }) => (
    <div className="slide top-anime" style={{ backgroundImage: `url(${anime.image})` }}>
        <div className="overlay">
            <h2>#1 Top Pick</h2>
            <h1>{anime.title}</h1>
            <div className="score">{anime.score}/10</div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
// Added 'year' prop here
const StoryView = ({ token, year = new Date().getFullYear() }) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Pass the dynamic year to the backend
                const { data } = await axios.get(`http://localhost:5000/api/wrapped?token=${token}&year=${year}`);
                setStatsData(data);

                if (data.empty) { alert(`No Anime completed in ${year}!`); return; }

                const storyData = [
                    { content: () => <IntroSlide stats={data} />, duration: 5000 },
                    { content: () => <GenreSlide stats={data} />, duration: 5000 },
                    ...data.top5.map(anime => ({
                        content: () => <TopAnimeSlide anime={anime} />,
                        duration: 6000
                    })),
                    {
                        content: () => <SummarySlide stats={data} />,
                        duration: 10000 
                    }
                ];

                setStories(storyData);
                setLoading(false);
            } catch (err) {
                console.error("Fetch error", err);
            }
        };
        fetchData();
    }, [token, year]); // Add year to dependency array

    const downloadSummary = async () => {
        const element = document.getElementById('summary-card') || document.querySelector('.stories-container');

        if (!element) {
            alert("Wait for the summary slide to appear!");
            return;
        }

        try {
            const canvas = await html2canvas(element, {
                useCORS: true, 
                scale: 2,      
            });
            const link = document.createElement('a');
            // Use the year from the data
            link.download = `MAL-Wrapped-${statsData?.year || year}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error("Screenshot failed:", e);
        }
    };

    if (loading) return <div>Analyzing your {year} history...</div>;

    return (
        <div className="story-wrapper">
            <div className="stories-container">
                <Stories
                    stories={stories}
                    defaultInterval={1500}
                    width={400}
                    height={700}
                    loop={false}
                />
            </div>
            {statsData && (
                <button className="share-btn" onClick={downloadSummary}>
                    Download Summary Card
                </button>
            )}
        </div>
    );
};

export default StoryView;