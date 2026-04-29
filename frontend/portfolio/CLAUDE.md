# frontend/portfolio — Next.js App

## Folder layout
```
app/
  page.tsx              ← / (new liquid hero, Phase 1 redesign)
  old-design/page.tsx   ← /old-design (previous home, preserved)
  layout.tsx            ← root layout, registers all font variables
  fonts.ts              ← codec/codecLight/codecBold/anelka/anton
  admin/                ← auth-gated admin panel
  api/                  ← serverless API routes

components/
  redesign/hero/        ← Phase 1 redesign components (liquid sim)
  hero/                 ← old FractalTunnel + HeroSection
  experience/
  education/
  contact/
  admin/
  ui/                   ← shadcn primitives (don't modify)

lib/
  supabase.ts           ← supabasePublic() / supabaseAdmin() / TABLES
  auth.ts               ← requireAdmin(), JWT helpers

types/
  types.ts              ← Project, Education, SiteSettings interfaces

proxy.ts                ← Next.js middleware (guards /admin/*)
```

## Font system
| Variable | Weight | Use |
|----------|--------|-----|
| `--font-codec` | 500 | body default |
| `--font-codecLight` | 300 | page wrapper |
| `--font-codecBold` | 600 | tracked uppercase marginalia |
| `--font-anelka` | 400 | decorative display |
| `--font-anton` | 400 | redesign hero center word (Anton, Google Fonts) |

## Tailwind conventions
- Base: `zinc-950` background
- Old accent: `red-500`
- Redesign palette: magenta `#E91E5C`, mint `#2EE5A0`, near-black `#0A0A0C`

## Supabase tables
| Constant | Table |
|----------|-------|
| `TABLES.projects` | `projects` |
| `TABLES.education` | `education` |
| `TABLES.settings` | `site_settings` |
| `TABLES.skills` | `skill_icons` |

## Auth
JWT cookie `admin_token`, helpers in `lib/auth.ts`. Middleware at `proxy.ts`.

## ISR
`export const revalidate = 3600` on home page. Content always present in HTML.

## Key patterns
- `ssr: false` dynamic imports must be inside a `'use client'` wrapper (see `LiquidHeroLazy.tsx`, `FractalTunnelLazy.tsx`)
- Server Component pages call Supabase directly — no client fetch on initial load
- Admin pages use TanStack Query for client-side mutation
