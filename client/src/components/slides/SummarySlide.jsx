import React from 'react';

const SummarySlide = ({ stats }) => {
  return (
    <div className="slide summary-slide" id="summary-card">
      <div className="summary-header">
        <h2 className="year-title">{stats.year} WRAPPED</h2>
        <p className="user-handle">@{stats.username}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <span className="label">Anime</span>
          <span className="value">{stats.totalAnime}</span>
        </div>
        <div className="stat-box">
          <span className="label">Hours</span>
          <span className="value">{stats.totalHours}</span>
        </div>
        <div className="stat-box full-width">
          <span className="label">Top Genre</span>
          <span className="value highlight">{stats.topGenre}</span>
        </div>
      </div>

      <div className="top-list-preview">
        <p>Top Favorites</p>
        <div className="posters-row">
            {stats.top5.slice(0, 3).map((anime, i) => (
                <div key={i} className="mini-poster">
                    <img src={anime.image} alt="poster" crossOrigin="anonymous" />
                </div>
            ))}
        </div>
      </div>

      <div className="footer">
        <p>MAL Wrapped by SauravSan</p>
      </div>
    </div>
  );
};

export default SummarySlide;