import { jwtVerify, SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'admin_token';
export const TOKEN_EXPIRE_SECONDS = 60 * 60 * 12; // 12h, same as FastAPI backend

function getSecretKey(): Uint8Array {
    const secret = process.env.SECRET_KEY;
    if (!secret) {
        throw new Error('Missing SECRET_KEY env var');
    }
    return new TextEncoder().encode(secret);
}

/**
 * Verify the `admin_token` cookie on the incoming request.
 * Returns the JWT payload if valid, or null if missing/invalid.
 */
export async function verifyAdminToken(token: string | undefined): Promise<
    { sub: string } | null
> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: ['HS256'],
        });
        if (payload.sub !== 'admin') return null;
        return { sub: 'admin' };
    } catch {
        return null;
    }
}

/**
 * Guard helper for route handlers. Call at the top of any protected route:
 *
 *   const unauth = await requireAdmin(request);
 *   if (unauth) return unauth;
 *
 * Returns an early NextResponse (401) if the request is not authenticated,
 * or null if the caller should proceed.
 */
export async function requireAdmin(
    request: NextRequest
): Promise<NextResponse | null> {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const payload = await verifyAdminToken(token);
    if (!payload) {
        return NextResponse.json(
            { detail: 'Not authenticated' },
            { status: 401 }
        );
    }
    return null;
}

/**
 * Sign a new admin JWT (12h expiry, HS256).
 */
export async function signAdminToken(): Promise<string> {
    return await new SignJWT({ sub: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setSubject('admin')
        .setExpirationTime('12h')
        .sign(getSecretKey());
}
