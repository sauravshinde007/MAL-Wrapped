require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const queryString = require('querystring'); // Built-in Node module
const mongoose = require('mongoose');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Allow Vite frontend
app.use(express.json());

// --- CONSTANTS ---
const MAL_AUTH_URL = 'https://myanimelist.net/v1/oauth2/authorize';
const MAL_TOKEN_URL = 'https://myanimelist.net/v1/oauth2/token';
const REDIRECT_URI = 'http://localhost:5000/auth/callback'; // Must match MAL App Settings

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// --- SCHEMA DEFINITION ---
const StatSchema = new mongoose.Schema({
    username: String,
    year: String,
    data: Object, // Stores the calculated stats
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours (cache)
});
const UserStats = mongoose.model('UserStats', StatSchema);

// --- AUTH ROUTES ---

// 1. Redirect user to MAL Login
app.get('/auth/login', (req, res) => {
    const params = queryString.stringify({
        response_type: 'code',
        client_id: process.env.MAL_CLIENT_ID,
        code_challenge: process.env.CODE_VERIFIER,
        code_challenge_method: 'plain',
        state: 'xyz', // Random string for security
        redirect_uri: REDIRECT_URI 
    });
    res.redirect(`${MAL_AUTH_URL}?${params}`);
});

// 2. Callback: Exchange Code for Token
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

        // Redirect back to frontend with token
        res.redirect(`http://localhost:5173?token=${response.data.access_token}`);
    } catch (error) {
        console.error("Auth Error:", error.response ? error.response.data : error.message);
        res.status(500).send("Authentication Failed");
    }
});

// --- API ROUTES ---
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

        // B. CHECK DB CACHE
        const cached = await UserStats.findOne({ username, year: targetYear });
        if (cached) {
            console.log(`Serving ${username} from Cache`);
            return res.json(cached.data);
        }

        console.log(`Fetching fresh data for ${username}...`);

        // C. FETCH ANIME LIST
        const listRes = await axios.get('https://api.myanimelist.net/v2/users/@me/animelist', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                fields: 'list_status{start_date,finish_date,updated_at,score},num_episodes,average_episode_duration,genres,main_picture',
                limit: 1000,
                status: 'completed'
            }
        });

        const data = listRes.data.data;

        // --- D. STRICT PRIORITY FILTERING ---
        
        // 1. First, try to find anime with an EXPLICIT finish date in target year
        let yearlyAnime = data.filter(item => 
            item.list_status.finish_date && 
            item.list_status.finish_date.startsWith(targetYear)
        );

        // 2. LOGIC CHECK: Do we have any data?
        if (yearlyAnime.length > 0) {
            console.log("Found explicit finish dates. Ignoring fallback.");
        } else {
            // 3. ONLY if explicit list is empty, try the 'Updated At' fallback
            console.log("No explicit dates found. Using 'Updated At' fallback.");
            
            yearlyAnime = data.filter(item => 
                !item.list_status.finish_date && // Ensure it doesn't have a date (sanity check)
                item.list_status.updated_at && 
                item.list_status.updated_at.startsWith(targetYear)
            );
        }

        // If BOTH are empty, then the user truly watched nothing
        if (yearlyAnime.length === 0) return res.json({ empty: true });

        // --- E. CALCULATIONS ---

        let totalMinutes = 0;
        const genreCounts = {};
        const genreEvolution = Array(12).fill(0).map(() => ({})); 

        yearlyAnime.forEach(({ node, list_status }) => {
            // 1. Duration Calc
            const duration = node.average_episode_duration || (24 * 60);
            const totalDuration = (duration / 60) * node.num_episodes; 
            totalMinutes += totalDuration;

            // 2. Month Determination
            // We need to determine which date string to use for the chart
            let dateStr = list_status.finish_date;
            
            // If we are in the "Fallback" scenario, finish_date is null, so use updated_at
            if (!dateStr && list_status.updated_at) {
                dateStr = list_status.updated_at;
            }

            if (dateStr) {
                const month = new Date(dateStr).getMonth();

                node.genres.forEach(g => {
                    genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
                    if (genreEvolution[month]) {
                        genreEvolution[month][g.name] = (genreEvolution[month][g.name] || 0) + 1;
                    }
                });
            }

            node.calculated_duration = totalDuration;
        });

        // 3. Top Rated
        const topRated = [...yearlyAnime]
            .sort((a, b) => b.list_status.score - a.list_status.score)
            .slice(0, 5)
            .map(item => ({
                title: item.node.title,
                image: item.node.main_picture.large,
                score: item.list_status.score
            }));

        // 4. Most Watched
        const mostWatched = [...yearlyAnime]
            .sort((a, b) => b.node.calculated_duration - a.node.calculated_duration)
            .slice(0, 5)
            .map(item => ({
                title: item.node.title,
                image: item.node.main_picture.large,
                minutes: Math.round(item.node.calculated_duration)
            }));

        // 5. Top Genre
        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

        const finalStats = {
            username,
            totalAnime: yearlyAnime.length,
            totalHours: Math.round(totalMinutes / 60),
            topGenre,
            topRated,     
            mostWatched,  
            genreEvolution, 
            year: targetYear
        };

        // F. SAVE TO DB
        await UserStats.create({ username, year: targetYear, data: finalStats });

        res.json(finalStats);

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});


app.listen(5000, () => console.log('Backend running on port 5000'));