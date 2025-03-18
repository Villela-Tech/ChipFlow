// Configuração do PM2 para gerenciamento de processos Node.js
module.exports = [{
  // Caminho para o arquivo principal do servidor
  script: 'dist/server.js',
  // Nome do processo no PM2
  name: 'multipremium-back',
  // Modo de execução: fork (processo único)
  exec_mode: 'fork',
  // Reinicia o servidor todos os dias às 00:05
  cron_restart: '05 00 * * *',
  // Reinicia o processo quando atingir 769 MB de memória
  max_memory_restart: '769M',
  // Configura o limite de memória do Node.js para 769 MB
  node_args: '--max-old-space-size=769',
  // Desativa o modo de observação de arquivos
  watch: false
}]