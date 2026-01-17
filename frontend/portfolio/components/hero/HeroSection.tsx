import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import RotatingText from './RotatingText';

const HeroSection = ({ name = "Denis", subtitle, availableForHire, videoUrl, loveItems = [] }) => {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePos({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate prism distortion
  const prismOffsetX = (mousePos.x - 0.5) * 60;
  const prismOffsetY = (mousePos.y - 0.5) * 60;

  return (
    <section ref={containerRef} className="relative min-h-screen bg-black overflow-hidden">
      {/* Video background */}
      {videoUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute min-w-full min-h-full object-cover"
            style={{
              transform: `translate(${prismOffsetX}px, ${prismOffsetY}px) scale(1.1)`,
              transition: 'transform 0.3s ease-out',
              filter: 'brightness(0.4) contrast(1.1)',
            }}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>

          {/* Prism overlay effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, 
                rgba(220, 38, 38, 0.15) 0%, 
                rgba(220, 38, 38, 0.05) 30%, 
                transparent 60%)`,
              mixBlendMode: 'screen',
            }}
          />

          {/* Chromatic aberration effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              transform: `translate(${prismOffsetX * 0.02}px, ${prismOffsetY * 0.02}px)`,
              background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, 
                rgba(255, 0, 0, 0.1) 0%, 
                transparent 40%)`,
              mixBlendMode: 'color-dodge',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              transform: `translate(${-prismOffsetX * 0.02}px, ${-prismOffsetY * 0.02}px)`,
              background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, 
                rgba(0, 100, 255, 0.1) 0%, 
                transparent 40%)`,
              mixBlendMode: 'color-dodge',
            }}
          />

          {/* Light refraction line */}
          <div
            className="absolute w-1 h-full opacity-20 pointer-events-none"
            style={{
              left: `${mousePos.x * 100}%`,
              top: 0,
              background: 'linear-gradient(to bottom, transparent, rgba(220, 38, 38, 0.5), transparent)',
              boxShadow: `0 0 20px rgba(220, 38, 38, 0.5)`,
              transform: `skewX(${(mousePos.x - 0.5) * 20}deg)`,
              transition: 'all 0.3s ease-out',
            }}
          />
        </div>
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24">
        <div className="max-w-4xl">
          {/* Available badge */}
          {availableForHire && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs text-red-400 font-medium tracking-[0.2em] uppercase">Available for Hire</span>
              </span>
            </motion.div>
          )}

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl leading-tight"
          >
            <motion.span
              className="block text-gray-400 text-3xl md:text-4xl lg:text-5xl mb-2 font-light italic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Hi!
            </motion.span>
            <motion.span
              className="block text-white font-extralight tracking-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              I'm{' '}
              <span className="relative inline-block text-white font-light">
                {name}
                <motion.span
                  className="absolute -bottom-2 left-0 h-[1px] bg-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 1.2 }}
                />
              </span>
            </motion.span>
          </motion.h1>

          {/* I love X */}
          {loveItems && loveItems.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-8 text-xl md:text-2xl text-gray-300 font-light tracking-wide"
            >
              I love{' '}
              <RotatingText items={loveItems} />
            </motion.p>
          )}

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mt-4 text-lg md:text-xl text-gray-400 font-light tracking-wide max-w-xl"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="absolute bottom-12 left-6 md:left-12 lg:left-24"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs text-gray-500 tracking-[0.3em] uppercase font-light">Scroll</span>
              <div className="w-[1px] h-16 bg-gradient-to-b from-gray-500 to-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;