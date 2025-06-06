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
  },
  // Configurações para o Netlify
  output: 'standalone',
  // Desabilitar exportação estática
  trailingSlash: false,
  // Configurações de ambiente
  env: {
    NEXT_PUBLIC_URL: process.env.URL || 'http://localhost:3000'
  }
}

module.exports = nextConfig 