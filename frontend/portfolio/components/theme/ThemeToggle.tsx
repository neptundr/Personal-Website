'use client';

import React from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Moon, Sun} from 'lucide-react';
import {useTheme} from './ThemeProvider';

interface ThemeToggleProps {
    delay?: number;
}

export default function ThemeToggle({delay = 0.75}: ThemeToggleProps) {
    const {theme, toggle} = useTheme();
    const isDark = theme === 'dark';

    return (
        <motion.button
            type="button"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={!isDark}
            initial={{opacity: 0, y: -15}}
            animate={{opacity: 1, y: 0}}
            transition={{delay, duration: 0.6}}
            whileTap={{scale: 0.94}}
            className="group relative inline-flex h-[26px] w-[26px] items-center justify-center
                       rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-md
                       cursor-pointer transition-colors duration-450
                       hover:border-red-500 hover:bg-red-500/55"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={isDark ? 'moon' : 'sun'}
                    initial={{opacity: 0, rotate: -60, scale: 0.6}}
                    animate={{opacity: 1, rotate: 0, scale: 1}}
                    exit={{opacity: 0, rotate: 60, scale: 0.6}}
                    transition={{duration: 0.25, ease: 'easeOut'}}
                    className="flex items-center justify-center text-red-400
                               transition-colors duration-300 group-hover:text-white"
                >
                    {isDark ? (
                        <Sun className="h-3 w-3" strokeWidth={2.25} />
                    ) : (
                        <Moon className="h-3 w-3" strokeWidth={2.25} />
                    )}
                </motion.span>
            </AnimatePresence>
        </motion.button>
    );
}
