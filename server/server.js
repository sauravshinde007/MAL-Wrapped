require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const queryString = require('querystring');

const app = express();

app.use(cors({ origin: process.env.VITE_FRONTEND_URL , credentials: true }));
app.use(express.json());

const MAL_AUTH_URL = 'https://myanimelist.net/v1/oauth2/authorize';
const MAL_TOKEN_URL = 'https://myanimelist.net/v1/oauth2/token';
const REDIRECT_URI = `${process.env.SERVER_URL}/auth/callback`;

// --- HELPER: DELAY FUNCTION ---
// Prevents hitting MAL/Jikan API Rate Limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- AUTH ROUTES ---
app.get('/auth/login', (req, res) => {
    const params = queryString.stringify({
        response_type: 'code',
        client_id: process.env.MAL_CLIENT_ID,
        code_challenge: process.env.CODE_VERIFIER,
        code_challenge_method: 'plain',
        state: 'xyz',
        redirect_uri: REDIRECT_URI 
    });
    res.redirect(`${MAL_AUTH_URL}?${params}`);
});

app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const response = await axios.post(MAL_TOKEN_URL, queryString.stringify({
            client_id: process.env.MAL_CLIENT_ID,
            client_secret: process.env.MAL_CLIENT_SECRET,
            code,
            code_verifier: process.env.CODE_VERIFIER,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        res.redirect(`${process.env.VITE_FRONTEND_URL}?token=${response.data.access_token}`);
    } catch (error) {
        console.error("Auth Error:", error.response ? error.response.data : error.message);
        res.status(500).send("Authentication Failed");
    }
});

// --- API ROUTE ---
app.get('/api/wrapped', async (req, res) => {
    const { token, year } = req.query;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const targetYear = year || new Date().getFullYear().toString();

    try {
        // A. Fetch User Profile
        const userRes = await axios.get('https://api.myanimelist.net/v2/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const username = userRes.data.name;

        // NOTE: Server-side caching (MongoDB) has been removed to comply with MAL Policy 3(c).
        // Caching is now handled on the client-side (browser localStorage).
        
        console.log(`Fetching fresh data for ${username}...`);

        // B. FETCH ANIME LIST
        const listRes = await axios.get('https://api.myanimelist.net/v2/users/@me/animelist', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                fields: 'list_status{start_date,finish_date,updated_at,score},num_episodes,average_episode_duration,genres,main_picture',
                limit: 1000,
                status: 'completed'
            }
        });
        const data = listRes.data.data;

        // C. FILTER FOR TARGET YEAR
        let yearlyAnime = data.filter(item => 
            item.list_status.finish_date && 
            item.list_status.finish_date.startsWith(targetYear)
        );

        // Fallback: If no explicit dates, check 'updated_at'
        if (yearlyAnime.length === 0) {
            yearlyAnime = data.filter(item => 
                !item.list_status.finish_date && 
                item.list_status.updated_at && 
                item.list_status.updated_at.startsWith(targetYear)
            );
        }

        if (yearlyAnime.length === 0) return res.json({ empty: true });

        // --- D. CORE CALCULATIONS ---
        let totalMinutes = 0;
        const genreCounts = {};
        const genreEvolution = Array(12).fill(0).map(() => ({})); 

        yearlyAnime.forEach(({ node, list_status }) => {
            // Duration
            const duration = node.average_episode_duration || (24 * 60);
            const totalDuration = (duration / 60) * node.num_episodes; 
            totalMinutes += totalDuration;
            
            node.calculated_duration = totalDuration;

            // Genres
            let dateStr = list_status.finish_date || list_status.updated_at;
            if (dateStr) {
                const month = new Date(dateStr).getMonth();
                node.genres.forEach(g => {
                    genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
                    if (genreEvolution[month]) {
                        genreEvolution[month][g.name] = (genreEvolution[month][g.name] || 0) + 1;
                    }
                });
            }
        });

        // Sort Lists
        const topRated = [...yearlyAnime]
            .sort((a, b) => b.list_status.score - a.list_status.score)
            .slice(0, 5)
            .map(item => ({
                title: item.node.title,
                image: item.node.main_picture.large,
                score: item.list_status.score
            }));

        const mostWatched = [...yearlyAnime]
            .sort((a, b) => b.node.calculated_duration - a.node.calculated_duration)
            .slice(0, 5)
            .map(item => ({
                title: item.node.title,
                image: item.node.main_picture.large,
                minutes: Math.round(item.node.calculated_duration)
            }));

        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

        // --- E. AUTHOR CALCULATION (Using Jikan API) ---
        console.log("Calculating Top Authors...");
        const authorCounts = {};
        
        const showsToAnalyze = [...yearlyAnime]
            .sort((a, b) => b.node.calculated_duration - a.node.calculated_duration)
            .slice(0, 10); 

        for (const show of showsToAnalyze) {
            try {
                // Jikan Rate Limit (~3 req/sec), using 600ms delay for safety
                await delay(400); 
                
                const staffRes = await axios.get(
                    `https://api.jikan.moe/v4/anime/${show.node.id}/staff`
                );
                
                const staff = staffRes.data.data || []; 
                
                const creators = staff.filter(person => 
                    person.positions.includes("Original Creator") || 
                    person.positions.includes("Story & Art")
                );

                creators.forEach(c => {
                    const name = c.person.name;
                    // const image = c.person.images?.jpg?.image_url || null;
                    const image  = null;

                    // FALLBACK IMAGE: If Jikan has no image for the person, use the Anime Poster
                    if (!image || image.includes('questionmark')) {
                        // Use the large picture of the anime we are currently analyzing
                        image = show.node.main_picture ? (show.node.main_picture.large || show.node.main_picture.medium) : null;
                    }

                    // WEIGHTED FORMULA
                    const score = show.list_status.score || 5; 
                    const duration = show.node.calculated_duration || 24;
                    const weight = score * duration;

                    if (!authorCounts[name]) {
                        authorCounts[name] = { weight: 0, count: 0, image: image };
                    }
                    if (!authorCounts[name].image && image) {
                        authorCounts[name].image = image;
                    }

                    authorCounts[name].weight += weight;
                    authorCounts[name].count += 1;
                });

            } catch (e) {
                console.log(`Failed to fetch staff for ${show.node.title} (Jikan Error)`);
            }
        }

        const topAuthors = Object.entries(authorCounts)
            .sort((a, b) => b[1].weight - a[1].weight)
            .slice(0, 5)
            .map(([name, data]) => ({ name, ...data }));

        const favoriteAuthor = topAuthors.length > 0 ? topAuthors[0].name : "Unknown";

        const finalStats = {
            username,
            totalAnime: yearlyAnime.length,
            totalHours: Math.round(totalMinutes / 60),
            topGenre,
            topRated,     
            mostWatched,
            genreEvolution,
            topAuthors,      
            favoriteAuthor,
            year: targetYear
        };

        // No DB save. Just return data.
        res.json(finalStats);

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

module.exports = app;