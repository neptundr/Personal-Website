'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import FaceSvg, { readFaceElements } from '../face/FaceSvg';
import { FaceEngine, type Hole } from '../face/face-engine';
import { onFaceSignal } from '../face/face-bus';
import { getSettings, subscribeSettings } from '../dev/settings';
import type { MobiusScene } from '../mobius/mobius-scene';
import { Spring } from '../lib/spring';
import { randRange } from '../lib/math';
import Loader from './Loader';

// Orchestrates the hero: loader → the :D wakes and hops into place → the
// Möbius jumps up from underneath → live. Owns the one animation loop that
// drives the face engine, the ring, and the world-shake on impacts.

const MIN_LOADER_S = 0.65;
const MAX_DPR = 2;
/** The face is the text ":D" turned upright (90°), then tilted a touch like the reference. */
const HOME_ROT = 90 - 14;
/** The face rests this share of the hole's height below the opening's centre (negative: above). */
const HOME_DROP = -0.03;
/** Black outline around the :D and its words, screen px. */
const FACE_OUTLINE_PX = 8;
const PROGRESS_RATE = 7;
/** A tab return after at least this long earns a "hi!". */
const WELCOME_BACK_MS = 3000;
const FALLBACK_FONT = 'system-ui, sans-serif';

function fallbackHole(width: number, height: number): Hole {
    const rx = Math.min(width * 0.3, height * 0.55);
    return { cx: width / 2, cy: height * 0.52, rx, ry: rx * 0.48 };
}

export default function HeroStage() {
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const loaderRef = useRef<HTMLDivElement>(null);
    const slotRef = useRef<HTMLSpanElement>(null);
    const barRef = useRef<HTMLSpanElement>(null);
    const digitRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const reducedMotion = useReducedMotion() ?? false;

    useEffect(() => {
        const root = rootRef.current;
        const canvas = canvasRef.current;
        const svg = svgRef.current;
        const loader = loaderRef.current;
        const slot = slotRef.current;
        const bar = barRef.current;
        const faceElements = svg ? readFaceElements(svg) : null;
        if (!root || !canvas || !svg || !loader || !slot || !bar || !faceElements) return;

        const section = root.closest('section');
        const fontFamily = getComputedStyle(root).getPropertyValue('--v2-font').trim() || FALLBACK_FONT;
        const shakeX = new Spring(0, { stiffness: 320, damping: 9 });
        const shakeY = new Spring(0, { stiffness: 320, damping: 9 });

        let disposed = false;
        let scene: MobiusScene | null = null;
        let visible = true;
        let loaded = 0.06;
        let shown = 0;
        let lastPercent = -1;
        let introStarted = false;
        let width = 0;
        let height = 0;

        const engine = new FaceEngine(
            faceElements,
            {
                onImpact: (strength) => {
                    scene?.impact(strength);
                    if (reducedMotion) return;
                    shakeX.kick(randRange(-1, 1) * 90 * strength);
                    shakeY.kick(140 * strength);
                },
                onLanded: () => {
                    scene?.appear();
                    section?.setAttribute('data-stage', 'live');
                },
            },
            reducedMotion,
            fontFamily,
        );

        const local = (clientX: number, clientY: number) => {
            const r = root.getBoundingClientRect();
            return { x: clientX - r.left, y: clientY - r.top };
        };

        // The loader's ":D" is real (invisible) text; the face sits exactly on
        // its baseline at its font size, so it reads as part of the word.
        const placeOnSlot = () => {
            const marker = slot.querySelector<HTMLElement>('[data-baseline]');
            const s = slot.getBoundingClientRect();
            const baseline = marker ? marker.getBoundingClientRect().top : s.bottom;
            const fontSize = parseFloat(getComputedStyle(slot).fontSize) || 100;
            const p = local(s.left, baseline);
            engine.placeAsText(p.x, p.y, fontSize);
        };

        const updateHome = () => {
            const hole = scene ? scene.restHole() : fallbackHole(width, height);
            const size = Math.min(hole.ry * 1.75, hole.rx * 0.8);
            engine.setHome({ x: hole.cx, y: hole.cy + hole.ry * HOME_DROP, size, rot: HOME_ROT }, hole);
        };

        engine.setOutline(FACE_OUTLINE_PX);

        // Background colour is a palette setting; it recolours the whole v2 page.
        const themeRoot = root.closest<HTMLElement>('.v2-root');
        const applyBackground = () => themeRoot?.style.setProperty('--v2-bg', getSettings().bg);
        applyBackground();

        const layout = () => {
            const rect = root.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            svg.setAttribute('viewBox', `0 0 ${width.toFixed(1)} ${height.toFixed(1)}`);
            scene?.resize(width, height, Math.min(window.devicePixelRatio || 1, MAX_DPR));
            updateHome();
            if (!introStarted) placeOnSlot();
        };

        const writeProgress = (p: number) => {
            bar.style.transform = `scaleX(${p.toFixed(4)})`;
            const percent = Math.round(p * 100);
            if (percent === lastPercent) return;
            lastPercent = percent;
            loader.setAttribute('aria-valuenow', String(percent));
            const digits = String(percent).padStart(3, '0');
            digitRefs.current.forEach((strip, place) => {
                if (!strip) return;
                strip.style.setProperty('--d', digits[place] ?? '0');
                // Hide leading zeros: "7%", "42%", "100%".
                const leading = place < 3 - String(percent).length;
                strip.toggleAttribute('data-off', leading);
            });
        };

        // Loading: fonts, then the three.js chunk, then the ring itself.
        void document.fonts.ready.then(() => {
            if (disposed) return;
            loaded = Math.max(loaded, 0.35);
            engine.remeasure();
            if (!introStarted) placeOnSlot();
        });
        import('../mobius/mobius-scene')
            .then(async ({ MobiusScene }) => {
                loaded = Math.max(loaded, 0.7);
                const created = await MobiusScene.create(canvas, fontFamily, getSettings());
                if (disposed) {
                    created.dispose();
                    return;
                }
                scene = created;
                layout();
                // Shader compile + uploads now, so the landing frame doesn't hitch.
                created.prepare();
                loaded = 1;
            })
            .catch((error: unknown) => {
                // The page still works without the ring: the face lands alone.
                console.error('Möbius ring failed to load', error);
                loaded = 1;
            });

        const start = performance.now();
        let last = start;
        let raf = 0;
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;

            if (!introStarted) {
                // Never faster than the real progress, never done before the minimum time.
                const cap = Math.min(1, (now - start) / 1000 / MIN_LOADER_S);
                const goal = Math.min(loaded, cap);
                shown += (goal - shown) * (1 - Math.exp(-dt * PROGRESS_RATE));
                if (goal >= 1 && shown > 0.995) shown = 1;
                writeProgress(shown);
                if (shown >= 1) {
                    introStarted = true;
                    loader.setAttribute('data-state', 'done');
                    engine.beginIntro();
                }
            }

            if (visible) {
                engine.update(dt);
                scene?.frame(dt, reducedMotion);
            }

            shakeX.update(dt);
            shakeY.update(dt);
            if (section) {
                const moving = Math.abs(shakeX.value) + Math.abs(shakeY.value) > 0.05;
                section.style.transform = moving
                    ? `translate3d(${shakeX.value.toFixed(2)}px, ${shakeY.value.toFixed(2)}px, 0)`
                    : '';
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        // Input. A press on the face becomes a click (dive) or a drag (throw).
        // A press on the face goes to the face (click = dive, drag = throw);
        // otherwise a press on the ring spins/tips it.
        let draggingRing = false;
        const onMove = (e: PointerEvent) => {
            const p = local(e.clientX, e.clientY);
            engine.pointer(p.x, p.y);
            engine.input();
            if (draggingRing) {
                scene?.dragTo(p.x, p.y);
                return;
            }
            const overFace = engine.isLive && engine.isOver(p.x, p.y);
            root.classList.toggle('is-over-face', overFace);
            root.classList.toggle('is-over-ring', !overFace && !engine.isHeld && (scene?.isOver(p.x, p.y) ?? false));
            root.classList.toggle('is-holding', engine.isHeld);
        };
        const onDown = (e: PointerEvent) => {
            const p = local(e.clientX, e.clientY);
            if (engine.pointerDown(p.x, p.y)) {
                e.preventDefault();
                root.setPointerCapture(e.pointerId);
                return;
            }
            if (!scene?.grab(p.x, p.y)) return;
            draggingRing = true;
            engine.signal({ type: 'agree' });
            root.classList.add('is-holding');
            e.preventDefault();
            root.setPointerCapture(e.pointerId);
        };
        const onUp = (e: PointerEvent) => {
            if (draggingRing) {
                draggingRing = false;
                scene?.release();
            }
            engine.pointerUp();
            root.classList.remove('is-holding');
            if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
        };
        const onActivity = () => engine.input();
        let hiddenAt = 0;
        const onVisibility = () => {
            if (document.hidden) {
                hiddenAt = performance.now();
                return;
            }
            if (hiddenAt && performance.now() - hiddenAt > WELCOME_BACK_MS) engine.welcomeBack();
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        root.addEventListener('pointerdown', onDown);
        root.addEventListener('pointerup', onUp);
        root.addEventListener('pointercancel', onUp);
        window.addEventListener('keydown', onActivity);
        window.addEventListener('wheel', onActivity, { passive: true });
        window.addEventListener('touchstart', onActivity, { passive: true });
        document.addEventListener('visibilitychange', onVisibility);

        const offSignals = onFaceSignal((s) => engine.signal(s));
        const offSettings = subscribeSettings(() => {
            scene?.setSettings(getSettings());
            applyBackground();
            // The ring may have moved: the face's home follows its opening.
            updateHome();
        });

        const resizeObserver = new ResizeObserver(layout);
        resizeObserver.observe(root);
        const visibility = new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? true;
        });
        visibility.observe(root);
        layout();

        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onMove);
            root.removeEventListener('pointerdown', onDown);
            root.removeEventListener('pointerup', onUp);
            root.removeEventListener('pointercancel', onUp);
            window.removeEventListener('keydown', onActivity);
            window.removeEventListener('wheel', onActivity);
            window.removeEventListener('touchstart', onActivity);
            document.removeEventListener('visibilitychange', onVisibility);
            offSignals();
            offSettings();
            resizeObserver.disconnect();
            visibility.disconnect();
            scene?.dispose();
            if (section) section.style.transform = '';
        };
    }, [reducedMotion]);

    return (
        <div ref={rootRef} className="v2-stage">
            <canvas ref={canvasRef} className="v2-stage__ring" aria-hidden="true" />
            <Loader rootRef={loaderRef} slotRef={slotRef} barRef={barRef} digitRefs={digitRefs} />
            <FaceSvg ref={svgRef} />
        </div>
    );
}
