'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
    TEXT_SPEED_MAX,
    getServerSettings,
    getSettings,
    resetSettings,
    subscribeSettings,
    updateSettings,
} from './settings';
// @ts-ignore
import './dev.css';

// Slide-in palette for tuning the stage live. Shown in `next dev`, or on any
// build with ?dev in the URL. Toggle with the tab or the \ key.

const TOGGLE_KEY = '\\';

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
                <p className="v2-dev__title">Stage</p>
                <label className="v2-dev__row">
                    <span>Ribbon A</span>
                    <input
                        type="color"
                        value={settings.colorOuter}
                        onChange={(e) => updateSettings({ colorOuter: e.target.value })}
                    />
                    <code>{settings.colorOuter}</code>
                </label>
                <label className="v2-dev__row">
                    <span>Ribbon B</span>
                    <input
                        type="color"
                        value={settings.colorInner}
                        onChange={(e) => updateSettings({ colorInner: e.target.value })}
                    />
                    <code>{settings.colorInner}</code>
                </label>
                <label className="v2-dev__row v2-dev__row--stack">
                    <span>
                        Text speed <output>{settings.textSpeed.toFixed(2)}</output>
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={TEXT_SPEED_MAX}
                        step={0.01}
                        value={settings.textSpeed}
                        onChange={(e) => updateSettings({ textSpeed: Number(e.target.value) })}
                    />
                </label>
                <button type="button" className="v2-dev__reset" onClick={resetSettings}>
                    Reset
                </button>
                <p className="v2-dev__hint">\ toggles · saved in this browser</p>
            </div>
        </aside>
    );
}
