// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// If no explicit API URL is set, use the same origin
export const getApiUrl = (path: string): string => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  
  // In browser, use the same origin
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}${path}`;
  }
  
  // In server-side code, use localhost with current port
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}${path}`;
};

export const config = {
  getApiUrl,
  // Add other configuration settings here
}; 