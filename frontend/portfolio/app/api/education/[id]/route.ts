import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, TABLES } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT /api/education/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;

    const { id } = await params;
    const body = await request.json();

    const { data: existing } = await supabaseAdmin()
        .from(TABLES.education)
        .select('id')
        .eq('id', id)
        .maybeSingle();
    if (!existing) {
        return NextResponse.json({ detail: 'Education not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin()
        .from(TABLES.education)
        .update(body)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}

// DELETE /api/education/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;

    const { id } = await params;
    const { error } = await supabaseAdmin()
        .from(TABLES.education)
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}
