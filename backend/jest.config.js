/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  // Para todos os módulos importados nos testes serem mockados automaticamente
  // automock: false,

  // Para de executar os testes após n falhas
  bail: 1,

  // O diretório onde o Jest deve armazenar suas informações de cache de dependências
  // cacheDirectory: "/tmp/jest_rs",

  // Limpa automaticamente as chamadas e instâncias mock entre cada teste
  clearMocks: true,

  // Indica se as informações de cobertura devem ser coletadas durante a execução do teste
  collectCoverage: true,

  // Array de padrões glob indicando um conjunto de arquivos para os quais as informações de cobertura devem ser coletadas
  collectCoverageFrom: ["<rootDir>/src/services/**/*.ts"],

  // O diretório onde o Jest deve gerar seus arquivos de cobertura
  coverageDirectory: "coverage",

  // Array de padrões regexp usados para pular a coleta de cobertura
  // coveragePathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // Indica qual provedor deve ser usado para instrumentar o código para cobertura
  coverageProvider: "v8",

  // Lista de nomes de repórteres que o Jest usa ao escrever relatórios de cobertura
  coverageReporters: ["text", "lcov"],

  // Objeto que configura a aplicação de limite mínimo para resultados de cobertura
  // coverageThreshold: undefined,

  // Caminho para um extrator de dependências personalizado
  // dependencyExtractor: undefined,

  // Faz com que chamadas a APIs obsoletas lancem mensagens de erro úteis
  // errorOnDeprecated: false,

  // Força a coleta de cobertura de arquivos ignorados usando um array de padrões glob
  // forceCoverageMatch: [],

  // Caminho para um módulo que exporta uma função assíncrona que é acionada uma vez antes de todos os conjuntos de teste
  // globalSetup: undefined,

  // Caminho para um módulo que exporta uma função assíncrona que é acionada uma vez após todos os conjuntos de teste
  // globalTeardown: undefined,

  // Conjunto de variáveis globais que precisam estar disponíveis em todos os ambientes de teste
  // globals: {},

  // A quantidade máxima de workers usados para executar seus testes
  // maxWorkers: "50%",

  // Array de nomes de diretórios a serem pesquisados recursivamente a partir da localização do módulo que requer
  // moduleDirectories: [
  //   "node_modules"
  // ],

  // Array de extensões de arquivo que seus módulos usam
  // moduleFileExtensions: [
  //   "js",
  //   "json",
  //   "jsx",
  //   "ts",
  //   "tsx",
  //   "node"
  // ],

  // Mapa de expressões regulares para nomes de módulos ou arrays de nomes de módulos que permitem substituir recursos com um único módulo
  // moduleNameMapper: {},

  // Array de padrões regexp de strings, correspondidos contra todos os caminhos de módulos antes de serem considerados 'visíveis' para o carregador de módulos
  // modulePathIgnorePatterns: [],

  // Ativa notificações para resultados de teste
  // notify: false,

  // Enum que especifica o modo de notificação. Requer { notify: true }
  // notifyMode: "failure-change",

  // Preset que é usado como base para a configuração do Jest
  preset: "ts-jest",

  // Executa testes de um ou mais projetos
  // projects: undefined,

  // Use esta opção de configuração para adicionar repórteres personalizados ao Jest
  // reporters: undefined,

  // Reseta automaticamente o estado mock entre cada teste
  // resetMocks: false,

  // Reseta o registro de módulos antes de executar cada teste individual
  // resetModules: false,

  // Caminho para um resolvedor personalizado
  // resolver: undefined,

  // Restaura automaticamente o estado mock entre cada teste
  // restoreMocks: false,

  // O diretório raiz que o Jest deve escanear para testes e módulos
  // rootDir: undefined,

  // Lista de caminhos para diretórios que o Jest deve usar para procurar arquivos
  // roots: [
  //   "<rootDir>"
  // ],

  // Permite usar um runner personalizado em vez do runner de teste padrão do Jest
  // runner: "jest-runner",

  // Caminhos para módulos que executam algum código para configurar ou preparar o ambiente de teste antes de cada teste
  // setupFiles: [],

  // Lista de caminhos para módulos que executam algum código para configurar ou preparar o framework de teste antes de cada teste
  // setupFilesAfterEnv: [],

  // O número de segundos após o qual um teste é considerado lento e reportado como tal nos resultados
  // slowTestThreshold: 5,

  // Lista de caminhos para módulos serializadores de snapshot que o Jest deve usar para testes de snapshot
  // snapshotSerializers: [],

  // O ambiente de teste que será usado para testar
  testEnvironment: "node",

  // Opções que serão passadas para o testEnvironment
  // testEnvironmentOptions: {},

  // Adiciona um campo de localização aos resultados do teste
  // testLocationInResults: false,

  // Os padrões glob que o Jest usa para detectar arquivos de teste
  testMatch: ["**/__tests__/**/*.spec.ts"]

  // Array de padrões regexp de strings que são correspondidos contra todos os caminhos de teste, testes correspondentes são pulados
  // testPathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // O padrão regexp ou array de padrões que o Jest usa para detectar arquivos de teste
  // testRegex: [],

  // Esta opção permite o uso de um processador de resultados personalizado
  // testResultsProcessor: undefined,

  // Esta opção permite o uso de um runner de teste personalizado
  // testRunner: "jasmine2",

  // Esta opção define a URL para o ambiente jsdom. É refletida em propriedades como location.href
  // testURL: "http://localhost",

  // Definir este valor como "fake" permite o uso de temporizadores falsos para funções como "setTimeout"
  // timers: "real",

  // Mapa de expressões regulares para caminhos de transformadores
  // transform: undefined,

  // Array de padrões regexp de strings que são correspondidos contra todos os caminhos de arquivos fonte, arquivos correspondentes pularão a transformação
  // transformIgnorePatterns: [
  //   "/node_modules/",
  //   "\\.pnp\\.[^\\/]+$"
  // ],

  // Array de padrões regexp de strings que são correspondidos contra todos os módulos antes que o carregador de módulos retorne automaticamente um mock para eles
  // unmockedModulePathPatterns: undefined,

  // Indica se cada teste individual deve ser reportado durante a execução
  // verbose: undefined,

  // Array de padrões regexp que são correspondidos contra todos os caminhos de arquivos fonte antes de re-executar testes no modo watch
  // watchPathIgnorePatterns: [],

  // Se deve usar watchman para rastreamento de arquivos
  // watchman: true,
};
