interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchClient(url: string, options: FetchOptions = {}) {
  const { requireAuth = true, headers = {}, ...rest } = options;

  const requestHeaders = new Headers(headers);

  if (requireAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Não autorizado');
    }
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  return response;
} 