/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorar erros do ESLint em produção
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Otimizações de build
  swcMinify: true,
  poweredByHeader: false,
  // Configurações de imagens
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Configurações experimentais
  experimental: {
    serverActions: true,
  },
  // Otimizações de compilação
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configuração de compressão
  compress: true,
}

module.exports = nextConfig 