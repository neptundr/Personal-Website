'use client';

import React, {useRef, useEffect, useCallback} from 'react';

type IntroPhase = 0 | 1;

const PARTICLE_CHARS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}<>?/|\\';

export default function FractalTunnel() {
    const FIXED_CANVAS_HEIGHT = 4500;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    // const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const timeRef = useRef(100);
    const speedRef = useRef(0.006);
    const introPhaseRef = useRef<IntroPhase>(0);
    const introTimeRef = useRef(0);
    const tunnelOscRef = useRef(0);

    // const skipClearRef = useRef(false);

    const stableViewportHeightRef = useRef<number>(0); // stable viewport height on mount
    const stableViewportWidthRef = useRef<number>(0); // stable viewport width on mount

    const lastCanvasWidthRef = useRef<number>(0);

    const numParticles = 100;
    const particleCharsRef = useRef<string[]>([]);

    // Springy hover state (disabled on coarse pointers / reduced motion).
    // Layout: [ox, oy, vx, vy] per particle.
    const offsetsRef = useRef<Float32Array>(new Float32Array(numParticles * 4));
    const mouseRef = useRef<{x: number; y: number; active: boolean}>({
        x: -9999,
        y: -9999,
        active: false,
    });
    const isFinePointerRef = useRef(false);
    const reducedMotionRef = useRef(false);

    // Cached theme-derived color triplets (space-separated "r g b").
    const colorsRef = useRef({
        tunnelPrimary: '200 20 25',
        tunnelSecondary: '120 10 15',
        particle: '200 20 25',
        alphaBoost: 0,
    });

    if (particleCharsRef.current.length === 0) {
        for (let i = 0; i < numParticles; i++) {
            particleCharsRef.current.push(
                // @ts-ignore
                PARTICLE_CHARS[Math.floor(Math.random() * PARTICLE_CHARS.length)]
            );
        }
    }

    const draw = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            width: number,
            height: number,
            time: number,
            introPhase: IntroPhase,
            introTime: number
        ) => {
            const viewportWidth = stableViewportWidthRef.current || window.innerWidth;
            const viewportHeight = stableViewportHeightRef.current || window.innerHeight;

            // center of the tunnel = middle of the viewport, not canvas
            const cx = viewportWidth * (2 / 3);
            const cy = viewportHeight * 0.5;
            // use viewport diagonal for radius, not full page
            const viewportRadius = Math.hypot(viewportWidth, viewportHeight);

            const maxRadius = Math.hypot(viewportWidth, viewportHeight);
            const radiusScale = 1;

            // if (!skipClearRef.current) {
            ctx.clearRect(0, 0, width, height);
            // }

            const numLayers = 90;

            tunnelOscRef.current += 0.016;
            const tunnelOsc = 0.75 + 0.4 * Math.sin(tunnelOscRef.current * 0.8);

            let fadeIn = 1;
            if (introPhase === 0) fadeIn = Math.min(introTime / 1.5, 1);

            for (let layer = 0; layer < numLayers; layer++) {
                const offset = (layer / numLayers + time * speedRef.current) % 1;
                const scale = Math.pow(offset, 4);
                const radius = scale * maxRadius * 0.7;
                const opacity = Math.sin(offset * Math.PI) * fadeIn * tunnelOsc;

                if (opacity < 0.01 || radius < 5) continue;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(time * 0.03 + layer * 0.05);

                const innerR = radius * 0.4;
                const isSmallScreen = stableViewportWidthRef.current <= 768;
                const thickness = (-0.045 + scale * 35) / radiusScale * (isSmallScreen ? 0.7 : 1);
                const curves = 12;

                for (let i = 1; i < curves; i++) {
                    const a0 = ((i - 1) / curves) * Math.PI * 2;
                    const a1 = (i / curves) * Math.PI * 2;

                    const wave = 0.15 * Math.sin(layer * 0.5 + time * 0.2);

                    const r0 =
                        innerR +
                        (radius - innerR) *
                        (0.5 +
                            0.3 * Math.cos(5 * a0 + time * 0.4) +
                            0.2 * Math.cos(3 * a0 - time * 0.3) +
                            wave);

                    const r1 =
                        innerR +
                        (radius - innerR) *
                        (0.5 +
                            0.3 * Math.cos(5 * a1 + time * 0.4) +
                            0.2 * Math.cos(3 * a1 - time * 0.3) +
                            wave);

                    const sa0 = a0 + Math.sqrt(scale) * Math.PI * 2;
                    const sa1 = a1 + Math.sqrt(scale) * Math.PI * 2;

                    ctx.beginPath();
                    ctx.moveTo(Math.cos(sa0) * r0, Math.sin(sa0) * r0);
                    ctx.lineTo(Math.cos(sa1) * r1, Math.sin(sa1) * r1);

                    const primary = colorsRef.current.tunnelPrimary;
                    const secondary = colorsRef.current.tunnelSecondary;
                    ctx.strokeStyle =
                        (layer + i) % 3 < 2
                            ? `rgba(${primary.replace(/ /g, ',')},${opacity})`
                            : `rgba(${secondary.replace(/ /g, ',')},${opacity})`;

                    ctx.lineWidth = thickness;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                }

                ctx.restore();
            }

            if (introPhase !== 1) return;

            const ageGrowth = 1 + Math.min(time * 0.02, 0.6);

            const springEnabled =
                isFinePointerRef.current && !reducedMotionRef.current;
            const offsets = offsetsRef.current;
            const mouse = mouseRef.current;
            const k = 90;    // spring stiffness
            const c = 14;    // damping
            const repelRadius = 170;
            const repelStrength = 22000;
            const particleRgb = colorsRef.current.particle;

            for (let p = 0; p < numParticles; p++) {
                const t =
                    (1 + time * 0.3 + p * 0.2 + Math.sin(p * 7.89) * 0.8) % 4;

                const a =
                    (p / numParticles) * Math.PI * 2 +
                    time * 0.08 +
                    Math.cos(p * 3.14) * 1.2;

                const r = t * viewportRadius * 0.55;

                const baseX = cx + Math.cos(a) * r;
                const baseY = cy + Math.sin(a) * r;

                const i = p * 4;
                let ox = offsets[i]!;
                let oy = offsets[i + 1]!;
                let vx = offsets[i + 2]!;
                let vy = offsets[i + 3]!;

                if (springEnabled) {
                    const dt = 0.016;
                    // Repulsion from mouse pointer (at the particle's current drawn position).
                    let fx = 0;
                    let fy = 0;
                    if (mouse.active) {
                        const drawnX = baseX + ox;
                        const drawnY = baseY + oy;
                        const dx = drawnX - mouse.x;
                        const dy = drawnY - mouse.y;
                        const dist2 = dx * dx + dy * dy;
                        if (dist2 < repelRadius * repelRadius && dist2 > 1) {
                            const dist = Math.sqrt(dist2);
                            const falloff = 1 - dist / repelRadius;
                            const mag = (repelStrength * falloff * falloff) / dist2;
                            fx = (dx / dist) * mag;
                            fy = (dy / dist) * mag;
                        }
                    }
                    // Hooke's law + damping back to rest (0, 0).
                    const ax = -k * ox - c * vx + fx;
                    const ay = -k * oy - c * vy + fy;
                    vx += ax * dt;
                    vy += ay * dt;
                    ox += vx * dt;
                    oy += vy * dt;
                    // Clamp to avoid runaway displacement on tab-switch etc.
                    const maxOff = 90;
                    if (ox > maxOff) ox = maxOff;
                    else if (ox < -maxOff) ox = -maxOff;
                    if (oy > maxOff) oy = maxOff;
                    else if (oy < -maxOff) oy = -maxOff;
                    offsets[i] = ox;
                    offsets[i + 1] = oy;
                    offsets[i + 2] = vx;
                    offsets[i + 3] = vy;
                } else if (ox !== 0 || oy !== 0 || vx !== 0 || vy !== 0) {
                    // Hard reset when interaction is disabled.
                    offsets[i] = 0;
                    offsets[i + 1] = 0;
                    offsets[i + 2] = 0;
                    offsets[i + 3] = 0;
                    ox = oy = 0;
                }

                ctx.save();
                ctx.translate(baseX + ox, baseY + oy);
                ctx.scale(1, -1);
                ctx.rotate(a);

                const alpha = colorsRef.current.alphaBoost + (-0.075 + (t + 0.1) * 0.85 * (1 - t * 0.15));
                const fontSize = 14 * (1 + t * 0.4) * ageGrowth;

                ctx.fillStyle = `rgba(${particleRgb.replace(/ /g, ',')},${alpha})`;
                ctx.font = `${fontSize}px "Fira Code", monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // @ts-ignore
                ctx.fillText(particleCharsRef.current[p], 0, 0);

                ctx.restore();
            }

            // skipClearRef.current = false;
        },
        []
    );

    // initialize and update stable viewport dimensions on mount and resize
    useEffect(() => {
        stableViewportHeightRef.current = window.innerHeight;
        stableViewportWidthRef.current = window.innerWidth;
    }, []);

    // theme color sync + pointer spring listeners
    useEffect(() => {
        const readColor = (name: string, fallback: string) => {
            const v = getComputedStyle(document.documentElement)
                .getPropertyValue(name)
                .trim();
            return v || fallback;
        };

        const refreshColors = () => {
            colorsRef.current = {
                tunnelPrimary: readColor('--tunnel-primary-rgb', '200 20 25'),
                tunnelSecondary: readColor('--tunnel-secondary-rgb', '120 10 15'),
                particle: readColor('--particle-rgb', '200 20 25'),
                alphaBoost: parseFloat(readColor('--particle-alpha-boost', '0')),
            };
        };

        refreshColors();
        window.addEventListener('themechange', refreshColors);

        const fineMq = window.matchMedia('(pointer: fine)');
        const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncFine = () => {
            isFinePointerRef.current = fineMq.matches;
        };
        const syncMotion = () => {
            reducedMotionRef.current = motionMq.matches;
        };
        syncFine();
        syncMotion();
        fineMq.addEventListener?.('change', syncFine);
        motionMq.addEventListener?.('change', syncMotion);

        const onPointerMove = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
            mouseRef.current.active = true;
        };
        const onPointerLeave = () => {
            mouseRef.current.active = false;
            mouseRef.current.x = -9999;
            mouseRef.current.y = -9999;
        };
        window.addEventListener('pointermove', onPointerMove, {passive: true});
        window.addEventListener('pointerleave', onPointerLeave);
        window.addEventListener('blur', onPointerLeave);

        return () => {
            window.removeEventListener('themechange', refreshColors);
            fineMq.removeEventListener?.('change', syncFine);
            motionMq.removeEventListener?.('change', syncMotion);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerleave', onPointerLeave);
            window.removeEventListener('blur', onPointerLeave);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        // const buffer = document.createElement('canvas');
        // const bufferCtx = buffer.getContext('2d')!;
        // bufferCanvasRef.current = buffer;

        const requestResize = () => {
            const newWidth = window.innerWidth;
            if (newWidth !== lastCanvasWidthRef.current) {
                canvas.width = newWidth;
                lastCanvasWidthRef.current = newWidth;
                // skipClearRef.current = true;
            }
        };

        canvas.width = window.innerWidth;
        canvas.height = FIXED_CANVAS_HEIGHT;
        lastCanvasWidthRef.current = canvas.width;
        // skipClearRef.current = true;

        requestResize();
        window.addEventListener('resize', requestResize);

        let lastTimestamp: number | null = null;

        const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            let delta = ((timestamp - lastTimestamp) / 1000) * 0.4;
            lastTimestamp = timestamp;

            delta = Math.min(delta, 0.05);

            // if (skipClearRef.current) {
            //     // skipClearRef.current is set true on resize or init
            // } else {
            //     skipClearRef.current = false;
            // }

            introTimeRef.current += delta;
            if (introPhaseRef.current === 0 && introTimeRef.current >= 1.5) {
                introPhaseRef.current = 1;
                introTimeRef.current = 0;
            }

            timeRef.current += delta;

            draw(
                ctx,
                canvas.width,
                canvas.height,
                timeRef.current,
                introPhaseRef.current,
                introTimeRef.current
            );

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', requestResize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [draw]);

    return (
        <>
            <div className="absolute inset-0 h-full bg-[var(--surface)]"/>
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full  pointer-events-none"
                style={{zIndex: 0}}
            />
            <div
                className="absolute inset-0 h-full pointer-events-none"
                style={{backgroundColor: 'rgb(var(--surface-rgb) / 0.35)'}}
            />
        </>
    );
}