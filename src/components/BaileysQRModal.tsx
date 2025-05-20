'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BaileysQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
}

const BaileysQRModal: React.FC<BaileysQRModalProps> = ({
  isOpen,
  onClose,
  qrCode
}) => {
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(40);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Função para iniciar a sessão do WhatsApp
  const startWhatsAppSession = useCallback(async () => {
    if (!qrCode) return;
    
    try {
      console.log(`Iniciando sessão WhatsApp para código ${qrCode}`);
      const response = await fetch(`/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `/whatsappsession/${qrCode}`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${qrCode}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!response.ok) {
        console.warn(`Não foi possível iniciar sessão: ${response.statusText}`);
      } else {
        console.log('Sessão iniciada com sucesso');
        setSessionStarted(true);
      }
    } catch (err) {
      console.error('Erro ao iniciar sessão:', err);
    }
  }, [qrCode]);

  // Verificar se a sessão já está iniciada ao abrir o modal
  useEffect(() => {
    if (isOpen && qrCode && !sessionStarted) {
      startWhatsAppSession();
    }
  }, [isOpen, qrCode, sessionStarted, startWhatsAppSession]);

  const fetchQRCode = useCallback(async () => {
    if (!qrCode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Buscando QR code para conexão`);
      const response = await fetch(`/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `/whatsapp/${qrCode}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${qrCode}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar QR code: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Dados de QR code recebidos:', responseData);
      
      // Encontrar o QR code na resposta em vários formatos possíveis
      let qrCodeValue = '';
      
      // 1. Se a resposta é um objeto com propriedade qrcode
      if (responseData && typeof responseData === 'object' && responseData.qrcode) {
        qrCodeValue = responseData.qrcode;
      } 
      // 2. Se a resposta é um array, procurar no primeiro item
      else if (Array.isArray(responseData) && responseData.length > 0) {
        if (responseData[0].qrcode) {
          qrCodeValue = responseData[0].qrcode;
        }
      }
      
      if (qrCodeValue) {
        console.log('QR code encontrado:', qrCodeValue.substring(0, 50) + '...');
        setQrCodeData(qrCodeValue);
      } else {
        setError('QR code não disponível. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao buscar QR code:', err);
      setError('Erro ao buscar o QR code. Tente novamente.');
    } finally {
      setLoading(false);
      // Reiniciar o contador com o novo valor de 40 segundos
      setRemainingSeconds(40);
    }
  }, [qrCode]);

  useEffect(() => {
    if (isOpen && qrCode) {
      fetchQRCode();
    } else {
      setQrCodeData('');
      setError(null);
    }
  }, [isOpen, qrCode, fetchQRCode]);

  // Contador para atualização automática
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          fetchQRCode();
          return 40; // Atualizado para 40 segundos
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, fetchQRCode]);

  // Copiar texto do QR code para a área de transferência
  const copyQRCodeToClipboard = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(qrCodeData)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Erro ao copiar:', err);
          alert('Não foi possível copiar o QR code. Por favor, tente novamente.');
        });
    }
  };

  // Função para verificar o status da conexão e manter ativa
  const checkConnectionStatus = useCallback(async () => {
    if (!qrCode) return;
    
    try {
      console.log(`Verificando status da conexão ${qrCode}`);
      const response = await fetch(`/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `/whatsapp/status/${qrCode}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${qrCode}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!response.ok) {
        console.warn(`Erro ao verificar status: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log(`Status da conexão ${qrCode}:`, data);
      
      if (data && data.status === 'connected' && isOpen) {
        console.log('Conexão está ativa, fechando modal de QR code');
        onClose();
      }
    } catch (err) {
      console.error('Erro ao verificar status da conexão:', err);
    }
  }, [qrCode, isOpen, onClose]);

  // Verificar status periodicamente para manter a conexão
  useEffect(() => {
    // Verificar status imediatamente
    if (qrCode) {
      checkConnectionStatus();
    }
    
    // E depois a cada 20 segundos (mesmo se o modal estiver fechado)
    // Isso mantém a conexão ativa mesmo após fechar o modal
    const statusInterval = setInterval(() => {
      if (qrCode) {
        checkConnectionStatus();
      }
    }, 20000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [qrCode, checkConnectionStatus]);

  // Função para reconectar e gerar um novo QR code
  const reconnectAndGetNewQRCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Primeiro desconecta a sessão atual
      if (qrCode) {
        console.log(`Desconectando a sessão atual para código ${qrCode}`);
        await fetch(`/api/proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: `/whatsapp/disconnect/${qrCode}`,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${qrCode}`,
              'Accept': 'application/json'
            }
          })
        });
      }
      
      // Pequena pausa para garantir que a desconexão foi processada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Inicia uma nova sessão
      await startWhatsAppSession();
      
      // Pequena pausa para garantir que a sessão foi iniciada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Busca um novo QR code
      await fetchQRCode();
      
      console.log('Reconexão e geração de novo QR code concluídas');
    } catch (err) {
      console.error('Erro ao reconectar e gerar novo QR code:', err);
      setError('Erro ao reconectar. Tente novamente.');
      setLoading(false);
    }
  }, [qrCode, startWhatsAppSession, fetchQRCode]);

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Conectar WhatsApp</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Escaneie o QR code com seu WhatsApp para conectar. O código será atualizado em {remainingSeconds} segundos.
            </p>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Escaneie o código QR com o WhatsApp do seu celular para conectar.
                Use a opção &ldquo;WhatsApp Web&rdquo; nas configurações do aplicativo.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Após escanear, aguarde alguns segundos para a conexão ser estabelecida.
                Use a opção &ldquo;WhatsApp Web&rdquo; nas configurações do aplicativo.
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center py-4">
              {loading ? (
                <div className="flex flex-col items-center">
                  <svg className="animate-spin h-10 w-10 text-green-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-gray-500">Gerando QR code...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 p-5 text-center">
                  <p>{error}</p>
                  <button
                    onClick={reconnectAndGetNewQRCode}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : qrCodeData ? (
                <div className="text-center bg-white p-4 rounded-lg shadow-sm relative">
                  <QRCodeSVG 
                    value={qrCodeData}
                    size={320}
                    level="L"
                    includeMargin={true}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                  />
                  <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                    {remainingSeconds}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Atualiza automaticamente a cada 40 segundos</p>
                </div>
              ) : (
                <div className="text-center p-5">
                  <p className="text-gray-500">Nenhum QR code disponível</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Instruções:</h3>
            <ol className="text-sm text-gray-600 list-decimal pl-5 space-y-1">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque em Menu (⋮) ou Configurações</li>
              <li>Selecione &quot;Aparelhos conectados&quot;</li>
              <li>Toque em &quot;Conectar um aparelho&quot;</li>
              <li>Escaneie o QR code acima</li>
            </ol>
          </div>

          {qrCodeData && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Modo alternativo:</h3>
              <p className="text-sm text-gray-600 mb-2">
                Se o QR code não funcionar, use uma destas opções:
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={copyQRCodeToClipboard}
                  className={`bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 ${
                    copySuccess ? 'bg-green-500' : ''
                  }`}
                >
                  {copySuccess ? 'Copiado!' : 'Copiar texto do QR code'}
                </button>
                <button
                  onClick={() => {
                    window.open(`https://chart.googleapis.com/chart?cht=qr&chs=512x512&chld=L|0&chl=${encodeURIComponent(qrCodeData)}&cache=${Date.now()}`, '_blank');
                  }}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                >
                  Abrir QR code ampliado
                </button>
                <button
                  onClick={reconnectAndGetNewQRCode}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                >
                  Reconectar
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={reconnectAndGetNewQRCode}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reconectar WhatsApp
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default BaileysQRModal; 