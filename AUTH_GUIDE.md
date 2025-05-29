# Sistema de Autenticação Bearer Token

Este projeto usa autenticação com Bearer Token salvando no localStorage.

## Como funciona

### 1. Login
O usuário faz login através da rota `/api/auth/login` com email e senha:

```javascript
import { useAuth } from '@/hooks/useAuth';

const { login } = useAuth();

const result = await login(email, password);
if (result.success) {
  // Login bem-sucedido
  // Token é automaticamente salvo no localStorage
}
```

### 2. Requisições Autenticadas
Use as funções utilitárias para fazer requisições com Bearer Token:

```javascript
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// GET request
const response = await apiGet('/api/users');

// POST request
const response = await apiPost('/api/users', userData);

// PUT request
const response = await apiPut('/api/users/123', userData);

// DELETE request
const response = await apiDelete('/api/users/123');
```

### 3. Hook useAuth
O hook `useAuth` fornece:

```javascript
const { user, loading, login, logout, getToken } = useAuth();

// user: dados do usuário logado
// loading: status de carregamento
// login: função para fazer login
// logout: função para logout
// getToken: função para obter o token atual
```

### 4. Middleware
O middleware protege automaticamente todas as rotas exceto:
- `/login`
- `/api/auth/login`
- `/api/auth/register`

### 5. Verificação de Token
Para verificar se um token é válido:

```javascript
// GET /api/auth/verify
// Header: Authorization: Bearer <token>
```

## Estrutura dos Arquivos

- `src/lib/auth.ts` - Utilitários de autenticação (JWT, bcrypt)
- `src/lib/api.ts` - Utilitários para requisições autenticadas
- `src/hooks/useAuth.ts` - Hook para gerenciar autenticação
- `middleware.ts` - Middleware para proteger rotas
- `src/app/api/auth/login/route.ts` - Rota de login
- `src/app/api/auth/verify/route.ts` - Rota de verificação de token

## Variáveis de Ambiente

Adicione no seu `.env.local`:

```
JWT_SECRET=your-jwt-secret-key-here
```

## Fluxo de Autenticação

1. Usuário faz login → recebe JWT token
2. Token é salvo no localStorage
3. Todas as requisições incluem o token no header Authorization
4. Middleware verifica o token nas rotas protegidas
5. API routes verificam o token para autorização 