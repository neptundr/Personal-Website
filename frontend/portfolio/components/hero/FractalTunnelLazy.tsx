'use client';

import dynamic from 'next/dynamic';

// Thin client-side wrapper so a Server Component can still dynamically
// import the canvas component with ssr: false (which Next.js 16 only
// allows inside a Client Component).
const FractalTunnel = dynamic(() => import('./FractalTunnel'), {ssr: false});

export default function FractalTunnelLazy() {
    return <FractalTunnel />;
}
