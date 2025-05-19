"use client";
import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, Paper, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  whatsAppId: number | null;
  companyId: number;
  token: string;
}

const QRCodeModal = ({ open, onClose, whatsAppId, companyId, token }: QRCodeModalProps) => {
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(40);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://apisuporte.villelatech.com.br";

  // Inicializa a conexão com o socket
  useEffect(() => {
    if (!open) return;
    
    const socketIO = io(apiUrl, {
      transports: ["websocket"],
      auth: {
        token: token || localStorage.getItem("token"),
      },
      path: "/socket.io",
    });

    setSocket(socketIO);

    return () => {
      socketIO.disconnect();
    };
  }, [open, apiUrl, token]);

  // Função para iniciar a sessão do WhatsApp
  const startWhatsAppSession = useCallback(async () => {
    if (!whatsAppId || !open) return;
    
    try {
      console.log(`Iniciando sessão WhatsApp para conexão ${whatsAppId}`);
      const response = await fetch(`/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `${apiUrl}/whatsappsession/${whatsAppId}`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem("token")}`,
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
  }, [whatsAppId, open, apiUrl, token]);

  // Função para verificar o status da conexão WhatsApp
  const checkConnectionStatus = useCallback(async () => {
    if (!whatsAppId) return;
    
    try {
      console.log(`Verificando status da conexão ${whatsAppId}`);
      const response = await fetch(`/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `${apiUrl}/whatsapp/status/${whatsAppId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem("token")}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!response.ok) {
        console.warn(`Erro ao verificar status: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log(`Status da conexão ${whatsAppId}:`, data);
      
      // Se estiver desconectado, tenta reiniciar a sessão
      if (data && (data.status === 'disconnected' || data.status === 'qrcode')) {
        console.log('Conexão desconectada ou aguardando QR code, reiniciando sessão...');
        await startWhatsAppSession();
        if (open) {
          await fetchQRCode();
        }
      } 
      // Se a conexão estiver pendente, aguarda
      else if (data && data.status === 'connecting') {
        console.log('Conexão em andamento, aguardando...');
      }
      // Se estiver conectado e o modal estiver aberto, fecha o modal
      else if (data && data.status === 'connected' && open) {
        console.log('Conexão está ativa, fechando modal de QR code');
        onClose();
      }
      // Se estiver conectado, mantém com ping periódico
      else if (data && data.status === 'connected') {
        console.log('Conexão ativa, enviando ping para manter a sessão');
        await fetch(`/api/proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: `${apiUrl}/whatsapp/ping/${whatsAppId}`,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token || localStorage.getItem("token")}`,
              'Accept': 'application/json'
            }
          })
        });
      }
    } catch (err) {
      console.error('Erro ao verificar status da conexão:', err);
    }
  }, [whatsAppId, apiUrl, token, open, onClose, startWhatsAppSession, fetchQRCode]);

  // Verificar status periodicamente para manter a conexão
  useEffect(() => {
    // Verificar status imediatamente se tiver um ID válido
    if (whatsAppId) {
      checkConnectionStatus();
    }
    
    // E depois a cada 20 segundos (mesmo se o modal estiver fechado)
    // Isso mantém a conexão ativa mesmo após fechar o modal
    const statusInterval = setInterval(() => {
      if (whatsAppId) {
        checkConnectionStatus();
      }
    }, 20000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [whatsAppId, checkConnectionStatus]);
  
  // Verificar se a sessão já está iniciada ao abrir o modal
  useEffect(() => {
    if (open && whatsAppId && !sessionStarted) {
      startWhatsAppSession();
    }
  }, [open, whatsAppId, sessionStarted, startWhatsAppSession]);

  // Função para buscar o QR code da API
  const fetchQRCode = useCallback(async () => {
    if (!whatsAppId || !open) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Buscando QR code para conexão ${whatsAppId}`);
      const response = await fetch(`/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `${apiUrl}/whatsapp/${whatsAppId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem("token")}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar QR code: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Dados de QR code recebidos:', responseData);
      
      // Processando diferentes formatos possíveis da resposta
      let qrCode = '';
      
      // Se a resposta é um array, pegamos o primeiro item
      if (Array.isArray(responseData) && responseData.length > 0) {
        const data = responseData[0];
        qrCode = data.qrcode || '';
        console.log('QR code extraído do array:', qrCode ? qrCode.substring(0, 30) + '...' : 'vazio');
      } 
      // Se a resposta é um objeto único
      else if (responseData && typeof responseData === 'object') {
        qrCode = responseData.qrcode || '';
        console.log('QR code extraído do objeto:', qrCode ? qrCode.substring(0, 30) + '...' : 'vazio');
      }
      
      if (qrCode) {
        setQrCodeData(qrCode);
        // Reinicia o contador
        setRemainingSeconds(40);
        setError(null);
      } else {
        console.warn('QR code não encontrado na resposta:', responseData);
        setError('QR code não disponível. A sessão pode estar iniciando. Tente novamente em alguns segundos.');
      }
    } catch (err) {
      console.error('Erro ao buscar QR code:', err);
      setError('Erro ao buscar QR code. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [whatsAppId, open, apiUrl, token]);

  // Busca o QR code do WhatsApp
  useEffect(() => {
    if (open && whatsAppId) {
      fetchQRCode();
    }
  }, [fetchQRCode, whatsAppId, open]);

  // Configura o listener do socket para atualizações do QR code
  useEffect(() => {
    if (!socket || !whatsAppId || !companyId || !open) return;

    const onWhatsappData = (data: { action: string; session: { id: number; qrcode: string } }) => {
      // Atualiza o QR code quando receber uma atualização via socket
      if (data.action === "update" && data.session.id === whatsAppId) {
        if (data.session.qrcode) {
          console.log('Atualizando QR code via socket:', data.session.qrcode.substring(0, 30) + '...');
          setQrCodeData(data.session.qrcode);
        }
      }

      // Fecha o modal quando o QR code for escaneado com sucesso
      if (data.action === "update" && data.session.id === whatsAppId && data.session.qrcode === "") {
        console.log('QR code escaneado com sucesso, fechando o modal');
        onClose();
      }
    };

    // Inscreve-se no canal de eventos da sessão do WhatsApp
    socket.on(`company-${companyId}-whatsappSession`, onWhatsappData);

    return () => {
      // Cancela a inscrição ao desmontar
      socket.off(`company-${companyId}-whatsappSession`, onWhatsappData);
    };
  }, [socket, whatsAppId, companyId, open, onClose]);

  // Contador para expiração do QR code
  useEffect(() => {
    if (!open) return;
    
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          // Renicia a sessão e busca novo QR code quando o contador chega a zero
          startWhatsAppSession().then(() => fetchQRCode());
          return 40;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [open, fetchQRCode, startWhatsAppSession]);

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

  // Função para reconectar e gerar um novo QR code
  const reconnectAndGetNewQRCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Primeiro desconecta a sessão atual
      if (whatsAppId) {
        console.log(`Desconectando a sessão atual para conexão ${whatsAppId}`);
        await fetch(`/api/proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: `${apiUrl}/whatsapp/disconnect/${whatsAppId}`,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token || localStorage.getItem("token")}`,
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
  }, [whatsAppId, apiUrl, token, startWhatsAppSession, fetchQRCode]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg"
      PaperProps={{
        style: {
          borderRadius: "12px",
          padding: "8px",
        },
      }}
    >
      <DialogContent>
        <Paper elevation={0}>
          <Typography 
            variant="h6" 
            color="primary" 
            gutterBottom 
            align="center"
            style={{ marginBottom: "16px" }}
          >
            Escaneie o QR Code com seu WhatsApp
          </Typography>
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
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            padding: "16px",
            margin: "0 auto",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            width: "fit-content",
            position: "relative"
          }}>
            {loading ? (
              <div style={{
                width: "300px",
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
                borderRadius: '8px',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    border: '3px solid #f3f3f3', 
                    borderTop: '3px solid #3498db', 
                    borderRadius: '50%', 
                    width: '40px', 
                    height: '40px', 
                    animation: 'spin 2s linear infinite',
                    margin: '0 auto 10px'
                  }}></div>
                  <Typography variant="body2" color="textSecondary">
                    Carregando QR code...
                  </Typography>
                  <style jsx>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              </div>
            ) : error ? (
              <div style={{
                width: "300px",
                height: "300px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
                borderRadius: '8px',
                padding: '16px'
              }}>
                <Typography variant="body1" color="error" style={{ marginBottom: '12px', textAlign: 'center' }}>
                  {error}
                </Typography>
                <button 
                  onClick={reconnectAndGetNewQRCode}
                  style={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : qrCodeData ? (
              <div style={{ position: 'relative', backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
                <QRCodeSVG 
                  value={qrCodeData}
                  size={300}
                  level="L"
                  includeMargin={true}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {remainingSeconds}
                </div>
              </div>
            ) : (
              <div style={{
                width: "300px",
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
                borderRadius: '8px',
              }}>
                <Typography variant="body1" color="textSecondary">
                  Aguardando pelo QR Code...
                </Typography>
              </div>
            )}
          </div>
          <div style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <button
              onClick={reconnectAndGetNewQRCode}
              style={{
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Reconectar
            </button>
            {qrCodeData && (
              <button
                onClick={copyQRCodeToClipboard}
                style={{
                  backgroundColor: copySuccess ? '#4caf50' : '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'background-color 0.3s'
                }}
              >
                {copySuccess ? 'Copiado!' : 'Copiar texto do QR'}
              </button>
            )}
            {qrCodeData && (
              <button
                onClick={() => {
                  window.open(`https://chart.googleapis.com/chart?cht=qr&chs=512x512&chld=L|0&chl=${encodeURIComponent(qrCodeData)}&cache=${Date.now()}`, '_blank');
                }}
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Abrir QR ampliado
              </button>
            )}
          </div>
          <div style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={reconnectAndGetNewQRCode}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Reconectar WhatsApp
            </button>
            <Typography 
              variant="caption" 
              color="textSecondary" 
              style={{ display: 'block', textAlign: 'center', marginLeft: '10px', marginRight: '10px' }}
            >
              O QR code expira em {remainingSeconds} segundos.
            </Typography>
          </div>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal; 