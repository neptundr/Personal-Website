import { Funnel_Display } from 'next/font/google';

// Funnel Display: one variable family (wght 300–800) for the whole v2 site,
// including the text painted onto the Möbius ribbon.
export const funnelDisplay = Funnel_Display({
    subsets: ['latin'],
    variable: '--font-funnel',
    display: 'swap',
});
