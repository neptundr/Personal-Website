import React from 'react';

interface HeroOverlayProps {
    centerWord: string;
}

/**
 * Text overlay positioned above the liquid canvas.
 *
 * Layout:
 *   Left  — "Denis Kaizer"        vertical, reads bottom-to-top
 *   Right — "Developer Portfolio" vertical, reads top-to-bottom
 *   Center — admin-editable word, Anton font, heavy condensed
 *
 * Vignette applied here via CSS radial-gradient (free, no JS).
 */
export default function HeroOverlay({ centerWord }: HeroOverlayProps) {
    return (
        <div
            className="fixed inset-0 w-full h-full"
            style={{ zIndex: 20, pointerEvents: 'none' }}
        >
            {/* Vignette */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(ellipse at center, transparent 50%, #1D0118 100%)',
                }}
            />

            {/* Left side text — "Denis Kaizer" reads bottom-to-top */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    left: '1.5rem',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(180deg)',
                    writingMode: 'vertical-rl',
                    fontFamily: 'var(--font-codecBold)',
                    fontSize: 'clamp(0.6rem, 0.9vw, 0.75rem)',
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    color: '#F9F9F9',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                }}
            >
                Denis Kaizer
            </div>

            {/* Right side text — "Developer Portfolio" reads top-to-bottom */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    right: '1.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    writingMode: 'vertical-rl',
                    fontFamily: 'var(--font-codecBold)',
                    fontSize: 'clamp(0.6rem, 0.9vw, 0.75rem)',
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    color: '#F9F9F9',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                }}
            >
                Developer Portfolio
            </div>

            {/* Center word */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <h1
                    style={{
                        fontFamily: 'var(--font-bebas)',
                        fontSize: 'clamp(6rem, 18vw, 16rem)',
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                        textTransform: 'uppercase',
                        color: '#F9F9F9',
                        margin: 0,
                        userSelect: 'none',
                    }}
                >
                    {centerWord}
                </h1>
            </div>
        </div>
    );
}
