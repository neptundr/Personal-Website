import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/supabase';

/**
 * Temporary diagnostic endpoint.
 * Hit /api/debug on any deployment to see env var status + Supabase query results.
 * Remove this file once the issue is resolved.
 */
export async function GET() {
    const url = process.env.SUPABASE_URL;
    const publishableKey =
        process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    const secretKey =
        process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envStatus = {
        SUPABASE_URL: url ? `set (${url.slice(0, 30)}...)` : 'MISSING',
        SUPABASE_PUBLISHABLE_KEY: publishableKey
            ? `set (${publishableKey.slice(0, 12)}...)`
            : 'MISSING',
        SUPABASE_SECRET_KEY: secretKey
            ? `set (${secretKey.slice(0, 12)}...)`
            : 'MISSING',
        SUPABASE_BUCKET: process.env.SUPABASE_BUCKET ?? 'not set (default: portfolio-uploads)',
        SECRET_KEY: process.env.SECRET_KEY ? 'set' : 'MISSING',
        ADMIN_USERNAME: process.env.ADMIN_USERNAME ? 'set' : 'MISSING',
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH ? 'set' : 'MISSING',
    };

    if (!url || (!publishableKey && !secretKey)) {
        return NextResponse.json(
            { envStatus, error: 'Cannot connect — missing Supabase env vars' },
            { status: 500 },
        );
    }

    // Use whichever key is available
    const key = (publishableKey ?? secretKey)!;
    const client = createClient(url, key, { auth: { persistSession: false } });

    const queries = await Promise.allSettled([
        client.from(TABLES.settings).select('count').limit(1),
        client.from(TABLES.projects).select('count').limit(1),
        client.from(TABLES.education).select('count').limit(1),
        client.from(TABLES.skills).select('count').limit(1),
    ]);

    const tableStatus = {
        [TABLES.settings]: formatResult(queries[0]),
        [TABLES.projects]: formatResult(queries[1]),
        [TABLES.education]: formatResult(queries[2]),
        [TABLES.skills]: formatResult(queries[3]),
    };

    return NextResponse.json({ envStatus, tableStatus });
}

function formatResult(
    result: PromiseSettledResult<{ data: unknown; error: { message: string } | null }>,
) {
    if (result.status === 'rejected') return { ok: false, error: String(result.reason) };
    const { data, error } = result.value;
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
}
