import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/auth';

// Protect /admin/* pages (but not /admin/login) at the routing layer.
// API route handlers still independently call `requireAdmin` for defense in
// depth — this proxy just stops unauthenticated users from ever loading
// admin UI. (Next.js 16 renamed `middleware` → `proxy`.)
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Let the login page through unauthenticated.
    if (pathname === '/admin/login') {
        return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const payload = await verifyAdminToken(token);

    if (!payload) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Match /admin and everything under /admin/ — login check is handled
    // inside the middleware body so the login page itself is reachable.
    matcher: ['/admin/:path*'],
};
