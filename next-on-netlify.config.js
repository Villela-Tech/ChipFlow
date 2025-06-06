module.exports = {
  // Configuração do plugin Next.js para Netlify
  generateBuildId: async () => {
    // Você pode personalizar o buildId se necessário
    return 'build-' + Date.now()
  },
  // Configurações de otimização
  optimization: {
    // Reduzir o tamanho do bundle
    minimize: true,
    // Dividir chunks
    splitChunks: {
      chunks: 'all'
    }
  },
  // Configurações de imagem
  images: {
    domains: ['chipflow.villelatech.com.br'],
    minimumCacheTTL: 60
  }
} 