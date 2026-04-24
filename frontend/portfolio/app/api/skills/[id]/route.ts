import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, TABLES } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// DELETE /api/skills/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;

    const { id } = await params;
    const { error } = await supabaseAdmin()
        .from(TABLES.skills)
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}
