import React, { useState } from 'react';
import InfoModal from './InfoModal';

const Footer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <footer className="app-footer">
        <div className="footer-content">
          
          {/* 1. GitHub Star Button */}
          <a 
            href="https://github.com/sauravshinde007/MAL-Wrapped" 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-btn"
          >
            <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor" style={{marginRight: '6px'}}>
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
            </svg>
            Star on GitHub
          </a>

          {/* 2. Links */}
          <div className="footer-links">
            <button onClick={() => setIsModalOpen(true)} className="link-btn">
              About & FAQ
            </button>
            <span className="separator">•</span>
            <span className="attribution">Authorized by MyAnimeList</span>
          </div>

        </div>
      </footer>

      <InfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Footer;