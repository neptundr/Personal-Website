// Live-tweakable stage settings, edited from the dev panel and remembered in
// this browser only. A tiny external store: read with getSettings(), listen
// with subscribeSettings() (works with React's useSyncExternalStore).

export interface StageSettings {
    /** Ribbon's first face colour (reference: orange). */
    readonly colorOuter: string;
    /** Ribbon's second face colour (reference: yellow). */
    readonly colorInner: string;
    /** Page background. */
    readonly bg: string;
    /** How fast "WELCOME!" rolls along the ribbon, in text tiles per second. */
    readonly textSpeed: number;
    /** "WELCOME!" height as a share of the bar's face. */
    readonly textScale: number;
    /** Ring offset, in ring units (the ring's radius is 3). */
    readonly posX: number;
    readonly posY: number;
    /** Ring rotation in degrees: tilt towards the viewer, turn around its axis, roll sideways. */
    readonly tilt: number;
    readonly turn: number;
    readonly roll: number;
}

type NumberKey = { [K in keyof StageSettings]: StageSettings[K] extends number ? K : never }[keyof StageSettings];
type ColorKey = Exclude<keyof StageSettings, NumberKey>;

export interface Range {
    readonly min: number;
    readonly max: number;
    readonly step: number;
}

/** Allowed range of every numeric setting (also drives the panel's sliders). */
export const RANGES: Record<NumberKey, Range> = {
    textSpeed: { min: 0, max: 1.5, step: 0.01 },
    textScale: { min: 0.4, max: 1.3, step: 0.01 },
    posX: { min: -3, max: 3, step: 0.05 },
    posY: { min: -2, max: 2, step: 0.05 },
    tilt: { min: -45, max: 45, step: 1 },
    turn: { min: -180, max: 180, step: 1 },
    roll: { min: -45, max: 45, step: 1 },
};

export const DEFAULT_SETTINGS: StageSettings = {
    colorOuter: '#ff7700',
    colorInner: '#ffc201',
    bg: '#000000',
    textSpeed: 0.35,
    textScale: 1,
    posX: 0,
    posY: 0,
    tilt: 0,
    turn: 0,
    roll: 0,
};

/** Bump when defaults change so older saved tweaks don't mask them. */
const STORAGE_KEY = 'v2-stage-settings-2';
const HEX = /^#[0-9a-f]{6}$/i;
const COLOR_KEYS: readonly ColorKey[] = ['colorOuter', 'colorInner', 'bg'];

let state: StageSettings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function sanitize(raw: unknown): StageSettings {
    if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
    const r = raw as Record<string, unknown>;
    const colors = Object.fromEntries(
        COLOR_KEYS.map((key) => {
            const v = r[key];
            return [key, typeof v === 'string' && HEX.test(v) ? v : DEFAULT_SETTINGS[key]];
        }),
    ) as Pick<StageSettings, ColorKey>;
    const numbers = Object.fromEntries(
        (Object.keys(RANGES) as NumberKey[]).map((key) => {
            const v = r[key];
            const { min, max } = RANGES[key];
            const n = typeof v === 'number' && Number.isFinite(v) ? v : DEFAULT_SETTINGS[key];
            return [key, Math.min(max, Math.max(min, n))];
        }),
    ) as Pick<StageSettings, NumberKey>;
    return { ...colors, ...numbers };
}

function hydrate(): void {
    if (hydrated || typeof window === 'undefined') return;
    hydrated = true;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) state = sanitize(JSON.parse(raw));
    } catch {
        // Storage blocked or corrupt: keep defaults.
    }
}

export function getSettings(): StageSettings {
    hydrate();
    return state;
}

export function getServerSettings(): StageSettings {
    return DEFAULT_SETTINGS;
}

export function updateSettings(patch: Partial<StageSettings>): void {
    state = sanitize({ ...getSettings(), ...patch });
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Not persisted; still applied for this session.
    }
    listeners.forEach((listener) => listener());
}

export function resetSettings(): void {
    updateSettings(DEFAULT_SETTINGS);
}

export function subscribeSettings(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
