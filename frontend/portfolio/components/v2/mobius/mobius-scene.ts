import {
    BufferAttribute,
    Color,
    DoubleSide,
    Group,
    Mesh,
    PerspectiveCamera,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    Vector3,
    WebGLRenderer,
} from 'three';
import { createMobiusGeometry, type MobiusShape } from './mobius-geometry';
import { createWelcomeTile, type TextTile } from './text-texture';
import { Spring } from '../lib/spring';
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
const HOLE_RADIUS = SHAPE.radius - SHAPE.side * 0.6;

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
    /** Text tiles over the bar's two laps at text size 1. */
    private readonly laps: number;

    private width = 1;
    private height = 1;
    private time = 0;
    private offset = 0;
    private speed: number;
    /** User placement from the palette (ring units, radians). */
    private place = { x: 0, y: 0, tilt: 0, turn: 0, roll: 0 };

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
        this.speed = settings.textSpeed;
        this.setSettings(settings);
        this.applyRest(true);
    }

    setSettings(settings: StageSettings): void {
        const u = this.material.uniforms;
        (u.uOuter!.value as Color).set(settings.colorOuter);
        (u.uInner!.value as Color).set(settings.colorInner);
        this.speed = settings.textSpeed;
        // Smaller text → more tiles; always a whole number over two laps so the text joins seamlessly.
        u.uTextScale!.value = settings.textScale;
        u.uRepeat!.value = Math.max(1, Math.round(this.laps / settings.textScale)) / 2;
        const rad = Math.PI / 180;
        this.place = {
            x: settings.posX,
            y: settings.posY,
            tilt: settings.tilt * rad,
            turn: settings.turn * rad,
            roll: settings.roll * rad,
        };
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

    /** Screen-space ellipse of the ring's opening, at rest. */
    restHole(): Hole {
        this.applyRest(true);
        this.group.updateMatrixWorld(true);
        // Measured along the top of the bar: that rim is what frames the opening on screen.
        const project = (x: number, z: number) => {
            const v = new Vector3(x, SHAPE.side / 2, z).applyMatrix4(this.mesh.matrixWorld).project(this.camera);
            return { x: ((v.x + 1) / 2) * this.width, y: ((1 - v.y) / 2) * this.height };
        };
        const right = project(HOLE_RADIUS, 0);
        const left = project(-HOLE_RADIUS, 0);
        const front = project(0, HOLE_RADIUS);
        const back = project(0, -HOLE_RADIUS);
        return {
            cx: (right.x + left.x + front.x + back.x) / 4,
            cy: (right.y + left.y + front.y + back.y) / 4,
            rx: Math.hypot(right.x - left.x, right.y - left.y) / 2,
            ry: Math.abs(front.y - back.y) / 2,
        };
    }

    frame(dt: number, reducedMotion: boolean): void {
        this.time += dt;
        this.offset += this.speed * dt;
        this.material.uniforms.uOffset!.value = this.offset;
        this.lift.update(dt);
        this.grow.update(dt);
        this.tilt.update(dt);

        const sway = reducedMotion ? 0 : 1;
        const p = this.place;
        this.group.position.set(p.x, p.y + this.lift.value + Math.sin(this.time * 0.9) * 0.05 * sway, 0);
        this.group.scale.setScalar(Math.max(0.001, this.grow.value));
        this.group.rotation.set(p.tilt + this.tilt.value, 0, ROLL + p.roll + Math.sin(this.time * 0.37) * 0.02 * sway);
        this.mesh.rotation.y = Math.PI + p.turn + Math.sin(this.time * 0.23) * 0.06 * sway;
        this.renderer.render(this.scene, this.camera);
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        this.material.dispose();
        this.tile.texture.dispose();
        this.renderer.dispose();
    }

    /** The ring at rest, with or without the palette's placement. */
    private applyRest(withPlacement: boolean): void {
        const p = withPlacement ? this.place : { x: 0, y: 0, tilt: 0, turn: 0, roll: 0 };
        this.group.position.set(p.x, p.y, 0);
        this.group.scale.setScalar(1);
        this.group.rotation.set(p.tilt, 0, ROLL + p.roll);
        this.mesh.rotation.set(0, Math.PI + p.turn, 0);
    }
}
