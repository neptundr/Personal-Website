import { clamp, easeOutBack, progress } from '../lib/math';

// Little bits of text that pop out of the :D and drift away: "z" while it
// sleeps, "<3" when petted, "hi!", "hey!", "!". They're set in the site font
// so they read like typed emoticons. A fixed pool of SVG <text> nodes is
// recycled; when it runs out, the oldest floater is reused.

export interface FloatMotion {
    readonly vx?: number;
    readonly vy?: number;
    readonly life?: number;
    /** Side-to-side drift amplitude, px. */
    readonly sway?: number;
}

interface Floater {
    readonly node: SVGTextElement;
    x: number;
    y: number;
    readonly vx: number;
    readonly vy: number;
    readonly size: number;
    readonly life: number;
    readonly sway: number;
    readonly tilt: number;
    age: number;
}

const f = (n: number): string => n.toFixed(2);

export class Floaters {
    /** Outline stroke width (px) given to each word as it spawns. */
    outline = 8;
    private active: Floater[] = [];
    private readonly free: SVGTextElement[];

    constructor(nodes: readonly SVGTextElement[]) {
        this.free = [...nodes];
        nodes.forEach((node) => node.setAttribute('opacity', '0'));
    }

    spawn(text: string, x: number, y: number, size: number, motion: FloatMotion = {}): void {
        let node = this.free.pop();
        if (!node) {
            const oldest = this.active.shift();
            if (!oldest) return;
            node = oldest.node;
        }
        node.textContent = text;
        node.setAttribute('font-size', f(size));
        node.setAttribute('stroke-width', f(this.outline));
        this.active.push({
            node,
            x,
            y,
            vx: motion.vx ?? 0,
            vy: motion.vy ?? -40,
            size,
            life: motion.life ?? 1.6,
            sway: motion.sway ?? 6,
            tilt: (Math.random() - 0.5) * 24,
            age: 0,
        });
    }

    update(dt: number): void {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const fl = this.active[i]!;
            fl.age += dt;
            fl.x += fl.vx * dt;
            fl.y += fl.vy * dt;
            const t = fl.age / fl.life;
            if (t >= 1) {
                fl.node.setAttribute('opacity', '0');
                this.active.splice(i, 1);
                this.free.push(fl.node);
                continue;
            }
            const appear = clamp(t / 0.15);
            const opacity = Math.min(appear, 1 - progress(t, 0.6, 1));
            const scale = 0.5 + 0.5 * easeOutBack(clamp(t / 0.25));
            const x = fl.x + Math.sin(fl.age * 3) * fl.sway;
            fl.node.setAttribute('opacity', f(opacity));
            fl.node.setAttribute('transform', `translate(${f(x)} ${f(fl.y)}) rotate(${f(fl.tilt)}) scale(${f(scale)})`);
        }
    }
}
