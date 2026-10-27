import { forwardRef } from 'react';
import type { EyeElements, FaceElements } from './face-engine';

// The :D's drawing, in a 100-unit face box, styled like type: solid colon
// dots for eyes and a hollow stroked mouth. The engine owns every attribute
// after mount; React only renders the skeleton once.

const EYES = [0, 1] as const;
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
                <g data-part="root">
                    {EYES.map((i) => (
                        <g key={i} data-part={`eye-${i}`}>
                            <ellipse data-part="dot" rx="7.5" ry="7.5" fill="#fff" />
                            <path
                                data-part="happy"
                                d="M -8.5 4.5 L 0 -4.5 L 8.5 4.5"
                                fill="none"
                                stroke="#fff"
                                strokeWidth="6.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0"
                            />
                            <text
                                data-part="glyph"
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="28"
                                fontWeight="800"
                                fill="#fff"
                                opacity="0"
                            />
                        </g>
                    ))}
                    <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
                        <path data-part="bowl" />
                        <path data-part="lid" />
                    </g>
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
    const part = <T extends Element>(scope: Element, name: string) => scope.querySelector<T>(`[data-part="${name}"]`);
    const eye = (i: number): EyeElements | null => {
        const group = part<SVGGElement>(svg, `eye-${i}`);
        if (!group) return null;
        const dot = part<SVGEllipseElement>(group, 'dot');
        const happy = part<SVGPathElement>(group, 'happy');
        const glyph = part<SVGTextElement>(group, 'glyph');
        return dot && happy && glyph ? { group, dot, happy, glyph } : null;
    };
    const clip = part<SVGGElement>(svg, 'clip');
    const clipShape = part<SVGEllipseElement>(svg, 'clip-shape');
    const root = part<SVGGElement>(svg, 'root');
    const bowl = part<SVGPathElement>(svg, 'bowl');
    const lid = part<SVGPathElement>(svg, 'lid');
    const floaters = Array.from(svg.querySelectorAll<SVGTextElement>('[data-part="floater"]'));
    const left = eye(0);
    const right = eye(1);
    if (!clip || !clipShape || !root || !bowl || !lid || !left || !right) return null;
    return { clip, clipShape, root, bowl, lid, floaters, eyes: [left, right] };
}
