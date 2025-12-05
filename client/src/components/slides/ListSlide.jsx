import React from 'react';
import { motion } from 'framer-motion';

const ListSlide = ({ title, list }) => {
    return (
        <div className="slide list-slide">
            <h2 className="list-header">{title}</h2>
            
            <div className="ranking-list">
                {list.map((item, index) => {
                    
                    // Logic: Use custom subtitle if exists. 
                    // If specifically set to "HIDE", render nothing.
                    // Otherwise calculate Anime stats.
                    let subtitle = null;
                    
                    if (item.customSubtitle === "HIDE") {
                        subtitle = null;
                    } else if (item.customSubtitle) {
                        subtitle = item.customSubtitle;
                    } else {
                        // Fallback for Anime objects
                        subtitle = item.score 
                            ? `Score: ${item.score}` 
                            : `${Math.round(item.minutes / 60)} hrs`;
                    }

                    return (
                        <motion.div 
                            className="ranking-item" 
                            key={index}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ 
                                delay: index * 0.2,
                                duration: 0.5, 
                                ease: "easeOut" 
                            }} 
                        >
                            {/* 1. Rank Number */}
                            <span className="rank-num">{index + 1}</span>
                            
                            {/* 2. Image (Standard Rectangular/Square Poster) */}
                            {/* Removed borderRadius: '50%' */}
                            <img 
                                src={item.image || 'https://cdn.myanimelist.net/images/questionmark_23.gif'} 
                                alt={item.title} 
                                className="rank-img" 
                            />
                            
                            {/* 3. Text */}
                            <div className="rank-text-col">
                                <span className="rank-title">{item.title}</span>
                                {/* Only render subtitle span if content exists */}
                                {subtitle && <span className="rank-subtitle">{subtitle}</span>}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ListSlide;