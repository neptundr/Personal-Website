// The :D speaks in type. Every expression is literally an emoticon: two eye
// characters and a mouth character from the site font, laid out like the
// text ":D" and then turned upright. Changing expression swaps characters
// with a little pop, so the face always looks like it came out of the font.
//
// Face space = text space: the run ":D" set at FACE_FONT_SIZE, baseline at
// y = 0, starting at x = 0. The engine rotates the whole run by 90° to stand
// it up as a face (colon on top, "D" below).

/** Characters an eye can be. "." is a colon's dot; the others stand upright. */
export type EyeChar = '.' | '-' | '^' | '$' | '×';

export interface Expression {
    /** [lower dot of the colon, upper dot]: the face's left and right eye once upright. */
    readonly eyes: readonly [EyeChar, EyeChar];
    readonly mouth: string;
    /** Extra scale on the mouth glyph (a big beam, a wide yawn). */
    readonly mouthScale?: number;
}

export type ExpressionName =
    | 'grin'
    | 'beam'
    | 'smile'
    | 'content'
    | 'wink'
    | 'tongue'
    | 'cat'
    | 'curious'
    | 'ooh'
    | 'neutral'
    | 'bored'
    | 'yawn'
    | 'sleep'
    | 'money'
    | 'dizzy'
    | 'grumpy';

/** Font size of the face glyphs, in face units. A Pose's `size` is px per this. */
export const FACE_FONT_SIZE = 100;
/** Matches the loader's letter-spacing (-0.02em) so ":D" lines up exactly. */
export const FACE_LETTER_SPACING = -2;
/** Eye glyphs other than "." are turned so they stand upright on the upright face. */
export const EYE_UPRIGHT = -90;

export const EXPRESSIONS: Record<ExpressionName, Expression> = {
    grin: { eyes: ['.', '.'], mouth: 'D' },
    beam: { eyes: ['^', '^'], mouth: 'D', mouthScale: 1.08 },
    smile: { eyes: ['.', '.'], mouth: ')' },
    content: { eyes: ['^', '^'], mouth: ')' },
    wink: { eyes: ['.', '-'], mouth: ')' },
    tongue: { eyes: ['.', '.'], mouth: 'P' },
    cat: { eyes: ['.', '.'], mouth: '3' },
    curious: { eyes: ['.', '.'], mouth: 'o' },
    ooh: { eyes: ['.', '.'], mouth: 'O', mouthScale: 1.05 },
    neutral: { eyes: ['.', '.'], mouth: '|' },
    bored: { eyes: ['-', '-'], mouth: '|' },
    yawn: { eyes: ['-', '-'], mouth: 'O', mouthScale: 1.15 },
    sleep: { eyes: ['-', '-'], mouth: 'o' },
    money: { eyes: ['$', '$'], mouth: 'D', mouthScale: 1.06 },
    dizzy: { eyes: ['×', '×'], mouth: 'o' },
    grumpy: { eyes: ['.', '.'], mouth: '(' },
};
