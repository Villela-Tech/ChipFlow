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
  // Ignorar erros do ESLint em produção
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configurações específicas para Netlify
  target: 'serverless',
  images: {
    domains: ['chipflow.villelatech.com.br'],
    minimumCacheTTL: 60,
    unoptimized: true
  },
  // Otimizações de build
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Configuração de ambiente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://chipflow.villelatech.com.br/api'
  }
}

module.exports = nextConfig 