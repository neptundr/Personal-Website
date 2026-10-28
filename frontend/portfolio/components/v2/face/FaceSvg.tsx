import { forwardRef } from 'react';
import { FACE_FONT_SIZE } from './expressions';
import type { FaceElements } from './face-engine';

// The :D's drawing: three characters of the site font (two eyes, a mouth)
// plus a pool of floating words. The engine owns every attribute after
// mount; React only renders the skeleton once.

const FLOATER_POOL = 8;

const FaceSvg = forwardRef<SVGSVGElement>(function FaceSvg(_, ref) {
    return (
        <svg ref={ref} className="v2-stage__face" aria-hidden="true">
            <defs>
                <clipPath id="v2-hole-clip" clipPathUnits="userSpaceOnUse">
                    <ellipse data-part="clip-shape" />
                </clipPath>
            </defs>
            <g data-part="clip">
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
    const root = part<SVGGElement>('root');
    const left = part<SVGTextElement>('eye-0');
    const right = part<SVGTextElement>('eye-1');
    const mouth = part<SVGTextElement>('mouth');
    const floaters = Array.from(svg.querySelectorAll<SVGTextElement>('[data-part="floater"]'));
    if (!clip || !clipShape || !root || !left || !right || !mouth) return null;
    return { clip, clipShape, root, eyes: [left, right], mouth, floaters };
}
