'use client';

import React, {useRef, useEffect, useCallback} from 'react';

type IntroPhase = 0 | 1;

const PARTICLE_CHARS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}<>?/|\\';

export default function FractalTunnel() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const timeRef = useRef(100);
    const speedRef = useRef(0.006);
    const introPhaseRef = useRef<IntroPhase>(0);
    const introTimeRef = useRef(0);
    const tunnelOscRef = useRef(0);

    const pendingResizeRef = useRef(true);

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
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // center of the tunnel = middle of the viewport, not canvas
            const cx = viewportWidth * (2 / 3);
            const cy = viewportHeight * 0.5;
            // use viewport diagonal for radius, not full page
            const viewportRadius = Math.hypot(viewportWidth, viewportHeight);

            const maxRadius = Math.hypot(viewportWidth, viewportHeight);
            const radiusScale = 1;

            ctx.clearRect(0, 0, width, height);

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
                const thickness = (-0.045 + scale * 35) / radiusScale;
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

            if (introPhase !== 1) return;

            const ageGrowth = 1 + Math.min(time * 0.02, 0.6);

            for (let p = 0; p < numParticles; p++) {
                const t =
                    (1 + time * 0.3 + p * 0.2 + Math.sin(p * 7.89) * 0.8) % 4;

                const a =
                    (p / numParticles) * Math.PI * 2 +
                    time * 0.08 +
                    Math.cos(p * 3.14) * 1.2;

                const r = t * viewportRadius * 0.55;

                ctx.save();
                ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
                ctx.scale(1, -1);
                ctx.rotate(a);

                const alpha = -0.075 + (t + 0.1) * 0.85 * (1 - t * 0.15);
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

        const buffer = document.createElement('canvas');
        const bufferCtx = buffer.getContext('2d')!;
        bufferCanvasRef.current = buffer;

        const requestResize = () => {
            pendingResizeRef.current = true;
        };

        requestResize();
        window.addEventListener('resize', requestResize);

        const observer = new ResizeObserver(requestResize);
        observer.observe(document.body);

        let lastTimestamp: number | null = null;

        const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            let delta = ((timestamp - lastTimestamp) / 1000) * 0.4;
            lastTimestamp = timestamp;

            delta = Math.min(delta, 0.05);

            if (pendingResizeRef.current) {
                // Use the global --vh variable for viewport height
                const vh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) * 100;
                const fullHeight = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight,
                    vh
                );

                canvas.height = fullHeight;
                buffer.width = canvas.width;
                buffer.height = canvas.height;
                bufferCtx.drawImage(canvas, 0, 0);

                canvas.width = window.innerWidth;
                // canvas.height = vh;

                ctx.drawImage(buffer, 0, 0);
                pendingResizeRef.current = false;
            }

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
            observer.disconnect();
            window.removeEventListener('resize', requestResize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [draw]);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full pointer-events-none"
                style={{zIndex: 0}}
            />
            <div className="absolute inset-0 h-full bg-black/35"/>
        </>
    );
}