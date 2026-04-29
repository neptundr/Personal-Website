# components/redesign — Design System v2

## Palette
| Name | Hex | RGB (0–1) |
|------|-----|-----------|
| Magenta | `#E91E5C` | `{ r:0.913, g:0.118, b:0.361 }` |
| Mint | `#2EE5A0` | `{ r:0.180, g:0.898, b:0.627 }` |
| Near-black | `#0A0A0C` | background / clear color |
| White | `#F2F2F2` | text, accents |

## Typography
| Role | Font | CSS variable |
|------|------|-------------|
| Hero display word | Anton (Google, 400) | `--font-anton` |
| Tracked uppercase labels | codecBold (local, 600) | `--font-codecBold` |

## Motion language
Liquid fluid simulation is the primary motion element. All future sections should integrate as scroll-coupled fluid splats or respond to the velocity field.

## Applied effects
- **Chromatic aberration** — RGB UV offset in display shader (`aberration` uniform, ~2–3px)
- **Film grain** — SVG `feTurbulence`, `mix-blend-mode: overlay`, opacity 0.12
- **Vignette** — CSS `radial-gradient`, no JS cost

## Performance budget
| Concern | Target |
|---------|--------|
| Hero JS chunk | ≤ 60KB gzipped |
| FPS (M1) | 60fps |
| FPS (mid-tier mobile) | 30fps |
| LCP | < 2.5s |

## Fluid sim files
| File | Purpose |
|------|---------|
| `hero/LiquidHero.tsx` | Client component — WebGL2 sim loop, pointer handling |
| `hero/LiquidHeroLazy.tsx` | `dynamic(..., {ssr:false})` wrapper |
| `hero/liquid-shaders.ts` | All GLSL strings (vertex + 9 fragment programs) |
| `hero/liquid-config.ts` | `SIM`, `LOW_POWER_SIM`, `PALETTE`, constants |
| `hero/liquid-webgl.ts` | `createFBO`, `createDoubleFBO`, `blit`, `createGLProgram` |
| `hero/Grain.tsx` | Film grain overlay |
| `hero/HeroOverlay.tsx` | Side text + center word + vignette |

## Low-power mode
Auto-detected via `navigator.deviceMemory < 4`. Drops to `simRes:128 / dyeRes:512`.

## Pause hooks
- `document.visibilitychange` — stops RAF when tab hidden
- `IntersectionObserver` — stops RAF when canvas off-screen
- `prefers-reduced-motion` — skips canvas mount entirely
