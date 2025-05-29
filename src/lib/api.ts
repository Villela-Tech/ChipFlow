import { getApiUrl } from './config';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
  autoLogoutOn401?: boolean;
}

export async function apiRequest(url: string, options: ApiOptions = {}) {
  const { requireAuth = true, autoLogoutOn401 = false, ...fetchOptions } = options;
  
  const apiUrl = getApiUrl(url);
  console.log('API Request:', apiUrl, { requireAuth, autoLogoutOn401 });
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (requireAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('API Request: Token check -', token ? 'Token found' : 'No token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(apiUrl, {
    ...fetchOptions,
    headers,
  });

  console.log('API Response:', apiUrl, 'Status:', response.status);

  if (response.status === 401 && autoLogoutOn401 && typeof window !== 'undefined') {
    // Token inválido ou expirado, fazer logout apenas se solicitado
    console.log('API Request: 401 detected, performing auto logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Token expirado');
  }

  return response;
}

export async function apiGet(url: string, options: ApiOptions = {}) {
  return apiRequest(url, { ...options, method: 'GET' });
}

export async function apiPost(url: string, data?: any, options: ApiOptions = {}) {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPut(url: string, data?: any, options: ApiOptions = {}) {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete(url: string, options: ApiOptions = {}) {
  return apiRequest(url, { ...options, method: 'DELETE' });
} 