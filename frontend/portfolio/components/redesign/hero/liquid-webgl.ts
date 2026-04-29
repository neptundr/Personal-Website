// WebGL utility types and helpers for the fluid simulation.

export interface GLProgram {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation | null>;
    /** Safe uniform location accessor — returns null (not undefined) for unknown keys. */
    u(name: string): WebGLUniformLocation | null;
}

export interface FBO {
    texture: WebGLTexture;
    fbo: WebGLFramebuffer;
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    attach(id: number): number;
}

export interface DoubleFBO {
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    read: FBO;
    write: FBO;
    swap(): void;
}

export function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`Shader compile error: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
}

export function createGLProgram(
    gl: WebGLRenderingContext,
    vertSrc: string,
    fragSrc: string,
): GLProgram {
    const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create program');
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    // Bind aPosition to location 0 before linking so initQuad works for all programs
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
    }
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (let i = 0; i < uniformCount; i++) {
        const info = gl.getActiveUniform(program, i);
        if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms, u: (name) => uniforms[name] ?? null };
}

/** Upload a fullscreen quad and configure attrib 0 as aPosition. */
export function initQuad(gl: WebGLRenderingContext): void {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
        gl.STATIC_DRAW,
    );
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array([0, 1, 2, 0, 2, 3]),
        gl.STATIC_DRAW,
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
}

export function createFBO(
    gl: WebGLRenderingContext,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    filtering: number,
): FBO {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error('Failed to create framebuffer');
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1 / w,
        texelSizeY: 1 / h,
        attach(id: number): number {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        },
    };
}

export function createDoubleFBO(
    gl: WebGLRenderingContext,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    filtering: number,
): DoubleFBO {
    let fbo1 = createFBO(gl, w, h, internalFormat, format, type, filtering);
    let fbo2 = createFBO(gl, w, h, internalFormat, format, type, filtering);
    return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1; },
        get write() { return fbo2; },
        swap() { [fbo1, fbo2] = [fbo2, fbo1]; },
    };
}

/**
 * Draw the fullscreen quad to `target`.
 * Pass `null` to render to the default framebuffer (the canvas).
 */
export function blit(gl: WebGLRenderingContext, target: FBO | null): void {
    if (target === null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}
