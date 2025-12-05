import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AnimatedGradientBackground = ({
  startingGap = 0,
  Breathing = true,
  gradientColors = [
    '#2979FF', // Blue (at bottom)
    '#0A0A0A', // Black (at top)
  ],
  gradientStops = [0, 80],
  animationSpeed = 0.05,
  breathingRange = 15,
  containerStyle = {},
}) => {
  // Guard: colors and stops must match
  if (gradientColors.length !== gradientStops.length) {
    console.error(
      'GradientColors and GradientStops must have the same length.'
    );
    return null;
  }

  const containerRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    let offset = startingGap;
    let direction = 1;

    const animateGradient = () => {
      // Breathing logic
      if (offset >= startingGap + breathingRange) direction = -1;
      if (offset <= startingGap - breathingRange) direction = 1;

      if (!Breathing) direction = 0;
      offset += direction * animationSpeed;

      const gradientStopsString = gradientStops
        .map((stop, index) => {
          // Oscillate the stops
          const currentStop = index === 0 ? stop : stop + offset;
          return `${gradientColors[index]} ${currentStop}%`;
        })
        .join(', ');

      const gradient = `linear-gradient(to top, ${gradientStopsString})`;

      if (containerRef.current) {
        containerRef.current.style.background = gradient;
      }

      animationFrame = requestAnimationFrame(animateGradient);
    };

    animationFrame = requestAnimationFrame(animateGradient);

    return () => cancelAnimationFrame(animationFrame);
  }, [
    startingGap,
    Breathing,
    gradientColors,
    gradientStops,
    animationSpeed,
    breathingRange,
  ]);

  return (
    <motion.div
      key="animated-gradient-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 2 } }}
      style={{
        position: 'fixed', // Locks to viewport
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 0, // Behind app content
        pointerEvents: 'none',
        overflow: 'hidden',
        ...containerStyle,
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </motion.div>
  );
};

export default AnimatedGradientBackground;
