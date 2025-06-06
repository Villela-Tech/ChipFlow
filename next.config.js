/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração básica do Next.js
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'localhost:3002', 'chipflow.villelatech.com.br']
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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://chipflow.villelatech.com.br/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig 