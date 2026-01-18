import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import RotatingText from './RotatingText';

interface HeroSectionProps {
  name?: string;
  subtitle?: string | undefined;
  availableForHire?: boolean | undefined;
  videoUrl?: string | undefined;
  loveItems?: string[];
}

const HeroSection: React.FC<HeroSectionProps> = ({
  name = "Denis",
  subtitle,
  availableForHire = false,
  videoUrl,
  loveItems = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
          {/* Add prism and chromatic overlays here */}
        </div>
      )}

      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24">
        <div className="max-w-4xl">
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

          {loveItems.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-8 text-xl md:text-2xl text-gray-300 font-light tracking-wide"
            >
              I love <RotatingText items={loveItems} />
            </motion.p>
          )}

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
        </div>
      </div>
    </section>
  );
};

export default HeroSection;