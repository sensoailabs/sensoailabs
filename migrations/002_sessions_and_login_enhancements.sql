-- =====================================================
-- MIGRAÇÃO: Sistema de Login - Estrutura Complementar
-- Data: 2024
-- Descrição: Tabela sessions, updates na users e limpeza automática
-- =====================================================

-- 1. ATUALIZAR TABELA USERS (campos já existem, apenas garantindo)
-- Verificar se campos existem antes de adicionar
DO $$ 
BEGIN
    -- Verificar se last_login existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Verificar se is_active existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
    END IF;
END $$;

-- 2. CRIAR TABELA SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Foreign key constraint
    CONSTRAINT fk_sessions_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- Índice em sessions.token para busca rápida
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Índice em sessions.user_id
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 4. FUNÇÃO PARA ATUALIZAR LAST_LOGIN AUTOMATICAMENTE
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

-- 6. TRIGGER PARA ATUALIZAR LAST_LOGIN
DROP TRIGGER IF EXISTS trigger_update_last_login ON sessions;
CREATE TRIGGER trigger_update_last_login
    AFTER INSERT ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_login();

-- 6. FUNÇÃO PARA VALIDAR SESSÃO
CREATE OR REPLACE FUNCTION validate_session(session_token VARCHAR(255))
RETURNS TABLE(
    user_id BIGINT,
    email VARCHAR(150),
    name VARCHAR(100),
    profile VARCHAR(50),
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.name,
        u.profile,
        u.is_active
    FROM sessions s
    INNER JOIN users u ON s.user_id = u.id
    WHERE s.token = session_token
      AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA CRIAR NOVA SESSÃO
CREATE OR REPLACE FUNCTION create_session(
    p_user_id BIGINT,
    p_token VARCHAR(255),
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    session_id BIGINT;
BEGIN
    -- Inserir nova sessão (sem expiração)
    INSERT INTO sessions (
        user_id, 
        token, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id,
        p_token,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNÇÃO PARA LOGOUT (INVALIDAR SESSÃO)
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

-- 9. FUNÇÃO PARA LOGOUT DE TODAS AS SESSÕES DO USUÁRIO
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

-- 10. ROW LEVEL SECURITY PARA SESSIONS
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

-- 11. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE sessions IS 'Tabela de sessões ativas do sistema (sem expiração)';
COMMENT ON COLUMN sessions.id IS 'Identificador único da sessão';
COMMENT ON COLUMN sessions.user_id IS 'ID do usuário proprietário da sessão';
COMMENT ON COLUMN sessions.token IS 'Token único da sessão';
COMMENT ON COLUMN sessions.created_at IS 'Data e hora de criação da sessão';
COMMENT ON COLUMN sessions.ip_address IS 'Endereço IP do cliente';
COMMENT ON COLUMN sessions.user_agent IS 'User agent do navegador';

-- 12. INSERIR DADOS DE EXEMPLO (OPCIONAL - APENAS PARA DESENVOLVIMENTO)
-- Descomentar apenas se necessário para testes
/*
-- Exemplo de sessão para usuário ID 1
INSERT INTO sessions (user_id, token, ip_address, user_agent)
VALUES (
    1,
    'example_token_' || extract(epoch from now())::text,
    '127.0.0.1',
    'Mozilla/5.0 (Test Browser)'
);
*/

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Verificar se tudo foi criado corretamente
DO $$
BEGIN
    RAISE NOTICE 'Migração concluída com sucesso!';
    RAISE NOTICE 'Tabela sessions criada com % colunas', (
        SELECT count(*) FROM information_schema.columns 
        WHERE table_name = 'sessions'
    );
    RAISE NOTICE 'Índices criados: idx_sessions_token, idx_sessions_user_id';
    RAISE NOTICE 'Funções criadas: update_last_login, validate_session, create_session, logout_session, logout_all_sessions';
    RAISE NOTICE 'RLS habilitado na tabela sessions';
    RAISE NOTICE 'IMPORTANTE: Sessões não expiram automaticamente - usuários permanecem sempre conectados';
END $$;