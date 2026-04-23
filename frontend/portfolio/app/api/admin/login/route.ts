import { NextRequest, NextResponse } from 'next/server';
import { verify as argonVerify } from '@node-rs/argon2';
import { signAdminToken, ADMIN_COOKIE, TOKEN_EXPIRE_SECONDS } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
        return NextResponse.json(
            { detail: 'Server not configured' },
            { status: 500 }
        );
    }

    let username = '';
    let password = '';
    try {
        const body = await request.json();
        username = body?.username ?? '';
        password = body?.password ?? '';
    } catch {
        return NextResponse.json(
            { detail: 'Invalid JSON' },
            { status: 400 }
        );
    }

    if (username !== ADMIN_USERNAME) {
        return NextResponse.json(
            { detail: 'Invalid credentials' },
            { status: 401 }
        );
    }

    let passwordOk = false;
    try {
        // @node-rs/argon2's `verify(hash, password)` handles passlib's
        // $argon2id$... hash format directly.
        passwordOk = await argonVerify(ADMIN_PASSWORD_HASH, password);
    } catch {
        passwordOk = false;
    }

    if (!passwordOk) {
        return NextResponse.json(
            { detail: 'Invalid credentials' },
            { status: 401 }
        );
    }

    const token = await signAdminToken();

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
        name: ADMIN_COOKIE,
        value: token,
        httpOnly: true,
        sameSite: 'lax', // same-origin now (frontend and API on one domain)
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: TOKEN_EXPIRE_SECONDS,
    });
    return response;
}
