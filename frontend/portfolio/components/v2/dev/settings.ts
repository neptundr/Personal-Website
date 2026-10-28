// Live-tweakable stage colours, edited from the dev panel and remembered in
// this browser only. The ring's pose and text speed are fixed in
// mobius-scene.ts. A tiny external store: read with getSettings(), listen with
// subscribeSettings() (works with React's useSyncExternalStore).

export interface StageSettings {
    /** Ribbon's first face colour (reference: orange). */
    readonly colorOuter: string;
    /** Ribbon's second face colour (reference: yellow). */
    readonly colorInner: string;
    /** Page background. */
    readonly bg: string;
}

export const DEFAULT_SETTINGS: StageSettings = {
    colorOuter: '#ff7700',
    colorInner: '#ffc201',
    bg: '#000000',
};

/** Bump when defaults change so older saved tweaks don't mask them. */
const STORAGE_KEY = 'v2-stage-settings-2';
const HEX = /^#[0-9a-f]{6}$/i;
const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof StageSettings)[];

let state: StageSettings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function sanitize(raw: unknown): StageSettings {
    if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
    const r = raw as Record<string, unknown>;
    return Object.fromEntries(
        KEYS.map((key) => {
            const v = r[key];
            return [key, typeof v === 'string' && HEX.test(v) ? v : DEFAULT_SETTINGS[key]];
        }),
    ) as unknown as StageSettings;
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
