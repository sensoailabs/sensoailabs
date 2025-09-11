-- =====================================================
-- Migração: Atualizar modelos para suporte multimodal
-- Data: 2025-01-10
-- Descrição: Configurar suporte a arquivos e tipos permitidos para modelos de IA
-- =====================================================

-- Atualizar GPT-4o para suporte multimodal
UPDATE model_configurations 
SET 
    supports_files = true,
    supported_file_types = '{
        "images": ["image/jpeg", "image/png", "image/gif", "image/webp"],
        "documents": ["application/pdf", "text/plain", "text/markdown"],
        "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css"],
        "max_file_size": 10485760,
        "max_files_per_message": 5
    }'::jsonb,
    updated_at = now()
WHERE model_name ILIKE '%gpt-4o%' OR model_name ILIKE '%gpt-4-vision%';

-- Atualizar Claude 3.5 Sonnet para suporte multimodal
UPDATE model_configurations 
SET 
    supports_files = true,
    supported_file_types = '{
        "images": ["image/jpeg", "image/png", "image/gif", "image/webp"],
        "documents": ["application/pdf", "text/plain", "text/markdown"],
        "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css"],
        "max_file_size": 10485760,
        "max_files_per_message": 5
    }'::jsonb,
    updated_at = now()
WHERE model_name ILIKE '%claude-3.5%' OR model_name ILIKE '%claude-3-5%';

-- Atualizar Gemini 2.0 para suporte multimodal
UPDATE model_configurations 
SET 
    supports_files = true,
    supported_file_types = '{
        "images": ["image/jpeg", "image/png", "image/gif", "image/webp"],
        "documents": ["application/pdf", "text/plain", "text/markdown"],
        "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css"],
        "max_file_size": 10485760,
        "max_files_per_message": 3
    }'::jsonb,
    updated_at = now()
WHERE model_name ILIKE '%gemini-2%' OR model_name ILIKE '%gemini-pro%';

-- Inserir GPT-4o se não existir
INSERT INTO model_configurations (
    model_name, display_name, provider, api_endpoint, max_tokens, 
    supports_files, supported_file_types, is_active, is_default
)
SELECT 
    'gpt-4o', 'GPT-4o (Multimodal)', 'openai', 'https://api.openai.com/v1/chat/completions', 4096,
    true, '{"images": ["image/jpeg", "image/png", "image/gif", "image/webp"], "documents": ["application/pdf", "text/plain", "text/markdown"], "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css"], "max_file_size": 10485760, "max_files_per_message": 5}'::jsonb,
    true, false
WHERE NOT EXISTS (SELECT 1 FROM model_configurations WHERE model_name = 'gpt-4o');

-- Inserir Claude 3.5 Sonnet se não existir
INSERT INTO model_configurations (
    model_name, display_name, provider, api_endpoint, max_tokens, 
    supports_files, supported_file_types, is_active, is_default
)
SELECT 
    'claude-3-5-sonnet', 'Claude 3.5 Sonnet (Multimodal)', 'anthropic', 'https://api.anthropic.com/v1/messages', 4096,
    true, '{"images": ["image/jpeg", "image/png", "image/gif", "image/webp"], "documents": ["application/pdf", "text/plain", "text/markdown"], "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css"], "max_file_size": 10485760, "max_files_per_message": 5}'::jsonb,
    true, false
WHERE NOT EXISTS (SELECT 1 FROM model_configurations WHERE model_name = 'claude-3-5-sonnet');

-- Inserir Gemini 2.0 Flash se não existir
INSERT INTO model_configurations (
    model_name, display_name, provider, api_endpoint, max_tokens, 
    supports_files, supported_file_types, is_active, is_default
)
SELECT 
    'gemini-2.0-flash', 'Gemini 2.0 Flash (Multimodal)', 'google', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', 8192,
    true, '{"images": ["image/jpeg", "image/png", "image/gif", "image/webp"], "documents": ["application/pdf", "text/plain", "text/markdown"], "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css"], "max_file_size": 10485760, "max_files_per_message": 3}'::jsonb,
    true, false
WHERE NOT EXISTS (SELECT 1 FROM model_configurations WHERE model_name = 'gemini-2.0-flash');

-- Verificar os modelos atualizados
SELECT 
    model_name,
    display_name,
    provider,
    supports_files,
    supported_file_types,
    is_active
FROM model_configurations 
WHERE supports_files = true
ORDER BY provider, model_name;

-- Comentários para documentação
COMMENT ON COLUMN model_configurations.supports_files IS 
'Indica se o modelo suporta processamento de arquivos (multimodal)';

COMMENT ON COLUMN model_configurations.supported_file_types IS 
'Configuração JSON dos tipos de arquivo suportados, limites de tamanho e quantidade máxima por