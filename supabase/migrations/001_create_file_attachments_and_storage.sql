-- Migração: Configuração de Storage e Tabela file_attachments
-- Data: $(date +%Y-%m-%d)
-- Descrição: Implementa funcionalidade multimodal com Storage e metadados de arquivos

-- =====================================================
-- 1. CONFIGURAÇÃO DO SUPABASE STORAGE
-- =====================================================

-- Criar bucket para arquivos do chat
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-files',
    'chat-files',
    true,
    10485760, -- 10MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
);

-- =====================================================
-- 2. POLÍTICAS RLS PARA O BUCKET
-- =====================================================

-- Política para upload (usuários podem fazer upload de seus próprios arquivos)
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para visualização (usuários podem ver seus próprios arquivos)
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
    bucket_id = 'chat-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para exclusão (usuários podem deletar seus próprios arquivos)
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'chat-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 3. CRIAÇÃO DA TABELA file_attachments
-- =====================================================

-- Criar tabela de anexos
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_file_attachments_message_id ON file_attachments(message_id);
CREATE INDEX idx_file_attachments_user_id ON file_attachments(user_id);
CREATE INDEX idx_file_attachments_created_at ON file_attachments(created_at DESC);
CREATE INDEX idx_file_attachments_file_type ON file_attachments(file_type);

-- =====================================================
-- 5. TRIGGER PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_file_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_file_attachments_updated_at();

-- =====================================================
-- 6. POLÍTICAS RLS PARA file_attachments
-- =====================================================

-- Habilitar RLS
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- Política para inserção (usuários autenticados podem inserir seus próprios arquivos)
CREATE POLICY "Users can insert their own file attachments" ON file_attachments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para seleção (usuários podem ver seus próprios arquivos)
CREATE POLICY "Users can view their own file attachments" ON file_attachments
FOR SELECT USING (auth.uid() = user_id);

-- Política para atualização (usuários podem atualizar seus próprios arquivos)
CREATE POLICY "Users can update their own file attachments" ON file_attachments
FOR UPDATE USING (auth.uid() = user_id);

-- Política para exclusão (usuários podem deletar seus próprios arquivos)
CREATE POLICY "Users can delete their own file attachments" ON file_attachments
FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. PERMISSÕES PARA ROLES
-- =====================================================

-- Conceder permissões para role anon (usuários não autenticados - apenas leitura limitada)
GRANT SELECT ON file_attachments TO anon;

-- Conceder permissões completas para role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON file_attachments TO authenticated;

-- =====================================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE file_attachments IS 'Tabela para armazenar metadados de arquivos anexados às mensagens do chat';
COMMENT ON COLUMN file_attachments.id IS 'Identificador único do anexo';
COMMENT ON COLUMN file_attachments.message_id IS 'Referência à mensagem que contém este anexo';
COMMENT ON COLUMN file_attachments.user_id IS 'Referência ao usuário que fez o upload';
COMMENT ON COLUMN file_attachments.file_name IS 'Nome do arquivo no storage (único)';
COMMENT ON COLUMN file_attachments.original_name IS 'Nome original do arquivo enviado pelo usuário';
COMMENT ON COLUMN file_attachments.file_type IS 'Categoria do arquivo (image, document, etc.)';
COMMENT ON COLUMN file_attachments.mime_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN file_attachments.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN file_attachments.file_url IS 'URL pública para acesso ao arquivo';
COMMENT ON COLUMN file_attachments.storage_path IS 'Caminho do arquivo no Supabase Storage';