-- =====================================================
-- Migração: Atualizar modelos para suporte multimodal (Simplificada)
-- Data: 2025-01-10
-- Descrição: Configurar suporte a arquivos para modelos existentes
-- =====================================================

-- Atualizar todos os modelos GPT-4 para suporte multimodal
UPDATE model_configurations 
SET 
    supports_files = true,
    supported_file_types = '{"images": ["image/jpeg", "image/png", "image/gif", "image/webp"], "documents": ["application/pdf", "text/plain", "text/markdown"], "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css"], "max_file_size": 10485760, "max_files_per_message": 5}'::jsonb,
    updated_at = now()
WHERE model_name ILIKE '%gpt-4%';

-- Atualizar todos os modelos Claude para suporte multimodal
UPDATE model_configurations 
SET 
    supports_files = true,
    supported_file_types = '{"images": ["image/jpeg", "image/png", "image/gif", "image/webp"], "documents": ["application/pdf", "text/plain", "text/markdown"], "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css"], "max_file_size": 10485760, "max_files_per_message": 5}'::jsonb,
    updated_at = now()
WHERE model_name ILIKE '%claude%';

-- Atualizar todos os modelos Gemini para suporte multimodal
UPDATE model_configurations 
SET 
    supports_files = true,
    supported_file_types = '{"images": ["image/jpeg", "image/png", "image/gif", "image/webp"], "documents": ["application/pdf", "text/plain", "text/markdown"], "code": ["text/javascript", "text/typescript", "text/python", "text/html", "text/css"], "max_file_size": 10485760, "max_files_per_message": 3}'::jsonb,
    updated_at = now()
WHERE model_name ILIKE '%gemini%';

-- Verificar os resultados
SELECT model_name, display_name, supports_files FROM model_configurations WHERE supports_files = true;