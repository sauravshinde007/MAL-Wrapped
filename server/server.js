require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const queryString = require('querystring');
const mongoose = require('mongoose');



const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Allow Vite frontend
app.use(express.json());

const MAL_AUTH_URL = 'https://myanimelist.net/v1/oauth2/authorize';
const MAL_TOKEN_URL = 'https://myanimelist.net/v1/oauth2/token';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// 2. Define the Schema
const StatSchema = new mongoose.Schema({
    username: String,
    year: String,
    data: Object, // Stores the calculated stats
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours (cache)
});
const UserStats = mongoose.model('UserStats', StatSchema);

// 1. Redirect user to MAL Login
app.get('/auth/login', (req, res) => {
    const params = queryString.stringify({
        response_type: 'code',
        client_id: process.env.MAL_CLIENT_ID,
        code_challenge: process.env.CODE_VERIFIER, // Simple PKCE for demo
        code_challenge_method: 'plain',
        state: 'xyz', // You should generate random state in prod
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
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        // Redirect back to frontend with token (In prod, use HTTP-only cookies)
        res.redirect(`http://localhost:5173?token=${response.data.access_token}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Authentication Failed");
    }
});

// Inside server.js

app.get('/api/wrapped', async (req, res) => {
    const { token, year } = req.query;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const targetYear = year || new Date().getFullYear().toString();

    try {
        const userRes = await axios.get('https://api.myanimelist.net/v2/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const username = userRes.data.name;

        // Check Cache (Keep your existing Mongo Logic here)
        const cached = await UserStats.findOne({ username, year: targetYear });
        if (cached) return res.json(cached.data);

        // Fetch Data
        const listRes = await axios.get('https://api.myanimelist.net/v2/users/@me/animelist', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                fields: 'list_status,num_episodes,average_episode_duration,genres,main_picture',
                limit: 1000,
                status: 'completed'
            }
        });

        const data = listRes.data.data;
        const yearlyAnime = data.filter(item => 
            item.list_status.finish_date && item.list_status.finish_date.startsWith(targetYear)
        );

        if (yearlyAnime.length === 0) return res.json({ empty: true });

        // --- CALCULATIONS ---

        let totalMinutes = 0;
        const genreCounts = {};
        const genreEvolution = Array(12).fill(0).map(() => ({})); // 12 Months of genres

        yearlyAnime.forEach(({ node, list_status }) => {
            const duration = node.average_episode_duration || (24 * 60);
            const totalDuration = (duration / 60) * node.num_episodes; // in minutes
            totalMinutes += totalDuration;

            // Extract Month (0-11)
            const month = new Date(list_status.finish_date).getMonth();

            node.genres.forEach(g => {
                // Total Counts
                genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
                
                // Monthly Evolution
                genreEvolution[month][g.name] = (genreEvolution[month][g.name] || 0) + 1;
            });

            // Attach calculated duration to object for sorting later
            node.calculated_duration = totalDuration;
        });

        // 1. Top Rated (Score)
        const topRated = [...yearlyAnime]
            .sort((a, b) => b.list_status.score - a.list_status.score)
            .slice(0, 5)
            .map(item => ({
                title: item.node.title,
                image: item.node.main_picture.large,
                score: item.list_status.score
            }));

        // 2. Most Watched (Duration/Time Spent)
        const mostWatched = [...yearlyAnime]
            .sort((a, b) => b.node.calculated_duration - a.node.calculated_duration)
            .slice(0, 5)
            .map(item => ({
                title: item.node.title,
                image: item.node.main_picture.large,
                minutes: Math.round(item.node.calculated_duration)
            }));

        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

        const finalStats = {
            username,
            totalAnime: yearlyAnime.length,
            totalHours: Math.round(totalMinutes / 60),
            topGenre,
            topRated,     // Top 5 by Score
            mostWatched,  // Top 5 by Time Wasted
            genreEvolution, // Array of 12 months data
            year: targetYear
        };

        // Save to DB (Keep your existing Mongo Logic)
        await UserStats.create({ username, year: targetYear, data: finalStats });

        res.json(finalStats);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

app.listen(5000, () => console.log('Backend running on port 5000'));