import { motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

const AnimatedGradientBackground = ({
  // Updated defaults for a better linear look (Blue bottom fading to black top)
  startingGap = 0, 
  Breathing = true,
  gradientColors = [
    "#2979FF", // Blue (at bottom)
    "#0A0A0A", // Black (at top)
  ],
  gradientStops = [0, 80], // Blue starts at 0%, transitions to black at 80%
  animationSpeed = 0.05,
  breathingRange = 15, // How much the gradient shifts up and down
  containerStyle = {},
  topOffset = 0, // Unused in linear mode but kept for prop compatibility
}) => {
  // Validation
  if (gradientColors.length !== gradientStops.length) {
    console.error("GradientColors and GradientStops must have the same length.");
    return null;
  }

  const containerRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    // 'offset' replaces 'width'. It oscillates to create the movement.
    let offset = startingGap;
    let direction = 1;

    const animateGradient = () => {
      // Breathing logic: oscillates the offset value
      if (offset >= startingGap + breathingRange) direction = -1;
      if (offset <= startingGap - breathingRange) direction = 1;

      if (!Breathing) direction = 0;
      offset += direction * animationSpeed;

      const gradientStopsString = gradientStops
        .map((stop, index) => {
            // We add the oscillating offset to the stops to make them move.
            // We don't move the first stop (0%) to keep the very bottom anchored.
            const currentStop = index === 0 ? stop : stop + offset;
            return `${gradientColors[index]} ${currentStop}%`
        })
        .join(", ");

      // --- CHANGE HERE: radial-gradient became linear-gradient(to top, ...) ---
      const gradient = `linear-gradient(to top, ${gradientStopsString})`;

      if (containerRef.current) {
        containerRef.current.style.background = gradient;
      }

      animationFrame = requestAnimationFrame(animateGradient);
    };

    animationFrame = requestAnimationFrame(animateGradient);

    return () => cancelAnimationFrame(animationFrame);
  }, [startingGap, Breathing, gradientColors, gradientStops, animationSpeed, breathingRange]);

  return (
    <motion.div
      key="animated-gradient-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 2 } }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0, 
        ...containerStyle
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