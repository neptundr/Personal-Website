'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
    RANGES,
    getServerSettings,
    getSettings,
    resetSettings,
    subscribeSettings,
    updateSettings,
    type StageSettings,
} from './settings';
// @ts-ignore
import './dev.css';

// Slide-in palette for tuning the stage live. Shown in `next dev`, or on any
// build with ?dev in the URL. Toggle with the tab or the \ key.

const TOGGLE_KEY = '\\';

type ColorField = { readonly key: 'colorOuter' | 'colorInner' | 'bg'; readonly label: string };
type SliderField = { readonly key: keyof typeof RANGES; readonly label: string; readonly unit?: string };

const COLORS: readonly ColorField[] = [
    { key: 'colorOuter', label: 'Ribbon A' },
    { key: 'colorInner', label: 'Ribbon B' },
    { key: 'bg', label: 'Background' },
];

const SECTIONS: ReadonlyArray<{ readonly title: string; readonly fields: readonly SliderField[] }> = [
    {
        title: 'Text',
        fields: [
            { key: 'textSpeed', label: 'Speed' },
            { key: 'textScale', label: 'Size' },
        ],
    },
    {
        title: 'Ring position',
        fields: [
            { key: 'posX', label: 'X' },
            { key: 'posY', label: 'Y' },
        ],
    },
    {
        title: 'Ring rotation',
        fields: [
            { key: 'tilt', label: 'Tilt', unit: '°' },
            { key: 'turn', label: 'Turn', unit: '°' },
            { key: 'roll', label: 'Roll', unit: '°' },
        ],
    },
];

function Slider({ field, settings }: { field: SliderField; settings: StageSettings }) {
    const range = RANGES[field.key];
    const value = settings[field.key];
    const digits = range.step < 1 ? 2 : 0;
    return (
        <label className="v2-dev__row v2-dev__row--stack">
            <span>
                {field.label}{' '}
                <output>
                    {value.toFixed(digits)}
                    {field.unit ?? ''}
                </output>
            </span>
            <input
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={value}
                onChange={(e) => updateSettings({ [field.key]: Number(e.target.value) })}
            />
        </label>
    );
}

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
                {SECTIONS.map((section) => (
                    <div key={section.title} className="v2-dev__group">
                        <p className="v2-dev__title">{section.title}</p>
                        {section.fields.map((field) => (
                            <Slider key={field.key} field={field} settings={settings} />
                        ))}
                    </div>
                ))}
                <button type="button" className="v2-dev__reset" onClick={resetSettings}>
                    Reset
                </button>
                <p className="v2-dev__hint">\ toggles · saved in this browser</p>
            </div>
        </aside>
    );
}
