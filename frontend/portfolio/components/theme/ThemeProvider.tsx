'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
    theme: Theme;
    toggle: () => void;
}

const STORAGE_KEY = 'theme';

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
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        window.setTimeout(() => { lockRef.current = false; }, 80);
    }, [applyTheme, theme]);

    return (
        <ThemeContext.Provider value={{theme, toggle}}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        return {theme: 'dark', toggle: () => {}};
    }
    return ctx;
}
