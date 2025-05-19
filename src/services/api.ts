import axios from 'axios';

const API_JUS_URL = 'https://apijus.villelatech.com.br';
const API_VBSENDER_URL = 'https://apivbsender.villelatech.com.br';

interface LoginResponse {
  token: string;
  // Add other response fields if needed
}

interface WhatsAppConnection {
  name: string;
  companyName: string;
  number: string;
  status: string;
  source: 'jus' | 'vbsender';
}

export const apiService = {
  async login(email: string, password: string): Promise<{ jusToken: string; vbsenderToken: string }> {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    try {
      console.log('[API] Tentando login nas APIs...');
      
      // Tenta login no JUS primeiro
      const jusResponse = await axios.post('/api/proxy', {
        url: `${API_JUS_URL}/auth/login`,
        method: 'POST',
        data: { email, password }
      }).catch(error => {
        console.error('[API] Erro no login JUS:', error.response?.data || error.message);
        throw new Error(`Erro no login JUS: ${error.response?.data?.error || error.message}`);
      });

      // Se o login no JUS foi bem sucedido, tenta o VBSender
      const vbsenderResponse = await axios.post('/api/proxy', {
        url: `${API_VBSENDER_URL}/auth/login`,
        method: 'POST',
        data: { email, password }
      }).catch(error => {
        console.error('[API] Erro no login VBSender:', error.response?.data || error.message);
        throw new Error(`Erro no login VBSender: ${error.response?.data?.error || error.message}`);
      });

      // Verifica se os tokens estão presentes
      if (!jusResponse?.data?.token) {
        throw new Error('Token JUS não recebido');
      }

      if (!vbsenderResponse?.data?.token) {
        throw new Error('Token VBSender não recebido');
      }

      console.log('[API] Login bem-sucedido em ambas as APIs');

      return {
        jusToken: jusResponse.data.token,
        vbsenderToken: vbsenderResponse.data.token
      };
    } catch (error) {
      console.error('[API] Erro durante o processo de login:', error);
      
      // Melhora a mensagem de erro para o usuário
      if (axios.isAxiosError(error) && error.response?.status === 500) {
        throw new Error('Erro de conexão com o servidor. Por favor, verifique suas credenciais e tente novamente.');
      }
      
      throw error;
    }
  },

  async getWhatsAppConnections(jusToken: string, vbsenderToken: string): Promise<WhatsAppConnection[]> {
    try {
      console.log('[API] Buscando conexões WhatsApp...');

      const [jusConnections, vbsenderConnections] = await Promise.all([
        axios.post('/api/proxy', {
          url: `${API_JUS_URL}/whatsapp-all`,
          method: 'GET',
          headers: { Authorization: `Bearer ${jusToken}` }
        }).catch(error => {
          console.error('[API] Erro ao buscar conexões JUS:', error.response?.data || error.message);
          return { data: [] }; // Retorna array vazio em caso de erro
        }),

        axios.post('/api/proxy', {
          url: `${API_VBSENDER_URL}/whatsapp-all`,
          method: 'GET',
          headers: { Authorization: `Bearer ${vbsenderToken}` }
        }).catch(error => {
          console.error('[API] Erro ao buscar conexões VBSender:', error.response?.data || error.message);
          return { data: [] }; // Retorna array vazio em caso de erro
        })
      ]);

      console.log('[API] Processando dados das conexões...');

      const jusData = (jusConnections.data || []).map((conn: any) => ({
        name: conn.name || 'N/A',
        companyName: conn.company?.name || 'N/A',
        number: conn.number || 'N/A',
        status: conn.status || 'N/A',
        source: 'jus' as const
      }));

      const vbsenderData = (vbsenderConnections.data || []).map((conn: any) => ({
        name: conn.name || 'N/A',
        companyName: conn.company?.name || 'N/A',
        number: conn.number || 'N/A',
        status: conn.status || 'N/A',
        source: 'vbsender' as const
      }));

      console.log('[API] Dados processados com sucesso');

      return [...jusData, ...vbsenderData];
    } catch (error) {
      console.error('[API] Erro ao buscar conexões:', error);
      throw error;
    }
  }
}; 