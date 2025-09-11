-- =====================================================
-- Migração: Configurar políticas RLS para file_attachments
-- Data: 2025-01-10
-- Descrição: Configurar políticas de segurança RLS para isolamento por usuário
-- =====================================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can insert their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can update their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can delete their own file attachments" ON file_attachments;

-- Política para SELECT: usuários podem ver apenas seus próprios anexos
CREATE POLICY "Users can view their own file attachments" ON file_attachments
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT c.user_id 
            FROM conversations c 
            WHERE c.id = file_attachments.conversation_id
        )
    );

-- Política para INSERT: usuários podem inserir anexos apenas em suas conversas
CREATE POLICY "Users can insert their own file attachments" ON file_attachments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.uid() IN (
            SELECT c.user_id 
            FROM conversations c 
            WHERE c.id = file_attachments.conversation_id
        )
    );

-- Política para UPDATE: usuários podem atualizar apenas seus próprios anexos
CREATE POLICY "Users can update their own file attachments" ON file_attachments
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

-- Política para DELETE: usuários podem deletar apenas seus próprios anexos
CREATE POLICY "Users can delete their own file attachments" ON file_attachments
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Garantir que RLS está habilitado
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- Conceder permissões básicas aos roles
GRANT SELECT, INSERT, UPDATE, DELETE ON file_attachments TO authenticated;
GRANT SELECT ON file_attachments TO anon;

-- Verificar se as políticas foram criadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'file_attachments'
ORDER BY policyname;

-- Comentários para documentação
COMMENT ON POLICY "Users can view their own file attachments" ON file_attachments IS 
'Permite que usuários vejam apenas seus próprios anexos ou anexos de conversas que participam';

COMMENT ON POLICY "Users can insert their own file attachments" ON file_attachments IS 
'Permite que usuários insiram anexos apenas em suas próprias conversas';

COMMENT ON POLICY "Users can update their own file attachments" ON file_attachments IS 
'Permite que usuários atualizem apenas seus próprios anexos';

COMMENT ON POLICY "Users can delete their own file attachments" ON file_attachments IS 
'Permite que usuários deletem apenas seus próprios anexos';