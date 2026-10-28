import { Spring } from '../lib/spring';
import { clamp, easeInCubic, easeOutBack, lerp } from '../lib/math';

// The :D's arms: two springy noodles that grow out from the sides of its
// face, flop about, and get slurped back in to where they came from.
//
// Each arm is a centreline of short segments hanging off a shoulder angle.
// That angle is a spring, kicked back and forth by whatever the arm is doing
// (waving, flailing). Further along the arm, each segment follows the angle
// the shoulder had a moment earlier, so motion travels down it like a whip
// and the tip lags and overshoots: that's the noodle. `out` (0..1) is how
// much of the arm has emerged. Drawn as two round-capped strokes: a black
// outline and the white noodle on top, matching the face's outlined glyphs.

export interface ArmPoint {
    readonly x: number;
    readonly y: number;
}

export interface ArmPaths {
    readonly outline: SVGPathElement;
    readonly fill: SVGPathElement;
}

/** Where the arms attach this frame, and how big the face is. */
export interface ArmFrame {
    /** Viewer's left, viewer's right. */
    readonly anchors: readonly [ArmPoint, ArmPoint];
    /** Face font size, px. */
    readonly size: number;
    /** Outline stroke width, px (half of it shows outside the noodle). */
    readonly outline: number;
}

export type ArmSide = 0 | 1;

type Pose = { readonly kind: 'wave' } | { readonly kind: 'reach'; readonly target: ArmPoint };

interface Grow {
    readonly from: number;
    readonly to: number;
    readonly start: number;
    readonly duration: number;
    readonly ease: (t: number) => number;
}

interface Sample {
    readonly t: number;
    readonly v: number;
}

const SEGMENTS = 28;
/** Noodle thickness and lengths, in face sizes. */
const THICKNESS = 0.085;
const WAVE_LENGTH = 1.05;
const REACH_MAX = 2.6;
const GROW_TIME = 0.42;
const SLURP_TIME = 0.2;
/** Up-and-out angle of a waving arm, radians from straight up. */
const WAVE_SPLAY = 0.25;
/** Waving: the shoulder swings ±this far (radians), flipping every half period (s). */
const WAVE_SWING = 0.42;
const WAVE_HALF_PERIOD = 0.14;
/** How long (s) a movement takes to travel from shoulder to tip. */
const WHIP_LAG = 0.16;
/** Flailing at a target: smaller, irregular swings. */
const REACH_SWING = 0.16;
const REACH_HALF_PERIOD = [0.12, 0.26] as const;
const HISTORY = WHIP_LAG + 0.1;

const f = (n: number): string => n.toFixed(1);

class Noodle {
    pose: Pose = { kind: 'wave' };
    /** Shoulder swing, radians: kicked back and forth, overshoots on purpose. */
    readonly swing = new Spring(0, { stiffness: 320, damping: 13 });
    out = 0;
    until = Infinity;
    nextFlip = 0;
    flipSign = 1;
    private grow: Grow | null = null;
    private history: Sample[] = [];

    constructor(readonly side: ArmSide) {}

    growTo(to: number, now: number, duration: number, ease: (t: number) => number): void {
        this.grow = { from: this.out, to, start: now, duration, ease };
    }

    get retracting(): boolean {
        return this.grow !== null && this.grow.to === 0;
    }

    get hidden(): boolean {
        return this.out <= 0.001 && !this.grow;
    }

    stepGrow(now: number): void {
        const g = this.grow;
        if (!g) return;
        const t = clamp((now - g.start) / g.duration);
        this.out = lerp(g.from, g.to, g.ease(t));
        if (t < 1) return;
        this.out = g.to;
        this.grow = null;
    }

    record(now: number): void {
        this.history.push({ t: now, v: this.swing.value });
        while (this.history.length > 2 && this.history[0]!.t < now - HISTORY) this.history.shift();
    }

    /** The shoulder swing as it was `ago` seconds earlier. */
    swingAgo(now: number, ago: number): number {
        const want = now - ago;
        const h = this.history;
        for (let i = h.length - 1; i > 0; i--) {
            const a = h[i - 1]!;
            const b = h[i]!;
            if (a.t <= want) return lerp(a.v, b.v, clamp((want - a.t) / (b.t - a.t || 1)));
        }
        return h[0]?.v ?? this.swing.value;
    }
}

export class Arms {
    private readonly noodles: readonly [Noodle, Noodle] = [new Noodle(0), new Noodle(1)];
    private time = 0;

    constructor(
        private readonly paths: readonly [ArmPaths, ArmPaths],
        private readonly reducedMotion: boolean,
    ) {
        paths.forEach(({ outline, fill }) => {
            for (const node of [outline, fill]) {
                node.setAttribute('fill', 'none');
                node.setAttribute('stroke-linecap', 'round');
                node.setAttribute('stroke-linejoin', 'round');
            }
            outline.setAttribute('stroke', '#000');
            fill.setAttribute('stroke', '#fff');
        });
    }

    /** True while any arm is out (or on its way in). */
    get active(): boolean {
        return this.noodles.some((n) => !n.hidden);
    }

    /** One arm pops out and waves like mad. */
    wave(side: ArmSide, duration: number): void {
        this.start(this.noodles[side], { kind: 'wave' }, duration);
    }

    /** One arm strains towards `target`, flailing, never quite getting there. */
    reach(side: ArmSide, target: ArmPoint, duration: number): void {
        this.start(this.noodles[side], { kind: 'reach', target }, duration);
    }

    /** Suck every arm back in. */
    retract(): void {
        this.noodles.forEach((n) => this.slurp(n));
    }

    update(dt: number, frame: ArmFrame): void {
        this.time += dt;
        this.noodles.forEach((n, i) => {
            if (this.time >= n.until) this.slurp(n);
            n.stepGrow(this.time);
            this.drive(n);
            n.swing.update(dt);
            n.record(this.time);
            this.draw(n, this.paths[i as ArmSide], frame);
        });
    }

    private start(n: Noodle, pose: Pose, duration: number): void {
        n.pose = pose;
        n.until = this.time + duration;
        n.nextFlip = this.time;
        if (n.out < 1 || n.retracting) n.growTo(1, this.time, GROW_TIME * (1 - n.out * 0.6), easeOutBack);
    }

    private slurp(n: Noodle): void {
        n.until = Infinity;
        if (n.hidden || n.retracting) return;
        n.growTo(0, this.time, SLURP_TIME, easeInCubic);
        n.swing.set(0);
    }

    /** Kick the shoulder back and forth while the arm is out. */
    private drive(n: Noodle): void {
        if (this.reducedMotion || n.hidden || n.retracting || this.time < n.nextFlip) return;
        n.flipSign *= -1;
        if (n.pose.kind === 'wave') {
            n.swing.set(n.flipSign * WAVE_SWING);
            n.nextFlip = this.time + WAVE_HALF_PERIOD;
        } else {
            n.swing.set(n.flipSign * REACH_SWING * (0.5 + Math.random() * 0.5));
            n.nextFlip = this.time + REACH_HALF_PERIOD[0] + Math.random() * (REACH_HALF_PERIOD[1] - REACH_HALF_PERIOD[0]);
        }
    }

    private draw(n: Noodle, paths: ArmPaths, frame: ArmFrame): void {
        if (n.out <= 0.001) {
            paths.outline.setAttribute('d', '');
            paths.fill.setAttribute('d', '');
            return;
        }
        const d = smoothPath(this.centreline(n, frame.anchors[n.side], frame.size));
        const width = Math.max(2, frame.size * THICKNESS);
        paths.outline.setAttribute('d', d);
        paths.outline.setAttribute('stroke-width', f(width + frame.outline));
        paths.fill.setAttribute('d', d);
        paths.fill.setAttribute('stroke-width', f(width));
    }

    /** The arm's centreline, shoulder first; later segments follow older shoulder angles. */
    private centreline(n: Noodle, anchor: ArmPoint, size: number): ArmPoint[] {
        const t = this.time;
        const outward = n.side === 1 ? 1 : -1;
        const pose = n.pose;
        let aim: number;
        let length: number;
        let bend: number;
        let whip: number;
        if (pose.kind === 'reach') {
            const dx = pose.target.x - anchor.x;
            const dy = pose.target.y - anchor.y;
            aim = Math.atan2(dy, dx);
            // Stretches, falls short, tries again.
            const strain = 0.84 + 0.1 * Math.sin(t * 5.5);
            length = Math.min(Math.hypot(dx, dy) * strain, size * REACH_MAX);
            bend = 0;
            whip = 1;
        } else {
            aim = -Math.PI / 2 + outward * WAVE_SPLAY;
            length = size * WAVE_LENGTH;
            bend = -outward * 0.15;
            whip = 1.1;
        }
        const step = (length * n.out) / SEGMENTS;
        const points: ArmPoint[] = [anchor];
        let x = anchor.x;
        let y = anchor.y;
        for (let i = 1; i <= SEGMENTS; i++) {
            const s = i / SEGMENTS;
            // The tip swings wider than the shoulder and a beat later.
            const swing = n.swingAgo(t, s * WHIP_LAG) * (1 + whip * s);
            const heading = aim + bend * s + swing;
            x += Math.cos(heading) * step;
            y += Math.sin(heading) * step;
            points.push({ x, y });
        }
        return points;
    }
}

/** Catmull-Rom through the points, as cubic Béziers. */
function smoothPath(p: readonly ArmPoint[]): string {
    if (p.length < 2) return '';
    let d = `M${f(p[0]!.x)} ${f(p[0]!.y)}`;
    for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] ?? p[i]!;
        const p1 = p[i]!;
        const p2 = p[i + 1]!;
        const p3 = p[i + 2] ?? p2;
        d += `C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
    }
    return d;
}
