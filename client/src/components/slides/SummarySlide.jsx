import React from 'react';

const SummarySlide = ({ stats }) => {
  // SAFETY CHECK: Ensure the list exists before trying to slice it
  const topList = stats.topRated || []; 

  return (
    // The outer container stays transparent for the web view
    <div className="slide summary-slide">
      
      {/* THIS is the inner card with the background that we will download */}
      <div className="summary-card-bg" id="summary-card-to-download">
        
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
              {topList.slice(0, 3).map((anime, i) => (
                  <div key={i} className="mini-poster">
                      <img src={anime.image} alt="poster" crossOrigin="anonymous" />
                  </div>
              ))}
          </div>
        </div>

        <div className="footer">
          <p>MAL Wrapped Project</p>
        </div>

      </div>
    </div>
  );
};

export default SummarySlide;