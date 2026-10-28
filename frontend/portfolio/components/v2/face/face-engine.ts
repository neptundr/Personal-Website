import { Spring, SPRINGS } from '../lib/spring';
import { clamp, easeInCubic, easeInOutCubic, lerp, progress, randRange } from '../lib/math';
import {
    EXPRESSIONS,
    EYE_UPRIGHT,
    FACE_FONT_SIZE,
    FACE_LETTER_SPACING,
    type ExpressionName,
} from './expressions';
import { Floaters, type FloatMotion } from './floaters';
import type { FaceSignal } from './face-bus';

// The :D's brain and body. The face itself is three characters of the site
// font (two eyes, a mouth), laid out exactly like the text ":D". Changing
// expression swaps characters with a pop: dip, swap at the bottom, overshoot.
// The body (position, size, tilt, squash, nod) is all springs, so every move
// overshoots a little: that's the "juice".
//
// Behaviour runs in layers, highest first:
//   body     intro hop, dive & fall, being held, being thrown
//   reaction spin, nod, :O, $-eyes, petting, "hi!"
//   mood     bored → yawning → asleep (z z z)
//   idle     wander, blinks, glances, random expressions, eye tracking
//
// Timed steps go through a tiny scheduler; starting a new reaction bumps the
// `sequence` so the previous one's pending steps quietly drop.

export interface FaceElements {
    /** Wrapper that gets the hole clip while diving. */
    readonly clip: SVGGElement;
    readonly clipShape: SVGEllipseElement;
    /** Everything above the opening's centre line: the dive only clips below it. */
    readonly clipTop: SVGRectElement;
    readonly root: SVGGElement;
    readonly eyes: readonly [SVGTextElement, SVGTextElement];
    readonly mouth: SVGTextElement;
    readonly floaters: readonly SVGTextElement[];
}

/** Ink bounds of a character relative to its text origin (alphabetic baseline). */
interface GlyphBox {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    readonly advance: number;
}

/** Placement of the face; `size` is the font size in px, `rot` in degrees (0 = reads as text). */
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
type Reaction = 'spin' | 'nod' | 'ooh' | 'hi';

interface Point {
    readonly x: number;
    readonly y: number;
}

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

/** Where the colon's dots and the mouth sit, measured from the real font. */
interface Layout {
    readonly lowerEye: Point;
    readonly upperEye: Point;
    readonly mouthX: number;
    readonly centre: Point;
    readonly radius: number;
}

const ALWAYS = -1;
const HOME_EXPRESSION: ExpressionName = 'grin';
const IDLE_MOODS: readonly ExpressionName[] = ['smile', 'beam', 'wink', 'curious', 'content', 'tongue', 'cat'];
const REPLIES = ['hey!', 'ouch!', 'oof!', 'ow!', 'easy!'] as const;
const REQUESTS = ['pet me?', 'play with me!', 'throw me!', 'pet me pls', 'wanna play?'] as const;
/** The first request lands in this window (seconds since the page started)… */
const FIRST_REQUEST = [6, 12] as const;
/** …later ones are rare. */
const REQUEST_GAP = [40, 75] as const;
const REQUEST_RETRY = 1;
/** No request while the visitor has petted, grabbed or clicked it this recently, seconds. */
const PLAY_QUIET = 20;
/** No idle expression starts this close (seconds) before a request. */
const REQUEST_CLEARANCE = 3;

/** Minimum gap between two plays of the same hover reaction, seconds. */
const COOLDOWN = 2.5;
const BORED_AFTER = 11;
const SLEEP_AFTER = 30;
const YAWN_GAP = [6, 9] as const;
const IDLE_GAP = [4.5, 8.5] as const;
const BLINK_GAP = [2, 5.2] as const;
const BLINK_HOLD = 0.07;
/** Quick blinks squash the eye flat and spring back; "-" is only for eyes that stay shut. */
const BLINK_SQUASH = 0.08;
const Z_GAP = 1.15;
/** How far eyes shift towards the cursor, face units. */
const LOOK_RANGE = 5;
/** How far the whole face drifts towards the cursor, as a share of the hole's radii. */
const FOLLOW_X = 0.22;
const FOLLOW_Y = 0.16;
/** Cursor distance (in hole radii) at which the follow drift maxes out. */
const FOLLOW_REACH = 2.2;
/** Max lean towards the cursor, degrees. */
const FOLLOW_LEAN = 12;

/** Pointer travel over the face (px, decaying) that counts as petting. */
const RUB_TO_PET = 320;
const RUB_DECAY = 2.5;
const DRAG_THRESHOLD = 6;
const THROW_DRAG = 1.3;
const THROW_MAX = 3800;
const THROW_REST = 70;
const RESTITUTION = 0.55;
/** Where a thrown face bounces, as a share of the hole's radii. */
const WALL_X = 0.72;
const WALL_Y = 0.62;
/** The dive's mask sits this share of the hole's height above the traced opening. */
const MASK_LIFT = 0.14;
const GRAVITY = 9000;
const FALL_KICK = 900;
/** The intro hop into the ring: arc height in face sizes, and duration. */
const INTRO_HOP_HEIGHT = 0.9;
const INTRO_HOP_TIME = 0.5;
/** $-eyes blink this many times, staying $ throughout. */
const MONEY_BLINKS = 3;
const MONEY_BLINK_GAP = 0.24;
/** Glyph pop: dip to this scale, swap the character once below SWAP_AT. */
const POP_DIP = 0.45;
const SWAP_AT = 0.6;
/** Eyes that aren't colon dots (^ $ × -) move this much further apart… */
const GLYPH_EYE_SPREAD = 1.55;
/** …and are scaled to fill this share of the gap between eye centres. */
const GLYPH_EYE_FILL = 0.92;

const f = (n: number): string => n.toFixed(2);

/** One character of the face, swapped with a pop. */
class Glyph {
    readonly pop = new Spring(1, SPRINGS.juicy);
    char: string;
    private pending: string | null = null;

    constructor(
        private readonly node: SVGTextElement,
        char: string,
    ) {
        this.char = char;
        node.textContent = char;
    }

    /** Swap the character, with a pop (dip, swap, overshoot) or instantly (blinks). */
    set(char: string, pop = true): void {
        if (!pop) {
            this.pending = null;
            this.write(char);
            return;
        }
        if (char === this.char) {
            if (this.pending !== null) {
                this.pending = null;
                this.pop.set(1);
            }
            return;
        }
        this.pending = char;
        this.pop.set(POP_DIP);
    }

    /** The character it's heading to (for decisions that shouldn't wait for the pop). */
    get target(): string {
        return this.pending ?? this.char;
    }

    update(dt: number): void {
        this.pop.update(dt);
        if (this.pending !== null && this.pop.value <= SWAP_AT) {
            this.write(this.pending);
            this.pending = null;
            this.pop.set(1);
        }
    }

    private write(char: string): void {
        this.char = char;
        this.node.textContent = char;
    }
}

export class FaceEngine {
    private mode: Mode = 'loader';
    private time = 0;

    private readonly x = new Spring(0, SPRINGS.soft);
    private readonly y = new Spring(0, SPRINGS.soft);
    private readonly size = new Spring(100, SPRINGS.snappy);
    private readonly rot = new Spring(0, SPRINGS.snappy);
    private readonly sx = new Spring(1, SPRINGS.wobble);
    private readonly sy = new Spring(1, SPRINGS.wobble);
    private readonly nod = new Spring(0, SPRINGS.nod);
    private readonly lookX = new Spring(0, SPRINGS.snappy);
    private readonly lookY = new Spring(0, SPRINGS.snappy);
    private readonly mouthScale = new Spring(1, SPRINGS.juicy);
    private readonly blinkSquash = new Spring(1, { stiffness: 1400, damping: 30 });
    private readonly eyeSpread = new Spring(1, SPRINGS.juicy);
    private readonly springs: readonly Spring[];
    private readonly eyes: readonly [Glyph, Glyph];
    private readonly mouth: Glyph;
    private readonly floaters: Floaters;
    private readonly glyphCentres = new Map<string, Point>();
    private readonly glyphBoxes = new Map<string, GlyphBox | null>();
    /** SVG getBBox() reports the em box, not the ink, so glyphs are measured on a canvas. */
    private readonly metrics = document.createElement('canvas').getContext('2d');
    private layout: Layout;

    private expression: ExpressionName = HOME_EXPRESSION;
    private home: Pose = { x: 0, y: 0, size: 100, rot: 76 };
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
    private nextRequest = randRange(FIRST_REQUEST[0], FIRST_REQUEST[1]);
    private lastPlay = -Infinity;
    private nextBlink = 1.2;
    private nextYawn = 0;
    private nextZ = 0;
    private nextWiggle = 0;
    private nextHeart = 0;
    private wiggleSide = 1;
    private rub = 0;
    private lastReply = '';
    private readonly cooldowns = new Map<Reaction, number>();

    private pointerX = 0;
    private pointerY = 0;
    private pointerAt = -1e9;
    private pressed: Point | null = null;
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
        /** CSS font-family list of the site font, for measuring glyphs. */
        private readonly fontFamily: string,
    ) {
        const grin = EXPRESSIONS[HOME_EXPRESSION];
        this.eyes = [new Glyph(el.eyes[0], grin.eyes[0]), new Glyph(el.eyes[1], grin.eyes[1])];
        this.mouth = new Glyph(el.mouth, grin.mouth);
        this.springs = [
            this.x, this.y, this.size, this.rot, this.sx, this.sy, this.nod,
            this.lookX, this.lookY, this.mouthScale, this.eyeSpread, this.blinkSquash,
        ];
        this.floaters = new Floaters(el.floaters);
        this.layout = this.measure();
    }

    // ─── Public API ────────────────────────────────────────────────────────

    get isLive(): boolean {
        return this.mode === 'live';
    }

    get isHeld(): boolean {
        return this.mode === 'held';
    }

    /** Re-read glyph metrics (call once the font has loaded). */
    remeasure(): void {
        this.glyphCentres.clear();
        this.glyphBoxes.clear();
        this.layout = this.measure();
    }

    /** Outline width in screen pixels for every face character and floating word. */
    setOutline(px: number): void {
        const nodes = [...this.el.eyes, this.el.mouth, ...this.el.floaters];
        nodes.forEach((node) => {
            node.setAttribute('stroke', '#000');
            node.setAttribute('stroke-width', f(Math.max(0, px)));
            node.setAttribute('stroke-linejoin', 'round');
            node.setAttribute('paint-order', 'stroke fill');
            node.setAttribute('vector-effect', 'non-scaling-stroke');
        });
    }

    /** Pin the face so its ":D" sits exactly where text starting at (left, baseline) would. */
    placeAsText(left: number, baseline: number, fontSize: number): void {
        const k = fontSize / FACE_FONT_SIZE;
        this.placeAt({
            x: left + this.layout.centre.x * k,
            y: baseline + this.layout.centre.y * k,
            size: fontSize,
            rot: 0,
        });
    }

    /** Jump to a pose instantly. */
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
        const k = this.size.value / FACE_FONT_SIZE;
        return Math.hypot(x - this.x.value, y - this.y.value) < this.layout.radius * k;
    }

    /** Pointer moved: eye tracking, petting, dragging. */
    pointer(x: number, y: number): void {
        const dist = Math.hypot(x - this.pointerX, y - this.pointerY);
        this.pointerX = x;
        this.pointerY = y;
        this.pointerAt = this.time;
        if (this.pressed && Math.hypot(x - this.pressed.x, y - this.pressed.y) > DRAG_THRESHOLD) {
            this.grab();
            return;
        }
        if (this.mode === 'live' && !this.pressed && this.isOver(x, y)) this.rub += dist;
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

    /**
     * Loader done: the ":D" wakes up and turns upright into a face, crouches,
     * and hops in one short arc into the ring, which slams in on the frame it
     * lands.
     */
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
        this.after(0.8, () => this.anticipate(0.8), seq);
        this.after(0.95, () => {
            this.sy.set(1);
            this.sx.set(1);
            this.sy.kick(7);
            this.express('ooh');
            // One natural hop: even horizontal speed, a parabolic arc, and the
            // ring slams in on the frame it lands.
            this.startTween({
                to: this.home,
                duration: INTRO_HOP_TIME,
                apex: this.home.size * INTRO_HOP_HEIGHT,
                ease: (t) => t,
                done: () => {
                    this.mode = 'live';
                    this.callbacks.onLanded();
                    this.land(1.8);
                    this.express(HOME_EXPRESSION);
                    this.goLive();
                },
            });
        }, seq);
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
        this.eyes.forEach((g) => g.update(dt));
        this.mouth.update(dt);
        // Blinks ("-") keep the colon's spacing; real glyph eyes spread out.
        const glyphEyes = this.eyes.some((g) => g.target !== '.');
        this.eyeSpread.set(glyphEyes ? GLYPH_EYE_SPREAD : 1);
        this.floaters.update(dt);
        this.render();
    }

    // ─── Glyph metrics ─────────────────────────────────────────────────────

    /** Ink box of a character at FACE_FONT_SIZE, or null if it can't be measured yet. */
    private glyphBox(char: string): GlyphBox | null {
        if (this.glyphBoxes.has(char)) return this.glyphBoxes.get(char) ?? null;
        const ctx = this.metrics;
        if (!ctx) return null;
        ctx.font = `800 ${FACE_FONT_SIZE}px ${this.fontFamily}`;
        const m = ctx.measureText(char);
        const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
        const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        const box = w <= 0 && h <= 0 ? null : { x: -m.actualBoundingBoxLeft, y: -m.actualBoundingBoxAscent, w, h, advance: m.width };
        this.glyphBoxes.set(char, box);
        return box;
    }

    /** Scale that makes a character's ink fit inside `slot` face units (never enlarges). */
    private glyphFit(char: string, slot: number): number {
        const b = this.glyphBox(char);
        if (!b) return 0.6;
        return Math.min(1, slot / Math.max(b.w, b.h, 1));
    }

    /** Ink centre of a character, relative to its text origin. */
    private glyphCentre(char: string): Point {
        const cached = this.glyphCentres.get(char);
        if (cached) return cached;
        const b = this.glyphBox(char);
        const centre: Point = b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : { x: FACE_FONT_SIZE * 0.25, y: -FACE_FONT_SIZE * 0.35 };
        this.glyphCentres.set(char, centre);
        return centre;
    }

    /** Lays the face out exactly like the text ":D", using the font's own metrics. */
    private measure(): Layout {
        const colon = this.glyphBox(':');
        const dot = this.glyphBox('.');
        const d = this.glyphBox('D');
        if (!colon || !dot || !d || colon.h === 0) {
            // Font not laid out yet: sensible estimates for a heavy sans.
            return {
                lowerEye: { x: 13, y: -8 },
                upperEye: { x: 13, y: -45 },
                mouthX: 26 + FACE_LETTER_SPACING,
                centre: { x: 46, y: -35 },
                radius: 55,
            };
        }
        const eyeX = colon.x + colon.w / 2;
        const mouthX = colon.advance + FACE_LETTER_SPACING;
        const left = colon.x;
        const right = mouthX + d.x + d.w;
        const top = Math.min(colon.y, d.y);
        const bottom = Math.max(colon.y + colon.h, d.y + d.h);
        return {
            lowerEye: { x: eyeX, y: colon.y + colon.h - dot.h / 2 },
            upperEye: { x: eyeX, y: colon.y + dot.h / 2 },
            mouthX,
            centre: { x: (left + right) / 2, y: (top + bottom) / 2 },
            radius: Math.max(right - left, bottom - top) * 0.6,
        };
    }

    // ─── Expressions & small gestures ──────────────────────────────────────

    private express(name: ExpressionName, kick = true): void {
        const e = EXPRESSIONS[name];
        const changed = name !== this.expression;
        this.expression = name;
        this.eyes[0].set(e.eyes[0]);
        this.eyes[1].set(e.eyes[1]);
        this.mouth.set(e.mouth);
        this.mouthScale.set(e.mouthScale ?? 1);
        if (kick && changed && !this.reducedMotion) {
            this.sy.kick(-2.4);
            this.sx.kick(1.8);
            this.rot.kick(randRange(-70, 70));
        }
    }

    /** Pop a word out of the face's top-right, like a typed aside. */
    private say(text: string, scale: number, motion: FloatMotion = {}): void {
        const size = this.size.value;
        this.floaters.spawn(text, this.x.value + size * 0.42, this.y.value - size * 0.55, size * scale, motion);
    }

    /** A different reply each time it gets bumped. */
    private reply(): string {
        const options = REPLIES.filter((r) => r !== this.lastReply);
        const pick = options[Math.floor(Math.random() * options.length)] ?? 'hey!';
        this.lastReply = pick;
        return pick;
    }

    /** A quick blink: eyes squash flat and spring back (no character swap). */
    private blink(): void {
        if (this.eyes.some((g) => g.target === '-' || g.target === '^')) return;
        this.blinkSquash.set(BLINK_SQUASH);
        this.after(BLINK_HOLD, () => this.blinkSquash.set(1), ALWAYS);
    }

    private autoBlink(): void {
        this.blink();
        if (Math.random() < 0.22) this.after(0.22, () => this.blink(), ALWAYS);
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

    /** $-eyes that pop in and blink a few times, staying $. */
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
        for (let i = 0; i < MONEY_BLINKS; i++) {
            this.after(0.4 + i * MONEY_BLINK_GAP, () => this.blink(), seq);
        }
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
        this.lastPlay = this.time;
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
        if (this.time >= this.nextRequest) {
            this.askToPlay();
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
        // Keep the stage clear for an upcoming request.
        if (this.time >= this.nextIdle && this.nextRequest - this.time > REQUEST_CLEARANCE) this.idleExpression();
    }

    /** Now and then it asks the visitor to pet it or play with it. */
    private askToPlay(): void {
        if (this.mode !== 'live') {
            this.nextRequest = this.time + REQUEST_RETRY;
            return;
        }
        // Already playing with it: no need to ask.
        if (this.time - this.lastPlay < PLAY_QUIET) {
            this.nextRequest = this.lastPlay + PLAY_QUIET;
            return;
        }
        this.bored = false;
        this.cancel();
        const seq = this.sequence;
        const pick = REQUESTS[Math.floor(Math.random() * REQUESTS.length)] ?? 'pet me?';
        this.busyUntil = this.time + 2.2;
        this.express(pick.startsWith('pet') ? 'cat' : 'beam');
        this.hop(0.8);
        this.after(0.5, () => this.hop(0.5), seq);
        this.say(pick, 0.2, { vy: -22, life: 2.4, sway: 4 });
        this.after(2, () => this.express(HOME_EXPRESSION), seq);
        this.nextRequest = this.time + randRange(REQUEST_GAP[0], REQUEST_GAP[1]);
        this.nextIdle = Math.max(this.nextIdle, this.time + 4);
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

    /** Roused from boredom: a curious look. */
    private wake(): void {
        this.bored = false;
        this.cancel();
        const seq = this.sequence;
        this.busyUntil = this.time + 0.9;
        this.express('curious');
        this.hop(0.7);
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
        this.lastPlay = this.time;
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
            this.say(this.reply(), 0.24, { vy: -34, life: 1.4 });
            this.after(1.4, () => this.express(HOME_EXPRESSION), seq);
        } else {
            this.express('beam');
            this.after(0.9, () => this.express(HOME_EXPRESSION), seq);
        }
    }

    // ─── Dive into the ring, fall back from the sky ────────────────────────

    private dive(): void {
        this.lastPlay = this.time;
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

    /** Drop from above the screen back onto home. */
    private startFall(): void {
        this.setClip(false);
        this.mode = 'fall';
        const spread = this.hole ? this.hole.rx * 0.15 : 0;
        this.x.snap(this.home.x + randRange(-1, 1) * spread);
        this.y.snap(-this.home.size * 0.8);
        this.fallVelocity = FALL_KICK;
        this.size.snap(this.home.size);
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

        // Float around inside the ring, drawn slightly towards the cursor.
        const calm = this.sleeping ? 0.2 : this.bored ? 0.45 : 1;
        const motion = this.reducedMotion ? 0 : calm;
        const wx = (Math.sin(t * 0.31) * 0.65 + Math.sin(t * 0.73 + 1.7) * 0.35) * motion;
        const wy = (Math.sin(t * 0.43 + 0.6) * 0.6 + Math.sin(t * 0.97) * 0.4) * motion;
        const droop = this.sleeping ? 0.18 : this.bored ? 0.1 : 0;
        let tx = home.x + wx * (hole ? hole.rx * 0.14 : 0);
        let ty = home.y + wy * (hole ? hole.ry * 0.08 : 0) + (hole ? hole.ry * droop : 0);
        if (fresh && hole && !this.reducedMotion && !this.sleeping) {
            tx += clamp((this.pointerX - home.x) / (hole.rx * FOLLOW_REACH), -1, 1) * hole.rx * FOLLOW_X;
            ty += clamp((this.pointerY - home.y) / (hole.ry * FOLLOW_REACH), -1, 1) * hole.ry * FOLLOW_Y;
        }
        this.x.set(tx);
        this.y.set(ty);
        this.size.set(home.size * (this.sleeping ? 0.92 : this.bored ? 0.95 : 1));
        const lean = fresh ? clamp((this.pointerX - this.x.value) / 600, -1, 1) * FOLLOW_LEAN : 0;
        this.rot.set(home.rot + this.spin + wx * 5 + lean);

        this.updateLook(fresh);
        this.updatePet();
        this.updateMood();
        if (t >= this.nextBlink && !this.sleeping) this.autoBlink();
    }

    /** Eyes shift towards the cursor, in the face's own (text) frame. */
    private updateLook(fresh: boolean): void {
        let lx: number;
        let ly: number;
        if (fresh && !this.sleeping) {
            const dx = this.pointerX - this.x.value;
            const dy = this.pointerY - this.y.value;
            const a = (-this.rot.value * Math.PI) / 180;
            const localX = dx * Math.cos(a) - dy * Math.sin(a);
            const localY = dx * Math.sin(a) + dy * Math.cos(a);
            const dist = Math.hypot(localX, localY) || 1;
            const reach = Math.min(1, dist / 250) * LOOK_RANGE;
            lx = (localX / dist) * reach;
            ly = (localY / dist) * reach;
        } else {
            lx = Math.sin(this.time * 0.37) * 1.2;
            ly = Math.sin(this.time * 0.5) * 1.8;
        }
        this.lookX.set(lx);
        this.lookY.set(ly);
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
        const k = this.size.value / FACE_FONT_SIZE;
        const { centre, radius } = this.layout;
        const sx = this.sx.value;
        const sy = this.sy.value;
        const floating = this.mode === 'live' && !this.reducedMotion;
        const bob = floating ? Math.sin(this.time * (this.sleeping ? 0.9 : 1.9)) * 2.2 : 0;
        // Squash around the bottom of the face so landings read as weight.
        const plant = (1 - sy) * radius * 0.7 * k;
        const y = this.y.value + (this.nod.value + bob) * k + plant;
        this.el.root.setAttribute(
            'transform',
            `translate(${f(this.x.value)} ${f(y)}) scale(${f(sx)} ${f(sy)}) rotate(${f(this.rot.value)}) scale(${f(k)}) translate(${f(-centre.x)} ${f(-centre.y)})`,
        );

        const { lowerEye, upperEye, mouthX } = this.layout;
        const midY = (lowerEye.y + upperEye.y) / 2;
        const half = ((lowerEye.y - upperEye.y) / 2) * this.eyeSpread.value;
        const slot = half * 2 * GLYPH_EYE_FILL;
        [midY + half, midY - half].forEach((spotY, i) => {
            const glyph = this.eyes[i === 0 ? 0 : 1];
            const node = this.el.eyes[i === 0 ? 0 : 1];
            const c = this.glyphCentre(glyph.char);
            const dot = glyph.char === '.';
            const turn = dot ? 0 : EYE_UPRIGHT;
            const fit = dot ? 1 : this.glyphFit(glyph.char, slot);
            node.setAttribute(
                'transform',
                // The blink squash is applied along the text's x axis, which is
                // the face's vertical once it's turned upright.
                `translate(${f(lowerEye.x + this.lookX.value)} ${f(spotY + this.lookY.value)}) scale(${f(Math.max(0.01, this.blinkSquash.value))} 1) rotate(${turn}) scale(${f(Math.max(0, glyph.pop.value * fit))}) translate(${f(-c.x)} ${f(-c.y)})`,
            );
        });

        const mc = this.glyphCentre(this.mouth.char);
        const ms = Math.max(0, this.mouth.pop.value * this.mouthScale.value);
        this.el.mouth.setAttribute(
            'transform',
            `translate(${f(mouthX + mc.x)} ${f(mc.y)}) scale(${f(ms)}) translate(${f(-mc.x)} ${f(-mc.y)})`,
        );

        if (this.clipped && this.hole) {
            const cy = this.hole.cy - this.hole.ry * MASK_LIFT;
            this.el.clipShape.setAttribute('cx', f(this.hole.cx));
            this.el.clipShape.setAttribute('cy', f(cy));
            this.el.clipShape.setAttribute('rx', f(this.hole.rx));
            this.el.clipShape.setAttribute('ry', f(this.hole.ry));
            const far = 1e5;
            this.el.clipTop.setAttribute('x', f(-far));
            this.el.clipTop.setAttribute('y', f(-far));
            this.el.clipTop.setAttribute('width', f(far * 2));
            this.el.clipTop.setAttribute('height', f(far + cy));
        }
    }
}
