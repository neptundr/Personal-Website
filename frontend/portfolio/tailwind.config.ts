// tailwind.config.ts
import type {Config} from 'tailwindcss';

const config: Config = {
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                futura: ['var(--font-futura)'],
                tilda: ['var(--font-tilda)'],
                codec: ['var(--font-codec)'],
            },
        },
    },
    plugins: [],
};

export default config;