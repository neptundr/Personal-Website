import { forwardRef } from 'react';
import { FACE_FONT_SIZE } from './expressions';
import type { FaceElements } from './face-engine';
import type { ArmPaths } from './arms';

// The :D's drawing: three characters of the site font (two eyes, a mouth),
// two noodle arms tucked behind them, plus a pool of floating words. The engine owns every attribute after
// mount; React only renders the skeleton once.

const FLOATER_POOL = 8;

const FaceSvg = forwardRef<SVGSVGElement>(function FaceSvg(_, ref) {
    return (
        <svg ref={ref} className="v2-stage__face" aria-hidden="true">
            <defs>
                {/* Union: the opening, plus everything above its centre line. */}
                <clipPath id="v2-hole-clip" clipPathUnits="userSpaceOnUse">
                    <ellipse data-part="clip-shape" />
                    <rect data-part="clip-top" />
                </clipPath>
            </defs>
            <g data-part="clip">
                {/* Behind the face, so arms emerge from under it. Outline, then noodle, per arm. */}
                <g data-part="arms">
                    {[0, 1].map((i) => (
                        <g key={i}>
                            <path data-part={`arm-${i}-outline`} />
                            <path data-part={`arm-${i}-fill`} />
                        </g>
                    ))}
                </g>
                <g data-part="root" fill="#fff" fontSize={FACE_FONT_SIZE} fontWeight="800">
                    <text data-part="eye-0">.</text>
                    <text data-part="eye-1">.</text>
                    <text data-part="mouth">D</text>
                </g>
            </g>
            <g data-part="floaters" fill="#fff" fontWeight="800" textAnchor="middle" dominantBaseline="central">
                {Array.from({ length: FLOATER_POOL }, (_, i) => (
                    <text key={i} data-part="floater" opacity="0" />
                ))}
            </g>
        </svg>
    );
});

export default FaceSvg;

/** Collects the parts the engine animates; null if the markup is incomplete. */
export function readFaceElements(svg: SVGSVGElement): FaceElements | null {
    const part = <T extends Element>(name: string) => svg.querySelector<T>(`[data-part="${name}"]`);
    const clip = part<SVGGElement>('clip');
    const clipShape = part<SVGEllipseElement>('clip-shape');
    const clipTop = part<SVGRectElement>('clip-top');
    const root = part<SVGGElement>('root');
    const left = part<SVGTextElement>('eye-0');
    const right = part<SVGTextElement>('eye-1');
    const mouth = part<SVGTextElement>('mouth');
    const floaters = Array.from(svg.querySelectorAll<SVGTextElement>('[data-part="floater"]'));
    const arm = (i: number): ArmPaths | null => {
        const outline = part<SVGPathElement>(`arm-${i}-outline`);
        const fill = part<SVGPathElement>(`arm-${i}-fill`);
        return outline && fill ? { outline, fill } : null;
    };
    const arm0 = arm(0);
    const arm1 = arm(1);
    if (!clip || !clipShape || !clipTop || !root || !left || !right || !mouth || !arm0 || !arm1) return null;
    return { clip, clipShape, clipTop, root, eyes: [left, right], mouth, floaters, arms: [arm0, arm1] };
}
