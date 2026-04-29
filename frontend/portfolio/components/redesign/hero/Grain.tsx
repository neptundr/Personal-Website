import React from 'react';

/**
 * Fixed full-bleed film grain overlay.
 * SVG feTurbulence — no runtime cost beyond initial paint.
 * mix-blend-mode: overlay at low opacity adds tactile texture.
 */
export default function Grain() {
    return (
        <div
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
                mixBlendMode: 'overlay',
                opacity: 0.12,
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
            >
                <filter id="grain-filter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.9"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect
                    width="100%"
                    height="100%"
                    filter="url(#grain-filter)"
                />
            </svg>
        </div>
    );
}
