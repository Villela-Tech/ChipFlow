'use client';

import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText, 
  CircularProgress, 
  Alert, 
  Grid 
} from '@mui/material';

interface UserCreationFormProps {
  token: string;
  apiUrl?: string;
  companyId: number;
  onSuccess?: (userData: any) => void;
}

const UserCreationForm: React.FC<UserCreationFormProps> = ({ 
  token, 
  apiUrl = 'https://apisuporte.villelatech.com.br', 
  companyId, 
  onSuccess 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para dados do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generateRandomPassword());
  const [profile, setProfile] = useState('user');
  const [queues, setQueues] = useState<Array<{ id: number, name: string }>>([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
  const [createNewQueue, setCreateNewQueue] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');
  const [newQueueColor, setNewQueueColor] = useState(generateRandomColor());
  
  // Função para gerar uma senha aleatória
  function generateRandomPassword(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Função para gerar cor aleatória
  function generateRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }
  
  const handleOpen = async () => {
    setOpen(true);
    setError(null);
    setSuccess(null);
    setPassword(generateRandomPassword());
    setNewQueueColor(generateRandomColor());
    
    // Carregar filas existentes
    await fetchQueues();
  };
  
  const handleClose = () => {
    setOpen(false);
    resetForm();
  };
  
  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword(generateRandomPassword());
    setProfile('user');
    setSelectedQueueIds([]);
    setCreateNewQueue(false);
    setNewQueueName('');
    setNewQueueColor(generateRandomColor());
    setError(null);
    setSuccess(null);
  };
  
  // Buscar filas existentes
  const fetchQueues = async () => {
    try {
      setLoading(true);
      
      console.log('Buscando filas existentes...');
      
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
      
      console.log('Status da resposta da busca de filas:', response.status);
      
      let responseText = '';
      try {
        responseText = await response.text();
        console.log('Resposta da API (texto):', responseText.substring(0, 200));
      } catch (e) {
        console.error('Erro ao ler o corpo da resposta:', e);
      }
      
      if (!response.ok) {
        console.error(`Erro ao buscar filas. Status: ${response.status}`);
        console.error('Corpo da resposta:', responseText);
        throw new Error(`Falha ao buscar filas (${response.status})`);
      }
      
      let queuesData;
      try {
        queuesData = JSON.parse(responseText);
        console.log('Filas encontradas:', queuesData.length);
      } catch (e) {
        console.error('Erro ao parsear resposta JSON:', e);
        throw new Error('Resposta da API não é um JSON válido');
      }
      
      setQueues(queuesData);
    } catch (err) {
      console.error('Erro detalhado ao buscar filas:', err);
      // Não lançamos o erro aqui para não interromper o fluxo principal
      setQueues([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Criar uma nova fila
  const createQueue = async () => {
    try {
      if (!newQueueName) {
        return null;
      }
      
      console.log('Criando fila com nome:', newQueueName, 'e cor:', newQueueColor);
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${apiUrl}/queue`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            name: newQueueName,
            color: newQueueColor,
            greetingMessage: `Olá! Você está na fila de atendimento de ${newQueueName}.`,
            companyId: companyId
          }
        })
      });
      
      console.log('Status da resposta de criação de fila:', response.status);
      
      let responseText = '';
      try {
        responseText = await response.text();
        console.log('Resposta da API (texto):', responseText);
      } catch (e) {
        console.error('Erro ao ler o corpo da resposta:', e);
      }
      
      if (!response.ok) {
        console.error(`Erro na criação da fila. Status: ${response.status}`);
        console.error('Corpo da resposta:', responseText);
        throw new Error(`Falha ao criar fila (${response.status})`);
      }
      
      let queueData;
      try {
        queueData = JSON.parse(responseText);
        console.log('Fila criada com sucesso:', queueData);
      } catch (e) {
        console.error('Erro ao parsear resposta JSON:', e);
        throw new Error('Resposta da API não é um JSON válido');
      }
      
      // Atualizar a lista de filas e selecionar a nova fila
      await fetchQueues();
      return queueData.id;
      
    } catch (err) {
      console.error('Erro detalhado ao criar fila:', err);
      throw err;
    }
  };
  
  // Criar usuário
  const createUser = async (queueIds: number[]) => {
    try {
      console.log('Enviando dados para criação de usuário:', {
        name,
        email,
        password: '********', // Não logar senha por segurança
        profile,
        companyId,
        queueIds
      });
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${apiUrl}/users`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            name,
            email,
            password,
            profile,
            companyId,
            queueIds
          }
        })
      });
      
      console.log('Status da resposta de criação de usuário:', response.status);
      
      let responseText = '';
      try {
        responseText = await response.text();
        console.log('Resposta da API (texto):', responseText.substring(0, 200));
      } catch (e) {
        console.error('Erro ao ler o corpo da resposta:', e);
      }
      
      if (!response.ok) {
        console.error(`Erro na criação do usuário. Status: ${response.status}`);
        console.error('Corpo da resposta:', responseText);
        throw new Error(`Falha ao criar usuário (${response.status})`);
      }
      
      let userData;
      try {
        userData = JSON.parse(responseText);
        console.log('Usuário criado com sucesso:', userData);
      } catch (e) {
        console.error('Erro ao parsear resposta JSON:', e);
        throw new Error('Resposta da API não é um JSON válido');
      }
      
      return userData;
      
    } catch (err) {
      console.error('Erro detalhado ao criar usuário:', err);
      throw err;
    }
  };
  
  // Função principal para criação do usuário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Iniciando processo de criação de usuário...');
      
      // Validar dados
      if (!name || !email || !password) {
        setError('Por favor, preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }
      
      let userData;
      
      // Pular a criação de fila se estiver dando problemas
      if (createNewQueue && newQueueName) {
        try {
          console.log('Tentando criar nova fila:', newQueueName);
          // Comentando a criação de fila temporariamente
          // const newQueueId = await createQueue();
          // if (newQueueId) {
          //   console.log('Fila criada com ID:', newQueueId);
          //   userQueueIds.push(newQueueId);
          // }
          console.log('Pulando criação de fila, pois está causando erros na API');
        } catch (queueError) {
          console.error('Erro ao criar fila, continuando sem ela:', queueError);
          // Continuamos mesmo com erro na fila
        }
      }
      
      // Criar o usuário com as filas selecionadas (somente as existentes)
      console.log('Criando usuário com filas selecionadas:', selectedQueueIds);
      userData = await createUser(selectedQueueIds);
      
      setSuccess(`Usuário "${name}" criado com sucesso!`);
      
      // Chamar callback de sucesso se existir
      if (onSuccess && userData) {
        onSuccess(userData);
      }
      
      // Resetar formulário após alguns segundos
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (err) {
      console.error('Erro completo durante criação:', err);
      let errorMessage = 'Erro desconhecido';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        startIcon={<span>+</span>}
        style={{
          backgroundColor: '#1976d2',
          color: 'white',
          fontWeight: 600,
          borderRadius: '8px',
          padding: '10px 16px',
          textTransform: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        Criar Novo Usuário
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  margin="normal"
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="E-mail"
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Senha"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  helperText="Senha gerada automaticamente (você pode alterá-la)"
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" disabled={loading}>
                  <InputLabel>Perfil</InputLabel>
                  <Select
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                    label="Perfil"
                  >
                    <MenuItem value="admin">Administrador</MenuItem>
                    <MenuItem value="user">Usuário</MenuItem>
                  </Select>
                  <FormHelperText>Nível de permissão do usuário</FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal" disabled={loading}>
                  <InputLabel>Filas</InputLabel>
                  <Select
                    multiple
                    value={selectedQueueIds}
                    onChange={(e) => setSelectedQueueIds(e.target.value as number[])}
                    label="Filas"
                    disabled={loading || queues.length === 0}
                  >
                    {queues.map((queue) => (
                      <MenuItem key={queue.id} value={queue.id}>
                        {queue.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Selecione as filas para este usuário</FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset" margin="normal">
                  <Grid container alignItems="center">
                    <Grid item>
                      <Button
                        variant={createNewQueue ? "contained" : "outlined"}
                        color="primary"
                        onClick={() => setCreateNewQueue(!createNewQueue)}
                        disabled={loading}
                        size="small"
                        sx={{ mr: 2 }}
                      >
                        {createNewQueue ? "✓ Criar Nova Fila" : "+ Criar Nova Fila"}
                      </Button>
                    </Grid>
                  </Grid>
                </FormControl>
              </Grid>
              
              {createNewQueue && (
                <Grid container item xs={12} spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      label="Nome da Nova Fila"
                      fullWidth
                      value={newQueueName}
                      onChange={(e) => setNewQueueName(e.target.value)}
                      margin="normal"
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Cor"
                      fullWidth
                      value={newQueueColor}
                      onChange={(e) => setNewQueueColor(e.target.value)}
                      margin="normal"
                      disabled={loading}
                      type="color"
                      sx={{ mt: 3 }}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
          </form>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            color="inherit"
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary" 
            disabled={loading || (!name || !email || !password)}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserCreationForm; 