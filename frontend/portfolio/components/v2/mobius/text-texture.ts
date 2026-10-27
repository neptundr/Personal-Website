import { CanvasTexture, ClampToEdgeWrapping, LinearMipmapLinearFilter, RepeatWrapping } from 'three';

// One tile of "WELCOME!" in white on transparent, tiled along the ribbon by
// the shader. Only the alpha is used, so the ribbon's colours stay live.

const TILE_HEIGHT = 256;
const FONT_SIZE = 196;
const WORD = 'WELCOME!';

export interface TextTile {
    readonly texture: CanvasTexture;
    /** Tile width / height. */
    readonly aspect: number;
}

export async function createWelcomeTile(fontFamily: string): Promise<TextTile> {
    const font = `800 ${FONT_SIZE}px ${fontFamily}`;
    try {
        await document.fonts.load(font, WORD);
    } catch {
        // Fall back to whatever the browser has; the ribbon still renders.
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable for the ribbon text');

    ctx.font = font;
    const gap = FONT_SIZE * 0.42;
    const width = Math.ceil(ctx.measureText(WORD).width + gap);
    canvas.width = width;
    canvas.height = TILE_HEIGHT;

    // Resizing the canvas resets its state.
    ctx.font = font;
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(WORD, gap / 2, TILE_HEIGHT * 0.53);

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return { texture, aspect: width / TILE_HEIGHT };
}
