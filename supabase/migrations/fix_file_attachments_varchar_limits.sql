-- Aumentar limites dos campos varchar na tabela file_attachments
-- Corrige erro: "value too long for type character varying(50)"

-- Aumentar limite do campo file_name para 255 caracteres
ALTER TABLE file_attachments 
ALTER COLUMN file_name TYPE character varying(255);

-- Aumentar limite do campo file_type para 100 caracteres
ALTER TABLE file_attachments 
ALTER COLUMN file_type TYPE character varying(100);

-- Aumentar limite do campo original_name para 255 caracteres
ALTER TABLE file_attachments 
ALTER COLUMN original_name TYPE character varying(255);

-- Aumentar limite do campo mime_type para 100 caracteres
ALTER TABLE file_attachments 
ALTER COLUMN mime_type TYPE character varying(100);

-- Comentários atualizados
COMMENT ON COLUMN file_attachments.file_name IS 'Nome original do arquivo (até 255 caracteres)';
COMMENT ON COLUMN file_attachments.file_type IS 'Tipo MIME do arquivo (até 100 caracteres)';
COMMENT ON COLUMN file_attachments.original_name IS 'Nome original preservado (até 255 caracteres)';
COMMENT ON COLUMN file_attachments.mime_type IS 'Tipo MIME completo (até 100 caracteres)';