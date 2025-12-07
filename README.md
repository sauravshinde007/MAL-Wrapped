
````markdown

![Project Banner](assets/banner.png)

# 🎬 Anime Year in Review (Unofficial MAL Wrapped)

An immersive, "Spotify Wrapped"-style experience for MyAnimeList users. Discover your viewing habits, top genres, and favorite authors through an interactive story interface.

**[https://mal-wrapped-io.vercel.app/]**

## ✨ Features

* **Story-Style UI:** Instagram-like navigation with smooth animations.
* **Deep Stats:** Calculates total hours watched, top genres, and viewing habits.
* **Creator Analysis:** Identifies your favorite Mangaka/Author based on watch time (powered by Jikan API).
* **Shareable:** Generate and download a sleek summary card for social media.
* **Privacy First:** No server-side storage. All data is processed on-the-fly and cached locally in your browser.

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite, Framer Motion, `react-insta-stories`
* **Backend:** Node.js, Express (Serverless)
* **APIs:** Official MyAnimeList API v2 (User Data) + Jikan API v4 (Staff Data)
* **Deployment:** Vercel

## 🚀 Quick Start

### 1. Prerequisites
You need a MyAnimeList API Client ID. [Get one here](https://myanimelist.net/apiconfig).

### 2. Installation

Clone the repo:
```bash
git clone [https://github.com/yourusername/anime-year-in-review.git](https://github.com/yourusername/anime-year-in-review.git)
cd anime-year-in-review
````

### 3\. Configuration

Create a `.env` file in **both** the `server` and `client` folders.

**Server (`server/.env`):**

```env
MAL_CLIENT_ID=your_mal_client_id
MAL_CLIENT_SECRET=your_mal_client_secret
# Generate a random 43-128 char string
CODE_VERIFIER=your_long_random_string_for_pkce 
VITE_FRONTEND_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
```

**Client (`client/.env`):**

```env
VITE_SERVER_URL=http://localhost:5000
```

### 4\. Run Locally

You need to run both the frontend and backend terminals.

**Terminal 1 (Backend):**

```bash
cd server
npm install
npm run dev
```

**Terminal 2 (Frontend):**

```bash
cd client
npm install
npm run dev
```

## 🌍 Deployment (Vercel)

This project is configured for easy deployment on Vercel.

1.  **Backend:** Deploy the `server` directory as a standalone project. Add the environment variables from `server/.env`.
2.  **Frontend:** Deploy the `client` directory. Set `VITE_SERVER_URL` to your backend's production URL.
3.  **Final Step:** Update your MyAnimeList App Settings "Redirect URL" to: `https://your-backend-url.vercel.app/auth/callback`

## ⚖️ Legal & Disclaimer

This application is **Authorized by MyAnimeList** but is an unofficial project and is not affiliated with, endorsed, or sponsored by MyAnimeList.net.

  * Data provided by MyAnimeList and Jikan.
  * User data is **never** stored on our servers.

-----

**Made with ❤️ for the Anime Community**

```
```