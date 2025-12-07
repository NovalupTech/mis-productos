/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
    // Deshabilitar source maps para evitar errores de parsing
    productionBrowserSourceMaps: false,
    // Configuración de Turbopack (Next.js 16 usa Turbopack por defecto)
    turbopack: {},
};

export default nextConfig;
