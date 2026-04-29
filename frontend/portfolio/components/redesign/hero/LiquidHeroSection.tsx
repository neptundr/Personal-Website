'use client';
import React, { useState } from 'react';
import { DEFAULT_COLOR_CONFIG, type ColorConfig } from './liquid-config';
import LiquidHeroLazy from './LiquidHeroLazy';
import ColorDrawer from './ColorDrawer';

/**
 * Client boundary that owns colour-map state and wires it to both
 * the WebGL canvas and the testing drawer panel.
 */
export default function LiquidHeroSection() {
    const [colorConfig, setColorConfig] = useState<ColorConfig>(DEFAULT_COLOR_CONFIG);

    return (
        <>
            <LiquidHeroLazy colorConfig={colorConfig} />
            <ColorDrawer config={colorConfig} onChange={setColorConfig} />
        </>
    );
}
