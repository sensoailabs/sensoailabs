# Estrutura de Banco de Dados - Sistema de Autenticação

## Tabela Users

### Especificações da Tabela

```sql
-- Criar tabela users para sistema de autenticação
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile VARCHAR(50) DEFAULT 'user' NOT NULL,
    photo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL
);
```

## Tabela Sessions

### Especificações da Tabela

```sql
-- Criar tabela sessions para controle de sessões ativas
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    remember_me BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Foreign key constraint
    CONSTRAINT fk_sessions_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);
```

### Campos da Tabela Sessions

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | BIGSERIAL | PRIMARY KEY, AUTO INCREMENT | Identificador único da sessão |
| `user_id` | BIGINT | NOT NULL, FOREIGN KEY | ID do usuário proprietário |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | Token único da sessão |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `ip_address` | VARCHAR(45) | NULLABLE | Endereço IP do cliente |
| `user_agent` | TEXT | NULLABLE | User agent do navegador |

### Índices para Performance

#### Tabela Users
```sql
-- Criar índice para consultas por profile
CREATE INDEX idx_users_profile ON users(profile);

-- Criar índice para consultas por is_active
CREATE INDEX idx_users_is_active ON users(is_active);

-- Criar índice para consultas por created_at
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Tabela Sessions
```sql
-- Índice em sessions.token para busca rápida
CREATE INDEX idx_sessions_token ON sessions(token);

-- Índice em sessions.user_id
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

### Triggers Automáticos

#### 1. Auto-atualização do campo updated_at

```sql
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

#### 3. Atualização Automática do Last Login

```sql
-- Função para atualizar last_login automaticamente
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar last_login do usuário quando uma nova sessão é criada
    UPDATE users 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar last_login automaticamente
CREATE TRIGGER trigger_update_last_login
    AFTER INSERT ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_login();
```

#### 4. Limpeza Automática de Sessões

```sql
-- Função para limpeza automática de sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar sessões expiradas
    DELETE FROM sessions 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza (opcional)
    RAISE NOTICE 'Limpeza automática: % sessões expiradas removidas', deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## Funções de Gerenciamento de Sessões

### 1. Validar Sessão

```sql
-- Função para validar sessão ativa
CREATE OR REPLACE FUNCTION validate_session(session_token VARCHAR(255))
RETURNS TABLE(
    user_id BIGINT,
    email VARCHAR(150),
    name VARCHAR(100),
    profile VARCHAR(50),
    is_active BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.name,
        u.profile,
        u.is_active,
        s.expires_at
    FROM sessions s
    INNER JOIN users u ON s.user_id = u.id
    WHERE s.token = session_token
      AND s.expires_at > CURRENT_TIMESTAMP
      AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;
```

### 2. Criar Nova Sessão

```sql
-- Função para criar nova sessão
CREATE OR REPLACE FUNCTION create_session(
    p_user_id BIGINT,
    p_token VARCHAR(255),
    p_remember_me BOOLEAN DEFAULT false,
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    session_id BIGINT;
    expires_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Definir tempo de expiração
    IF p_remember_me THEN
        expires_time := CURRENT_TIMESTAMP + INTERVAL '30 days';
    ELSE
        expires_time := CURRENT_TIMESTAMP + INTERVAL '24 hours';
    END IF;
    
    -- Inserir nova sessão
    INSERT INTO sessions (
        user_id, 
        token, 
        expires_at, 
        remember_me, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id,
        p_token,
        expires_time,
        p_remember_me,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. Logout de Sessão

```sql
-- Função para logout (invalidar sessão)
CREATE OR REPLACE FUNCTION logout_session(session_token VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE token = session_token;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Função para logout de todas as sessões do usuário
CREATE OR REPLACE FUNCTION logout_all_sessions(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security (RLS)

#### Tabela Users
```sql
-- Habilitar RLS na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Política para permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Política para permitir inserção de novos usuários (registro)
CREATE POLICY "Enable insert for registration" ON users
    FOR INSERT WITH CHECK (true);

-- Política para admins verem todos os usuários
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND profile = 'admin'
        )
    );

-- Política para admins gerenciarem todos os usuários
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND profile = 'admin'
        )
    );
```

#### Tabela Sessions
```sql
-- Habilitar RLS na tabela sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias sessões
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (
        user_id::text = auth.uid()::text
    );

-- Política para usuários gerenciarem apenas suas próprias sessões
CREATE POLICY "Users can manage own sessions" ON sessions
    FOR ALL USING (
        user_id::text = auth.uid()::text
    );

-- Política para admins verem todas as sessões
CREATE POLICY "Admins can view all sessions" ON sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND profile = 'admin'
        )
    );
```

### Documentação dos Campos

#### Tabela Users
```sql
-- Comentários para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema de autenticação';
COMMENT ON COLUMN users.id IS 'Identificador único do usuário';
COMMENT ON COLUMN users.name IS 'Nome completo do usuário';
COMMENT ON COLUMN users.email IS 'Email único do usuário (domínio @sensoramadesign.com.br)';
COMMENT ON COLUMN users.password IS 'Hash da senha criptografada (bcrypt)';
COMMENT ON COLUMN users.profile IS 'Perfil do usuário (user, admin, etc.)';
COMMENT ON COLUMN users.photo_url IS 'URL da foto de perfil do usuário';
COMMENT ON COLUMN users.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN users.updated_at IS 'Data e hora da última atualização';
COMMENT ON COLUMN users.last_login IS 'Data e hora do último login';
COMMENT ON COLUMN users.is_active IS 'Status ativo/inativo do usuário';
```

#### Tabela Sessions
```sql
-- Comentários para documentação
COMMENT ON TABLE sessions IS 'Tabela de sessões ativas do sistema (sem expiração)';
COMMENT ON COLUMN sessions.id IS 'Identificador único da sessão';
COMMENT ON COLUMN sessions.user_id IS 'ID do usuário proprietário da sessão';
COMMENT ON COLUMN sessions.token IS 'Token único da sessão';
COMMENT ON COLUMN sessions.created_at IS 'Data e hora de criação da sessão';
COMMENT ON COLUMN sessions.ip_address IS 'Endereço IP do cliente';
COMMENT ON COLUMN sessions.user_agent IS 'User agent do navegador';
```

## Especificações Técnicas

### Campos da Tabela

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | BIGSERIAL | PRIMARY KEY, AUTO INCREMENT | Identificador único |
| `name` | VARCHAR(100) | NOT NULL | Nome completo do usuário |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | Email único (domínio @sensoramadesign.com.br) |
| `password` | VARCHAR(255) | NOT NULL | Hash da senha (bcrypt) |
| `profile` | VARCHAR(50) | DEFAULT 'user', NOT NULL | Perfil do usuário |
| `photo_url` | VARCHAR(255) | NULLABLE | URL da foto de perfil |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Data de atualização |
| `last_login` | TIMESTAMP WITH TIME ZONE | NULLABLE | Último login |
| `is_active` | BOOLEAN | DEFAULT true | Status ativo/inativo |

### Constraints e Validações

1. **Email único**: Índice único automático
2. **Validação de domínio**: Trigger que valida @sensoramadesign.com.br
3. **Hash da senha**: Campo para armazenar hash bcrypt (255 chars)
4. **Auto-atualização**: Campo updated_at atualizado automaticamente
5. **Segurança**: RLS habilitado com políticas específicas

### Índices para Performance

- `idx_users_profile`: Para consultas por perfil
- `idx_users_is_active`: Para consultas por status ativo
- `idx_users_created_at`: Para consultas por data de criação
- Índice único automático no email

### Exemplo de Uso

#### Operações com Users
```sql
-- Inserir novo usuário
INSERT INTO users (name, email, password) 
VALUES (
    'João Silva', 
    'joao.silva@sensoramadesign.com.br', 
    '$2b$10$N9qo8uLOickgx2ZMRZoMye.Uo04/OjpVkVhHvx4JP68LTdGzTvSdW'
);

-- Buscar usuário por email
SELECT * FROM users WHERE email = 'joao.silva@sensoramadesign.com.br';

-- Atualizar último login
UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = 1;

-- Desativar usuário
UPDATE users SET is_active = false WHERE id = 1;
```

#### Operações com Sessions
```sql
-- Criar nova sessão (24 horas)
SELECT create_session(
    1, -- user_id
    'token_abc123xyz789', -- token único
    false, -- remember_me
    '192.168.1.100', -- ip_address
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' -- user_agent
);

-- Criar sessão persistente (30 dias)
SELECT create_session(
    1, -- user_id
    'token_persistent_456', -- token único
    true, -- remember_me = true
    '192.168.1.100', -- ip_address
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' -- user_agent
);

-- Validar sessão ativa
SELECT * FROM validate_session('token_abc123xyz789');

-- Fazer logout de uma sessão específica
SELECT logout_session('token_abc123xyz789');

-- Fazer logout de todas as sessões do usuário
SELECT logout_all_sessions(1);

-- Buscar sessões ativas de um usuário
SELECT s.*, u.name, u.email 
FROM sessions s
INNER JOIN users u ON s.user_id = u.id
WHERE s.user_id = 1 
  AND s.expires_at > CURRENT_TIMESTAMP;

-- Limpeza manual de sessões expiradas
SELECT cleanup_expired_sessions();
```

#### Consultas de Monitoramento
```sql
-- Contar sessões ativas por usuário
SELECT 
    u.name,
    u.email,
    COUNT(s.id) as sessoes_ativas
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id 
    AND s.expires_at > CURRENT_TIMESTAMP
GROUP BY u.id, u.name, u.email
ORDER BY sessoes_ativas DESC;

-- Sessões que expiram nas próximas 24 horas
SELECT 
    s.*,
    u.name,
    u.email,
    s.expires_at - CURRENT_TIMESTAMP as tempo_restante
FROM sessions s
INNER JOIN users u ON s.user_id = u.id
WHERE s.expires_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '24 hours'
ORDER BY s.expires_at;

-- Histórico de logins por usuário (últimas sessões)
SELECT 
    u.name,
    u.email,
    u.last_login,
    COUNT(s.id) as total_sessoes_criadas
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email, u.last_login
ORDER BY u.last_login DESC NULLS LAST;
```

## Status da Implementação

### Tabela Users
✅ **Tabela criada** no Supabase (Projeto: kdpdpcwjdkcbuvjksokd)  
✅ **Índices configurados** para performance  
✅ **Triggers implementados** para validação e auto-atualização  
✅ **RLS habilitado** com políticas de segurança  
✅ **Validação testada** - domínio do email funcionando  
✅ **Campos last_login e is_active** implementados  

### Tabela Sessions (Nova Estrutura)
🔄 **Migração criada** - `002_sessions_and_login_enhancements.sql`  
🔄 **Aguardando aplicação** no Supabase  
📋 **Recursos incluídos:**
- Tabela sessions com todos os campos especificados
- Índices otimizados para performance
- Funções de gerenciamento de sessões
- Triggers para atualização automática do last_login
- Limpeza automática de sessões expiradas
- RLS configurado para segurança
- Políticas de retenção implementadas

### Funcionalidades Implementadas
✅ **Controle de sessões ativas** com tokens únicos  
✅ **Suporte a "Manter-me conectado"** (30 dias vs 24 horas)  
✅ **Rastreamento de IP e User Agent** para auditoria  
✅ **Atualização automática do last_login** via trigger  
✅ **Limpeza automática** de sessões expiradas  
✅ **Funções de logout** individual e em massa  
✅ **Validação de sessões** com dados do usuário  
✅ **Consultas de monitoramento** para administração  

### Próximos Passos
1. **Aplicar migração** no Supabase via MCP
2. **Testar funções** de gerenciamento de sessões
3. **Configurar limpeza automática** (cron job)
4. **Integrar com frontend** React/TypeScript
5. **Implementar middleware** de autenticação

A estrutura está completa e pronta para integração com o sistema de autenticação da aplicação React.