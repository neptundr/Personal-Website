'use client';
import React, { useState, useEffect, useRef } from 'react';

interface HeroOverlayProps {
    centerWord: string;
}

/**
 * Text overlay positioned above the liquid canvas.
 *
 * Layout:
 *   Left  — "Denis Kaizer"        vertical, reads bottom-to-top
 *   Right — "Developer Portfolio" vertical, reads top-to-bottom
 *   Center — admin-editable word, Bebas Neue font, heavy condensed
 *
 * Vignette lives in its own fixed div — never participates in the shake transform.
 * Text wrapper smoothly eases to stroke direction on `ambientStroke` event, then
 * slowly returns to rest. Both directions use CSS transitions (no instant snap).
 */
export default function HeroOverlay({ centerWord }: HeroOverlayProps) {
    const [shake, setShake] = useState({ x: 0, y: 0 });
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function onStroke(e: Event) {
            const { dx, dy } = (e as CustomEvent<{ dx: number; dy: number }>).detail;
            if (timerRef.current) clearTimeout(timerRef.current);
            setShake({ x: dx * 14, y: dy * 14 });
            timerRef.current = setTimeout(() => setShake({ x: 0, y: 0 }), 120);
        }
        window.addEventListener('ambientStroke', onStroke);
        return () => {
            window.removeEventListener('ambientStroke', onStroke);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const isResting = shake.x === 0 && shake.y === 0;

    return (
        <>
            {/* Vignette — fixed, never shakes */}
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 20,
                    pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at center, transparent 50%, #1D0118 100%)',
                }}
            />

            {/* Text wrapper — shakes on ambient stroke */}
            <div
                className="fixed inset-0 w-full h-full"
                style={{
                    zIndex: 21,
                    pointerEvents: 'none',
                    transform: `translate(${shake.x}px, ${shake.y}px)`,
                    transition: isResting
                        ? 'transform 550ms cubic-bezier(0.15, 0, 0.2, 1)'
                        : 'transform 80ms ease-out',
                }}
            >
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
                        fontSize: 'clamp(0.58rem, 1.0vw, 0.85rem)',
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
                        fontSize: 'clamp(0.58rem, 1.0vw, 0.85rem)',
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
        </>
    );
}
