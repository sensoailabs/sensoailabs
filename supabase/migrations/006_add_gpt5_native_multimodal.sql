-- =====================================================
-- Migração: Adicionar GPT-5 com suporte multimodal nativo
-- Data: 2025-01-10
-- Descrição: Configurar GPT-5 com capacidades multimodais nativas otimizadas
-- =====================================================

-- Inserir ou atualizar GPT-5 com configuração multimodal nativa
INSERT INTO model_configurations (
    model_name,
    display_name,
    provider,
    api_endpoint,
    max_tokens,
    supports_files,
    supported_file_types,
    is_active,
    is_default
) VALUES (
    'gpt-5',
    'GPT-5 (Multimodal Nativo)',
    'openai',
    'https://api.openai.com/v1/chat/completions',
    200000,
    true,
    '{
        "images": ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff"],
        "documents": ["application/pdf", "text/plain", "text/markdown", "text/csv"],
        "office": ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
        "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css", "text/json", "text/xml"],
        "max_file_size": 52428800,
        "max_files_per_message": 20,
        "native_processing": true,
        "supports_batch_processing": true,
        "optimized_for_large_files": true
    }'::jsonb,
    true,
    false
)
ON CONFLICT (model_name) 
DO UPDATE SET
    display_name = EXCLUDED.display_name,
    supports_files = EXCLUDED.supports_files,
    supported_file_types = EXCLUDED.supported_file_types,
    max_tokens = EXCLUDED.max_tokens,
    updated_at = now();

-- Atualizar GPT-4o para indicar que não tem processamento nativo
UPDATE model_configurations 
SET 
    supported_file_types = jsonb_set(
        supported_file_types,
        '{native_processing}',
        'false'::jsonb
    ),
    updated_at = now()
WHERE model_name = 'gpt-4o';

-- Verificar configurações atualizadas
SELECT 
    model_name,
    display_name,
    provider,
    supports_files,
    supported_file_types->>'native_processing' as native_processing,
    supported_file_types->>'max_file_size' as max_file_size,
    supported_file_types->>'max_files_per_message' as max_files_per_message
FROM model_configurations 
WHERE model_name IN ('gpt-5', 'gpt-4o')
ORDER BY model_name;

-- Comentários para documentação
COMMENT ON TABLE model_configurations IS 
'Configurações dos modelos de IA com suporte a processamento multimodal nativo e fallback';

COMMENT ON COLUMN model_configurations.supported_file_types IS 
'Configuração JSON com tipos suportados, limites e flags de processamento nativo';