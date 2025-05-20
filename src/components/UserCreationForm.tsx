'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';

interface UserCreationFormProps {
  token: string;
  companyId: number;
}

const UserCreationForm: React.FC<UserCreationFormProps> = ({ token, companyId }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEmail('');
    setError(null);
  };

  const createUser = async () => {
    if (!username || !password || !email) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${process.env.NEXT_PUBLIC_API_URL}/users`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            username,
            password,
            email,
            companyId
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao criar usuário');
      }

      const data = await response.json();
      console.log('Usuário criado:', data);
      handleClose();
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
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
        startIcon={<span style={{ fontSize: "18px" }}>+</span>}
        style={{
          backgroundColor: '#3B82F6',
          color: 'white',
          fontWeight: 600,
          borderRadius: '8px',
          padding: '10px 16px',
          textTransform: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        Novo Usuário
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              label="Nome de Usuário"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              label="Senha"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={createUser}
            variant="contained"
            color="primary"
            disabled={loading || !username || !password || !email}
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