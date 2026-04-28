import Link from 'next/link';

export default function NotFound() {
    return (
        <div
            className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6"
            style={{fontFamily: 'var(--font-codecLight)'}}
        >
            <p className="text-red-500/70 text-xs tracking-[0.4em] uppercase mb-6">
                Page not found
            </p>

            <h1
                className="text-[clamp(6rem,20vw,14rem)] text-white leading-none select-none"
                style={{fontFamily: 'var(--font-codecBold)'}}
            >
                404
            </h1>

            <p className="mt-6 text-zinc-500 text-sm text-center max-w-xs">
                This page doesn&apos;t exist or was moved.
            </p>

            <Link
                href="/"
                className="mt-10 inline-flex items-center gap-2 px-5 py-2 rounded-full
                           border border-red-500/30 bg-red-500/10 backdrop-blur-md
                           text-xs text-red-400 tracking-[0.2em] uppercase
                           transition-colors hover:border-red-500 hover:bg-red-500/20 hover:text-white"
                style={{fontFamily: 'var(--font-codec)'}}
            >
                Back to home
            </Link>
        </div>
    );
}
