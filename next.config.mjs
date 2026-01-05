/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        viewTransitions: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'imgs.search.brave.com',
            },
            {
                protocol: 'https',
                hostname: 'www.amazon.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'platform-lookaside.fbsbx.com',
            }
        ],
    },
    // Deshabilitar source maps para evitar errores de parsing
    productionBrowserSourceMaps: false,
    // Configuración de Turbopack (Next.js 16 usa Turbopack por defecto)
    turbopack: {},
    // Aumentar el límite de tamaño del body para Server Actions (50MB para múltiples imágenes)
    serverActions: {
        bodySizeLimit: '50mb',
    },
};

export default nextConfig;
