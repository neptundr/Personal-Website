'use client';
import React, { useRef, useEffect } from 'react';
import {
    SIM,
    LOW_POWER_SIM,
    BACKGROUND_COLOR,
    AMBIENT_SPLAT_INTERVAL,
    INITIAL_SPLAT_COUNT,
    MAX_DPR,
    DEFAULT_COLOR_CONFIG,
    type ColorConfig,
    type SimConfig,
} from './liquid-config';
import {
    createGLProgram,
    createFBO,
    createDoubleFBO,
    initQuad,
    blit,
} from './liquid-webgl';
import * as S from './liquid-shaders';

// ─── helpers ─────────────────────────────────────────────────────────────────

function isLowPower(): boolean {
    const mem = (navigator as { deviceMemory?: number }).deviceMemory;
    return typeof mem === 'number' && mem < 4;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const n = parseInt(hex.replace('#', ''), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

// WebGL2 internal format constants (avoids needing WebGL2RenderingContext type upfront)
const RGBA16F    = 0x881a;
const RG16F      = 0x822f;
const R16F       = 0x822d;
const RG         = 0x8227;
const RED        = 0x1903;
const HALF_FLOAT = 0x140b;

// ─── component ───────────────────────────────────────────────────────────────

interface LiquidHeroProps {
    colorConfig?: ColorConfig;
}

export default function LiquidHero({ colorConfig = DEFAULT_COLOR_CONFIG }: LiquidHeroProps) {
    const canvasRef      = useRef<HTMLCanvasElement>(null);
    const colorConfigRef = useRef<ColorConfig>(colorConfig);

    // Keep ref in sync without restarting the sim
    useEffect(() => { colorConfigRef.current = colorConfig; }, [colorConfig]);

    useEffect(() => {
        const canvasOrNull = canvasRef.current;
        if (!canvasOrNull) return;
        const canvas: HTMLCanvasElement = canvasOrNull;

        // Skip canvas for reduced-motion users
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // ── WebGL2 context ────────────────────────────────────────────────
        const glRaw = canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,
            preserveDrawingBuffer: false,
        }) as WebGL2RenderingContext | null;
        if (!glRaw) return;
        const gl = glRaw; // non-null const keeps nested closures type-safe

        if (!gl.getExtension('EXT_color_buffer_float')) return;

        const cfg: SimConfig = isLowPower() ? LOW_POWER_SIM : SIM;

        // ── Canvas sizing ─────────────────────────────────────────────────
        const handleResize = () => {
            const dpr = Math.min(devicePixelRatio, MAX_DPR);
            canvas.width  = Math.floor(innerWidth  * dpr);
            canvas.height = Math.floor(innerHeight * dpr);
        };
        handleResize();
        window.addEventListener('resize', handleResize, { passive: true });

        // ── FBOs sized to canvas aspect ratio (prevents distortion) ───────
        const aspect = canvas.width / canvas.height;
        const simH   = cfg.simRes;
        const simW   = Math.max(1, Math.round(simH * aspect));
        const dyeH   = cfg.dyeRes;
        const dyeW   = Math.max(1, Math.round(dyeH * aspect));

        // ── Programs ──────────────────────────────────────────────────────
        const clearProg     = createGLProgram(gl, S.baseVertexShader, S.clearShader);
        const splatProg     = createGLProgram(gl, S.baseVertexShader, S.splatShader);
        const advectProg    = createGLProgram(gl, S.baseVertexShader, S.advectionShader);
        const divergProg    = createGLProgram(gl, S.baseVertexShader, S.divergenceShader);
        const curlProg      = createGLProgram(gl, S.baseVertexShader, S.curlShader);
        const vorticityProg = createGLProgram(gl, S.baseVertexShader, S.vorticityShader);
        const pressureProg  = createGLProgram(gl, S.baseVertexShader, S.pressureShader);
        const gradSubProg   = createGLProgram(gl, S.baseVertexShader, S.gradientSubtractShader);
        const displayProg   = createGLProgram(gl, S.baseVertexShader, S.displayShader);

        initQuad(gl);

        // ── FBOs ──────────────────────────────────────────────────────────
        let velocity    = createDoubleFBO(gl, simW, simH, RG16F,   RG,      HALF_FLOAT, gl.LINEAR);
        let dye         = createDoubleFBO(gl, dyeW, dyeH, RGBA16F, gl.RGBA, HALF_FLOAT, gl.LINEAR);
        const divergence = createFBO(gl, simW, simH, R16F, RED, HALF_FLOAT, gl.NEAREST);
        const curl       = createFBO(gl, simW, simH, R16F, RED, HALF_FLOAT, gl.NEAREST);
        let pressure    = createDoubleFBO(gl, simW, simH, R16F, RED, HALF_FLOAT, gl.NEAREST);

        // ── Splat: velocity + white dye ───────────────────────────────────
        function splat(x: number, y: number, dx: number, dy: number) {
            const asp = canvas.width / canvas.height;
            const nx  = x / canvas.width;
            const ny  = 1 - y / canvas.height;
            const r   = cfg.splatRadius / 100;

            gl.useProgram(splatProg.program);

            gl.uniform1i(splatProg.u('uTarget'), velocity.read.attach(0));
            gl.uniform1f(splatProg.u('aspectRatio'), asp);
            gl.uniform2f(splatProg.u('point'), nx, ny);
            gl.uniform3f(splatProg.u('color'), dx * cfg.splatForce, -dy * cfg.splatForce, 0);
            gl.uniform1f(splatProg.u('radius'), r);
            gl.uniform2f(splatProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            blit(gl, velocity.write);
            velocity.swap();

            gl.uniform1i(splatProg.u('uTarget'), dye.read.attach(0));
            gl.uniform2f(splatProg.u('point'), nx, ny);
            gl.uniform3f(splatProg.u('color'), 1, 1, 1);
            gl.uniform1f(splatProg.u('radius'), r);
            gl.uniform2f(splatProg.u('texelSize'), dye.texelSizeX, dye.texelSizeY);
            blit(gl, dye.write);
            dye.swap();
        }

        // ── Click splat: dye only, no velocity push ───────────────────────
        function splatDyeOnly(x: number, y: number) {
            gl.useProgram(splatProg.program);
            gl.uniform1i(splatProg.u('uTarget'), dye.read.attach(0));
            gl.uniform1f(splatProg.u('aspectRatio'), canvas.width / canvas.height);
            gl.uniform2f(splatProg.u('point'), x / canvas.width, 1 - y / canvas.height);
            gl.uniform3f(splatProg.u('color'), 1, 1, 1);
            gl.uniform1f(splatProg.u('radius'), (cfg.splatRadius / 100) * 2.5);
            gl.uniform2f(splatProg.u('texelSize'), dye.texelSizeX, dye.texelSizeY);
            blit(gl, dye.write);
            dye.swap();
        }

        // ── Ambient stroke: curved Bézier from a random screen edge ─────────
        function ambientStroke() {
            const W = canvas.width;
            const H = canvas.height;

            // Origin within 8% of a random edge; angle points inward
            const margin = 0.08;
            const edge   = Math.floor(Math.random() * 4);
            let x0: number, y0: number, baseAngle: number;

            switch (edge) {
                case 0: // top → downward
                    x0 = Math.random() * W;
                    y0 = Math.random() * H * margin;
                    baseAngle = Math.PI * 0.5;
                    break;
                case 1: // right → leftward
                    x0 = W * (1 - Math.random() * margin);
                    y0 = Math.random() * H;
                    baseAngle = Math.PI;
                    break;
                case 2: // bottom → upward
                    x0 = Math.random() * W;
                    y0 = H * (1 - Math.random() * margin);
                    baseAngle = Math.PI * 1.5;
                    break;
                default: // left → rightward
                    x0 = Math.random() * W * margin;
                    y0 = Math.random() * H;
                    baseAngle = 0;
                    break;
            }

            // ±50° spread around inward direction
            const angle = baseAngle + (Math.random() - 0.5) * (Math.PI * 5 / 9);
            const len   = Math.min(W, H) * (0.35 + Math.random() * 0.45);

            // Bézier control point — perpendicular bend for curvature
            const perp = angle + Math.PI / 2;
            const bend = len * (Math.random() - 0.5) * 0.65;
            const cBx  = x0 + Math.cos(angle) * len * 0.5 + Math.cos(perp) * bend;
            const cBy  = y0 + Math.sin(angle) * len * 0.5 + Math.sin(perp) * bend;
            const x1   = x0 + Math.cos(angle) * len;
            const y1   = y0 + Math.sin(angle) * len;

            const STEPS = 32;
            let px = x0, py = y0;
            for (let i = 1; i <= STEPS; i++) {
                const t  = i / STEPS;
                const mt = 1 - t;
                const bx = mt * mt * x0 + 2 * mt * t * cBx + t * t * x1;
                const by = mt * mt * y0 + 2 * mt * t * cBy + t * t * y1;
                splat(bx, by, (bx - px) * 7, (by - py) * 7);
                px = bx; py = by;
            }

            // Notify text overlay: normalized direction for shake
            window.dispatchEvent(new CustomEvent('ambientStroke', {
                detail: { dx: Math.cos(angle), dy: Math.sin(angle) },
            }));
        }

        // Interval scales with screen width — fewer strokes on small screens
        function ambientIntervalMs(): number {
            if (innerWidth >= 1024) return 700;
            if (innerWidth >= 600)  return 1400;
            return 2800;
        }

        // ── Simulation step ───────────────────────────────────────────────
        let lastT = performance.now();

        function step(dt: number) {
            gl.disable(gl.BLEND);

            gl.useProgram(curlProg.program);
            gl.uniform2f(curlProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(curlProg.u('uVelocity'), velocity.read.attach(0));
            blit(gl, curl);

            gl.useProgram(vorticityProg.program);
            gl.uniform2f(vorticityProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(vorticityProg.u('uVelocity'), velocity.read.attach(0));
            gl.uniform1i(vorticityProg.u('uCurl'),     curl.attach(1));
            gl.uniform1f(vorticityProg.u('curl'),      cfg.curl);
            gl.uniform1f(vorticityProg.u('dt'),        dt);
            blit(gl, velocity.write);
            velocity.swap();

            gl.useProgram(divergProg.program);
            gl.uniform2f(divergProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(divergProg.u('uVelocity'), velocity.read.attach(0));
            blit(gl, divergence);

            gl.useProgram(clearProg.program);
            gl.uniform1i(clearProg.u('uTexture'), pressure.read.attach(0));
            gl.uniform1f(clearProg.u('value'), 0.8);
            blit(gl, pressure.write);
            pressure.swap();

            gl.useProgram(pressureProg.program);
            gl.uniform2f(pressureProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(pressureProg.u('uDivergence'), divergence.attach(0));
            for (let i = 0; i < cfg.pressureIterations; i++) {
                gl.uniform1i(pressureProg.u('uPressure'), pressure.read.attach(1));
                blit(gl, pressure.write);
                pressure.swap();
            }

            gl.useProgram(gradSubProg.program);
            gl.uniform2f(gradSubProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(gradSubProg.u('uPressure'), pressure.read.attach(0));
            gl.uniform1i(gradSubProg.u('uVelocity'), velocity.read.attach(1));
            blit(gl, velocity.write);
            velocity.swap();

            gl.useProgram(advectProg.program);
            gl.uniform2f(advectProg.u('texelSize'),    velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform2f(advectProg.u('dyeTexelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(advectProg.u('uVelocity'),   velocity.read.attach(0));
            gl.uniform1i(advectProg.u('uSource'),     velocity.read.attach(0));
            gl.uniform1f(advectProg.u('dt'),          dt);
            gl.uniform1f(advectProg.u('dissipation'), cfg.velocityDissipation);
            blit(gl, velocity.write);
            velocity.swap();

            gl.uniform2f(advectProg.u('texelSize'),    velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform2f(advectProg.u('dyeTexelSize'), dye.texelSizeX, dye.texelSizeY);
            gl.uniform1i(advectProg.u('uVelocity'),   velocity.read.attach(0));
            gl.uniform1i(advectProg.u('uSource'),     dye.read.attach(1));
            gl.uniform1f(advectProg.u('dt'),          dt);
            gl.uniform1f(advectProg.u('dissipation'), cfg.densityDissipation);
            blit(gl, dye.write);
            dye.swap();
        }

        // ── Render with colour-map ────────────────────────────────────────
        function render() {
            const cc = colorConfigRef.current;
            const [s0, s1, s2, s3] = cc.colors;
            const c0 = hexToRgb(s0);
            const c1 = hexToRgb(s1);
            const c2 = hexToRgb(s2);
            const c3 = hexToRgb(s3);

            gl.useProgram(displayProg.program);
            gl.uniform1i(displayProg.u('uTexture'),   dye.read.attach(0));
            gl.uniform3f(displayProg.u('cDark'),     c0.r, c0.g, c0.b);
            gl.uniform3f(displayProg.u('cMid'),      c1.r, c1.g, c1.b);
            gl.uniform3f(displayProg.u('cMidLight'), c2.r, c2.g, c2.b);
            gl.uniform3f(displayProg.u('cLight'),    c3.r, c3.g, c3.b);
            gl.uniform1f(displayProg.u('t1'), cc.thresholds[0]);
            gl.uniform1f(displayProg.u('t2'), cc.thresholds[1]);
            gl.uniform1f(displayProg.u('t3'), cc.thresholds[2]);
            blit(gl, null);
        }

        // ── Pointer handling ──────────────────────────────────────────────
        interface Ptr { x: number; y: number; down: boolean }
        const ptrs = new Map<number, Ptr>();

        function canvasXY(e: PointerEvent) {
            const rect = canvas.getBoundingClientRect();
            return {
                cx: (e.clientX - rect.left) * (canvas.width  / rect.width),
                cy: (e.clientY - rect.top)  * (canvas.height / rect.height),
            };
        }

        function onPointerDown(e: PointerEvent) {
            const { cx, cy } = canvasXY(e);
            splatDyeOnly(cx, cy); // colour burst, no direction
            ptrs.set(e.pointerId, { x: cx, y: cy, down: true });
        }

        function onPointerMove(e: PointerEvent) {
            const { cx, cy } = canvasXY(e);
            const p = ptrs.get(e.pointerId);
            if (p) {
                if (p.down) splat(cx, cy, (cx - p.x) * 6, (cy - p.y) * 6);
                p.x = cx; p.y = cy;
            } else {
                ptrs.set(e.pointerId, { x: cx, y: cy, down: false });
            }
        }

        function onPointerUp(e: PointerEvent) {
            const p = ptrs.get(e.pointerId);
            if (p) p.down = false;
        }

        canvas.addEventListener('pointerdown',  onPointerDown, { passive: true });
        canvas.addEventListener('pointermove',  onPointerMove, { passive: true });
        canvas.addEventListener('pointerup',    onPointerUp,   { passive: true });
        canvas.addEventListener('pointerleave', onPointerUp,   { passive: true });

        // ── Boot ──────────────────────────────────────────────────────────
        const initCount = innerWidth >= 768 ? INITIAL_SPLAT_COUNT : Math.max(2, Math.floor(INITIAL_SPLAT_COUNT / 2));
        for (let i = 0; i < initCount; i++) ambientStroke();
        const ambientTimer = setInterval(ambientStroke, ambientIntervalMs());

        // ── RAF + pause hooks ─────────────────────────────────────────────
        let rafId   = 0;
        let running = true;

        function loop(now: number) {
            if (!running) return;
            const dt = Math.min((now - lastT) / 1000, 0.016667);
            lastT = now;
            step(dt);
            render();
            rafId = requestAnimationFrame(loop);
        }
        rafId = requestAnimationFrame(loop);

        function onVisibility() {
            if (document.visibilityState === 'hidden') {
                running = false; cancelAnimationFrame(rafId);
            } else {
                running = true; lastT = performance.now();
                rafId = requestAnimationFrame(loop);
            }
        }
        document.addEventListener('visibilitychange', onVisibility);

        const observer = new IntersectionObserver((entries) => {
            const e = entries[0];
            if (!e) return;
            if (e.isIntersecting && !running) {
                running = true; lastT = performance.now();
                rafId = requestAnimationFrame(loop);
            } else if (!e.isIntersecting && running) {
                running = false; cancelAnimationFrame(rafId);
            }
        }, { threshold: 0 });
        observer.observe(canvas);

        // ── Cleanup ───────────────────────────────────────────────────────
        return () => {
            running = false;
            cancelAnimationFrame(rafId);
            clearInterval(ambientTimer);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', onVisibility);
            observer.disconnect();
            canvas.removeEventListener('pointerdown',  onPointerDown);
            canvas.removeEventListener('pointermove',  onPointerMove);
            canvas.removeEventListener('pointerup',    onPointerUp);
            canvas.removeEventListener('pointerleave', onPointerUp);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full"
            style={{ background: BACKGROUND_COLOR, zIndex: 0 }}
        />
    );
}
