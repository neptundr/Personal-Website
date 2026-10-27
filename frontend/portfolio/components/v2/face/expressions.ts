// The :D's vocabulary, drawn like type rather than like an emoji: a colon's
// dots for eyes and a hollow, stroked mouth with the stem weight of a heavy
// font, so ":D" reads as the two characters it is. A face lives in a
// 100-unit box centred on (0, 0): eyes above, mouth below. Every expression
// is just numbers, so the engine can spring from any face to any other.
//
// The mouth is two strokes sharing two corners: a LID across the top (flat,
// arched up, or sagging) and a rounded BOWL below. Both on: D, O, o.
// Bowl only: ")" smile. Lid only: "-" or a "︵" frown.

export interface MouthShape {
    /** Half-width between the corners. */
    readonly w: number;
    /** Depth of the bowl below the corners. */
    readonly depth: number;
    /** Lid: positive bulges up, negative sags. */
    readonly arch: number;
    /** Bowl squareness: ~0.55 elliptical, ~0.9 boxy like a "D". */
    readonly round: number;
    /** Stroke weight. */
    readonly thick: number;
    /** Vertical offset of the corners. */
    readonly y: number;
    /** 0..1 visibility of the bowl stroke. */
    readonly bowl: number;
    /** 0..1 visibility of the lid stroke. */
    readonly lid: number;
}

export interface EyeShape {
    readonly rx: number;
    readonly ry: number;
    /** 0..1 cross-fade to a happy caret (^). */
    readonly happy: number;
    /** 0..1 cross-fade to a glyph ($, ×, @). */
    readonly glyph: number;
    /** Vertical offset (droopy eyes sit lower). */
    readonly y: number;
}

export interface Expression {
    readonly eyes: EyeShape;
    /** Right eye, when it differs (wink). */
    readonly rightEye?: EyeShape;
    readonly mouth: MouthShape;
    /** Glyph shown when an eye's `glyph` is up. */
    readonly glyph?: string;
}

export type ExpressionName =
    | 'grin'
    | 'beam'
    | 'smile'
    | 'content'
    | 'wink'
    | 'curious'
    | 'ooh'
    | 'neutral'
    | 'bored'
    | 'yawn'
    | 'sleep'
    | 'money'
    | 'dizzy'
    | 'spiral'
    | 'grumpy';

export const EYE_X = 21;
export const EYE_Y = -27;
/** Stroke weight of the grin's "D"; the loader sizes the face from it. */
export const GRIN_STROKE = 11;
export const GRIN_HALF_WIDTH = 30;
export const GRIN_DEPTH = 40;
export const EYE_RADIUS = 7.5;

const DOT: EyeShape = { rx: EYE_RADIUS, ry: EYE_RADIUS, happy: 0, glyph: 0, y: 0 };
const HAPPY: EyeShape = { ...DOT, happy: 1 };
const GLYPH: EyeShape = { ...DOT, glyph: 1 };
const CLOSED: EyeShape = { rx: 9, ry: 2.6, happy: 0, glyph: 0, y: 2 };

const mouth = (shape: Partial<MouthShape> & Pick<MouthShape, 'w' | 'depth'>): MouthShape => ({
    arch: 0,
    round: 0.86,
    thick: GRIN_STROKE,
    y: 0,
    bowl: 1,
    lid: 1,
    ...shape,
});

const SMILE = mouth({ w: 22, depth: 15, round: 0.6, lid: 0, thick: 10, y: 4 });

export const EXPRESSIONS: Record<ExpressionName, Expression> = {
    /** :D, the resting face. */
    grin: { eyes: DOT, mouth: mouth({ w: GRIN_HALF_WIDTH, depth: GRIN_DEPTH }) },
    /** ^D^ */
    beam: { eyes: HAPPY, mouth: mouth({ w: 33, depth: 45 }) },
    /** :) */
    smile: { eyes: DOT, mouth: SMILE },
    /** ^)^ */
    content: { eyes: HAPPY, mouth: SMILE },
    /** ;D */
    wink: { eyes: DOT, rightEye: CLOSED, mouth: mouth({ w: 27, depth: 32 }) },
    /** :o */
    curious: { eyes: { ...DOT, rx: 8.5, ry: 9 }, mouth: mouth({ w: 8, depth: 15, arch: 7, round: 0.55, thick: 9, y: 6 }) },
    /** :O */
    ooh: { eyes: { ...DOT, rx: 9, ry: 10.5 }, mouth: mouth({ w: 12, depth: 24, arch: 12, round: 0.55, thick: 10, y: 3 }) },
    /** :- */
    neutral: { eyes: DOT, mouth: mouth({ w: 15, depth: 0, bowl: 0, thick: 10, y: 10 }) },
    /** droopy lids, flat mouth */
    bored: { eyes: { ...DOT, rx: 8.5, ry: 3, y: 3 }, mouth: mouth({ w: 12, depth: 0, bowl: 0, thick: 9, y: 12 }) },
    /** -O- */
    yawn: { eyes: CLOSED, mouth: mouth({ w: 12, depth: 32, arch: 15, round: 0.55, thick: 10, y: 6 }) },
    /** -o- with z's floating up */
    sleep: { eyes: CLOSED, mouth: mouth({ w: 6, depth: 8, arch: 4, round: 0.55, thick: 8, y: 10 }) },
    /** $D$ */
    money: { eyes: GLYPH, mouth: mouth({ w: 33, depth: 44 }), glyph: '$' },
    /** ×o× after a hard landing */
    dizzy: { eyes: GLYPH, mouth: mouth({ w: 9, depth: 12, arch: 6, round: 0.55, thick: 9, y: 8 }), glyph: '×' },
    /** @)@ after chasing the cursor */
    spiral: { eyes: GLYPH, mouth: mouth({ w: 20, depth: 10, round: 0.6, lid: 0, thick: 10, y: 6 }), glyph: '@' },
    /** >:( frowning, after being thrown into a wall */
    grumpy: { eyes: { ...DOT, rx: 8, ry: 5, y: 3 }, mouth: mouth({ w: 16, depth: 0, arch: 7, bowl: 0, thick: 10, y: 12 }) },
};

const f = (n: number): string => n.toFixed(2);

/** The rounded bowl: from the left corner, down and round, to the right corner. */
export function bowlPath(w: number, depth: number, round: number, y: number): string {
    const hw = Math.max(0.5, w);
    const d = Math.max(0, depth);
    const bottom = y + d;
    return (
        `M ${f(-hw)} ${f(y)} C ${f(-hw)} ${f(y + d * round)} ${f(-hw * round * 0.62)} ${f(bottom)} 0 ${f(bottom)} ` +
        `C ${f(hw * round * 0.62)} ${f(bottom)} ${f(hw)} ${f(y + d * round)} ${f(hw)} ${f(y)}`
    );
}

/** The lid across the top: flat, arched up, or sagging. */
export function lidPath(w: number, arch: number, y: number): string {
    const hw = Math.max(0.5, w);
    return `M ${f(-hw)} ${f(y)} Q 0 ${f(y - 2 * arch)} ${f(hw)} ${f(y)}`;
}
