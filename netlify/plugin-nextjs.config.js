module.exports = {
  // Configurações do plugin Next.js
  build: {
    // Usar o modo standalone do Next.js
    standalone: true,
    // Não usar o modo de exportação estática
    staticExport: false,
  },
  // Configurações do servidor
  server: {
    // Usar o modo de produção
    isProd: true,
    // Não usar o modo de exportação estática
    isStatic: false,
  }
} 