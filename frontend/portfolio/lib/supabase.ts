import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Two Supabase clients, both server-only (never exposed to the browser).
 *
 *  - `supabasePublic`: uses the PUBLISHABLE key (`sb_publishable_...`).
 *    Respects RLS. Used for public read operations (home page SSR, public
 *    GET API routes).
 *
 *  - `supabaseAdmin`: uses the SECRET key (`sb_secret_...`). Bypasses RLS.
 *    Used for admin writes, deletes, and file uploads, always behind
 *    `requireAdmin()`.
 *
 * The publishable key is OPTIONAL. If it is not set, both clients fall back
 * to the secret key. That's safe because neither client is ever constructed
 * on the client bundle (env vars have no `NEXT_PUBLIC_` prefix), but it does
 * mean read operations bypass RLS. Set the publishable key + read policies
 * later for proper defense in depth.
 *
 * Note: `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` are accepted as
 * aliases for backward compatibility with Supabase's legacy key naming.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

const SUPABASE_SECRET_KEY =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET ?? 'portfolio-uploads';

function assertEnv(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(
            `Missing env var ${name}. Set it in Vercel project settings (server-only, no NEXT_PUBLIC_ prefix).`
        );
    }
    return value;
}

let _public: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

export function supabasePublic(): SupabaseClient {
    if (!_public) {
        // Prefer the publishable key (respects RLS). If not set, fall back to
        // the secret key so the site still works on day one with a single
        // secret key configured — matches the legacy FastAPI setup.
        const key = SUPABASE_PUBLISHABLE_KEY ?? SUPABASE_SECRET_KEY;
        _public = createClient(
            assertEnv('SUPABASE_URL', SUPABASE_URL),
            assertEnv('SUPABASE_PUBLISHABLE_KEY or SUPABASE_SECRET_KEY', key),
            { auth: { persistSession: false } }
        );
    }
    return _public;
}

export function supabaseAdmin(): SupabaseClient {
    if (!_admin) {
        _admin = createClient(
            assertEnv('SUPABASE_URL', SUPABASE_URL),
            assertEnv('SUPABASE_SECRET_KEY', SUPABASE_SECRET_KEY),
            { auth: { persistSession: false } }
        );
    }
    return _admin;
}

// Tables (must match SQLAlchemy model __tablename__ values)
export const TABLES = {
    projects: 'projects',
    education: 'education',
    settings: 'site_settings',
    skills: 'skill_icons',
} as const;
