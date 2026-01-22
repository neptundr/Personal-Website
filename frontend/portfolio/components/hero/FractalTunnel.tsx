'use client';

import React, { useRef, useEffect, useCallback } from 'react';

type IntroPhase = 0 | 1;

const PARTICLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}<>?/|\\';

export default function FractalTunnel() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);

    const timeRef = useRef<number>(100);
    const speedRef = useRef<number>(0.006);
    const targetSpeedRef = useRef<number>(0.006);

    const introPhaseRef = useRef<IntroPhase>(0);
    const introTimeRef = useRef<number>(0);

    // Tunnel opacity oscillator
    const tunnelOscRef = useRef<number>(0);

    // Particle chars
    const numParticles = 180;
    const particleCharsRef = useRef<string[]>([]);
    if (particleCharsRef.current.length === 0) {
        for (let i = 0; i < numParticles; i++) {
            // @ts-ignore
            particleCharsRef.current.push(PARTICLE_CHARS[Math.floor(Math.random() * PARTICLE_CHARS.length)]);
        }
    }

    const draw = useCallback((
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        time: number,
        introPhase: IntroPhase,
        introTime: number
    ) => {
        const cx = width * (2 / 3);
        const cy = height * (1.5 / 3);
        const maxRadius = Math.hypot(width, height);

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        const numLayers = 90;

        // Speed logic
        // speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.001;
        const s = Math.sin(time * 0.15);
        if (s > 0.9) targetSpeedRef.current = 0.004;
        else if (s < -0.9) targetSpeedRef.current = 0.009;
        else targetSpeedRef.current = 0.006;
        const baseSpeed = speedRef.current;

        // Tunnel opacity oscillator
        tunnelOscRef.current += 0.016;
        const tunnelOsc = 0.85 + 0.4 * Math.sin(tunnelOscRef.current * 0.8);

        // Radial fade-in intro (water-drop effect)
        let fadeIn = 1;
        if (introPhase === 0) fadeIn = Math.min(introTime / 1.5, 1);

        for (let layer = 0; layer < numLayers; layer++) {
            const offset = (layer / numLayers + time * baseSpeed) % 1;
            const scale = Math.pow(offset, 5);
            const radius = scale * maxRadius * 0.87;
            let opacity = Math.sin(offset * Math.PI) * fadeIn * tunnelOsc;

            if (opacity < 0.01 || radius < 5) continue;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 0.03 + layer * 0.05);

            const innerR = radius * 0.4;
            const thickness = -0.05 + scale * 35;
            const curves = 12;

            for (let i = 1; i < curves; i++) {
                const a0 = ((i - 1) / curves) * Math.PI * 2;
                const a1 = (i / curves) * Math.PI * 2;

                const r0 =
                    innerR +
                    (radius - innerR) *
                        (0.5 +
                            0.3 * Math.cos(5 * a0 + time * 0.4) +
                            0.2 * Math.cos(3 * a0 - time * 0.3) +
                            0.15 * Math.sin(layer * 0.5 + time * 0.2));

                const r1 =
                    innerR +
                    (radius - innerR) *
                        (0.5 +
                            0.3 * Math.cos(5 * a1 + time * 0.4) +
                            0.2 * Math.cos(3 * a1 - time * 0.3) +
                            0.15 * Math.sin(layer * 0.5 + time * 0.2));

                const sa0 = a0 + Math.sqrt(scale) * Math.PI * 2;
                const sa1 = a1 + Math.sqrt(scale) * Math.PI * 2;

                const x0 = Math.cos(sa0) * r0;
                const y0 = Math.sin(sa0) * r0;
                const x1 = Math.cos(sa1) * r1;
                const y1 = Math.sin(sa1) * r1;

                const color =
                    (layer + i) % 3 < 2
                        ? `rgba(200,20,25,${opacity})`
                        : `rgba(120,10,15,${opacity})`;

                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
                ctx.strokeStyle = color;
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }

            ctx.restore();
        }

        // Particles as letters
        if (introPhase !== 1) return;

        for (let p = 0; p < numParticles; p++) {
            // Shift t earlier so particles appear sooner
            const t = (1+ time * 0.3 + p * 0.2 + Math.sin(p * 7.89) * 0.8) % 4;
            const a = (p / numParticles) * Math.PI * 2 + time * 0.08 + Math.cos(p * 3.14) * 1.2;
            const r = t * maxRadius * 0.55;

            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;

            const char = particleCharsRef.current[p];
            const alpha = (t + 0.1) * 0.85;
            const fontSize = 18 * (1 + t * 0.5);

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(1, -1); // flip vertically
            ctx.rotate(a);
            ctx.fillStyle = `rgba(200,20,25,${alpha})`;
            ctx.font = `${fontSize}px "Fira Code", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // @ts-ignore
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resize();
        window.addEventListener('resize', resize);

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

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full"
            style={{ background: '#000' }}
        />
    );
}