'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
    getServerSettings,
    getSettings,
    resetSettings,
    subscribeSettings,
    updateSettings,
    type StageSettings,
} from './settings';
// @ts-ignore
import './dev.css';

// Slide-in palette for tuning the stage colours live. Shown in `next dev`, or
// on any build with ?dev in the URL. Toggle with the tab or the \ key.

const TOGGLE_KEY = '\\';

const COLORS: ReadonlyArray<{ readonly key: keyof StageSettings; readonly label: string }> = [
    { key: 'colorOuter', label: 'Ribbon A' },
    { key: 'colorInner', label: 'Ribbon B' },
    { key: 'bg', label: 'Background' },
];

export default function DevPanel() {
    const [enabled, setEnabled] = useState(false);
    const [open, setOpen] = useState(false);
    const settings = useSyncExternalStore(subscribeSettings, getSettings, getServerSettings);

    useEffect(() => {
        const allowed = process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).has('dev');
        setEnabled(allowed);
        if (!allowed) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== TOGGLE_KEY || e.target instanceof HTMLInputElement) return;
            setOpen((was) => !was);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    if (!enabled) return null;

    return (
        <aside className="v2-dev" data-open={open} aria-label="Developer palette">
            <button type="button" className="v2-dev__tab" aria-expanded={open} onClick={() => setOpen((was) => !was)}>
                palette
            </button>
            <div className="v2-dev__panel">
                <p className="v2-dev__title">Colours</p>
                {COLORS.map((field) => (
                    <label key={field.key} className="v2-dev__row">
                        <span>{field.label}</span>
                        <input
                            type="color"
                            value={settings[field.key]}
                            onChange={(e) => updateSettings({ [field.key]: e.target.value })}
                        />
                        <code>{settings[field.key]}</code>
                    </label>
                ))}
                <button type="button" className="v2-dev__reset" onClick={resetSettings}>
                    Reset
                </button>
                <p className="v2-dev__hint">\ toggles · saved in this browser</p>
            </div>
        </aside>
    );
}
