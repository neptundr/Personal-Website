// Live-tweakable stage settings, edited from the dev panel and remembered in
// this browser only. A tiny external store: read with getSettings(), listen
// with subscribeSettings() (works with React's useSyncExternalStore).

export interface StageSettings {
    /** Ribbon's first face (reference: orange). */
    readonly colorOuter: string;
    /** Ribbon's second face (reference: yellow). */
    readonly colorInner: string;
    /** How fast "WELCOME!" rolls along the ribbon, in text tiles per second. */
    readonly textSpeed: number;
}

export const DEFAULT_SETTINGS: StageSettings = {
    colorOuter: '#ff7700',
    colorInner: '#ffc201',
    textSpeed: 0.35,
};

export const TEXT_SPEED_MAX = 1.5;

/** Bump when defaults change so older saved tweaks don't mask them. */
const STORAGE_KEY = 'v2-stage-settings-2';
const HEX = /^#[0-9a-f]{6}$/i;

let state: StageSettings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function sanitize(raw: unknown): StageSettings {
    if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
    const r = raw as Record<string, unknown>;
    const color = (v: unknown, fallback: string) => (typeof v === 'string' && HEX.test(v) ? v : fallback);
    const speed = typeof r.textSpeed === 'number' && Number.isFinite(r.textSpeed) ? r.textSpeed : DEFAULT_SETTINGS.textSpeed;
    return {
        colorOuter: color(r.colorOuter, DEFAULT_SETTINGS.colorOuter),
        colorInner: color(r.colorInner, DEFAULT_SETTINGS.colorInner),
        textSpeed: Math.min(TEXT_SPEED_MAX, Math.max(0, speed)),
    };
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
