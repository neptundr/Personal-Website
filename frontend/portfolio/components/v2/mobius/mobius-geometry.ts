import { BufferAttribute, BufferGeometry } from 'three';

// A Möbius "noodle": a bar with a SQUARE cross-section bent into a ring and
// given half a twist, so each face joins up with the face opposite it.
//
// Cross-section at angle θ around the ring: a side×side square, rotated by
// φ = θ/2 + phase about the ring's tangent. After a full lap φ has turned by
// π: face A has become face C, and face B has become face D. That makes two
// endless tracks (A→C→A and B→D→B), each two laps long, four text lines in
// total on screen at any moment.
//
// UVs follow each track: the first face of a pair covers u ∈ [0, 1), its
// partner carries on with u ∈ [1, 2). `aFace` tells the shader which track a
// vertex is on (0: A/C, 1: B/D) for its colour.

export interface MobiusShape {
    readonly radius: number;
    /** Side length of the square cross-section. */
    readonly side: number;
    readonly segments: number;
    readonly phase: number;
}

const FACES = 4;

export function createMobiusGeometry(shape: MobiusShape): BufferGeometry {
    const rings = shape.segments + 1;
    const count = FACES * rings * 2;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(count * 2), 2));
    geometry.setAttribute('aFace', new BufferAttribute(new Float32Array(count), 1));

    const indices: number[] = [];
    for (let face = 0; face < FACES; face++) {
        for (let i = 0; i < shape.segments; i++) {
            const a = vertexIndex(shape, face, i, 0);
            const b = vertexIndex(shape, face, i, 1);
            const c = vertexIndex(shape, face, i + 1, 0);
            const d = vertexIndex(shape, face, i + 1, 1);
            indices.push(a, c, b, b, c, d);
        }
    }
    geometry.setIndex(indices);
    updateMobiusGeometry(geometry, shape);
    return geometry;
}

function vertexIndex(shape: MobiusShape, face: number, ring: number, edge: number): number {
    return (face * (shape.segments + 1) + ring) * 2 + edge;
}

type Vec3 = [number, number, number];

/** Recomputes positions, normals and UVs (e.g. if the twist phase changes). */
export function updateMobiusGeometry(geometry: BufferGeometry, shape: MobiusShape): void {
    const position = geometry.getAttribute('position') as BufferAttribute;
    const normal = geometry.getAttribute('normal') as BufferAttribute;
    const uv = geometry.getAttribute('uv') as BufferAttribute;
    const faceFlag = geometry.getAttribute('aFace') as BufferAttribute;
    const h = shape.side / 2;

    for (let i = 0; i <= shape.segments; i++) {
        const u = i / shape.segments;
        const theta = u * Math.PI * 2;
        const phi = theta / 2 + shape.phase;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const cx = shape.radius * cosT;
        const cz = shape.radius * sinT;
        // The two axes of the twisted square: b (sideways) and n (up).
        const b: Vec3 = [cosT * Math.cos(phi), Math.sin(phi), sinT * Math.cos(phi)];
        const n: Vec3 = [-cosT * Math.sin(phi), Math.cos(phi), -sinT * Math.sin(phi)];
        const corner = (wb: number, wn: number): Vec3 => [
            cx + b[0] * wb + n[0] * wn,
            b[1] * wb + n[1] * wn,
            cz + b[2] * wb + n[2] * wn,
        ];
        const neg = (v: Vec3): Vec3 => [-v[0], -v[1], -v[2]];

        // Each face lists its two edge vertices in the order that continues
        // seamlessly into its partner face after a lap.
        const faces: ReadonlyArray<{ pts: [Vec3, Vec3]; n: Vec3; u: number; track: number }> = [
            { pts: [corner(-h, h), corner(h, h)], n, u, track: 0 },
            { pts: [corner(h, h), corner(h, -h)], n: b, u, track: 1 },
            { pts: [corner(h, -h), corner(-h, -h)], n: neg(n), u: u + 1, track: 0 },
            { pts: [corner(-h, -h), corner(-h, h)], n: neg(b), u: u + 1, track: 1 },
        ];

        faces.forEach((f, face) => {
            for (let k = 0; k < 2; k++) {
                const index = vertexIndex(shape, face, i, k);
                const p = f.pts[k]!;
                position.setXYZ(index, p[0], p[1], p[2]);
                normal.setXYZ(index, f.n[0], f.n[1], f.n[2]);
                uv.setXY(index, f.u, k);
                faceFlag.setX(index, f.track);
            }
        });
    }

    position.needsUpdate = true;
    normal.needsUpdate = true;
    uv.needsUpdate = true;
    faceFlag.needsUpdate = true;
    geometry.computeBoundingSphere();
}
