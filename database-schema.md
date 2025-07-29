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

### Índices para Performance

```sql
-- Criar índice para consultas por profile
CREATE INDEX idx_users_profile ON users(profile);

-- Criar índice para consultas por is_active
CREATE INDEX idx_users_is_active ON users(is_active);

-- Criar índice para consultas por created_at
CREATE INDEX idx_users_created_at ON users(created_at);
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

#### 2. Validação de Domínio do Email

```sql
-- Função para validar domínio do email
CREATE OR REPLACE FUNCTION validate_email_domain()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email NOT LIKE '%@sensoramadesign.com.br' THEN
        RAISE EXCEPTION 'Email deve ser do domínio @sensoramadesign.com.br';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para validar domínio do email
CREATE TRIGGER validate_users_email_domain
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_email_domain();
```

### Row Level Security (RLS)

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

### Documentação dos Campos

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

## Status da Implementação

✅ **Tabela criada** no Supabase (Projeto: kdpdpcwjdkcbuvjksokd)  
✅ **Índices configurados** para performance  
✅ **Triggers implementados** para validação e auto-atualização  
✅ **RLS habilitado** com políticas de segurança  
✅ **Validação testada** - domínio do email funcionando  
✅ **Documentação completa** dos campos e constraints  

A estrutura está pronta para integração com o sistema de autenticação da aplicação React.