import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic, supabaseAdmin, TABLES } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/settings — public, returns single row or null.
// The FastAPI backend returned `db.query(SiteSettings).first()` which is a
// single object (or null). Frontend `api/client.ts` wraps it in an array.
// We keep the same raw-object shape so the existing client wrapping works.
export async function GET() {
    const { data, error } = await supabasePublic()
        .from(TABLES.settings)
        .select('*')
        .limit(1)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? {});
}

// POST /api/settings — admin only, create a settings row
export async function POST(request: NextRequest) {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;

    const body = await request.json();
    const { data, error } = await supabaseAdmin()
        .from(TABLES.settings)
        .insert(body)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}
