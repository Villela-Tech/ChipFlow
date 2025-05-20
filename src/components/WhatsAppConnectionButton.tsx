'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Typography,
  Box,
  FormHelperText
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

interface WhatsAppConnectionButtonProps {
  token: string;
  apiUrl?: string;
  companyId: number;
  onConnectionCreated?: (connectionData: WhatsAppConnection) => void;
}

interface WhatsAppConnection {
  id: number;
  name: string;
  status: string;
  qrcode?: string;
  companyId: number;
  queueIds: number[];
}

const WhatsAppConnectionButton: React.FC<WhatsAppConnectionButtonProps> = ({
  token,
  apiUrl = 'https://apisuporte.villelatech.com.br',
  companyId,
  onConnectionCreated
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queues, setQueues] = useState<Array<{ id: number; name: string }>>([]);
  
  // Estados do formulário
  const [connectionName, setConnectionName] = useState('');
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [farewellMessage, setFarewellMessage] = useState('Obrigado pelo contato! Em breve retornaremos.');
  
  // Estados para o processo de QR code
  const [step, setStep] = useState(1); // 1: formulário, 2: QR code
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(40);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Limpar intervalos ao desmontar o componente
    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
      if (statusCheckInterval) clearInterval(statusCheckInterval);
    };
  }, [countdownInterval, statusCheckInterval]);
  
  const handleOpen = async () => {
    setOpen(true);
    resetForm();
    await fetchQueues();
  };
  
  const handleClose = () => {
    setOpen(false);
    
    // Limpar intervalos
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
  };
  
  const resetForm = () => {
    setConnectionName('');
    setSelectedQueueIds([]);
    setIsDefault(false);
    setFarewellMessage('Obrigado pelo contato! Em breve retornaremos.');
    setStep(1);
    setConnectionId(null);
    setQrCodeData('');
    setError(null);
    setIsConnected(false);
  };
  
  // Buscar filas disponíveis
  const fetchQueues = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${apiUrl}/queue`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao buscar filas');
      }
      
      const data = await response.json();
      setQueues(data);
    } catch (err) {
      console.error('Erro ao buscar filas:', err);
      setError('Não foi possível carregar as filas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Criar conexão WhatsApp
  const createWhatsAppConnection = async () => {
    try {
      if (!connectionName || selectedQueueIds.length === 0) {
        setError('Por favor, preencha o nome da conexão e selecione pelo menos uma fila');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${apiUrl}/whatsapp`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            name: connectionName,
            isDefault: isDefault,
            companyId: companyId,
            queueIds: selectedQueueIds,
            farewellMessage: farewellMessage,
            type: 'baileys' // Assumindo tipo baileys
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar conexão WhatsApp');
      }
      
      const data = await response.json();
      console.log('Conexão WhatsApp criada:', data);
      
      // Salvar o ID da conexão e avançar para a etapa do QR code
      setConnectionId(data.id);
      
      // Iniciar sessão WhatsApp e buscar QR code
      await startWhatsAppSession(data.id);
      
      // Iniciar verificação de status
      startStatusCheck(data.id);
      
      // Avançar para a etapa do QR code
      setStep(2);
      
      // Callback de sucesso se fornecido
      if (onConnectionCreated) {
        onConnectionCreated(data);
      }
      
    } catch (err) {
      console.error('Erro ao criar conexão WhatsApp:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar conexão WhatsApp');
    } finally {
      setLoading(false);
    }
  };
  
  // Iniciar sessão WhatsApp e buscar QR code
  const startWhatsAppSession = async (id: number) => {
    try {
      console.log(`Iniciando sessão WhatsApp para ID ${id}`);
      const sessionResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${apiUrl}/whatsappsession/${id}`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Falha ao iniciar sessão WhatsApp');
      }
      
      // Buscar QR code
      await fetchQRCode(id);
      
      // Iniciar contador para atualização do QR code
      startQRCodeCountdown(id);
      
    } catch (err) {
      console.error('Erro ao iniciar sessão WhatsApp:', err);
      setError('Erro ao iniciar sessão WhatsApp. Tente novamente.');
    }
  };
  
  // Buscar QR code
  const fetchQRCode = async (id: number) => {
    try {
      console.log(`Buscando QR code para conexão ${id}`);
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${apiUrl}/whatsapp/${id}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao buscar QR code');
      }
      
      const data = await response.json();
      
      if (data && data.qrcode) {
        console.log('QR code encontrado:', data.qrcode.substring(0, 30) + '...');
        setQrCodeData(data.qrcode);
        setRemainingSeconds(40);
      } else if (Array.isArray(data) && data.length > 0 && data[0].qrcode) {
        console.log('QR code encontrado no array:', data[0].qrcode.substring(0, 30) + '...');
        setQrCodeData(data[0].qrcode);
        setRemainingSeconds(40);
      } else {
        console.warn('QR code não encontrado nos dados:', data);
        setError('QR code não disponível. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao buscar QR code:', err);
      setError('Erro ao buscar QR code. Tente novamente.');
    }
  };
  
  // Iniciar contador para atualização do QR code
  const startQRCodeCountdown = (id: number) => {
    // Limpar intervalo anterior se existir
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    // Configurar novo intervalo
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          fetchQRCode(id);
          return 40;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCountdownInterval(interval);
  };
  
  // Iniciar verificação periódica de status
  const startStatusCheck = (id: number) => {
    // Limpar intervalo anterior se existir
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    
    // Verificar status imediatamente
    checkConnectionStatus(id);
    
    // Configurar verificação periódica
    const interval = setInterval(() => {
      checkConnectionStatus(id);
    }, 10000);
    
    setStatusCheckInterval(interval);
  };
  
  // Verificar status da conexão
  const checkConnectionStatus = async (id: number) => {
    try {
      console.log(`Verificando status da conexão ${id}`);
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${apiUrl}/whatsapp/status/${id}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      console.log(`Status da conexão ${id}:`, data);
      
      // Se estiver conectado, atualizar o estado
      if (data && data.status === 'connected') {
        setIsConnected(true);
        
        // Parar o contador de QR code se estiver conectado
        if (countdownInterval) {
          clearInterval(countdownInterval);
          setCountdownInterval(null);
        }
        
        // Manter a conexão ativa com ping periódico
        pingConnection(id);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status da conexão:', error);
    }
  };
  
  // Manter conexão ativa com ping
  const pingConnection = async (id: number) => {
    try {
      await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${apiUrl}/whatsapp/ping/${id}`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
      });
      console.log(`Ping enviado para manter a conexão ${id} ativa`);
    } catch (err) {
      console.error('Erro ao enviar ping:', err);
    }
  };
  
  // Reconectar WhatsApp (regenerar QR code)
  const reconnectWhatsApp = async () => {
    if (!connectionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await startWhatsAppSession(connectionId);
    } catch (err) {
      setError('Erro ao reconectar WhatsApp. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button
        variant="contained"
        color="success"
        onClick={handleOpen}
        startIcon={<span style={{ fontSize: "18px" }}>+</span>}
        style={{
          backgroundColor: '#25d366',
          color: 'white',
          fontWeight: 600,
          borderRadius: '8px',
          padding: '10px 16px',
          textTransform: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        Nova Conexão WhatsApp
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {step === 1 ? 'Nova Conexão WhatsApp' : 'Conectar WhatsApp'}
        </DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {step === 1 && (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                label="Nome da Conexão"
                fullWidth
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
              
              <FormControl fullWidth margin="normal" disabled={loading || queues.length === 0}>
                <InputLabel>Filas</InputLabel>
                <Select
                  multiple
                  value={selectedQueueIds}
                  onChange={(e) => setSelectedQueueIds(e.target.value as number[])}
                  label="Filas"
                >
                  {queues.map((queue) => (
                    <MenuItem key={queue.id} value={queue.id}>
                      {queue.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {queues.length === 0 
                    ? 'Nenhuma fila disponível. Crie uma fila primeiro.' 
                    : 'Selecione as filas para esta conexão'}
                </FormHelperText>
              </FormControl>
              
              <TextField
                label="Mensagem de Despedida"
                fullWidth
                value={farewellMessage}
                onChange={(e) => setFarewellMessage(e.target.value)}
                margin="normal"
                multiline
                rows={2}
                disabled={loading}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Definir como conexão padrão"
                sx={{ mt: 2 }}
              />
            </Box>
          )}
          
          {step === 2 && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              {isConnected ? (
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Image
                      src="/whatsapp-qr.png"
                      alt="WhatsApp Logo"
                      width={80}
                      height={80}
                      className="mx-auto"
                    />
                    <Typography variant="h6" color="success.main" gutterBottom>
                      WhatsApp Conectado com Sucesso!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      A conexão "{connectionName}" está ativa e pronta para uso.
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Escaneie o QR code abaixo com seu WhatsApp para conectar:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative', mb: 3 }}>
                    {loading ? (
                      <CircularProgress size={60} />
                    ) : qrCodeData ? (
                      <Box sx={{ position: 'relative', bgcolor: 'white', p: 2, borderRadius: 1, boxShadow: 1 }}>
                        <QRCodeSVG 
                          value={qrCodeData} 
                          size={250}
                          level="L"
                          includeMargin={true}
                        />
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            bottom: 8, 
                            right: 8, 
                            bgcolor: 'rgba(255,255,255,0.8)',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 'bold',
                            border: 1,
                            borderColor: 'divider'
                          }}
                        >
                          {remainingSeconds}
                        </Box>
                      </Box>
                    ) : (
                      <Typography>QR code não disponível</Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Instruções:
                    </Typography>
                    <ol style={{ textAlign: 'left', paddingLeft: 20 }}>
                      <li>Abra o WhatsApp no seu celular</li>
                      <li>Toque em Menu (⋮) ou Configurações</li>
                      <li>Selecione "Aparelhos conectados"</li>
                      <li>Toque em "Conectar um aparelho"</li>
                      <li>Escaneie o QR code acima</li>
                    </ol>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          {step === 1 ? (
            <>
              <Button onClick={handleClose} color="inherit" disabled={loading}>
                Cancelar
              </Button>
              <Button 
                onClick={createWhatsAppConnection} 
                variant="contained" 
                color="primary" 
                disabled={loading || !connectionName || selectedQueueIds.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Criando...' : 'Criar Conexão'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleClose} color="inherit">
                {isConnected ? 'Fechar' : 'Cancelar'}
              </Button>
              {!isConnected && (
                <Button 
                  onClick={reconnectWhatsApp} 
                  variant="contained" 
                  color="primary" 
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Gerando...' : 'Gerar Novo QR Code'}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WhatsAppConnectionButton; 