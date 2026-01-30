import {NextRequest, NextResponse} from 'next/server';
import {jwtVerify} from 'jose';

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

export async function proxy(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    if (!pathname.startsWith('/admin')) return NextResponse.next();
    if (pathname === '/admin/login') return NextResponse.next();

    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url));

    try {
        await jwtVerify(token, SECRET);
        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL('/admin/login', req.url));
    }
}

export const config = {matcher: ['/admin/:path*']};