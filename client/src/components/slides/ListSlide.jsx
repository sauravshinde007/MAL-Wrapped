import React from 'react';
import { motion } from 'framer-motion';

const ListSlide = ({ title, list }) => {
    return (
        <div className="slide list-slide">
            <h2 className="list-header">{title}</h2>
            
            <div className="ranking-list">
                {list.map((anime, index) => {
                    // Determine subtitle based on available data (Score vs Minutes)
                    const subtitle = anime.score 
                        ? `Score: ${anime.score}` 
                        : `${Math.round(anime.minutes / 60)} hrs`;

                    return (
                        <motion.div 
                            className="ranking-item" 
                            key={index}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ 
                                delay: index * 0.3, // Faster cascade
                                duration: 0.8, 
                                ease: "easeOut" 
                            }} 
                        >
                            {/* 1. Big Rank Number */}
                            <span className="rank-num">{index + 1}</span>
                            
                            {/* 2. Square Image */}
                            <img src={anime.image} alt="" className="rank-img" />
                            
                            {/* 3. Stacked Text */}
                            <div className="rank-text-col">
                                <span className="rank-title">{anime.title}</span>
                                <span className="rank-subtitle">{subtitle}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ListSlide;