'use client';

import dynamic from 'next/dynamic';

// Thin client-side wrapper so a Server Component can dynamically import
// the canvas component with ssr: false (Next.js requires this inside a Client Component).
const LiquidHero = dynamic(() => import('./LiquidHero'), { ssr: false });

export default function LiquidHeroLazy() {
    return <LiquidHero />;
}
