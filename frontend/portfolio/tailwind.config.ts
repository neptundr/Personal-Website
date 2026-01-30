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
                codec: ['var(--font-codec)'],
            },
        },
    },
    plugins: [],
};

export default config;