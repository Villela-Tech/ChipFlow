const fs = require('fs-extra');
const path = require('path');

async function copyStaticFiles() {
  const sourceDir = path.join(process.cwd(), '.next/static');
  const targetDir = path.join(process.cwd(), '.next/standalone/.next/static');

  try {
    // Garantir que o diretório de destino existe
    await fs.ensureDir(targetDir);

    // Copiar arquivos estáticos
    await fs.copy(sourceDir, targetDir);

    console.log('✅ Arquivos estáticos copiados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao copiar arquivos estáticos:', error);
    process.exit(1);
  }
}

copyStaticFiles(); 