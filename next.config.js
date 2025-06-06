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
  // Aumentar o limite de tempo do build
  staticPageGenerationTimeout: 180,
  // Configurações de imagens
  images: {
    domains: ['localhost'],
    unoptimized: true
  }
}

module.exports = nextConfig 