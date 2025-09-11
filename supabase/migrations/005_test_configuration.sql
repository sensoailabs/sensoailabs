-- =====================================================
-- Teste: Verificar configuração multimodal
-- Data: 2025-01-10
-- Descrição: Testar se as configurações foram aplicadas corretamente
-- =====================================================

-- 1. Verificar modelos com suporte multimodal
SELECT 
    model_name,
    display_name,
    provider,
    supports_files,
    supported_file_types->>'max_file_size' as max_file_size,
    supported_file_types->>'max_files_per_message' as max_files_per_message,
    is_active
FROM model_configurations 
WHERE supports_files = true
ORDER BY provider, model_name;

-- 2. Verificar políticas RLS da tabela file_attachments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'file_attachments'
ORDER BY policyname;

-- 3. Verificar permissões da tabela file_attachments
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'file_attachments'
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 4. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'file_attachments';

-- 5. Verificar estrutura da tabela file_attachments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'file_attachments'
ORDER BY ordinal_position;

-- Comentário de resultado esperado
-- Esperamos ver:
-- - Pelo menos 3 modelos com supports_files = true
-- - 4 políticas RLS ativas para file_attachments
-- - Permissões para anon (SELECT) e authenticated (ALL)
-- - RLS habilitado (rowsecurity = true)
-- - Estrutura completa da tabela com todos os campos necessários