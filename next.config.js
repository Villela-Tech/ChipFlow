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
  poweredByHeader: false
}

module.exports = nextConfig 