# Sistema de Sessões - Guia de Implementação

## Visão Geral

Este documento descreve a implementação do sistema de sessões para o projeto Senso AI Labs, onde os usuários permanecem conectados indefinidamente após o login, sem tempo de expiração automática.

## Estrutura da Tabela Sessions

### Campos Principais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | BIGSERIAL | ID único da sessão | 1, 2, 3... |
| `user_id` | BIGINT | ID do usuário (FK) | 1 |
| `token` | VARCHAR(255) | Token único da sessão | `sess_abc123xyz789` |
| `created_at` | TIMESTAMP | Data de criação | `2024-01-14 14:30:00+00` |
| `ip_address` | VARCHAR(45) | IP do cliente | `192.168.1.100` |
| `user_agent` | TEXT | Navegador/dispositivo | `Mozilla/5.0...` |

## Características do Sistema

### Sessões Permanentes
- **Duração:** Indefinida (sem expiração automática)
- **Logout:** Apenas manual pelo usuário
- **Persistência:** Token salvo no localStorage
- **Segurança:** Controle via Row Level Security (RLS)

## Funções Principais

### 1. Criar Sessão
```sql
SELECT create_session(
    user_id,           -- ID do usuário
    token,             -- Token único gerado
    ip_address,        -- IP do cliente
    user_agent         -- User agent do navegador
);
```

**Exemplo:**
```sql
SELECT create_session(
    1,
    'sess_' || encode(gen_random_bytes(32), 'hex'),
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);
```

### 2. Validar Sessão
```sql
SELECT * FROM validate_session('token_da_sessao');
```

**Retorna:**
- `user_id`: ID do usuário
- `email`: Email do usuário
- `name`: Nome do usuário
- `profile`: Perfil (user/admin)
- `is_active`: Status ativo

### 3. Logout
```sql
-- Logout de uma sessão específica
SELECT logout_session('token_da_sessao');

-- Logout de todas as sessões do usuário
SELECT logout_all_sessions(user_id);
```

## Integração com Frontend

### 1. Login (Criar Sessão)
```typescript
// Após validar credenciais
const sessionData = {
    user_id: user.id,
    token: generateSecureToken(),
    ip_address: getClientIP(),
    user_agent: navigator.userAgent
};

// Chamar função create_session via API
const sessionId = await createSession(sessionData);

// Salvar token no localStorage (permanente)
localStorage.setItem('authToken', sessionData.token);
```

### 2. Middleware de Autenticação
```typescript
// Validar sessão em cada requisição
const validateUserSession = async (token: string) => {
    const session = await validateSession(token);
    
    if (!session || session.length === 0) {
        throw new Error('Sessão inválida');
    }
    
    return session[0]; // Dados do usuário
};
```

### 3. Logout
```typescript
// Logout simples
const logout = async (token: string) => {
    await logoutSession(token);
    localStorage.removeItem('authToken');
    // Redirecionar para login
};

// Logout de todos os dispositivos
const logoutAllDevices = async (userId: number) => {
    await logoutAllSessions(userId);
    localStorage.removeItem('authToken');
    // Redirecionar para login
};
```

## Segurança e Auditoria

### 1. Rastreamento de Acesso
- **IP Address:** Registra IP de cada sessão
- **User Agent:** Identifica dispositivo/navegador
- **Timestamps:** Controla criação das sessões

### 2. Políticas RLS (Row Level Security)
- Usuários veem apenas suas próprias sessões
- Admins podem ver todas as sessões
- Proteção automática contra acesso não autorizado

### 3. Gerenciamento Manual
- Logout manual pelo usuário
- Logout de todos os dispositivos
- Controle total do usuário sobre suas sessões

## Consultas de Monitoramento

### 1. Sessões Ativas por Usuário
```sql
SELECT 
    u.name,
    u.email,
    COUNT(s.id) as sessoes_ativas,
    MAX(s.created_at) as ultimo_login
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id 
GROUP BY u.id, u.name, u.email
ORDER BY sessoes_ativas DESC;
```

### 2. Histórico de Acessos
```sql
SELECT 
    u.name,
    u.email,
    s.created_at as login_time,
    s.ip_address,
    s.user_agent
FROM sessions s
INNER JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 50;
```

### 3. Sessões por Dispositivo
```sql
SELECT 
    u.name,
    s.ip_address,
    s.user_agent,
    s.created_at,
    COUNT(*) OVER (PARTITION BY s.user_id) as total_sessoes
FROM sessions s
INNER JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;
```

## Boas Práticas

### 1. Geração de Tokens
- Use tokens criptograficamente seguros
- Comprimento mínimo de 32 bytes
- Prefixo identificador (ex: `sess_`)

### 2. Validação de Sessão
- Valide em cada requisição protegida
- Verifique se o usuário está ativo
- Implemente rate limiting

### 3. Logout Seguro
- Sempre remova o token do cliente
- Invalide a sessão no servidor
- Redirecione para página de login

### 4. Monitoramento
- Monitore sessões por usuário
- Alerte sobre múltiplas sessões suspeitas
- Mantenha logs de auditoria

## Exemplo de Implementação Completa

### Backend (Edge Function)
```typescript
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: Request) {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (req.method === 'POST') {
        const { email, password } = await req.json();
        
        // Validar credenciais
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .single();

        if (!user || !await verifyPassword(password, user.password)) {
            return new Response('Credenciais inválidas', { status: 401 });
        }

        // Criar sessão
        const token = 'sess_' + crypto.randomUUID();
        
        const { data: session } = await supabase.rpc('create_session', {
            p_user_id: user.id,
            p_token: token,
            p_ip_address: getClientIP(req),
            p_user_agent: req.headers.get('user-agent')
        });

        return new Response(JSON.stringify({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profile: user.profile
            }
        }));
    }
}
```

### Frontend (React Hook)
```typescript
import { useState, useEffect } from 'react';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            validateSession(token);
        } else {
            setLoading(false);
        }
    }, []);

    const validateSession = async (token: string) => {
        try {
            const response = await fetch('/api/validate-session', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error('Erro ao validar sessão:', error);
            localStorage.removeItem('authToken');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const { token, user } = await response.json();
            localStorage.setItem('authToken', token);
            setUser(user);
            return { success: true };
        } else {
            return { success: false, error: 'Credenciais inválidas' };
        }
    };

    const logout = async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        
        localStorage.removeItem('authToken');
        setUser(null);
    };

    return { user, loading, login, logout };
};
```

## Próximos Passos

1. **Aplicar migração no Supabase**
2. **Implementar Edge Functions para autenticação**
3. **Atualizar middleware de autenticação**
4. **Testar fluxo completo de login/logout**
5. **Implementar monitoramento de sessões**
6. **Configurar alertas de segurança**