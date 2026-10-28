import {
    BufferAttribute,
    Color,
    DoubleSide,
    Group,
    Mesh,
    PerspectiveCamera,
    Raycaster,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three';
import { createMobiusGeometry, type MobiusShape } from './mobius-geometry';
import { createWelcomeTile, type TextTile } from './text-texture';
import { Spring, type SpringConfig } from '../lib/spring';
import { clamp, randRange } from '../lib/math';
import type { StageSettings } from '../dev/settings';
import type { Hole } from '../face/face-engine';

// The rolling "WELCOME!" Möbius ring: a square bar with half a twist.
// Flat-shaded like the illustration it's based on: one colour per track of
// faces (they never meet, so no seam), "WELCOME!" running along all four
// faces, and a soft facing-ratio shade for depth.

const SHAPE: MobiusShape = { radius: 3, side: 0.92, segments: 360, phase: -0.75 * Math.PI };
/** Camera elevation; ~30° gives the reference's flattened ellipse. */
const ELEVATION = 0.52;
const FOV = 30;
const ROLL = -0.1;
/** Half-extent of the viewport (in clip space, 1 = edge) the ring may reach. */
const FILL_X = 0.86;
const FILL_Y = 0.76;
/** Fit the camera against every Nth vertex of the ring. */
const FIT_STRIDE = 9;
/** Inner opening, as a radius in ring units (inside of the bar). */
/** Directions sampled when tracing the opening's edge. */
const HOLE_BINS = 96;

const DEG = Math.PI / 180;
/** How fast "WELCOME!" rolls along the ribbon, in text tiles per second. */
const TEXT_SPEED = 0.48;
/** The ring's resting pose (tuned in the dev palette): offset in ring units, scale, angles. */
const POSE = { x: 0.05, y: 0.45, scale: 1.16, tilt: 6 * DEG, turn: 161 * DEG, roll: 1 * DEG } as const;

// Dragging the ring: sideways spins it about its axis, up/down tips it.
const TURN_PER_PX = (Math.PI * 2) / 700;
const TILT_PER_PX = 0.004;
/** A held ring can only be tipped this far either way from its rest tilt; springs may overshoot after release. */
const TILT_RANGE = 5 * DEG;
/** Fastest the ring may spin, rad/s (1.5 turns a second), however hard it's flung. */
const MAX_SPIN = Math.PI * 2 * 1.5;
/** While held, the ring follows the pointer tightly… */
const HELD: SpringConfig = { stiffness: 420, damping: 30 };
/** …and once released it carries its momentum and wobbles back. */
const RELEASED_TURN: SpringConfig = { stiffness: 36, damping: 5.5 };
const RELEASED_TILT: SpringConfig = { stiffness: 150, damping: 7 };
/** How far ahead (s) the spin's momentum carries when picking which whole turn to settle on. */
const SPIN_CARRY = 0.35;

const VERTEX = /* glsl */ `
attribute float aFace;
varying vec2 vUv;
varying float vFace;
varying float vFacing;
void main() {
    vUv = uv;
    vFace = aFace;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vFacing = abs(dot(n, normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uOuter;
uniform vec3 uInner;
uniform sampler2D uText;
uniform float uOffset;
uniform float uRepeat;
uniform float uTextScale;
varying vec2 vUv;
varying float vFace;
varying float vFacing;
void main() {
    // Track B/D (the big outer wall at the front) wears the first colour.
    vec3 base = mix(uInner, uOuter, step(0.5, vFace));
    // Text height as a share of the face, centred across it.
    float v = (vUv.y - 0.5) / uTextScale + 0.5;
    float inside = step(0.0, v) * step(v, 1.0);
    // Sampled rotated 180° so the text reads upright on the front face.
    float ink = inside * texture2D(uText, vec2(-vUv.x * uRepeat - uOffset, 1.0 - v)).a;
    vec3 color = mix(base, vec3(1.0, 0.985, 0.95), ink);
    gl_FragColor = vec4(color * mix(0.78, 1.0, vFacing), 1.0);
    #include <colorspace_fragment>
}
`;

export class MobiusScene {
    private readonly renderer: WebGLRenderer;
    private readonly scene = new Scene();
    private readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
    private readonly group = new Group();
    private readonly mesh: Mesh;
    private readonly material: ShaderMaterial;
    private readonly tile: TextTile;

    /** Slam in from below, scale pop, and a rocking tilt for impacts. */
    private readonly lift = new Spring(-0.9, { stiffness: 320, damping: 13 });
    private readonly grow = new Spring(0.55, { stiffness: 300, damping: 12 });
    private readonly tilt = new Spring(0, { stiffness: 160, damping: 7 });
    /** Extra rotation from dragging, on top of the palette pose. */
    private readonly dragTurn = new Spring(0, RELEASED_TURN);
    private readonly dragTilt = new Spring(0, RELEASED_TILT);
    private readonly wobble = new Spring(0, { stiffness: 180, damping: 6 });
    private drag: { x: number; y: number; turn: number; tilt: number; lastTurn: number; lastAt: number } | null = null;
    private turnVelocity = 0;
    private readonly raycaster = new Raycaster();
    private readonly pointerNdc = new Vector2();
    /** Text tiles over the bar's two laps at text size 1. */
    private readonly laps: number;

    private width = 1;
    private height = 1;
    private time = 0;
    private offset = 0;
    private readonly place = POSE;

    static async create(canvas: HTMLCanvasElement, fontFamily: string, settings: StageSettings): Promise<MobiusScene> {
        const tile = await createWelcomeTile(fontFamily);
        return new MobiusScene(canvas, tile, settings);
    }

    private constructor(canvas: HTMLCanvasElement, tile: TextTile, settings: StageSettings) {
        this.tile = tile;
        this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.outputColorSpace = SRGBColorSpace;
        this.renderer.setClearColor(0x000000, 0);
        tile.texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

        this.laps = (2 * 2 * Math.PI * SHAPE.radius) / (SHAPE.side * tile.aspect);

        this.material = new ShaderMaterial({
            uniforms: {
                uOuter: { value: new Color(settings.colorOuter) },
                uInner: { value: new Color(settings.colorInner) },
                uText: { value: tile.texture },
                uOffset: { value: 0 },
                uRepeat: { value: 1 },
                uTextScale: { value: 1 },
            },
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            side: DoubleSide,
        });
        this.mesh = new Mesh(createMobiusGeometry(SHAPE), this.material);
        this.group.add(this.mesh);
        this.group.visible = false;
        this.scene.add(this.group);
        // Whole tiles over two laps so the text joins seamlessly.
        this.material.uniforms.uRepeat!.value = Math.max(1, Math.round(this.laps)) / 2;
        this.setSettings(settings);
        this.applyRest(true);
    }

    setSettings(settings: StageSettings): void {
        const u = this.material.uniforms;
        (u.uOuter!.value as Color).set(settings.colorOuter);
        (u.uInner!.value as Color).set(settings.colorInner);
    }

    resize(width: number, height: number, dpr: number): void {
        this.width = Math.max(1, width);
        this.height = Math.max(1, height);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(this.width, this.height, false);
        this.camera.aspect = this.width / this.height;
        this.fitCamera();
    }

    /**
     * Pull the camera back just far enough that every sampled vertex of the
     * ring (at rest) lands inside the allowed frame. Exact for any aspect.
     */
    private fitCamera(): void {
        // Fit the untransformed ring, so palette moves don't change the zoom.
        this.applyRest(false);
        this.group.updateMatrixWorld(true);
        const position = this.mesh.geometry.getAttribute('position') as BufferAttribute;
        const points: Vector3[] = [];
        for (let i = 0; i < position.count; i += FIT_STRIDE) {
            points.push(new Vector3().fromBufferAttribute(position, i).applyMatrix4(this.mesh.matrixWorld));
        }
        const probe = new Vector3();
        const fits = () =>
            points.every((p) => {
                probe.copy(p).project(this.camera);
                return Math.abs(probe.x) <= FILL_X && Math.abs(probe.y) <= FILL_Y;
            });
        let near = 4;
        let far = 120;
        for (let i = 0; i < 18; i++) {
            const mid = (near + far) / 2;
            this.placeCamera(mid);
            if (fits()) far = mid;
            else near = mid;
        }
        this.placeCamera(far);
    }

    private placeCamera(distance: number): void {
        this.camera.position.set(0, Math.sin(ELEVATION) * distance, Math.cos(ELEVATION) * distance);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateMatrixWorld();
        this.camera.updateProjectionMatrix();
    }

    /** Slam in from underneath on the frame the :D lands. */
    appear(): void {
        this.group.visible = true;
        this.lift.snap(-0.9);
        this.grow.snap(0.55);
        this.lift.set(0);
        this.grow.set(1);
        this.lift.kick(9);
        this.grow.kick(5);
        this.tilt.kick(1.6);
    }

    /** Something landed on/in the ring: it dips and rocks. */
    impact(strength: number): void {
        if (!this.group.visible) return;
        this.lift.kick(-1.8 * strength);
        this.tilt.kick(0.9 * strength);
        this.grow.kick(-0.5 * strength);
    }

    /**
     * Screen-space ellipse of the ring's opening, at rest. Traced from the real
     * mesh: around the projected centre, the nearest vertex in each direction
     * is the edge of the opening, twist and all.
     */
    restHole(): Hole {
        this.applyRest(true);
        this.group.updateMatrixWorld(true);
        const toScreen = (v: Vector3) => ({ x: ((v.x + 1) / 2) * this.width, y: ((1 - v.y) / 2) * this.height });
        const centre = toScreen(new Vector3().applyMatrix4(this.mesh.matrixWorld).project(this.camera));
        const position = this.mesh.geometry.getAttribute('position') as BufferAttribute;
        const nearest = new Array<{ x: number; y: number; d: number } | undefined>(HOLE_BINS);
        const v = new Vector3();
        for (let i = 0; i < position.count; i++) {
            const p = toScreen(v.fromBufferAttribute(position, i).applyMatrix4(this.mesh.matrixWorld).project(this.camera));
            const dx = p.x - centre.x;
            const dy = p.y - centre.y;
            const d = Math.hypot(dx, dy);
            const bin = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)) * HOLE_BINS) % HOLE_BINS;
            const best = nearest[bin];
            if (!best || d < best.d) nearest[bin] = { x: p.x, y: p.y, d };
        }
        const edge = nearest.filter((p): p is { x: number; y: number; d: number } => p !== undefined);
        const xs = edge.map((p) => p.x);
        const ys = edge.map((p) => p.y);
        const left = Math.min(...xs);
        const right = Math.max(...xs);
        const top = Math.min(...ys);
        const bottom = Math.max(...ys);
        return { cx: (left + right) / 2, cy: (top + bottom) / 2, rx: (right - left) / 2, ry: (bottom - top) / 2 };
    }

    frame(dt: number, reducedMotion: boolean): void {
        this.time += dt;
        this.offset += TEXT_SPEED * dt;
        this.material.uniforms.uOffset!.value = this.offset;
        this.lift.update(dt);
        this.grow.update(dt);
        this.tilt.update(dt);
        this.dragTurn.update(dt);
        this.dragTurn.velocity = clamp(this.dragTurn.velocity, -MAX_SPIN, MAX_SPIN);
        this.dragTilt.update(dt);
        this.wobble.update(dt);

        const sway = reducedMotion ? 0 : 1;
        const p = this.place;
        this.group.position.set(p.x, p.y + this.lift.value + Math.sin(this.time * 0.9) * 0.05 * sway, 0);
        this.group.scale.setScalar(Math.max(0.001, this.grow.value * p.scale));
        this.group.rotation.set(
            p.tilt + this.tilt.value + this.dragTilt.value,
            0,
            ROLL + p.roll + this.wobble.value + Math.sin(this.time * 0.37) * 0.02 * sway,
        );
        this.mesh.rotation.y = Math.PI + p.turn + this.dragTurn.value + Math.sin(this.time * 0.23) * 0.06 * sway;
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Compile the shader and upload geometry and the text texture now (during
     * loading), so the frame the ring slams in doesn't stall on that work.
     */
    prepare(): void {
        const wasVisible = this.group.visible;
        this.group.visible = true;
        this.renderer.compile(this.scene, this.camera);
        this.renderer.initTexture(this.tile.texture);
        // One invisible draw (scaled to nothing) uploads the buffers too.
        this.group.scale.setScalar(1e-4);
        this.renderer.render(this.scene, this.camera);
        this.renderer.clear();
        this.group.visible = wasVisible;
    }

    /** Is the pointer (CSS px) over the ring? */
    isOver(x: number, y: number): boolean {
        if (!this.group.visible) return false;
        this.pointerNdc.set((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
        this.raycaster.setFromCamera(this.pointerNdc, this.camera);
        return this.raycaster.intersectObject(this.mesh, false).length > 0;
    }

    /** Start dragging if the pointer is on the ring; the grab itself knocks it off balance. */
    grab(x: number, y: number): boolean {
        if (!this.isOver(x, y)) return false;
        this.drag = { x, y, turn: this.dragTurn.value, tilt: this.dragTilt.value, lastTurn: this.dragTurn.value, lastAt: performance.now() };
        this.turnVelocity = 0;
        this.dragTurn.config = HELD;
        this.dragTilt.config = HELD;
        this.wobble.kick(randRange(-1, 1) * 2.4);
        this.lift.kick(-1.2);
        return true;
    }

    /** Sideways spins the ring about its axis; up/down tips it, within ±5° while held. */
    dragTo(x: number, y: number): void {
        const d = this.drag;
        if (!d) return;
        const turn = d.turn + (x - d.x) * TURN_PER_PX;
        const tilt = clamp(d.tilt + (y - d.y) * TILT_PER_PX, -TILT_RANGE, TILT_RANGE);
        this.dragTurn.set(turn);
        this.dragTilt.set(tilt);

        const now = performance.now();
        const dt = Math.max(1, now - d.lastAt) / 1000;
        const measured = this.turnVelocity * 0.6 + ((turn - d.lastTurn) / dt) * 0.4;
        this.turnVelocity = clamp(measured, -MAX_SPIN, MAX_SPIN);
        d.lastTurn = turn;
        d.lastAt = now;
    }

    /** Let go: the spin carries on and settles on a whole turn, the tilt springs back with a wobble. */
    release(): void {
        if (!this.drag) return;
        this.drag = null;
        const full = Math.PI * 2;
        const carried = this.dragTurn.value + this.turnVelocity * SPIN_CARRY;
        this.dragTurn.config = RELEASED_TURN;
        this.dragTurn.velocity = this.turnVelocity;
        this.dragTurn.set(Math.round(carried / full) * full);
        this.dragTilt.config = RELEASED_TILT;
        this.dragTilt.set(0);
        this.wobble.kick(randRange(-1, 1) * 1.8);
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        this.material.dispose();
        this.tile.texture.dispose();
        this.renderer.dispose();
    }

    /** The ring at rest, with or without the palette's placement. */
    private applyRest(withPlacement: boolean): void {
        const p = withPlacement ? this.place : { x: 0, y: 0, scale: 1, tilt: 0, turn: 0, roll: 0 };
        this.group.position.set(p.x, p.y, 0);
        this.group.scale.setScalar(p.scale);
        this.group.rotation.set(p.tilt, 0, ROLL + p.roll);
        this.mesh.rotation.set(0, Math.PI + p.turn, 0);
    }
}
