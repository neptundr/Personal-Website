'use client';
import React, { useRef, useEffect } from 'react';
import {
    PALETTE_LIST,
    SIM,
    LOW_POWER_SIM,
    BACKGROUND_COLOR,
    AMBIENT_SPLAT_INTERVAL,
    INITIAL_SPLAT_COUNT,
    MAX_DPR,
    type PaletteColor,
    type SimConfig,
} from './liquid-config';
import {
    createGLProgram,
    createFBO,
    createDoubleFBO,
    initQuad,
    blit,
    type FBO,
    type DoubleFBO,
    type GLProgram,
} from './liquid-webgl';
import * as S from './liquid-shaders';

// ─── helpers ────────────────────────────────────────────────────────────────

function isLowPower(): boolean {
    const mem = (navigator as { deviceMemory?: number }).deviceMemory;
    return typeof mem === 'number' && mem < 4;
}

function pickColor(): PaletteColor {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return PALETTE_LIST[Math.floor(Math.random() * PALETTE_LIST.length)]!;
}

interface PointerData {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    down: boolean;
    color: PaletteColor;
}

// WebGL2 internal format constants (avoid needing WebGL2RenderingContext type)
const RGBA16F = 0x881a;
const RG16F   = 0x822f;
const R16F    = 0x822d;
const RG      = 0x8227;
const RED     = 0x1903;
const HALF_FLOAT = 0x140b;

// ─── main component ──────────────────────────────────────────────────────────

export default function LiquidHero() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Reduced-motion check
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // WebGL2 context — split so nested closures see non-null type
        const glRaw = canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,
            preserveDrawingBuffer: false,
        }) as WebGL2RenderingContext | null;
        if (!glRaw) return;
        const gl = glRaw;

        const ext = gl.getExtension('EXT_color_buffer_float');
        if (!ext) return; // float FBOs required

        const cfg: SimConfig = isLowPower() ? LOW_POWER_SIM : SIM;

        // ── resize ────────────────────────────────────────────────────────
        function resize() {
            const dpr = Math.min(devicePixelRatio, MAX_DPR);
            const w = Math.floor(innerWidth  * dpr);
            const h = Math.floor(innerHeight * dpr);
            if (canvas!.width !== w || canvas!.height !== h) {
                canvas!.width  = w;
                canvas!.height = h;
            }
        }
        resize();

        // ── compile programs ──────────────────────────────────────────────
        const clearProg      = createGLProgram(gl, S.baseVertexShader, S.clearShader);
        const splatProg      = createGLProgram(gl, S.baseVertexShader, S.splatShader);
        const advectProg     = createGLProgram(gl, S.baseVertexShader, S.advectionShader);
        const divergProg     = createGLProgram(gl, S.baseVertexShader, S.divergenceShader);
        const curlProg       = createGLProgram(gl, S.baseVertexShader, S.curlShader);
        const vorticityProg  = createGLProgram(gl, S.baseVertexShader, S.vorticityShader);
        const pressureProg   = createGLProgram(gl, S.baseVertexShader, S.pressureShader);
        const gradSubProg    = createGLProgram(gl, S.baseVertexShader, S.gradientSubtractShader);
        const displayProg    = createGLProgram(gl, S.baseVertexShader, S.displayShader);

        initQuad(gl);

        // ── FBOs ──────────────────────────────────────────────────────────
        const simW = cfg.simRes;
        const simH = cfg.simRes;
        const dyeW = cfg.dyeRes;
        const dyeH = cfg.dyeRes;

        let velocity  = createDoubleFBO(gl, simW, simH, RG16F,   RG,   HALF_FLOAT, gl.LINEAR);
        let dye       = createDoubleFBO(gl, dyeW, dyeH, RGBA16F, gl.RGBA, HALF_FLOAT, gl.LINEAR);
        const divergence = createFBO(gl, simW, simH, R16F, RED, HALF_FLOAT, gl.NEAREST);
        const curl       = createFBO(gl, simW, simH, R16F, RED, HALF_FLOAT, gl.NEAREST);
        let pressure  = createDoubleFBO(gl, simW, simH, R16F, RED, HALF_FLOAT, gl.NEAREST);

        // ── splat ─────────────────────────────────────────────────────────
        function splat(x: number, y: number, dx: number, dy: number, color: PaletteColor) {
            const aspect = canvas!.width / canvas!.height;

            gl.useProgram(splatProg.program);
            gl.uniform1i(splatProg.u('uTarget'), velocity.read.attach(0));
            gl.uniform1f(splatProg.u('aspectRatio'), aspect);
            gl.uniform2f(splatProg.u('point'), x / canvas!.width, 1 - y / canvas!.height);
            gl.uniform3f(splatProg.u('color'), dx * cfg.splatForce, -dy * cfg.splatForce, 0);
            gl.uniform1f(splatProg.u('radius'),
                cfg.splatRadius / 100 * (simH / simW));
            gl.uniform2f(splatProg.u('texelSize'),
                velocity.texelSizeX, velocity.texelSizeY);
            blit(gl, velocity.write);
            velocity.swap();

            gl.useProgram(splatProg.program);
            gl.uniform1i(splatProg.u('uTarget'), dye.read.attach(0));
            gl.uniform2f(splatProg.u('point'), x / canvas!.width, 1 - y / canvas!.height);
            gl.uniform3f(splatProg.u('color'), color.r, color.g, color.b);
            gl.uniform1f(splatProg.u('radius'),
                cfg.splatRadius / 100);
            gl.uniform2f(splatProg.u('texelSize'), dye.texelSizeX, dye.texelSizeY);
            blit(gl, dye.write);
            dye.swap();
        }

        function ambientSplat() {
            const x  = Math.random() * canvas!.width;
            const y  = Math.random() * canvas!.height;
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            splat(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, pickColor());
        }

        // ── sim step ──────────────────────────────────────────────────────
        let lastT = performance.now();

        function step(dt: number) {
            gl.disable(gl.BLEND);

            // curl
            gl.useProgram(curlProg.program);
            gl.uniform2f(curlProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(curlProg.u('uVelocity'), velocity.read.attach(0));
            blit(gl, curl);

            // vorticity
            gl.useProgram(vorticityProg.program);
            gl.uniform2f(vorticityProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(vorticityProg.u('uVelocity'), velocity.read.attach(0));
            gl.uniform1i(vorticityProg.u('uCurl'),     curl.attach(1));
            gl.uniform1f(vorticityProg.u('curl'),      cfg.curl);
            gl.uniform1f(vorticityProg.u('dt'),        dt);
            blit(gl, velocity.write);
            velocity.swap();

            // divergence
            gl.useProgram(divergProg.program);
            gl.uniform2f(divergProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(divergProg.u('uVelocity'), velocity.read.attach(0));
            blit(gl, divergence);

            // clear pressure
            gl.useProgram(clearProg.program);
            gl.uniform1i(clearProg.u('uTexture'), pressure.read.attach(0));
            gl.uniform1f(clearProg.u('value'), 0.8);
            blit(gl, pressure.write);
            pressure.swap();

            // pressure Jacobi iterations
            gl.useProgram(pressureProg.program);
            gl.uniform2f(pressureProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(pressureProg.u('uDivergence'), divergence.attach(0));
            for (let i = 0; i < cfg.pressureIterations; i++) {
                gl.uniform1i(pressureProg.u('uPressure'), pressure.read.attach(1));
                blit(gl, pressure.write);
                pressure.swap();
            }

            // gradient subtract
            gl.useProgram(gradSubProg.program);
            gl.uniform2f(gradSubProg.u('texelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(gradSubProg.u('uPressure'), pressure.read.attach(0));
            gl.uniform1i(gradSubProg.u('uVelocity'), velocity.read.attach(1));
            blit(gl, velocity.write);
            velocity.swap();

            // advect velocity
            gl.useProgram(advectProg.program);
            gl.uniform2f(advectProg.u('texelSize'),    velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform2f(advectProg.u('dyeTexelSize'), velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(advectProg.u('uVelocity'),   velocity.read.attach(0));
            gl.uniform1i(advectProg.u('uSource'),     velocity.read.attach(0));
            gl.uniform1f(advectProg.u('dt'),          dt);
            gl.uniform1f(advectProg.u('dissipation'), cfg.velocityDissipation);
            blit(gl, velocity.write);
            velocity.swap();

            // advect dye
            gl.uniform2f(advectProg.u('texelSize'),    velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform2f(advectProg.u('dyeTexelSize'), dye.texelSizeX, dye.texelSizeY);
            gl.uniform1i(advectProg.u('uVelocity'),   velocity.read.attach(0));
            gl.uniform1i(advectProg.u('uSource'),     dye.read.attach(1));
            gl.uniform1f(advectProg.u('dt'),          dt);
            gl.uniform1f(advectProg.u('dissipation'), cfg.densityDissipation);
            blit(gl, dye.write);
            dye.swap();
        }

        // ── render ────────────────────────────────────────────────────────
        function render() {
            gl.useProgram(displayProg.program);
            gl.uniform1i(displayProg.u('uTexture'),   dye.read.attach(0));
            gl.uniform1f(displayProg.u('aberration'), cfg.aberration);
            blit(gl, null);
        }

        // ── pointer tracking ──────────────────────────────────────────────
        const pointers: Map<number, PointerData> = new Map();

        function onPointerMove(e: PointerEvent) {
            const rect = canvas!.getBoundingClientRect();
            const scaleX = canvas!.width  / rect.width;
            const scaleY = canvas!.height / rect.height;
            const cx = (e.clientX - rect.left) * scaleX;
            const cy = (e.clientY - rect.top)  * scaleY;

            if (pointers.has(e.pointerId)) {
                const p = pointers.get(e.pointerId)!;
                p.dx = (cx - p.x) * 5;
                p.dy = (cy - p.y) * 5;
                p.x  = cx;
                p.y  = cy;
                if (p.down || e.pointerType !== 'mouse') {
                    splat(cx, cy, p.dx, p.dy, p.color);
                }
            } else {
                pointers.set(e.pointerId, { id: e.pointerId, x: cx, y: cy, dx: 0, dy: 0, down: false, color: pickColor() });
            }
        }

        function onPointerDown(e: PointerEvent) {
            const p = pointers.get(e.pointerId);
            if (p) { p.down = true; p.color = pickColor(); }
        }

        function onPointerUp(e: PointerEvent) {
            const p = pointers.get(e.pointerId);
            if (p) p.down = false;
        }

        canvas.addEventListener('pointermove',  onPointerMove, { passive: true });
        canvas.addEventListener('pointerdown',  onPointerDown, { passive: true });
        canvas.addEventListener('pointerup',    onPointerUp,   { passive: true });
        canvas.addEventListener('pointerleave', onPointerUp,   { passive: true });

        // ── initial burst ─────────────────────────────────────────────────
        for (let i = 0; i < INITIAL_SPLAT_COUNT; i++) ambientSplat();

        // ── ambient timer ─────────────────────────────────────────────────
        const ambientTimer = setInterval(ambientSplat, AMBIENT_SPLAT_INTERVAL);

        // ── RAF loop with pause hooks ─────────────────────────────────────
        let rafId = 0;
        let running = true;

        function loop(now: number) {
            if (!running) return;
            const dt = Math.min((now - lastT) / 1000, 0.016667);
            lastT = now;
            resize();
            step(dt);
            render();
            rafId = requestAnimationFrame(loop);
        }

        rafId = requestAnimationFrame(loop);

        // Pause on hidden tab
        function onVisibility() {
            if (document.visibilityState === 'hidden') {
                running = false;
                cancelAnimationFrame(rafId);
            } else {
                running = true;
                lastT = performance.now();
                rafId = requestAnimationFrame(loop);
            }
        }
        document.addEventListener('visibilitychange', onVisibility);

        // Pause when scrolled off screen
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry) return;
                if (entry.isIntersecting && !running) {
                    running = true;
                    lastT = performance.now();
                    rafId = requestAnimationFrame(loop);
                } else if (!entry.isIntersecting && running) {
                    running = false;
                    cancelAnimationFrame(rafId);
                }
            },
            { threshold: 0 }
        );
        observer.observe(canvas);

        // ── cleanup ───────────────────────────────────────────────────────
        return () => {
            running = false;
            cancelAnimationFrame(rafId);
            clearInterval(ambientTimer);
            document.removeEventListener('visibilitychange', onVisibility);
            observer.disconnect();
            canvas.removeEventListener('pointermove',  onPointerMove);
            canvas.removeEventListener('pointerdown',  onPointerDown);
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
