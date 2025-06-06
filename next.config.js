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
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Configurações para o Netlify
  output: 'standalone',
  distDir: '.next',
  // Configurações de ambiente
  env: {
    NEXT_PUBLIC_URL: process.env.URL || 'http://localhost:3000'
  },
  // Configurações de webpack
  webpack: (config, { dev, isServer }) => {
    // Otimizações apenas para produção
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  // Configurações experimentais
  experimental: {
    serverActions: true,
  }
}

module.exports = nextConfig 