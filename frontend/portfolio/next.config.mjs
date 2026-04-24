/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow next/image to serve images from Supabase Storage public URLs.
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },

    // Tree-shake package imports more aggressively.
    experimental: {
        optimizePackageImports: ['framer-motion', 'lucide-react'],
    },

    // Serverless bundle must include the @node-rs/argon2 native addon for
    // login password verification.
    serverExternalPackages: ['@node-rs/argon2'],
};

export default nextConfig;
