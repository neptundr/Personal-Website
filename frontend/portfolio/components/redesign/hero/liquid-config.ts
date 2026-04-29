// Fluid simulation configuration — edit these to tune the visual.

export type PaletteColor = { r: number; g: number; b: number };

export const BACKGROUND_COLOR = '#1D0118';

export interface SimConfig {
    simRes: number;
    dyeRes: number;
    densityDissipation: number;
    velocityDissipation: number;
    pressureIterations: number;
    splatRadius: number;
    splatForce: number;
    curl: number;
}

/** Normal devices */
export const SIM: SimConfig = {
    simRes: 96,
    dyeRes: 512,
    densityDissipation: 0.993,
    velocityDissipation: 0.990,
    pressureIterations: 15,
    splatRadius: 0.38,
    splatForce: 3800,
    curl: 22,
};

/** Low-memory / low-power devices (deviceMemory < 4 GB) */
export const LOW_POWER_SIM: SimConfig = {
    simRes: 64,
    dyeRes: 256,
    densityDissipation: 0.990,
    velocityDissipation: 0.985,
    pressureIterations: 10,
    splatRadius: 0.44,
    splatForce: 2800,
    curl: 16,
};

/** Milliseconds between ambient strokes when mouse is idle */
export const AMBIENT_SPLAT_INTERVAL = 700;
/** Curved strokes injected on mount */
export const INITIAL_SPLAT_COUNT = 5;
/** Max device pixel ratio applied to canvas */
export const MAX_DPR = 1.5;

// ─── Color mapping ────────────────────────────────────────────────────────────

/**
 * 4-color luminance map applied in the display shader.
 * colors[0] = darkest (background), colors[3] = lightest.
 * thresholds[0..2] are luminance cut-offs (0–1) in ascending order.
 */
export interface ColorConfig {
    colors: [string, string, string, string];
    thresholds: [number, number, number];
}

export const DEFAULT_COLOR_CONFIG: ColorConfig = {
    colors: ['#1D0118', '#D60064', '#B5FCCC', '#F9F9F9'],
    thresholds: [0.07, 0.26, 0.56],
};
