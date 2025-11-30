import React from 'react';
import { motion } from 'framer-motion';

// 1. Intro Slide - Slower Fade In
export const IntroSlide = ({ username }) => (
    <div className="slide intro-slide">
        <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 2, ease: "easeOut" }} // Was 1s
        >
            Hi {username}
        </motion.h1>
        <motion.h2 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 2.5, duration: 2 }} // Was delay 2s
        >
            Your Anime Wrapped is ready.<br/>Are you?
        </motion.h2>
    </div>
);

// 2. Message Slide - Slower Slide In
export const MessageSlide = ({ mainText, subText, accentColor = "#FFD700" }) => (
    <div className="slide message-slide">
        <motion.h1 
            initial={{ x: -50, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }} // Added explicit slow duration
        >
            {mainText}
        </motion.h1>
        {subText && (
            <motion.p 
                style={{ color: accentColor }}
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 1, duration: 1.5 }} // Slower delay and fade
            >
                {subText}
            </motion.p>
        )}
    </div>
);

// 3. Hero Slide - Slower Reveal
export const HeroSlide = ({ anime }) => {
    const formattedValue = (anime.score || 0).toLocaleString();

    return (
        <div className="slide">
            
            {/* Image & Title Container */}
            <motion.div 
                className="hero-image-container"
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ duration: 0.8, ease: "backOut" }}
            >
                <img src={anime.image} alt={anime.title} className="hero-poster" />
                
                {/* NEW: Anime Title */}
                <h2 className="hero-anime-title">{anime.title}</h2>
            </motion.div>

            {/* Bottom Text */}
            <motion.div className="hero-text-block"
                initial={{ y: 40, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            >
                <h1>
                    Your favourite anime this year with {formattedValue} score
                </h1>
            </motion.div>
        </div>
    );
};

// --- NEW COMPONENT: Genre Reveal ---
export const GenreRevealSlide = ({ genre }) => (
    <div className="slide genre-reveal-slide">
        <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            style={{ fontSize: '1.8rem', color: '#ccc', marginBottom: '1rem', fontWeight: 600 }}
        >
            Your Personality Type...
        </motion.h2>
        
        <motion.h1 
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.5, duration: 0.8, type: "spring", stiffness: 120 }}
            style={{ 
                fontSize: '3rem', 
                fontWeight: 900, 
                color: '#FFD700',
                textTransform: 'uppercase',
                wordBreak: 'break-word',
                lineHeight: 0.9,
                textShadow: '0 10px 30px rgba(255, 215, 0, 0.3)'
            }}
        >
            {genre}
        </motion.h1>
    </div>
);