// Damped springs integrated in small fixed steps, so they behave the same at
// 30, 60 or 120 fps. Unit mass: `stiffness` pulls towards the target,
// `damping` bleeds energy. Low damping = overshoot and wobble ("juice").

export interface SpringConfig {
    readonly stiffness: number;
    readonly damping: number;
}

export const SPRINGS = {
    /** Facial features: pops past the target and settles with a wobble. */
    juicy: { stiffness: 520, damping: 17 },
    /** Size and rotation: quick, one small overshoot. */
    snappy: { stiffness: 260, damping: 18 },
    /** Drifting position: slow and floaty. */
    soft: { stiffness: 38, damping: 9 },
    /** Squash & stretch: very bouncy. */
    wobble: { stiffness: 700, damping: 11 },
    /** Nods and recoils. */
    nod: { stiffness: 420, damping: 13 },
} as const satisfies Record<string, SpringConfig>;

const STEP = 1 / 240;
const MAX_DT = 0.1;

export class Spring {
    value: number;
    target: number;
    velocity = 0;

    constructor(
        initial: number,
        public config: SpringConfig,
    ) {
        this.value = initial;
        this.target = initial;
    }

    set(target: number): void {
        this.target = target;
    }

    /** Jump straight to a value, at rest. */
    snap(value: number): void {
        this.value = value;
        this.target = value;
        this.velocity = 0;
    }

    /** Add velocity: the spring flicks away and swings back. */
    kick(velocity: number): void {
        this.velocity += velocity;
    }

    update(dt: number): void {
        let remaining = Math.min(dt, MAX_DT);
        const { stiffness, damping } = this.config;
        while (remaining > 1e-6) {
            const h = Math.min(STEP, remaining);
            const force = -stiffness * (this.value - this.target) - damping * this.velocity;
            this.velocity += force * h;
            this.value += this.velocity * h;
            remaining -= h;
        }
    }
}
