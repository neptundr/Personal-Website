'use client';

import React, {useRef, useEffect, useCallback} from 'react';

type IntroPhase = 0 | 1;

const PARTICLE_CHARS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}<>?/|\\';

export default function FractalTunnel() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const timeRef = useRef(100);
    const speedRef = useRef(0.006);
    const introPhaseRef = useRef<IntroPhase>(0);
    const introTimeRef = useRef(0);
    const tunnelOscRef = useRef(0);

    const numParticles = 180;
    const particleCharsRef = useRef<string[]>([]);

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
            const cx = width * (2 / 3);
            const cy = window.innerHeight * 0.5;

            const maxRadius = Math.hypot(width, height);
            const viewportRadius = Math.hypot(window.innerWidth, window.innerHeight);
            const radiusScale = viewportRadius / maxRadius;

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);

            const numLayers = 90;

            tunnelOscRef.current += 0.016;
            const tunnelOsc = 0.85 + 0.4 * Math.sin(tunnelOscRef.current * 0.8);

            let fadeIn = 1;
            if (introPhase === 0) fadeIn = Math.min(introTime / 1.5, 1);

            // Tunnel rings
            for (let layer = 0; layer < numLayers; layer++) {
                const offset = (layer / numLayers + time * speedRef.current) % 1;
                const scale = Math.pow(offset, 5);
                const radius = scale * maxRadius * 0.87;
                const opacity = Math.sin(offset * Math.PI) * fadeIn * tunnelOsc;

                if (opacity < 0.01 || radius < 5) continue;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(time * 0.03 + layer * 0.05);

                const innerR = radius * 0.4;
                const thickness = (-0.045 + scale * 35) / radiusScale; // restore thickness
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

                    ctx.strokeStyle =
                        (layer + i) % 3 < 2
                            ? `rgba(200,20,25,${opacity})`
                            : `rgba(120,10,15,${opacity})`;

                    ctx.lineWidth = thickness;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                }

                ctx.restore();
            }

            // Particles
            if (introPhase !== 1) return;

            const ageGrowth = 1 + Math.min(time * 0.02, 0.6); // slow growth over time

            for (let p = 0; p < numParticles; p++) {
                const t =
                    (1 + time * 0.3 + p * 0.2 + Math.sin(p * 7.89) * 0.8) % 4;

                const a =
                    (p / numParticles) * Math.PI * 2 +
                    time * 0.08 +
                    Math.cos(p * 3.14) * 1.2;

                const r = t * viewportRadius * 0.55; // particles viewport-normalized

                ctx.save();
                ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
                ctx.scale(1, -1);
                ctx.rotate(a);

                const alpha = (t + 0.1) * 0.85 * (1 - t * 0.15);
                const fontSize = 14 * (1 + t * 0.4) * ageGrowth;

                ctx.fillStyle = `rgba(200,20,25,${alpha})`;
                ctx.font = `${fontSize}px "Fira Code", monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // @ts-ignore
                ctx.fillText(particleCharsRef.current[p], 0, 0);

                ctx.restore();
            }
        },
        []
    );

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        const resize = () => {
            const height = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            );
            canvas.width = window.innerWidth;
            canvas.height = height;
        };

        resize();
        window.addEventListener('resize', resize);

        const observer = new ResizeObserver(resize);
        observer.observe(document.body);

        const animate = () => {
            introTimeRef.current += 0.016;

            if (introPhaseRef.current === 0 && introTimeRef.current >= 1.5) {
                introPhaseRef.current = 1;
                introTimeRef.current = 0;
            }

            timeRef.current += 0.016;

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

        animate();

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [draw]);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full pointer-events-none"
                style={{background: '#000', zIndex: 0}}
            />

            <div className="absolute inset-0 bg-black/40"/>
        </>
    );
}