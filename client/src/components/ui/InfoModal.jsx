import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-btn" onClick={onClose}>×</button>
          
          <h2>About MAL Wrapped</h2>
          <p>
            An unofficial year-in-review for anime fans. This project uses the MyAnimeList API to generate a story-style summary of your watch history.
          </p>

          <h3>FAQ</h3>
          <p><strong>Is my data safe?</strong><br/>
          Yes, I do not store your data on my servers. Your stats are calculated on the fly and cached temporarily in your browser for performance.</p>
          
          <p><strong>Why is my favorite author missing?</strong><br/>
          I am only analyzing your top 10 most-watched shows. If an author doesn't appear there, they might not show up in the summary.</p>

          <h3>Legal & Privacy</h3>
          <p>
            This application is <strong>Authorized by MyAnimeList</strong> but is not affiliated with MyAnimeList.net.
          </p>
          <p>
            <a href="https://myanimelist.net/about/terms_of_use" target="_blank" rel="noreferrer">MyAnimeList Terms of Use</a>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InfoModal;