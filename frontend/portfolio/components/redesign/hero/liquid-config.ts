// Fluid simulation configuration — edit these to tune the visual.

export type PaletteColor = { r: number; g: number; b: number };

export const PALETTE = {
    magenta: { r: 0.913, g: 0.118, b: 0.361 }, // #E91E5C
    mint:    { r: 0.180, g: 0.898, b: 0.627 }, // #2EE5A0
    white:   { r: 0.95,  g: 0.95,  b: 0.95  },
} as const;

// Weighted list — magenta/mint appear more often than white
export const PALETTE_LIST: PaletteColor[] = [
    PALETTE.magenta,
    PALETTE.mint,
    PALETTE.magenta,
    PALETTE.mint,
    PALETTE.white,
];

export const BACKGROUND_COLOR = '#0A0A0C';

export interface SimConfig {
    simRes: number;
    dyeRes: number;
    densityDissipation: number;
    velocityDissipation: number;
    pressureIterations: number;
    splatRadius: number;
    splatForce: number;
    curl: number;
    aberration: number;
}

export const SIM: SimConfig = {
    simRes: 256,
    dyeRes: 1024,
    densityDissipation: 0.97,
    velocityDissipation: 0.985,
    pressureIterations: 20,
    splatRadius: 0.22,
    splatForce: 5500,
    curl: 28,
    // chromatic aberration in UV space (~2px on 1024-wide canvas)
    aberration: 0.0025,
};

export const LOW_POWER_SIM: SimConfig = {
    simRes: 128,
    dyeRes: 512,
    densityDissipation: 0.96,
    velocityDissipation: 0.98,
    pressureIterations: 15,
    splatRadius: 0.25,
    splatForce: 4000,
    curl: 20,
    aberration: 0.002,
};

/** Milliseconds between ambient splats when mouse is idle */
export const AMBIENT_SPLAT_INTERVAL = 1200;
/** Burst of splats injected on mount */
export const INITIAL_SPLAT_COUNT = 6;
/** Max device pixel ratio applied to canvas */
export const MAX_DPR = 1.5;
