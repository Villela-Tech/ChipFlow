/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração básica do Next.js
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'localhost:3002']
    },
  },
  // Configuração para cookies e headers
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 