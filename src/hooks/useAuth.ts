import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        let token = localStorage.getItem('token');
        console.log('useAuth: Checking token...', token ? 'Token found' : 'No token');
        
        // Se não há token, criar um token temporário para o bypass
        if (!token) {
          console.log('useAuth: No token found, creating temporary token for bypass...');
          token = 'bypass-token-admin';
          localStorage.setItem('token', token);
        }

        console.log('useAuth: Verifying token...');
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('useAuth: Verify response status:', response.status);

        if (!response.ok) {
          throw new Error(`Invalid token - Status: ${response.status}`);
        }

        // Se chegou até aqui, o token é válido ou está em bypass
        console.log('useAuth: Token is valid, getting user data...');
        const verifyData = await response.json();
        
        if (verifyData.user) {
          console.log('useAuth: User data received from API:', verifyData.user.email);
          localStorage.setItem('user', JSON.stringify(verifyData.user));
          setUser(verifyData.user);
        } else {
          // Fallback para dados do localStorage
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            console.log('useAuth: User data loaded from localStorage:', parsedUser.email);
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('useAuth: Auth error:', error);
        console.log('useAuth: Cleaning localStorage and setting user to null');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('useAuth: Attempting login for:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no login');
      }

      const data = await response.json();
      console.log('useAuth: Login successful, saving data...');
      
      // Salvar token e dados do usuário no localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      return { success: true };
    } catch (error) {
      console.error('useAuth: Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro no login' 
      };
    }
  };

  const logout = () => {
    console.log('useAuth: Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  return { user, loading, login, logout, getToken };
} 