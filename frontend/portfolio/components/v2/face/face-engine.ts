import { Spring, SPRINGS } from '../lib/spring';
import { clamp, easeInCubic, easeInOutCubic, lerp, progress, randRange } from '../lib/math';
import { EXPRESSIONS, EYE_X, EYE_Y, bowlPath, lidPath, type EyeShape, type ExpressionName } from './expressions';
import { Floaters } from './floaters';
import type { FaceSignal } from './face-bus';

// The :D's brain and body. Every visible quantity (position, size, tilt,
// squash, nod, each eye, the mouth) is a spring, so any state can flow into
// any other and every change overshoots a little: that is the "juice".
//
// Behaviour runs in layers, highest first:
//   body     intro hop, dive & fall, being held, being thrown
//   reaction spin, nod, :O, $-eyes, petting, flick-chase, "hi!"
//   mood     bored → yawning → asleep (z z z)
//   idle     wander, blinks, glances, random expressions, eye tracking
//
// Timed steps go through a tiny scheduler; starting a new reaction bumps the
// `sequence` so the previous one's pending steps quietly drop.

export interface EyeElements {
    readonly group: SVGGElement;
    readonly dot: SVGEllipseElement;
    readonly happy: SVGPathElement;
    readonly glyph: SVGTextElement;
}

export interface FaceElements {
    /** Wrapper that gets the hole clip while diving. */
    readonly clip: SVGGElement;
    readonly clipShape: SVGEllipseElement;
    readonly root: SVGGElement;
    readonly eyes: readonly [EyeElements, EyeElements];
    readonly bowl: SVGPathElement;
    readonly lid: SVGPathElement;
    readonly floaters: readonly SVGTextElement[];
}

/** Placement of the face; `size` is pixels per 100 face units, `rot` in degrees. */
export interface Pose {
    readonly x: number;
    readonly y: number;
    readonly size: number;
    readonly rot: number;
}

/** The ring's opening on screen. */
export interface Hole {
    readonly cx: number;
    readonly cy: number;
    readonly rx: number;
    readonly ry: number;
}

export interface FaceCallbacks {
    /** Something hit hard; shake the world by `strength`. */
    onImpact(strength: number): void;
    /** Intro finished: the face has landed in the ring. */
    onLanded(): void;
}

type Mode = 'loader' | 'intro' | 'tween' | 'live' | 'held' | 'thrown' | 'fall';
type Reaction = 'spin' | 'nod' | 'ooh' | 'chase' | 'hi';

interface Task {
    readonly at: number;
    readonly run: () => void;
    readonly sequence: number;
}

interface Tween {
    readonly fromX: number;
    readonly fromY: number;
    readonly fromSize: number;
    readonly toX: number;
    readonly toY: number;
    readonly toSize: number;
    readonly start: number;
    readonly duration: number;
    /** Height of the arc above the straight path, px. */
    readonly apex: number;
    readonly ease: (t: number) => number;
    readonly done: () => void;
}

const ALWAYS = -1;
const HOME_EXPRESSION: ExpressionName = 'grin';
const IDLE_MOODS: readonly ExpressionName[] = ['smile', 'beam', 'wink', 'curious', 'content'];

const COOLDOWN = 5;
const BORED_AFTER = 11;
const SLEEP_AFTER = 30;
const YAWN_GAP = [6, 9] as const;
const IDLE_GAP = [4.5, 8.5] as const;
const BLINK_GAP = [2, 5.2] as const;
const Z_GAP = 1.15;
const LOOK_RANGE = 5;
const CHASE_LOOK_RANGE = 10;

/** Pointer travel over the face (px, decaying) that counts as petting. */
const RUB_TO_PET = 320;
const RUB_DECAY = 2.5;
/** Cursor speed (px/s) that counts as a flick. */
const FLICK_SPEED = 2800;
const DRAG_THRESHOLD = 6;
const THROW_DRAG = 1.3;
const THROW_MAX = 3800;
const THROW_REST = 70;
const RESTITUTION = 0.55;
/** Where a thrown face bounces, as a share of the hole's radii. */
const WALL_X = 0.72;
const WALL_Y = 0.62;
const GRAVITY = 9000;
const FALL_KICK = 900;
/** $-eyes switch off/on this many times, ending on $. */
const MONEY_SWITCHES = 6;

const f = (n: number): string => n.toFixed(2);

class EyeSprings {
    readonly rx = new Spring(7.5, SPRINGS.juicy);
    readonly ry = new Spring(7.5, SPRINGS.juicy);
    readonly happy = new Spring(0, SPRINGS.juicy);
    readonly glyph = new Spring(0, SPRINGS.juicy);
    readonly y = new Spring(0, SPRINGS.juicy);
    readonly lookX = new Spring(0, SPRINGS.snappy);
    readonly lookY = new Spring(0, SPRINGS.snappy);
    shape: EyeShape = EXPRESSIONS.grin.eyes;

    all(): Spring[] {
        return [this.rx, this.ry, this.happy, this.glyph, this.y, this.lookX, this.lookY];
    }

    apply(shape: EyeShape): void {
        this.shape = shape;
        this.rx.set(shape.rx);
        this.ry.set(shape.ry);
        this.happy.set(shape.happy);
        this.glyph.set(shape.glyph);
        this.y.set(shape.y);
    }

    look(x: number, y: number): void {
        this.lookX.set(x);
        this.lookY.set(y);
    }
}

export class FaceEngine {
    private mode: Mode = 'loader';
    private time = 0;

    private readonly x = new Spring(0, SPRINGS.soft);
    private readonly y = new Spring(0, SPRINGS.soft);
    private readonly size = new Spring(100, SPRINGS.snappy);
    private readonly rot = new Spring(-90, SPRINGS.snappy);
    private readonly sx = new Spring(1, SPRINGS.wobble);
    private readonly sy = new Spring(1, SPRINGS.wobble);
    private readonly nod = new Spring(0, SPRINGS.nod);
    private readonly eyes = [new EyeSprings(), new EyeSprings()] as const;
    private readonly mouth = {
        w: new Spring(30, SPRINGS.juicy),
        depth: new Spring(40, SPRINGS.juicy),
        arch: new Spring(0, SPRINGS.juicy),
        round: new Spring(0.86, SPRINGS.juicy),
        thick: new Spring(11, SPRINGS.juicy),
        y: new Spring(0, SPRINGS.juicy),
        bowl: new Spring(1, SPRINGS.juicy),
        lid: new Spring(1, SPRINGS.juicy),
    };
    private readonly springs: readonly Spring[];
    private readonly floaters: Floaters;

    private expression: ExpressionName = HOME_EXPRESSION;
    private glyphChar = '';
    private home: Pose = { x: 0, y: 0, size: 100, rot: -14 };
    private hole: Hole | null = null;
    private spin = 0;
    private busyUntil = 0;
    private lastInput = 0;
    private bored = false;
    private sleeping = false;
    private money = false;
    private petting = false;
    private clipped = false;
    private nextIdle = 0;
    private nextBlink = 1.2;
    private nextYawn = 0;
    private nextZ = 0;
    private nextWiggle = 0;
    private nextHeart = 0;
    private wiggleSide = 1;
    private chasingUntil = 0;
    private rub = 0;
    private readonly cooldowns = new Map<Reaction, number>();

    private pointerX = 0;
    private pointerY = 0;
    private pointerAt = -1e9;
    private pointerStamp = 0;
    private pressed: { x: number; y: number } | null = null;
    private grabX = 0;
    private grabY = 0;
    private velX = 0;
    private velY = 0;
    private bounces = 0;

    private tasks: Task[] = [];
    private sequence = 0;
    private tween: Tween | null = null;
    private fallVelocity = 0;

    constructor(
        private readonly el: FaceElements,
        private readonly callbacks: FaceCallbacks,
        private readonly reducedMotion: boolean,
    ) {
        this.springs = [
            this.x, this.y, this.size, this.rot, this.sx, this.sy, this.nod,
            ...this.eyes.flatMap((e) => e.all()),
            ...Object.values(this.mouth),
        ];
        this.floaters = new Floaters(el.floaters);
        this.express(HOME_EXPRESSION, false);
        this.springs.forEach((s) => s.snap(s.target));
    }

    // ─── Public API ────────────────────────────────────────────────────────

    get isLive(): boolean {
        return this.mode === 'live';
    }

    get isHeld(): boolean {
        return this.mode === 'held';
    }

    /** Jump to a pose instantly (the loader keeps the face glued to its text). */
    placeAt(pose: Pose): void {
        this.x.snap(pose.x);
        this.y.snap(pose.y);
        this.size.snap(pose.size);
        this.rot.snap(pose.rot);
    }

    setHome(home: Pose, hole: Hole): void {
        this.home = home;
        this.hole = hole;
    }

    isOver(x: number, y: number): boolean {
        return Math.hypot(x - this.x.value, y - this.y.value) < this.size.value * 0.5;
    }

    /** Pointer moved: eye tracking, petting, flick detection, dragging. */
    pointer(x: number, y: number): void {
        const now = performance.now();
        const elapsed = now - this.pointerStamp;
        const dist = Math.hypot(x - this.pointerX, y - this.pointerY);
        const speed = elapsed > 0 && elapsed < 120 ? (dist / elapsed) * 1000 : 0;
        this.pointerStamp = now;
        this.pointerX = x;
        this.pointerY = y;
        this.pointerAt = this.time;

        if (this.pressed && Math.hypot(x - this.pressed.x, y - this.pressed.y) > DRAG_THRESHOLD) {
            this.grab();
            return;
        }
        if (this.mode !== 'live') return;
        if (!this.pressed && this.isOver(x, y)) this.rub += dist;
        if (speed > FLICK_SPEED) this.chase();
    }

    /** Press on the face: becomes a click (dive) or a drag (grab & throw). */
    pointerDown(x: number, y: number): boolean {
        if (this.mode !== 'live' || this.money || !this.isOver(x, y)) return false;
        this.pressed = { x, y };
        this.input();
        return true;
    }

    pointerUp(): void {
        if (this.mode === 'held') {
            this.release();
            return;
        }
        if (!this.pressed) return;
        this.pressed = null;
        this.dive();
    }

    /** Any user activity: keeps boredom away, or wakes it up. */
    input(): void {
        this.lastInput = this.time;
        if (this.mode !== 'live') return;
        if (this.sleeping) this.jolt();
        else if (this.bored) this.wake();
    }

    signal(s: FaceSignal): void {
        if (this.mode !== 'live') return;
        this.input();
        if (s.type === 'money') {
            this.setMoney(s.on);
            return;
        }
        if (this.money || this.petting) return;
        if (s.type === 'spin') {
            if (this.claim('spin')) this.doSpin();
            return;
        }
        const order: Reaction[] = Math.random() < 0.5 ? ['nod', 'ooh'] : ['ooh', 'nod'];
        const pick = order.find((r) => this.claim(r));
        if (pick === 'nod') this.doNod();
        if (pick === 'ooh') this.doOoh();
    }

    /** The visitor came back to the tab: pop up and wave. */
    welcomeBack(): void {
        if (this.mode !== 'live' || this.money || !this.claim('hi')) return;
        this.sleeping = false;
        this.bored = false;
        this.lastInput = this.time;
        this.cancel();
        const seq = this.sequence;
        this.busyUntil = this.time + 2;
        this.express('beam');
        this.hop(0.9);
        for (let i = 0; i < 5; i++) {
            this.after(0.12 + i * 0.16, () => this.rot.kick(i % 2 === 0 ? 170 : -170), seq);
        }
        this.say('hi!', 0.3, { vy: -26, life: 1.8 });
        this.after(1.7, () => this.express(HOME_EXPRESSION), seq);
    }

    /** Loader done: wake up, beam, and hop over into the ring. */
    beginIntro(): void {
        if (this.mode !== 'loader') return;
        this.mode = 'intro';
        if (this.reducedMotion) {
            this.placeAt(this.home);
            this.goLive();
            this.callbacks.onLanded();
            return;
        }
        const seq = this.sequence;
        this.size.set(this.size.value * 1.7);
        this.rot.set(this.home.rot);
        this.sy.kick(-3);
        this.sx.kick(2);
        this.after(0.12, () => this.express('beam'), seq);
        this.after(0.85, () => this.anticipate(0.7), seq);
        this.after(1.02, () =>
            this.startTween({
                to: this.home,
                duration: 0.78,
                apex: this.home.size * 1.6,
                ease: (t) => t,
                done: () => {
                    this.land(1.3);
                    this.express(HOME_EXPRESSION);
                    this.goLive();
                    this.callbacks.onLanded();
                },
            }),
        seq);
    }

    update(dt: number): void {
        this.time += dt;
        this.rub *= Math.exp(-dt * RUB_DECAY);
        this.runTasks();
        if (this.tween) this.updateTween();
        else if (this.mode === 'fall') this.updateFall(dt);
        else if (this.mode === 'held') this.updateHeld(dt);
        else if (this.mode === 'thrown') this.updateThrown(dt);
        else if (this.mode === 'live') this.updateLive();
        else if (this.time >= this.nextBlink) this.autoBlink();
        for (const s of this.springs) s.update(dt);
        this.floaters.update(dt);
        this.render();
    }

    // ─── Expressions & small gestures ──────────────────────────────────────

    private express(name: ExpressionName, kick = true): void {
        const e = EXPRESSIONS[name];
        const changed = name !== this.expression;
        this.expression = name;
        this.eyes[0].apply(e.eyes);
        this.eyes[1].apply(e.rightEye ?? e.eyes);
        if (e.glyph && e.glyph !== this.glyphChar) {
            this.glyphChar = e.glyph;
            this.el.eyes.forEach((eye) => {
                eye.glyph.textContent = e.glyph ?? '';
            });
        }
        const m = this.mouth;
        m.w.set(e.mouth.w);
        m.depth.set(e.mouth.depth);
        m.arch.set(e.mouth.arch);
        m.round.set(e.mouth.round);
        m.thick.set(e.mouth.thick);
        m.y.set(e.mouth.y);
        m.bowl.set(e.mouth.bowl);
        m.lid.set(e.mouth.lid);
        if (kick && changed && !this.reducedMotion) {
            this.sy.kick(-2.4);
            this.sx.kick(1.8);
            this.rot.kick(randRange(-70, 70));
        }
    }

    /** Pop a word out of the face's top-right, like a typed aside. */
    private say(text: string, scale: number, motion: { vx?: number; vy?: number; life?: number } = {}): void {
        const size = this.size.value;
        this.floaters.spawn(text, this.x.value + size * 0.42, this.y.value - size * 0.55, size * scale, motion);
    }

    private blink(): void {
        this.eyes.forEach((e) => {
            if (e.shape.happy > 0.5 || e.shape.glyph > 0.5 || e.shape.ry < 3.5) return;
            e.ry.set(1);
            e.rx.set(e.shape.rx * 1.15);
        });
        this.after(0.09, () => this.eyes.forEach((e) => e.apply(e.shape)), ALWAYS);
    }

    private autoBlink(): void {
        this.blink();
        if (Math.random() < 0.22) this.after(0.2, () => this.blink(), ALWAYS);
        this.nextBlink = this.time + randRange(BLINK_GAP[0], BLINK_GAP[1]);
    }

    /** A little jump in place. */
    private hop(strength: number): void {
        if (this.reducedMotion) return;
        this.nod.kick(-420 * strength);
        this.sy.kick(4 * strength);
        this.after(0.32, () => this.sy.kick(-4 * strength), ALWAYS);
    }

    /** Crouch before a jump. */
    private anticipate(amount: number): void {
        this.sy.set(1 - 0.26 * amount);
        this.sx.set(1 + 0.18 * amount);
    }

    private land(strength: number): void {
        this.sy.set(1);
        this.sx.set(1);
        if (!this.reducedMotion) {
            this.sy.kick(-9 * strength);
            this.sx.kick(7 * strength);
            this.nod.kick(260 * strength);
        }
        this.callbacks.onImpact(strength);
    }

    // ─── Reactions ─────────────────────────────────────────────────────────

    private claim(reaction: Reaction): boolean {
        if ((this.cooldowns.get(reaction) ?? -Infinity) > this.time) return false;
        this.cooldowns.set(reaction, this.time + COOLDOWN);
        return true;
    }

    private doSpin(): void {
        this.cancel();
        const seq = this.sequence;
        this.busyUntil = this.time + 1.7;
        this.express('beam');
        this.spin += 360;
        this.hop(0.6);
        this.after(1.25, () => this.express(HOME_EXPRESSION), seq);
    }

    private doNod(): void {
        this.cancel();
        const seq = this.sequence;
        this.busyUntil = this.time + 1.4;
        this.express('content');
        this.nod.kick(300);
        this.after(0.24, () => this.nod.kick(300), seq);
        this.after(0.48, () => this.nod.kick(200), seq);
        this.after(1.2, () => this.express(HOME_EXPRESSION), seq);
    }

    private doOoh(): void {
        this.cancel();
        const seq = this.sequence;
        this.busyUntil = this.time + 1.3;
        this.express('ooh');
        this.sy.kick(6);
        this.sx.kick(-4);
        this.hop(0.35);
        this.after(1.15, () => this.express(HOME_EXPRESSION), seq);
    }

    /** $-eyes that swap off and on three times (each swap hidden in a blink), ending on $. */
    private setMoney(on: boolean): void {
        if (on === this.money) return;
        this.money = on;
        this.cancel();
        if (!on) {
            this.busyUntil = this.time + 0.4;
            this.express(HOME_EXPRESSION);
            return;
        }
        const seq = this.sequence;
        this.busyUntil = Infinity;
        this.stopPet();
        this.express('money');
        this.hop(0.5);
        for (let i = 1; i <= MONEY_SWITCHES; i++) {
            const glyph = i % 2 === 1 ? 0 : 1;
            this.after(0.32 + (i - 1) * 0.2, () => {
                this.eyes.forEach((e) => e.ry.set(1.2));
                this.after(0.05, () => this.eyes.forEach((e) => e.apply({ ...e.shape, glyph })), seq);
            }, seq);
        }
    }

    /** A fast flick of the cursor: eyes try to keep up, then spin out. */
    private chase(): void {
        if (this.money || this.petting || !this.claim('chase')) return;
        this.cancel();
        const seq = this.sequence;
        this.busyUntil = this.time + 2.2;
        this.chasingUntil = this.time + 0.8;
        this.express('ooh');
        this.after(0.8, () => {
            this.express('spiral');
            this.sx.kick(4);
            for (let i = 0; i < 4; i++) this.after(i * 0.14, () => this.rot.kick(i % 2 ? -220 : 220), seq);
        }, seq);
        this.after(2.0, () => this.express(HOME_EXPRESSION), seq);
    }

    // ─── Petting ───────────────────────────────────────────────────────────

    private updatePet(): void {
        if (this.money) return;
        if (!this.petting) {
            if (this.rub < RUB_TO_PET) return;
            this.petting = true;
            this.cancel();
            this.express('content');
            this.nextWiggle = this.time;
            this.nextHeart = this.time + 0.25;
        }
        if (this.rub < RUB_TO_PET * 0.3) {
            this.stopPet();
            return;
        }
        this.busyUntil = this.time + 0.6;
        if (this.reducedMotion) return;
        if (this.time >= this.nextWiggle) {
            this.rot.kick(this.wiggleSide * 140);
            this.sx.kick(1.5);
            this.wiggleSide *= -1;
            this.nextWiggle = this.time + 0.11;
        }
        if (this.time >= this.nextHeart) {
            const size = this.size.value;
            this.floaters.spawn('<3', this.x.value + randRange(-0.3, 0.3) * size, this.y.value - size * 0.45, size * 0.22, {
                vx: randRange(-15, 15),
                vy: -60,
                life: 1.6,
            });
            this.nextHeart = this.time + 0.55;
        }
    }

    private stopPet(): void {
        if (!this.petting) return;
        this.petting = false;
        this.rub = 0;
        const seq = this.sequence;
        this.express('beam');
        this.busyUntil = this.time + 0.7;
        this.after(0.6, () => this.express(HOME_EXPRESSION), seq);
    }

    // ─── Moods: bored, yawning, asleep ─────────────────────────────────────

    private updateMood(): void {
        if (this.money || this.petting || this.time < this.busyUntil) return;
        const idle = this.time - this.lastInput;
        if (this.sleeping) {
            if (this.time >= this.nextZ) this.snore();
            return;
        }
        if (!this.bored && idle > BORED_AFTER) {
            this.bored = true;
            this.cancel();
            this.express('bored');
            this.nextYawn = this.time + 2.2;
            return;
        }
        if (this.bored) {
            if (idle > SLEEP_AFTER) this.fallAsleep();
            else if (this.time >= this.nextYawn) this.yawn();
            return;
        }
        if (this.time >= this.nextIdle) this.idleExpression();
    }

    private yawn(): void {
        const seq = this.sequence;
        this.busyUntil = this.time + 2;
        this.express('yawn');
        this.sy.kick(5);
        this.after(1.6, () => this.express('bored'), seq);
        this.nextYawn = this.time + randRange(YAWN_GAP[0], YAWN_GAP[1]);
    }

    private fallAsleep(): void {
        this.sleeping = true;
        this.cancel();
        this.express('sleep');
        this.nextZ = this.time + 0.6;
    }

    private snore(): void {
        const size = this.size.value;
        const big = Math.random() < 0.4;
        this.floaters.spawn(big ? 'Z' : 'z', this.x.value + size * 0.38, this.y.value - size * 0.3, size * (big ? 0.26 : 0.18), {
            vx: 22,
            vy: -38,
            life: 2.6,
            sway: 8,
        });
        this.nextZ = this.time + Z_GAP;
    }

    /** Woken from sleep: a startled jump. */
    private jolt(): void {
        this.sleeping = false;
        this.bored = false;
        this.cancel();
        const seq = this.sequence;
        this.busyUntil = this.time + 1.4;
        this.express('ooh');
        if (!this.reducedMotion) {
            this.nod.kick(-760);
            this.sy.kick(9);
            this.rot.kick(randRange(-260, 260));
        }
        this.say('!', 0.32, { vy: -30, life: 1 });
        this.callbacks.onImpact(0.3);
        this.after(0.9, () => this.express(HOME_EXPRESSION), seq);
        this.nextIdle = this.time + 4;
    }

    /** Roused from boredom: a curious blink. */
    private wake(): void {
        this.bored = false;
        this.cancel();
        const seq = this.sequence;
        this.busyUntil = this.time + 0.9;
        this.express('curious');
        this.hop(0.7);
        this.blink();
        this.after(0.55, () => this.express(HOME_EXPRESSION), seq);
        this.nextIdle = this.time + 4;
    }

    private idleExpression(): void {
        const options = IDLE_MOODS.filter((n) => n !== this.expression);
        const pick = options[Math.floor(Math.random() * options.length)] ?? 'smile';
        const seq = this.sequence;
        const hold = randRange(1.4, 2.6);
        this.express(pick);
        if (Math.random() < 0.45) this.hop(0.5);
        this.busyUntil = this.time + hold;
        this.after(hold, () => this.express(HOME_EXPRESSION), seq);
        this.nextIdle = this.time + hold + randRange(IDLE_GAP[0], IDLE_GAP[1]);
    }

    // ─── Grab & throw ──────────────────────────────────────────────────────

    private grab(): void {
        const p = this.pressed;
        this.pressed = null;
        if (!p || this.mode !== 'live') return;
        this.cancel();
        this.stopPet();
        this.mode = 'held';
        this.busyUntil = Infinity;
        this.grabX = this.x.value - p.x;
        this.grabY = this.y.value - p.y;
        this.velX = 0;
        this.velY = 0;
        this.express('ooh');
        const seq = this.sequence;
        this.after(0.45, () => this.express('beam'), seq);
    }

    private updateHeld(dt: number): void {
        const k = 1 - Math.exp(-dt * 28);
        const nx = lerp(this.x.value, this.pointerX + this.grabX, k);
        const ny = lerp(this.y.value, this.pointerY + this.grabY, k);
        if (dt > 0) {
            this.velX = lerp(this.velX, (nx - this.x.value) / dt, 0.35);
            this.velY = lerp(this.velY, (ny - this.y.value) / dt, 0.35);
        }
        this.x.snap(nx);
        this.y.snap(ny);
        const speed = Math.hypot(this.velX, this.velY);
        this.rot.set(this.home.rot + this.spin + clamp(this.velX * 0.012, -30, 30));
        this.sy.set(1 + Math.min(speed / 5000, 0.14));
        this.sx.set(1 - Math.min(speed / 7000, 0.1));
        this.updateLook(true);
    }

    private release(): void {
        this.cancel();
        this.bounces = 0;
        this.sx.set(1);
        this.sy.set(1);
        const speed = Math.hypot(this.velX, this.velY);
        const scale = speed > THROW_MAX ? THROW_MAX / speed : 1;
        this.velX *= scale;
        this.velY *= scale;
        this.mode = 'thrown';
        if (speed < THROW_REST * 2) {
            this.settle();
            return;
        }
        this.express('ooh');
    }

    private updateThrown(dt: number): void {
        const drag = Math.exp(-dt * THROW_DRAG);
        this.velX *= drag;
        this.velY *= drag;
        let x = this.x.value + this.velX * dt;
        let y = this.y.value + this.velY * dt;

        // Bounce off the inside of the ring.
        const hole = this.hole;
        if (hole) {
            const a = hole.rx * WALL_X;
            const b = hole.ry * WALL_Y;
            const dx = x - hole.cx;
            const dy = y - hole.cy;
            const e = (dx / a) ** 2 + (dy / b) ** 2;
            if (e > 1) {
                const s = 1 / Math.sqrt(e);
                x = hole.cx + dx * s;
                y = hole.cy + dy * s;
                let nx = dx / (a * a);
                let ny = dy / (b * b);
                const len = Math.hypot(nx, ny) || 1;
                nx /= len;
                ny /= len;
                const vn = this.velX * nx + this.velY * ny;
                if (vn > 0) {
                    this.velX -= (1 + RESTITUTION) * vn * nx;
                    this.velY -= (1 + RESTITUTION) * vn * ny;
                    this.bump(vn / 1600);
                }
            }
        }

        this.x.snap(x);
        this.y.snap(y);
        // Rolls as it slides.
        this.spin += this.velX * dt * 0.35;
        this.rot.set(this.home.rot + this.spin);
        if (Math.hypot(this.velX, this.velY) < THROW_REST) this.settle();
    }

    private bump(strength: number): void {
        if (strength < 0.12) return;
        const s = Math.min(1.2, strength);
        this.bounces++;
        this.express('ooh');
        if (!this.reducedMotion) {
            this.sx.kick(-6 * s);
            this.sy.kick(5 * s);
        }
        this.callbacks.onImpact(s * 0.7);
    }

    /** Comes to rest after a throw; grumbles if it hit the wall. */
    private settle(): void {
        this.mode = 'live';
        this.spin = Math.round(this.spin / 360) * 360;
        this.lastInput = this.time;
        const seq = this.sequence;
        this.busyUntil = this.time + 1.6;
        if (this.bounces > 0) {
            this.express('grumpy');
            this.say('hey!', 0.24, { vy: -34, life: 1.4 });
            this.after(1.4, () => this.express(HOME_EXPRESSION), seq);
        } else {
            this.express('beam');
            this.after(0.9, () => this.express(HOME_EXPRESSION), seq);
        }
    }

    // ─── Dive into the ring, fall back from the sky ────────────────────────

    private dive(): void {
        this.cancel();
        this.stopPet();
        this.mode = 'tween';
        this.busyUntil = Infinity;
        this.express('ooh');
        this.setClip(true);
        const hole = this.hole ?? { cx: this.home.x, cy: this.home.y, rx: 100, ry: 60 };
        this.startTween({
            to: { x: this.x.value, y: hole.cy + hole.ry + this.size.value * 0.75, size: this.size.value, rot: 0 },
            duration: 0.5,
            apex: this.home.size * 0.6,
            ease: easeInCubic,
            done: () => this.startFall(),
        });
    }

    private startFall(): void {
        this.setClip(false);
        this.mode = 'fall';
        const spread = this.hole ? this.hole.rx * 0.15 : 0;
        this.x.snap(this.home.x + randRange(-1, 1) * spread);
        this.y.snap(-this.home.size * 0.8);
        this.size.snap(this.home.size);
        this.fallVelocity = FALL_KICK;
        this.spin += 360;
        this.express('ooh');
        this.sy.set(1.18);
        this.sx.set(0.88);
    }

    private updateFall(dt: number): void {
        this.fallVelocity += GRAVITY * dt;
        const y = this.y.value + this.fallVelocity * dt;
        if (y < this.home.y) {
            this.y.snap(y);
            return;
        }
        this.y.snap(this.home.y);
        this.mode = 'live';
        this.land(1.6);
        this.express('dizzy');
        const seq = this.sequence;
        this.busyUntil = this.time + 2.6;
        this.after(1.7, () => this.express('beam'), seq);
        this.after(2.4, () => this.express(HOME_EXPRESSION), seq);
    }

    private startTween(spec: { to: Pose; duration: number; apex: number; ease: (t: number) => number; done: () => void }): void {
        this.tween = {
            fromX: this.x.value,
            fromY: this.y.value,
            fromSize: this.size.value,
            toX: spec.to.x,
            toY: spec.to.y,
            toSize: spec.to.size,
            start: this.time,
            duration: spec.duration,
            apex: spec.apex,
            ease: spec.ease,
            done: spec.done,
        };
    }

    private updateTween(): void {
        const tw = this.tween;
        if (!tw) return;
        const s = progress(this.time, tw.start, tw.start + tw.duration);
        const e = tw.ease(s);
        this.x.snap(lerp(tw.fromX, tw.toX, e));
        this.y.snap(lerp(tw.fromY, tw.toY, e) - tw.apex * 4 * s * (1 - s));
        this.size.snap(lerp(tw.fromSize, tw.toSize, easeInOutCubic(s)));
        // Stretched while travelling fast (take-off and touch-down), round at the apex.
        const speed = Math.abs(1 - 2 * s);
        this.sy.set(1 + 0.18 * speed);
        this.sx.set(1 - 0.12 * speed);
        if (s < 1) return;
        this.tween = null;
        tw.done();
    }

    private setClip(on: boolean): void {
        this.clipped = on;
        if (on) this.el.clip.setAttribute('clip-path', 'url(#v2-hole-clip)');
        else this.el.clip.removeAttribute('clip-path');
    }

    // ─── Idle life ─────────────────────────────────────────────────────────

    private goLive(): void {
        this.mode = 'live';
        this.lastInput = this.time;
        this.nextIdle = this.time + 3;
        this.busyUntil = this.time + 0.8;
    }

    private updateLive(): void {
        const t = this.time;
        const home = this.home;
        const hole = this.hole;
        const fresh = t - this.pointerAt < 3;
        const chasing = t < this.chasingUntil;

        // Float around inside the ring, drawn slightly towards the cursor.
        const calm = this.sleeping ? 0.2 : this.bored ? 0.45 : 1;
        const motion = this.reducedMotion ? 0 : calm;
        const wx = (Math.sin(t * 0.31) * 0.65 + Math.sin(t * 0.73 + 1.7) * 0.35) * motion;
        const wy = (Math.sin(t * 0.43 + 0.6) * 0.6 + Math.sin(t * 0.97) * 0.4) * motion;
        const droop = this.sleeping ? 0.18 : this.bored ? 0.1 : 0;
        let tx = home.x + wx * (hole ? hole.rx * 0.14 : 0);
        let ty = home.y + wy * (hole ? hole.ry * 0.08 : 0) + (hole ? hole.ry * droop : 0);
        if (fresh && hole && !this.reducedMotion && !this.sleeping) {
            tx += clamp((this.pointerX - home.x) / (hole.rx * 3), -1, 1) * hole.rx * 0.12;
            ty += clamp((this.pointerY - home.y) / (hole.ry * 3), -1, 1) * hole.ry * 0.1;
        }
        this.x.set(tx);
        this.y.set(ty);
        this.size.set(home.size * (this.sleeping ? 0.92 : this.bored ? 0.95 : 1));
        const lean = fresh ? clamp((this.pointerX - this.x.value) / 600, -1, 1) * (chasing ? 22 : 7) : 0;
        this.rot.set(home.rot + this.spin + wx * 5 + lean);

        this.updateLook(fresh);
        this.updatePet();
        this.updateMood();
        if (t >= this.nextBlink && !this.sleeping) this.autoBlink();
    }

    /** Eyes track the cursor (in the face's own rotated frame), or glance around. */
    private updateLook(fresh: boolean): void {
        let lx: number;
        let ly: number;
        const chasing = this.time < this.chasingUntil;
        if (fresh && !this.sleeping) {
            const dx = this.pointerX - this.x.value;
            const dy = this.pointerY - this.y.value;
            const a = (-this.rot.value * Math.PI) / 180;
            const localX = dx * Math.cos(a) - dy * Math.sin(a);
            const localY = dx * Math.sin(a) + dy * Math.cos(a);
            const dist = Math.hypot(localX, localY) || 1;
            const reach = chasing ? CHASE_LOOK_RANGE : Math.min(1, dist / 250) * LOOK_RANGE;
            lx = (localX / dist) * reach;
            ly = (localY / dist) * reach * 0.8;
        } else {
            lx = Math.sin(this.time * 0.5) * 2.5;
            ly = Math.sin(this.time * 0.37) * 1.5 + (this.bored || this.sleeping ? 2 : 0);
        }
        this.eyes.forEach((e) => e.look(lx, ly));
    }

    // ─── Scheduler ─────────────────────────────────────────────────────────

    private after(delay: number, run: () => void, sequence = this.sequence): void {
        this.tasks.push({ at: this.time + delay, run, sequence });
    }

    /** Drop the pending steps of whatever reaction was playing. */
    private cancel(): void {
        this.sequence++;
    }

    private runTasks(): void {
        if (this.tasks.length === 0) return;
        const due = this.tasks.filter((task) => task.at <= this.time);
        if (due.length === 0) return;
        this.tasks = this.tasks.filter((task) => task.at > this.time);
        due.forEach((task) => {
            if (task.sequence === ALWAYS || task.sequence === this.sequence) task.run();
        });
    }

    // ─── Render ────────────────────────────────────────────────────────────

    private render(): void {
        const k = this.size.value / 100;
        const sx = this.sx.value;
        const sy = this.sy.value;
        const floating = this.mode === 'live' && !this.reducedMotion;
        const bob = floating ? Math.sin(this.time * (this.sleeping ? 0.9 : 1.9)) * 2.2 : 0;
        // Squash around the bottom of the face so landings read as weight.
        const plant = (1 - sy) * 38 * k;
        const y = this.y.value + (this.nod.value + bob) * k + plant;
        this.el.root.setAttribute(
            'transform',
            `translate(${f(this.x.value)} ${f(y)}) scale(${f(sx)} ${f(sy)}) rotate(${f(this.rot.value)}) scale(${f(k)})`,
        );

        this.eyes.forEach((e, i) => {
            const node = this.el.eyes[i === 0 ? 0 : 1];
            const side = i === 0 ? -1 : 1;
            node.group.setAttribute('transform', `translate(${f(side * EYE_X + e.lookX.value)} ${f(EYE_Y + e.y.value + e.lookY.value)})`);
            const happy = clamp(e.happy.value);
            const glyph = clamp(e.glyph.value);
            const keep = 1 - Math.max(happy, glyph);
            node.dot.setAttribute('rx', f(Math.max(0.01, e.rx.value * keep)));
            node.dot.setAttribute('ry', f(Math.max(0.01, e.ry.value * keep)));
            node.happy.setAttribute('opacity', f(happy));
            node.happy.setAttribute('transform', `scale(${f(Math.max(0, 0.4 + 0.6 * e.happy.value))})`);
            node.glyph.setAttribute('opacity', f(glyph));
            node.glyph.setAttribute('transform', `scale(${f(Math.max(0, 0.3 + 0.7 * e.glyph.value))})`);
        });

        const m = this.mouth;
        const thick = f(Math.max(1, m.thick.value));
        this.el.bowl.setAttribute('d', bowlPath(m.w.value, m.depth.value, m.round.value, m.y.value));
        this.el.bowl.setAttribute('stroke-width', thick);
        this.el.bowl.setAttribute('opacity', f(clamp(m.bowl.value)));
        this.el.lid.setAttribute('d', lidPath(m.w.value, m.arch.value, m.y.value));
        this.el.lid.setAttribute('stroke-width', thick);
        this.el.lid.setAttribute('opacity', f(clamp(m.lid.value)));

        if (this.clipped && this.hole) {
            this.el.clipShape.setAttribute('cx', f(this.hole.cx));
            this.el.clipShape.setAttribute('cy', f(this.hole.cy));
            this.el.clipShape.setAttribute('rx', f(this.hole.rx));
            this.el.clipShape.setAttribute('ry', f(this.hole.ry));
        }
    }
}
