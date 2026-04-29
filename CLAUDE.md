# Personal Website — Claude Session Guide

## What this project is

Denis's personal portfolio site. A Next.js 16 App Router frontend deployed on **Vercel**, backed by **Supabase** (PostgreSQL + Storage). There is also a legacy FastAPI backend in `/backend` — it has been **fully superseded** by Next.js API routes and can be ignored or deleted.

---

## Repo layout

```
Personal-Website/
├── frontend/portfolio/        ← the only thing that matters
│   ├── app/
│   │   ├── page.tsx           ← home page (ISR Server Component)
│   │   ├── layout.tsx
│   │   ├── providers.tsx      ← React Query + Toaster client wrapper
│   │   ├── admin/             ← protected admin UI pages
│   │   │   ├── login/
│   │   │   ├── projects/
│   │   │   ├── education/
│   │   │   ├── settings/
│   │   │   └── skillicons/
│   │   └── api/               ← serverless API routes (replaced FastAPI)
│   │       ├── admin/login/route.ts
│   │       ├── admin/logout/route.ts
│   │       ├── projects/route.ts + [id]/route.ts
│   │       ├── education/route.ts + [id]/route.ts
│   │       ├── settings/route.ts + [id]/route.ts
│   │       ├── skills/route.ts + [id]/route.ts
│   │       ├── upload/route.ts
│   │       └── debug/route.ts  ← TEMPORARY, delete after env fix confirmed
│   ├── components/
│   │   ├── hero/              FractalTunnel.tsx, HeroSection.tsx,
│   │   │                      FractalTunnelLazy.tsx (client wrapper for ssr:false)
│   │   ├── experience/        ExperienceSection, ExperienceCard, useTilt
│   │   ├── education/         EducationSection, EducationCard
│   │   ├── contact/           ContactSection, GameOfLife
│   │   ├── footer/            FooterSection
│   │   ├── shared/            SkillBadge
│   │   ├── admin/             AdminLayout, AdminNav, EntityForm
│   │   └── ui/                shadcn/ui primitives (don't touch)
│   ├── lib/
│   │   ├── supabase.ts        ← two Supabase clients + TABLES map
│   │   └── auth.ts            ← JWT helpers + requireAdmin() + cookie name
│   ├── proxy.ts               ← Next.js 16 middleware (protects /admin/*)
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── backend/                   ← legacy FastAPI, IGNORE
```

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict, `exactOptionalPropertyTypes: true`) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Data | Supabase (PostgreSQL + Storage) |
| Auth | `jose` JWT + `@node-rs/argon2` + HttpOnly cookie |
| Hosting | Vercel (Hobby tier) |
| State | TanStack Query v5 (admin pages only — home page is SSR) |

---

## Key architectural decisions

### Home page is an ISR Server Component
`app/page.tsx` is an **async Server Component** with `export const revalidate = 3600`. It calls `loadHomeData()` which fires 4 Supabase queries in parallel and returns data directly into JSX — no client-side fetching, no blank-page flicker on cold start.

### FractalTunnel needs a client wrapper
`ssr: false` dynamic imports are only allowed inside Client Components in Next.js 16. `FractalTunnelLazy.tsx` is the thin `'use client'` wrapper — import it from the Server Component, not `FractalTunnel` directly.

### Middleware is named `proxy.ts` / `proxy()`
Next.js 16 renamed the middleware file and export. The file is `frontend/portfolio/proxy.ts` and exports `async function proxy(request)` (not `middleware`). It guards `/admin/*`, letting `/admin/login` through unauthenticated.

### Two Supabase clients, never exposed to the browser
- `supabasePublic()` — uses publishable key, respects RLS. Used by home page SSR and public GET routes.
- `supabaseAdmin()` — uses secret key, bypasses RLS. Used by admin write routes behind `requireAdmin()`.
- Both are lazy singletons in `lib/supabase.ts`. Neither key has a `NEXT_PUBLIC_` prefix.

### TABLES map
```ts
// lib/supabase.ts
export const TABLES = {
  projects:  'projects',
  education: 'education',
  settings:  'site_settings',
  skills:    'skill_icons',
}
```
These match the SQLAlchemy `__tablename__` values from the old FastAPI models.

---

## Environment variables (Vercel → Project Settings → Environment Variables)

All server-only — no `NEXT_PUBLIC_` prefix:

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | ✅ | `https://<project>.supabase.co` |
| `SUPABASE_SECRET_KEY` | ✅ | Service role key. Starts with `eyJ…`. **Copy the revealed value, not the masked dots.** |
| `SUPABASE_PUBLISHABLE_KEY` | optional | Anon/publishable key. Falls back to secret key if missing. |
| `SUPABASE_BUCKET` | optional | Storage bucket name. Defaults to `portfolio-uploads`. |
| `SECRET_KEY` | ✅ | Random string used to sign admin JWTs. |
| `ADMIN_USERNAME` | ✅ | Admin login username. |
| `ADMIN_PASSWORD_HASH` | ✅ | argon2id hash of admin password (generated via passlib). |

**Remove `NEXT_PUBLIC_API_URL`** — it pointed to the old Render backend which no longer exists.

---

## Open PR

**PR #3** `rini/serene-perlman-9ae1d8` → `main`
https://github.com/neptundr/Personal-Website/pull/3

Contains the entire migration: ISR home page, 11 API routes, `lib/auth.ts`, `lib/supabase.ts`, `proxy.ts` middleware, `FractalTunnelLazy`, font deletions (655 KB saved), bundle optimisations.

### Status as of last session
- All code committed and pushed ✅
- Vercel Preview building from the PR branch ✅
- **Bug found:** `SUPABASE_SECRET_KEY` was pasted as bullet characters (`••••`) instead of the real value → all Supabase queries fail with a `ByteString` error
- **Fix:** Re-paste the actual service role key in Vercel env vars → redeploy

### After the env fix is confirmed working — merge checklist
1. ~~Delete `app/api/debug/route.ts`~~ ✅ done
2. ~~Remove the debug error banner from `app/page.tsx`~~ ✅ done
3. Merge PR #3 into `main`
4. Shut down the Render service
5. Remove the UptimeRobot monitor for the Render URL

---

## Common gotchas

- **`exactOptionalPropertyTypes: true`** — optional props must be declared `prop?: T`, not `prop: T | undefined`. Be precise when spreading or passing optional fields.
- **`ssr: false` only in Client Components** — never call `dynamic(..., { ssr: false })` inside a Server Component; wrap it in a `'use client'` file first.
- **Server Component logs go to Vercel Function logs**, not the browser console. Check Vercel dashboard → Deployment → Functions tab.
- **`/api/debug`** (temporary) — hit this URL on any Vercel deployment to check env var presence and live table connectivity.
- **Vercel Hobby tier** — ~4.5 MB body limit on serverless functions. Large video uploads will fail; needs a direct-to-Supabase-Storage upload strategy if that becomes a requirement.
- **Git worktrees** — Claude sessions create worktrees under `.claude/worktrees/`. The PR branch lives at `.claude/worktrees/serene-perlman-9ae1d8/`.

---

## Local dev

```bash
cd frontend/portfolio
npm install
# create .env.local with the variables from the table above
npm run dev      # http://localhost:3000
npm run build    # verify production build before pushing
```

The `backend/` folder has its own Python venv and is not needed for local development.

---

## Redesign v2 (branch: `redesign/v2`)

Phase 1 complete: liquid WebGL hero at `/`.

### New files
| Path | Purpose |
|------|---------|
| `components/redesign/hero/LiquidHero.tsx` | WebGL2 Navier-Stokes fluid sim, mouse-interactive |
| `components/redesign/hero/LiquidHeroLazy.tsx` | `dynamic(..., {ssr:false})` client wrapper |
| `components/redesign/hero/liquid-shaders.ts` | All GLSL shader strings |
| `components/redesign/hero/liquid-config.ts` | Palette, sim constants, FBO sizes |
| `components/redesign/hero/liquid-webgl.ts` | WebGL helpers (FBO, programs, blit) |
| `components/redesign/hero/Grain.tsx` | SVG feTurbulence film grain overlay |
| `components/redesign/hero/HeroOverlay.tsx` | Side text + Anton center word + vignette |
| `app/old-design/page.tsx` | Preserved old home at `/old-design` |

### Supabase migration (run manually in dashboard)
```sql
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS hero_center_word TEXT DEFAULT 'CREATE';
```

### Design tokens (redesign)
- Magenta: `#E91E5C` / `{ r:0.913, g:0.118, b:0.361 }`
- Mint: `#2EE5A0` / `{ r:0.180, g:0.898, b:0.627 }`
- Background: `#0A0A0C`
- Center word font: Anton (`--font-anton`, Google Fonts)
- Side text font: codecBold (`--font-codecBold`)
