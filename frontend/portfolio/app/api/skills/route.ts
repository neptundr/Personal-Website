import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic, supabaseAdmin, TABLES } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/skills — public
export async function GET() {
    const { data, error } = await supabasePublic()
        .from(TABLES.skills)
        .select('*');

    if (error) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
}

// POST /api/skills — admin only
export async function POST(request: NextRequest) {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;

    const body = await request.json();
    const { data, error } = await supabaseAdmin()
        .from(TABLES.skills)
        .insert(body)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}
