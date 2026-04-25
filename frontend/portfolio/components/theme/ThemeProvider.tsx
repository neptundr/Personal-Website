'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {AnimatePresence, motion} from 'framer-motion';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
    theme: Theme;
    toggle: () => void;
    isTransitioning: boolean;
}

const STORAGE_KEY = 'theme';
const FADE_MS = 240;

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
    if (typeof document === 'undefined') return 'dark';
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
    } catch {
        /* noop */
    }
    return 'dark';
}

export default function ThemeProvider({children}: {children: React.ReactNode}) {
    const [theme, setTheme] = useState<Theme>('dark');
    const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);
    const lockRef = useRef(false);

    useEffect(() => {
        const initial = readInitialTheme();
        setTheme(initial);
        document.documentElement.setAttribute('data-theme', initial);
    }, []);

    const applyTheme = useCallback((next: Theme) => {
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            /* noop */
        }
        window.dispatchEvent(
            new CustomEvent<Theme>('themechange', {detail: next})
        );
        setTheme(next);
    }, []);

    const toggle = useCallback(() => {
        if (lockRef.current) return;
        lockRef.current = true;

        const reduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const next: Theme = theme === 'dark' ? 'light' : 'dark';

        if (reduced) {
            applyTheme(next);
            lockRef.current = false;
            return;
        }

        setPendingTheme(next);

        window.setTimeout(() => {
            applyTheme(next);
        }, FADE_MS);

        window.setTimeout(() => {
            setPendingTheme(null);
            lockRef.current = false;
        }, FADE_MS * 2);
    }, [applyTheme, theme]);

    const fadeColor = pendingTheme === 'light' ? '#faf9f6' : '#0a0a0a';

    return (
        <ThemeContext.Provider
            value={{theme, toggle, isTransitioning: pendingTheme !== null}}
        >
            {children}
            <AnimatePresence>
                {pendingTheme && (
                    <motion.div
                        key="theme-fade"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: FADE_MS / 1000, ease: 'easeInOut'}}
                        className="fixed inset-0 pointer-events-none"
                        style={{backgroundColor: fadeColor, zIndex: 100}}
                    />
                )}
            </AnimatePresence>
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        return {theme: 'dark', toggle: () => {}, isTransitioning: false};
    }
    return ctx;
}
