'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import QRCode from 'qrcode';
import BaileysQRModal from '@/components/BaileysQRModal';
import ConnectionReconnectButton from '@/components/ConnectionReconnectButton';
import dynamic from 'next/dynamic';

// Importação dinâmica do componente com Material UI
const WhatsAppConnectionButton = dynamic(() => import('@/components/WhatsAppConnectionButton'), {
  ssr: false,
  loading: () => <div className="h-10 bg-gray-200 animate-pulse rounded-md w-64"></div>
});

// Importação do UserCreationForm
const UserCreationForm = dynamic(() => import('@/components/UserCreationForm'), {
  ssr: false,
  loading: () => <div className="h-10 bg-gray-200 animate-pulse rounded-md w-64"></div>
});

interface WhatsAppConnection {
  id: number;
  name: string;
  number: string;
  status: string;
  qrcode?: string;
}

// Função simplificada para gerar QR code com foco em compatibilidade com Baileys
function generateQRCodeDataURL(qrcodeData: string): Promise<string> {
  console.log('[DEBUG] Gerando QR code com os seguintes dados:');
  console.log('[DEBUG] Tipo de dados:', typeof qrcodeData);
  console.log('[DEBUG] Tamanho dos dados:', qrcodeData.length);
  console.log('[DEBUG] Primeiros 100 caracteres:', qrcodeData.substring(0, 100));
  
  // Se o dado já for uma URL base64, retorne-o diretamente
  if (qrcodeData.startsWith('data:image/')) {
    console.log('[INFO] Dados já são uma imagem base64, retornando diretamente');
    return Promise.resolve(qrcodeData);
  }
  
  // Para o formato do Baileys, precisamos passar o texto sem nenhuma alteração
  console.log('[INFO] Usando QR code original do Baileys');
  
  // Tenta diretamente com o QR code completo - sem processamento
  try {
    // Primeira tentativa com configurações otimizadas para o formato Baileys
    const options = {
      errorCorrectionLevel: 'M' as const, // Nível médio de correção de erros (mais compatível)
      type: 'image/png' as const,
      width: 256, // Tamanho padrão
      margin: 4,  // Margem padrão para QR codes
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    return QRCode.toDataURL(qrcodeData, options)
      .then(url => {
        console.log('[SUCCESS] QR code gerado com sucesso no formato original');
        return url;
      })
      .catch(err => {
        console.error('[ERROR] Falha ao gerar QR code no formato original:', err);
        
        // Tentar fazer fallback para configurações mais simples
        return QRCode.toDataURL(qrcodeData, {
          errorCorrectionLevel: 'L' as const
        });
      });
  } catch (error) {
    console.error('[ERROR] Falha total ao gerar QR code:', error);
    // Fallback para Google Charts API
    return Promise.resolve(`https://chart.googleapis.com/chart?cht=qr&chs=256x256&chld=L|0&chl=${encodeURIComponent(qrcodeData)}`);
  }
}

// Função para mostrar os detalhes do QR code no console (útil para debug)
function logQRCodeDetails(qrcode: string | null) {
  if (!qrcode) {
    console.log('[INFO] Nenhum dado de QR code disponível');
    return;
  }
  
  console.log('[DEBUG] Comprimento do QR code:', qrcode.length);
  console.log('[DEBUG] Primeiros 100 caracteres:', qrcode.substring(0, 100));
  
  if (qrcode.startsWith('data:image/')) {
    console.log('[DEBUG] QR code é uma imagem base64');
  } else if (qrcode.includes('@')) {
    console.log('[DEBUG] QR code parece ser no formato Baileys');
  }
}

export default function WhatsAppConnectionsPage() {
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [companyId, setCompanyId] = useState(1); // Valor padrão para companyId
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<WhatsAppConnection | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [modalError, setModalError] = useState('');
  const [baileysQRModalOpen, setBaileysQRModalOpen] = useState(false);
  const [loadingQRCode, setLoadingQRCode] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedConnectionName, setSelectedConnectionName] = useState<string>('');
  const [generatedQRCodeURL, setGeneratedQRCodeURL] = useState<string | null>(null);
  const [qrCodeGeneratedAt, setQRCodeGeneratedAt] = useState<Date | null>(null);
  const [qrCodeTimeIndicator, setQRCodeTimeIndicator] = useState<NodeJS.Timeout | null>(null);
  const [isRefreshingQR, setIsRefreshingQR] = useState<boolean>(false);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [secondsToNextRefresh, setSecondsToNextRefresh] = useState(15);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [connectionRefreshInterval, setConnectionRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Função para iniciar o contador regressivo para próxima atualização
  const startCountdown = () => {
    // Limpa contador anterior se existir
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    // Definimos um intervalo para atualizar o QR code automaticamente a cada 15 segundos
    setSecondsToNextRefresh(15);
    const interval = setInterval(() => {
      setSecondsToNextRefresh(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCountdownInterval(interval);
  };

  // Função para atualizar as conexões
  const refreshConnections = async () => {
    if (!token) return;
    
    try {
      setIsRefreshing(true);
      console.log("\n===== ATUALIZANDO LISTA DE CONEXÕES =====");
      
      const apiUrl = 'https://apisuporte.villelatech.com.br';
      const connectionsResponse = await axios.post('/api/proxy', {
        url: `${apiUrl}/whatsapp`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('WhatsApp Connections atualizado:', connectionsResponse.data);
      
      // Atualiza a lista de conexões
      setConnections(connectionsResponse.data);
      setLastUpdated(new Date());
      
      // Se o modal de QR code estiver aberto, verifica se precisa atualizar o QR code
      if (modalOpen && selectedConnectionId) {
        console.log("Modal aberto, verificando atualizações para o QR code...");
        const currentConnection = connectionsResponse.data.find(
          (conn: WhatsAppConnection) => conn.id === selectedConnectionId
        );
        
        if (currentConnection && currentConnection.qrcode && currentConnection.qrcode !== selectedQRCode) {
          console.log("QR code na API diferente do exibido, atualizando...");
          setSelectedQRCode(currentConnection.qrcode);
          
          try {
            // Gera o QR code atualizado
            setIsRefreshingQR(true);
            const newQRCodeURL = await generateQRCodeDataURL(currentConnection.qrcode);
            
            // Atualiza a imagem
            setGeneratedQRCodeURL(null); // Limpa primeiro para forçar nova renderização
            setTimeout(() => {
              setGeneratedQRCodeURL(newQRCodeURL);
              setQRCodeGeneratedAt(new Date());
              setIsRefreshingQR(false);
              startCountdown();
            }, 300);
          } catch (error) {
            console.error("Erro ao atualizar QR code durante refresh das conexões:", error);
            setIsRefreshingQR(false);
          }
        } else if (currentConnection && currentConnection.status === 'CONNECTED') {
          console.log("Conexão conectada, fechando modal...");
          alert("Conexão ativada com sucesso!");
          closeModal();
        }
      }
      
      console.log("===== FIM DA ATUALIZAÇÃO DE CONEXÕES =====\n");
    } catch (err) {
      console.error("Erro ao atualizar lista de conexões:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Modifica a função refreshQRCode para usar a processador de QR code
  const refreshQRCode = async () => {
    if (!selectedConnectionId || !token) return;
    
    try {
      console.log("\n===== ATUALIZANDO QR CODE =====");
      console.log("ID da conexão:", selectedConnectionId);
      
      // Mostrar animação de carregamento
      setIsRefreshingQR(true);
      
      const apiUrl = 'https://apisuporte.villelatech.com.br';
      const response = await axios.post('/api/proxy', {
        url: `${apiUrl}/whatsapp/${selectedConnectionId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log("Resposta completa da API:", response.data);
      
      if (response.data && response.data.qrcode) {
        const newQrCode = response.data.qrcode;
        
        // Usa a função helper para mostrar detalhes do QR code no console
        logQRCodeDetails(newQrCode);
        
        // Atualiza no estado o texto do QR code original (para referência)
        setSelectedQRCode(newQrCode);
        
        try {
          // Limpa o QR code atual antes de gerar um novo
          setGeneratedQRCodeURL(null);
          
          // Gera QR code a partir do texto recebido
          console.log("[GERAÇÃO] Gerando QR code com o QR code recebido da API");
          const qrCodeDataURL = await generateQRCodeDataURL(newQrCode);
          console.log("[GERAÇÃO] QR code atualizado gerado com sucesso");
          
          // Pequeno delay para garantir que a interface atualizou
          setTimeout(() => {
            console.log("Aplicando novo QR code na interface");
            setGeneratedQRCodeURL(qrCodeDataURL);
            setQRCodeGeneratedAt(new Date());
            setIsRefreshingQR(false);
          }, 500);
        } catch (genError) {
          console.error("Erro ao gerar QR code atualizado:", genError);
          setIsRefreshingQR(false);
        }
        
        // Atualiza a conexão na lista de conexões
        setConnections(prevConnections => 
          prevConnections.map(conn => 
            conn.id === selectedConnectionId ? { ...conn, ...response.data } : conn
          )
        );
      } else {
        console.log("Resposta não contém QR code:", response.data);
        setIsRefreshingQR(false);
        
        // Se a conexão estiver conectada, fechar o modal
        if (response.data && response.data.status === 'CONNECTED') {
          console.log("Conexão ativada com sucesso!");
          alert("Conexão ativada com sucesso!");
          closeModal();
          
          // Atualiza a lista completa de conexões para refletir a mudança
          refreshConnections();
        }
      }
      
      console.log("===== FIM DA ATUALIZAÇÃO =====\n");
    } catch (err) {
      console.error("Erro ao atualizar QR code:", err);
      setIsRefreshingQR(false);
    }
  };

  const openQRCodeModal = async (qrcode: string, name: string, connectionId: number) => {
    console.log("\n===== DADOS DO QR CODE INICIAL =====");
    console.log("Nome da conexão:", name);
    console.log("ID da conexão:", connectionId);
    console.log("Texto do QR code inicial:", qrcode.substring(0, 50) + "...");
    console.log("Comprimento do texto:", qrcode?.length);
    
    // Verificar se o QR code tem o formato esperado (com @ e vírgulas)
    const isWhatsAppFormat = qrcode.includes('@') && qrcode.includes(',');
    console.log("Formato WhatsApp detectado:", isWhatsAppFormat);
    
    if (isWhatsAppFormat) {
      // Se estiver no formato do WhatsApp, vamos analisar as partes
      const parts = qrcode.split(',');
      console.log("Número de partes separadas por vírgula:", parts.length);
      
      if (qrcode.includes('@')) {
        const mainParts = qrcode.split('@');
        console.log("Parte antes de @:", mainParts[0]);
        // Não mostramos a parte após @ para não sobrecarregar o console
      }
    }
    console.log("===== FIM DADOS QR CODE INICIAL =====\n");
    
    // Configura os estados necessários
    setSelectedConnectionName(name);
    setSelectedConnectionId(connectionId);
    setModalOpen(true);
    
    // Solicita um novo QR code diretamente da API
    try {
      setIsRefreshingQR(true);
      
      const apiUrl = 'https://apisuporte.villelatech.com.br';
      const response = await axios.post('/api/proxy', {
        url: `${apiUrl}/whatsapp/${connectionId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.qrcode) {
        const freshQrCode = response.data.qrcode;
        console.log("\n===== QR CODE ATUALIZADO =====");
        console.log("QR code atualizado recebido diretamente da API");
        console.log("Comprimento do texto atualizado:", freshQrCode.length);
        console.log("Texto atualizado:", freshQrCode.substring(0, 50) + "...");
        console.log("===== FIM QR CODE ATUALIZADO =====\n");
        
        // Usa o QR code mais recente da API
        setSelectedQRCode(freshQrCode);
        
        // QR code gerado, registre o momento
        const qrCodeDataURL = await generateQRCodeDataURL(freshQrCode);
        console.log("QR code gerado com sucesso usando dados recentes");
        setGeneratedQRCodeURL(qrCodeDataURL);
        
        // Registra o momento da geração do QR code
        setQRCodeGeneratedAt(new Date());
        
        // Inicia contagem regressiva para próxima atualização
        startCountdown();

        // Configura um timer para verificar o status da conexão periodicamente
        const statusCheckTimer = setInterval(() => {
          // Verifica se a conexão foi ativada a cada 5 segundos
          if (selectedConnectionId && token) {
            axios.post('/api/proxy', {
              url: `https://apisuporte.villelatech.com.br/whatsapp/${selectedConnectionId}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            })
            .then(response => {
              if (response.data && response.data.status === 'CONNECTED') {
                console.log("Conexão ativada automaticamente!");
                alert("Conexão ativada com sucesso!");
                closeModal();
                refreshConnections();
              }
            })
            .catch(error => {
              console.error("Erro ao verificar status:", error);
            });
          }
        }, 5000);
        setQRCodeTimeIndicator(statusCheckTimer);
      } else {
        // Se não receber um QR code novo, use o inicial como fallback
        console.log("API não retornou QR code atualizado, usando o inicial como fallback");
        setSelectedQRCode(qrcode);
        
        // Gera o QR code a partir do texto inicial
        const qrCodeDataURL = await generateQRCodeDataURL(qrcode);
        setGeneratedQRCodeURL(qrCodeDataURL);
        
        // Registra o momento da geração do QR code
        setQRCodeGeneratedAt(new Date());
      }
      
      setIsRefreshingQR(false);
    } catch (error) {
      console.error("Erro ao gerar/obter o QR code:", error);
      alert("Não foi possível gerar o QR code. Por favor tente novamente.");
      setIsRefreshingQR(false);
      
      // Ainda assim, tenta usar o QR code inicial como fallback
      setSelectedQRCode(qrcode);
      try {
        const qrCodeDataURL = await generateQRCodeDataURL(qrcode);
        setGeneratedQRCodeURL(qrCodeDataURL);
        setQRCodeGeneratedAt(new Date());
      } catch (fallbackError) {
        console.error("Falha também no fallback:", fallbackError);
      }
    }
    
    // Verifica o status da conexão para garantir que não exibimos o QR code se já estiver conectado
    try {
      const apiUrl = 'https://apisuporte.villelatech.com.br';
      const response = await axios.post('/api/proxy', {
        url: `${apiUrl}/whatsapp/${connectionId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.status === 'CONNECTED') {
        console.log("Conexão já está ativada! Fechando modal...");
        alert("Esta conexão já está ativada!");
        closeModal();
        refreshConnections();
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar status atual da conexão:", error);
    }
    
    // Configura atualização automática a cada 15 segundos (mais frequente para melhor experiência)
    const interval = setInterval(refreshQRCode, 15000);
    setRefreshInterval(interval);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedQRCode(null);
    setGeneratedQRCodeURL(null);
    setSelectedConnectionId(null);
    setQRCodeGeneratedAt(null);
    setIsRefreshingQR(false);
    
    // Clear refresh interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    // Clear QR code age interval
    if (qrCodeTimeIndicator) {
      clearInterval(qrCodeTimeIndicator);
      setQRCodeTimeIndicator(null);
    }
    
    // Clear countdown interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
  };
  
  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (connectionRefreshInterval) {
        clearInterval(connectionRefreshInterval);
      }
      if (qrCodeTimeIndicator) {
        clearInterval(qrCodeTimeIndicator);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [refreshInterval, connectionRefreshInterval, qrCodeTimeIndicator, countdownInterval]);

  useEffect(() => {
    async function authenticateAndFetchData() {
      setLoading(true);
      try {
        // Environment variables should be loaded from .env.local in Next.js
        const email = process.env.NEXT_PUBLIC_EMAIL;
        const password = process.env.NEXT_PUBLIC_PASSWORD;
        const apiUrl = 'https://apisuporte.villelatech.com.br';

        // Check if credentials are available
        if (!email || !password) {
          setError('Credenciais não encontradas. Configure as variáveis de ambiente.');
          setLoading(false);
          return;
        }

        // Login to get token - using our internal proxy
        const loginResponse = await axios.post('/api/proxy', {
          url: `${apiUrl}/auth/login`,
          method: 'POST',
          data: {
            email,
            password
          },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log('Login Response:', loginResponse.data);

        if (loginResponse.data && loginResponse.data.token) {
          const authToken = loginResponse.data.token;
          setToken(authToken);

          // Fetch WhatsApp connections - using our internal proxy
          const connectionsResponse = await axios.post('/api/proxy', {
            url: `${apiUrl}/whatsapp`,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json'
            }
          });

          console.log('WhatsApp Connections Raw Response:', connectionsResponse.data);
          
          // Check what fields exist in each connection
          if (connectionsResponse.data && Array.isArray(connectionsResponse.data) && connectionsResponse.data.length > 0) {
            console.log('First connection object:', connectionsResponse.data[0]);
            console.log('Status field value:', connectionsResponse.data[0].status);
            console.log('All statuses:', connectionsResponse.data.map(conn => conn.status));
          }

          setConnections(connectionsResponse.data);
          
          // Configura atualização automática das conexões a cada 30 segundos
          const interval = setInterval(refreshConnections, 30000);
          setConnectionRefreshInterval(interval);
        } else {
          setError('Não foi possível obter o token de autenticação');
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao buscar os dados. Verifique o console para mais detalhes.');
      } finally {
        setLoading(false);
      }
    }

    authenticateAndFetchData();
  }, []);

  // Função para reconectar WhatsApp
  const reconnectWhatsApp = async (connectionId: number) => {
    if (!token) return;
    
    try {
      setIsRefreshing(true);
      console.log("\n===== INICIANDO RECONEXÃO DO WHATSAPP =====");
      console.log("ID da conexão:", connectionId);
      
      const apiUrl = 'https://apisuporte.villelatech.com.br';
      const response = await axios.post('/api/proxy', {
        url: `${apiUrl}/whatsapp/${connectionId}/reconnect`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Resposta da reconexão:', response.data);
      
      // Atualiza a lista de conexões após a reconexão
      await refreshConnections();
      
      // Se recebemos um QR code, abre o modal para escaneamento
      if (response.data && response.data.qrcode) {
        const connection = connections.find(conn => conn.id === connectionId);
        if (connection) {
          openQRCodeModal(response.data.qrcode, connection.name, connectionId);
        }
      }
      
      console.log("===== FIM DA RECONEXÃO =====\n");
    } catch (err) {
      console.error("Erro ao reconectar WhatsApp:", err);
      alert("Erro ao reconectar. Por favor, tente novamente.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Função para mostrar o status formatado
  const formatStatus = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
            Ativado
          </span>
        );
      case 'qrcode':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <span className="w-2 h-2 mr-1 bg-blue-500 rounded-full"></span>
            QR Code Disponível
          </span>
        );
      case 'DISCONNECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="w-2 h-2 mr-1 bg-yellow-500 rounded-full"></span>
            Desativado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="w-2 h-2 mr-1 bg-gray-500 rounded-full"></span>
            {status}
          </span>
        );
    }
  };

  // Instrução para escaneamento do QR code com correção para as aspas
  const whatsappInstructions = (
    <div className="mt-4 text-sm text-gray-600 p-3 bg-gray-50 rounded-md w-full">
      <p className="mb-2 font-medium">Como conectar:</p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Abra o WhatsApp no seu telefone</li>
        <li>Toque em Configurações (três pontos)</li>
        <li>Selecione &quot;Aparelhos conectados&quot;</li>
        <li>Toque em &quot;Conectar um aparelho&quot;</li>
        <li>Escaneie este QR code com a câmera</li>
      </ol>
      <p className="mt-2 text-xs text-gray-500">
        O QR code é atualizado automaticamente a cada 15 segundos.
      </p>
    </div>
  );

  const handleShowQRCode = (connection: any) => {
    console.log('Opening QR code modal for connection:', connection.id);
    setSelectedConnection(connection);
    setIsQRModalOpen(true);
  };

  // Callback para quando uma nova conexão for criada
  const handleConnectionCreated = (connectionData: any) => {
    // Atualizar a lista de conexões
    refreshConnections();
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
      {/* Sidebar */}
      <div className="w-20 bg-[#38BDF8] flex flex-col items-center py-6 gap-8 shadow-lg">
        <Image src="/images/Logo.png" alt="ChipFlow Logo" width={80} height={80} className="mb-8" />
        <Link href="/dashboard" className="p-3 hover:bg-white/10 rounded-lg transition-all hover:scale-110">
          <Image src="/images/casa.png" alt="Home" width={32} height={32} />
        </Link>
        <Link href="/connections" className="p-3 bg-white/10 rounded-lg transition-all hover:scale-110">
          <Image src="/images/ChipLogo.png" alt="Connections" width={48} height={48} />
        </Link>
        <div className="mt-auto">
          <Link href="/profile" className="p-3 hover:bg-white/10 rounded-lg transition-all hover:scale-110">
            <Image src="/images/user.png" alt="Profile" width={32} height={32} />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">WhatsApp Connections</h1>
          <div className="flex items-center space-x-2">
            {token && (
              <>
                <WhatsAppConnectionButton 
                  token={token} 
                  companyId={companyId} 
                  onConnectionCreated={handleConnectionCreated}
                />
                <UserCreationForm 
                  token={token} 
                  companyId={companyId}
                />
              </>
            )}
            
            <button
              onClick={refreshConnections}
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Atualizando...
                </>
              ) : (
                'Atualizar'
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.length > 0 ? (
              connections.map((connection) => (
                <div key={connection.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">{connection.name}</h3>
                      {formatStatus(connection.status)}
                    </div>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Número:</span> {connection.number || 'Não configurado'}
                    </p>
                    
                    <div className="mt-4 flex justify-end space-x-2">
                      {/* Botão para reconectar WhatsApp se desconectado */}
                      {connection.status === 'DISCONNECTED' && (
                        <button
                          onClick={() => reconnectWhatsApp(connection.id)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reconectar
                        </button>
                      )}
                      
                      {/* Exibir botão de QR code para conexões desconectadas ou com status 'qrcode' */}
                      {(connection.status === 'DISCONNECTED' || connection.status === 'qrcode') && connection.qrcode && (
                        <button
                          onClick={() => handleShowQRCode(connection)}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
                            <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
                          </svg>
                          Exibir QR Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-blue-50 p-6 rounded-xl text-center">
                <p className="text-blue-700">Nenhuma conexão encontrada</p>
              </div>
            )}
          </div>
        )}

        {/* BaileysQRModal para exibir os QR codes de forma otimizada */}
        {isQRModalOpen && selectedConnection && (
          <BaileysQRModal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
            connectionId={selectedConnection.id}
            apiUrl="https://apisuporte.villelatech.com.br"
            authToken={token || ""}
          />
        )}
      </div>
    </div>
  );
} 



