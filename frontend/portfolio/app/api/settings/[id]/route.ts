import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, TABLES } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT /api/settings/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;

    const { id } = await params;
    const body = await request.json();

    const { data: existing } = await supabaseAdmin()
        .from(TABLES.settings)
        .select('id')
        .eq('id', id)
        .maybeSingle();
    if (!existing) {
        return NextResponse.json({ detail: 'Settings not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin()
        .from(TABLES.settings)
        .update(body)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}
