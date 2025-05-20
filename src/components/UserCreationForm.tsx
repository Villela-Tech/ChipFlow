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
  onSuccess?: (userData: UserData) => void;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  profile: string;
  companyId: number;
  queueIds: number[];
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
  company: string;
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
      
      let userData: UserData;
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
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userData: FormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as string,
      company: formData.get('company') as string,
    };
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Iniciando processo de criação de usuário...');
      
      // Validar dados
      if (!userData.name || !userData.email || !userData.password) {
        setError('Por favor, preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }
      
      // Criar o usuário com as filas selecionadas (somente as existentes)
      console.log('Criando usuário com filas selecionadas:', selectedQueueIds);
      const userDataResponse = await createUser(selectedQueueIds);
      
      setSuccess(`Usuário "${userData.name}" criado com sucesso!`);
      
      // Chamar callback de sucesso se existir
      if (onSuccess && userDataResponse) {
        onSuccess(userDataResponse);
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