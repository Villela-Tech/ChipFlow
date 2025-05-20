'use client';

import React, { useState } from 'react';
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
  Box,
  FormHelperText
} from '@mui/material';

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
  
  // Form states
  const [connectionName, setConnectionName] = useState('');
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [farewellMessage, setFarewellMessage] = useState('Obrigado pelo contato! Em breve retornaremos.');
  
  const handleOpen = async () => {
    setOpen(true);
    resetForm();
    await fetchQueues();
  };
  
  const handleClose = () => {
    setOpen(false);
    resetForm();
  };
  
  const resetForm = () => {
    setConnectionName('');
    setSelectedQueueIds([]);
    setIsDefault(false);
    setFarewellMessage('Obrigado pelo contato! Em breve retornaremos.');
    setError(null);
  };
  
  // Fetch available queues
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
  
  // Create WhatsApp connection
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
            type: 'baileys'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar conexão WhatsApp');
      }
      
      const data = await response.json();
      console.log('Conexão WhatsApp criada:', data);
      
      // Callback de sucesso se fornecido
      if (onConnectionCreated) {
        onConnectionCreated(data);
      }
      
      handleClose();
    } catch (err) {
      console.error('Erro ao criar conexão WhatsApp:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar conexão WhatsApp');
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
        <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
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
        </DialogContent>
        
        <DialogActions>
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
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WhatsAppConnectionButton; 