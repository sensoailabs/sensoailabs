# API REST de Autenticação - Documentação

## Endpoint de Login

### POST /api/auth/login

Autentica um usuário no sistema.

#### Request Body
```json
{
  "email": "string (required)",
  "password": "string (required)", 
  "rememberMe": "boolean (optional, default false)"
}
```

#### Responses

**200 - Sucesso**
```json
{
  "message": "Login realizado",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Nome do Usuário",
    "email": "usuario@sensoramadesign.com.br",
    "profile": "admin"
  }
}
```

**400 - Dados inválidos**
```json
{
  "error": "Dados obrigatórios não informados"
}
```

**401 - Credenciais inválidas**
```json
{
  "error": "Credenciais inválidas"
}
```

**403 - Usuário inativo**
```json
{
  "error": "Usuário inativo"
}
```

**500 - Erro interno**
```json
{
  "error": "Erro interno do servidor"
}
```

## Processo de Autenticação

1. **Validação de dados**: Verifica se email e password foram fornecidos
2. **Busca do usuário**: Consulta usuário por email no Supabase
3. **Verificação de status**: Confirma se usuário está ativo
4. **Validação de senha**: Compara senha com hash armazenado
5. **Geração de token**: Cria token JWT para autenticação
6. **Atualização de login**: Registra último login do usuário
7. **Criação de sessão**: Se rememberMe=true, cria sessão persistente

## Integração Frontend

### Uso do AuthService

```typescript
import { authService } from '../services/authService';

// Login
try {
  const response = await authService.login(email, password, rememberMe);
  console.log('Usuário logado:', response.user);
} catch (error) {
  console.error('Erro no login:', error);
}

// Verificar autenticação
const isAuth = await authService.isAuthenticated();

// Logout
await authService.logout();
```

### Interceptador HTTP

```typescript
import apiClient from '../lib/httpClient';

// Requisições automáticas com token
const response = await apiClient.get('/api/users');
const data = await apiClient.post('/api/data', { content: 'test' });
```

## Armazenamento de Token

- **rememberMe = true**: Token salvo no `localStorage` (persistente)
- **rememberMe = false**: Token salvo no `sessionStorage` (sessão)
- **Logout automático**: Token removido se expirar ou for inválido

## Segurança

- Tokens JWT com expiração de 24 horas
- Sessões persistentes no Supabase para rememberMe
- Interceptadores automáticos para requisições
- Logout automático em caso de token inválido
- Validação de domínio de email (@sensoramadesign.com.br)

## Exemplo de Teste

```typescript
// Teste de login
const testLogin = async () => {
  try {
    const response = await authService.login(
      'admin@sensoramadesign.com.br',
      'Admin123!',
      true
    );
    
    console.log('Login bem-sucedido:', response);
    
    // Fazer requisição autenticada
    const userData = await apiClient.get('/api/user/profile');
    console.log('Dados do usuário:', userData.data);
    
  } catch (error) {
    console.error('Erro:', error);
  }
};
```