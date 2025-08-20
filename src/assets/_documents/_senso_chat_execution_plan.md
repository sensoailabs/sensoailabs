---
id: plan-senso-chat-001
title: Senso Chat - Funcionalidade de Chat com IA
createdAt: 2025-08-20
author: SensoAI Labs Team
status: draft
---

## 🧩 Scope

Implementação completa da funcionalidade backend para o módulo Senso Chat, transformando o frontend existente em uma plataforma funcional de conversação com inteligência artificial. O projeto inclui:

- **Chat em tempo real** com múltiplos modelos de IA (GPT, Claude, Gemini)
- **Sistema de persistência** completo com histórico de conversas
- **Funcionalidade multimodal** para upload e processamento de arquivos (imagens, PDFs, documentos)
- **Organização por projetos** para agrupamento de conversas
- **Interface de streaming** com indicadores visuais de processamento
- **Sistema de fallback** automático entre modelos de IA
- **Configurações personalizáveis** por usuário

**Exclusões do escopo:**
- Integração com outras funcionalidades da plataforma SensoAI Labs
- Versão mobile (foco exclusivo em desktop)
- Gerenciamento de custos de APIs (implementação futura)
- Análise avançada de sentimentos ou dados (módulos separados)

## ✅ Functional Requirements

### FASE 1: Chat Básico com IA
- Conexão funcional com APIs OpenAI (GPT), Anthropic (Claude) e Google (Gemini)
- Seleção de modelo de IA via dropdown no frontend existente
- Sistema de streaming de respostas em tempo real
- Indicador visual "digitando" durante processamento da IA
- Fallback automático entre modelos em caso de falha
- Tratamento de erros com mensagens user-friendly

### FASE 2: Persistência e Histórico
- Estrutura completa de banco de dados no Supabase
- Salvamento automático de todas as conversas e mensagens
- Interface de histórico integrada à sidebar existente
- Funcionalidade "Novo Chat" para iniciar conversas limpas
- Geração automática de títulos para conversas
- Retomada de conversas anteriores com contexto completo

### FASE 3: Funcionalidade Multimodal
- Upload de arquivos (imagens: JPG/PNG/GIF/WebP, documentos: PDF/DOC/DOCX/TXT)
- Armazenamento seguro no Supabase Storage
- Processamento multimodal baseado nas capacidades de cada modelo
- Interface de upload integrada ao botão existente no frontend
- Visualização de arquivos anexados nas conversas
- Validação de tipos de arquivo suportados por modelo

### FASE 4: Organização por Projetos
- Sistema de criação e gerenciamento de projetos
- Agrupamento de conversas por projeto
- Interface de organização integrada à sidebar
- Filtros e busca por projeto
- Movimentação de conversas entre projetos

## ⚙️ Non-Functional Requirements

### Performance
- Tempo de resposta máximo de 5 segundos para chamadas de API
- Streaming de texto em tempo real (latência < 200ms)
- Interface otimizada para dispositivos desktop
- Suporte a conversas com até 100 mensagens sem degradação de performance
- Cache inteligente para reduzir chamadas desnecessárias à API

### Security
- Autenticação segura via Supabase Auth
- Criptografia de dados sensíveis em repouso
- Validação rigorosa de tipos de arquivo no upload
- Sanitização de inputs do usuário
- Isolamento de dados por usuário (Row Level Security)
- Logs de auditoria para ações críticas

### Scalability
- Arquitetura preparada para múltiplos usuários simultâneos
- Pool de conexões otimizado para o banco de dados
- Sistema de rate limiting para APIs externas
- Estrutura de dados indexada para consultas eficientes
- Possibilidade de implementação de cache distribuído (Redis)

### Reliability
- Uptime de 99.5% para o sistema
- Sistema de fallback entre modelos de IA (3 níveis)
- Backup automático de conversas críticas
- Monitoramento proativo de APIs externas
- Recuperação automática de falhas temporárias

## 📚 Guidelines & Packages

### Guidelines de Desenvolvimento
- **Código:** Seguir padrões ESLint/Prettier do projeto existente
- **Commits:** Conventional Commits para versionamento semântico
- **Branching:** GitFlow com feature branches por fase
- **Testing:** Cobertura mínima de 80% para funções críticas
- **Documentation:** JSDoc para funções públicas e complexas
- **Database:** Todas as alterações de banco via MCP do Supabase com versionamento

### Packages e Tecnologias
- **ORM:** Prisma Client (MIT License) - para interação com banco de dados
- **Database:** Supabase/PostgreSQL - banco principal e storage
- **MCP (Model Context Protocol):** Para execução segura de comandos SQL no Supabase
- **APIs:** 
  - OpenAI SDK (MIT License) - integração GPT
  - Anthropic SDK (MIT License) - integração Claude  
  - Google AI SDK (Apache 2.0) - integração Gemini
- **Real-time:** WebSockets ou Server-Sent Events - streaming de respostas
- **File Processing:**
  - multer (MIT License) - upload de arquivos
  - pdf-parse (MIT License) - extração de texto de PDFs
  - sharp (Apache 2.0) - processamento de imagens
- **Validation:** 
  - joi (BSD-3-Clause) - validação de schemas
  - file-type (MIT License) - detecção de tipos de arquivo
- **Monitoring:**
  - winston (MIT License) - logging estruturado
  - prometheus-client (Apache 2.0) - métricas de performance

### Stack de Infraestrutura
- **Backend:** Integração com stack existente do projeto
- **Database:** Supabase (PostgreSQL + Auth + Storage + MCP)
- **Deploy:** Conforme pipeline existente da SensoAI Labs
- **Monitoring:** Integração com ferramentas de observabilidade do projeto

### Workflow de Database via MCP
- **Todas as alterações** de banco serão executadas via MCP do Supabase
- **Versionamento** de schemas com controle de migração
- **Rollback** automático em caso de falhas
- **Backup** antes de cada alteração crítica
- **Validação** de sintaxe SQL antes da execução
- **Logs** detalhados de todas as operações de banco

## 🔐 Threat Model

### Ameaças de Segurança Identificadas

#### 1. Injection Attacks
- **SQL Injection:** Através de inputs maliciosos em mensagens
- **Prompt Injection:** Manipulação de prompts para IAs
- **Mitigação:** Sanitização rigorosa de inputs, uso de prepared statements, validação de prompts

#### 2. Data Exposure
- **Conversas Privadas:** Acesso não autorizado a conversas de outros usuários
- **Arquivos Sensíveis:** Vazamento de documentos confidenciais
- **Mitigação:** Row Level Security (RLS), criptografia de arquivos, auditoria de acessos

#### 3. API Abuse
- **Rate Limiting Bypass:** Sobrecarga das APIs de IA
- **API Key Exposure:** Vazamento de chaves de API
- **Mitigação:** Rate limiting por usuário, rotação de chaves, monitoramento de uso

#### 4. File Upload Vulnerabilities
- **Malware Upload:** Upload de arquivos maliciosos
- **Path Traversal:** Manipulação de caminhos de arquivo
- **Mitigação:** Validação rigorosa de tipos, sandbox para processamento, antivírus integrado

#### 5. Session Management
- **Session Hijacking:** Roubo de sessões de usuário
- **CSRF Attacks:** Falsificação de requisições
- **Mitigação:** Tokens seguros, CSRF tokens, rotação de sessões

## 🔢 Execution Plan

### **FASE 1: Chat Básico com IA (3-4 semanas)**

#### Sprint 1: Configuração Base (1 semana)
1. **Setup do ambiente de desenvolvimento**
   - Configuração do Prisma com Supabase
   - Setup das variáveis de ambiente para APIs
   - Configuração inicial de logging e monitoramento

2. **[MCP] Implementação da estrutura base de dados - Fase 1**
   ```sql
   -- ETAPA 1.1: Criação das tabelas principais
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255),
     avatar_url VARCHAR(500),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE conversations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title VARCHAR(255) NOT NULL,
     model_used VARCHAR(50) NOT NULL,
     is_active BOOLEAN DEFAULT true,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     project_id UUID, -- Para fase 4
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
     role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
     content TEXT NOT NULL,
     file_attachments JSONB,
     model_used VARCHAR(50),
     token_count INTEGER,
     processing_time FLOAT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

   - **[MCP] ETAPA 1.2: Configuração de índices de performance**
   ```sql
   -- Índices para otimização de queries
   CREATE INDEX idx_conversations_user_id ON conversations(user_id);
   CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
   CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
   CREATE INDEX idx_messages_created_at ON messages(created_at);
   CREATE INDEX idx_messages_role ON messages(role);
   ```

   - **[MCP] ETAPA 1.3: Row Level Security (RLS)**
   ```sql
   -- Habilitar RLS nas tabelas
   ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

   -- Políticas de segurança
   CREATE POLICY "Users can only access their own conversations" 
   ON conversations FOR ALL 
   USING (auth.uid() = user_id);

   CREATE POLICY "Users can only access messages from their conversations" 
   ON messages FOR ALL 
   USING (
     conversation_id IN (
       SELECT id FROM conversations WHERE user_id = auth.uid()
     )
   );
   ```

3. **Configuração das APIs de IA**
   - Integração com OpenAI SDK (GPT-4)
   - Integração com Anthropic SDK (Claude)
   - Integração com Google AI SDK (Gemini)
   - Implementação de rate limiting básico

#### Sprint 2: Chat Funcional (1 semana)
4. **Implementação do sistema de chat**
   - Endpoint para envio de mensagens
   - Sistema de streaming de respostas
   - Integração com seletor de modelo do frontend

5. **Sistema de fallback entre modelos**
   - Lógica de detecção de falhas de API
   - Implementação de fallback automático
   - Logs de monitoramento de falhas

#### Sprint 3: Interface e UX (1 semana)
6. **Indicadores visuais de estado**
   - Implementação de "digitando" via WebSocket/SSE
   - Estados de loading e processamento
   - Tratamento de erros na interface

7. **Testes e refinamentos**
   - Testes de integração com todas as APIs
   - Testes de performance e latência
   - Ajustes de UX baseados em feedback

### **FASE 2: Persistência e Histórico (2-3 semanas)**

#### Sprint 4: Estrutura de Dados (1 semana)
8. **[MCP] Expansão do schema de banco - Fase 2**
   ```sql
   -- ETAPA 2.1: Configurações do sistema
   CREATE TABLE model_configurations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     model_name VARCHAR(50) UNIQUE NOT NULL,
     display_name VARCHAR(100) NOT NULL,
     provider VARCHAR(50) NOT NULL,
     api_endpoint TEXT NOT NULL,
     max_tokens INTEGER NOT NULL,
     supports_files BOOLEAN DEFAULT false,
     supported_file_types JSONB,
     is_active BOOLEAN DEFAULT true,
     is_default BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- ETAPA 2.2: Logs de uso das APIs
   CREATE TABLE api_usage_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL,
     conversation_id UUID,
     message_id UUID,
     model_used VARCHAR(50) NOT NULL,
     request_type VARCHAR(20) NOT NULL,
     tokens_used INTEGER NOT NULL,
     response_time FLOAT NOT NULL,
     success BOOLEAN DEFAULT true,
     error_message TEXT,
     timestamp TIMESTAMP DEFAULT NOW()
   );

   -- ETAPA 2.3: Preferências do usuário
   CREATE TABLE user_preferences (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
     default_model VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
     auto_save_conversations BOOLEAN DEFAULT true,
     max_history_length INTEGER DEFAULT 50,
     enable_file_uploads BOOLEAN DEFAULT true,
     preferred_theme VARCHAR(20) DEFAULT 'light',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

   - **[MCP] ETAPA 2.4: Índices adicionais para performance**
   ```sql
   -- Índices para logs e configurações
   CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
   CREATE INDEX idx_api_usage_logs_model_used ON api_usage_logs(model_used);
   CREATE INDEX idx_api_usage_logs_timestamp ON api_usage_logs(timestamp DESC);
   CREATE INDEX idx_model_configurations_active ON model_configurations(is_active);
   CREATE INDEX idx_model_configurations_default ON model_configurations(is_default);
   ```

   - **[MCP] ETAPA 2.5: Triggers para auditoria e timestamps**
   ```sql
   -- Função para atualizar updated_at
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $ language 'plpgsql';

   -- Triggers para updated_at
   CREATE TRIGGER update_conversations_updated_at 
     BEFORE UPDATE ON conversations 
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

   CREATE TRIGGER update_users_updated_at 
     BEFORE UPDATE ON users 
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

   CREATE TRIGGER update_user_preferences_updated_at 
     BEFORE UPDATE ON user_preferences 
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
   ```

9. **Sistema de títulos automáticos**
   - Geração automática de títulos usando IA
   - Fallback para títulos baseados em timestamp
   - Interface de edição manual de títulos

#### Sprint 5: Interface de Histórico (1 semana)
10. **Integração com sidebar do frontend**
    - Lista de conversas ordenada por data
    - Busca e filtros no histórico
    - Paginação para performance

11. **Funcionalidade "Novo Chat"**
    - Criação de conversas vazias
    - Limpeza de contexto anterior
    - Integração com seletor de modelo

#### Sprint 6: Retomada de Conversas (1 semana)
12. **Sistema de contexto completo**
    - Carregamento de histórico completo
    - Manutenção de contexto para IA
    - Otimização de queries para conversas longas

### **FASE 3: Funcionalidade Multimodal (3-4 semanas)**

#### Sprint 7: Upload de Arquivos (1 semana)
13. **[MCP] Sistema de arquivos - Fase 3**
    ```sql
    -- ETAPA 3.1: Tabela de anexos de arquivos
    CREATE TABLE file_attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size BIGINT NOT NULL,
      file_path TEXT NOT NULL,
      file_url TEXT NOT NULL,
      image_metadata JSONB,
      document_pages INTEGER,
      uploaded_at TIMESTAMP DEFAULT NOW()
    );

    -- ETAPA 3.2: Índices para arquivos
    CREATE INDEX idx_file_attachments_user_id ON file_attachments(user_id);
    CREATE INDEX idx_file_attachments_conversation_id ON file_attachments(conversation_id);
    CREATE INDEX idx_file_attachments_message_id ON file_attachments(message_id);
    CREATE INDEX idx_file_attachments_file_type ON file_attachments(file_type);
    CREATE INDEX idx_file_attachments_uploaded_at ON file_attachments(uploaded_at DESC);

    -- ETAPA 3.3: RLS para arquivos
    CREATE POLICY "Users can only access their own files" 
    ON file_attachments FOR ALL 
    USING (auth.uid() = user_id);
    
    ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
    ```

    - **[MCP] ETAPA 3.4: Configuração do Supabase Storage**
    ```sql
    -- Criação do bucket para arquivos
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'senso-chat-files',
      'senso-chat-files',
      false,
      52428800, -- 50MB
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
            'application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain']
    );

    -- Políticas de storage
    CREATE POLICY "Users can upload their own files" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'senso-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can view their own files" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'senso-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can delete their own files" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'senso-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    ```

14. **Processamento de metadados**
    - Extração de informações de imagens
    - Contagem de páginas para PDFs
    - Geração de thumbnails para visualização

#### Sprint 8: Integração Multimodal (1-2 semanas)
15. **Processamento por modelo de IA**
    - Adaptação de prompts para incluir arquivos
    - Encoding correto para cada API
    - Tratamento de limitações por modelo

16. **Interface de visualização**
    - Preview de arquivos no chat
    - Download seguro de arquivos
    - Histórico de arquivos por conversa

#### Sprint 9: Otimização e Testes (1 semana)
17. **Performance e segurança**
    - Otimização de upload de arquivos grandes
    - Scanning de segurança para malware
    - Testes de stress com múltiplos arquivos

### **FASE 4: Organização por Projetos (2-3 semanas)**

#### Sprint 10: Sistema de Projetos (1 semana)
18. **[MCP] Estrutura de projetos - Fase 4**
    ```sql
    -- ETAPA 4.1: Tabela de projetos
    CREATE TABLE projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(7), -- Código hex da cor
      icon VARCHAR(50),
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- ETAPA 4.2: Atualizar tabela de conversas para suportar projetos
    -- (A coluna project_id já foi criada na Fase 1, agora criamos a foreign key)
    ALTER TABLE conversations 
    ADD CONSTRAINT fk_conversations_project_id 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

    -- ETAPA 4.3: Índices para projetos
    CREATE INDEX idx_projects_user_id ON projects(user_id);
    CREATE INDEX idx_projects_is_default ON projects(is_default);
    CREATE INDEX idx_conversations_project_id ON conversations(project_id);

    -- ETAPA 4.4: RLS para projetos
    CREATE POLICY "Users can only access their own projects" 
    ON projects FOR ALL 
    USING (auth.uid() = user_id);
    
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

    -- ETAPA 4.5: Trigger para updated_at em projetos
    CREATE TRIGGER update_projects_updated_at 
      BEFORE UPDATE ON projects 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ```

    - **[MCP] ETAPA 4.6: Dados iniciais do sistema**
    ```sql
    -- Inserir configurações padrão dos modelos
    INSERT INTO model_configurations (model_name, display_name, provider, api_endpoint, max_tokens, supports_files, supported_file_types, is_active, is_default) VALUES
    ('gpt-4', 'GPT-4', 'openai', 'https://api.openai.com/v1/chat/completions', 8192, true, '["image/jpeg", "image/png", "image/gif", "image/webp"]', true, true),
    ('claude-3-sonnet', 'Claude 3 Sonnet', 'anthropic', 'https://api.anthropic.com/v1/messages', 200000, true, '["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain"]', true, false),
    ('gemini-pro', 'Gemini Pro', 'google', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', 32768, true, '["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]', true, false);

    -- Função para criar projeto padrão para novos usuários
    CREATE OR REPLACE FUNCTION create_default_project_for_user()
    RETURNS TRIGGER AS $
    BEGIN
      INSERT INTO projects (user_id, name, description, is_default)
      VALUES (NEW.id, 'Projeto Padrão', 'Projeto criado automaticamente para organizar suas conversas', true);
      
      INSERT INTO user_preferences (user_id)
      VALUES (NEW.id);
      
      RETURN NEW;
    END;
    $ language 'plpgsql';

    -- Trigger para criar projeto padrão
    CREATE TRIGGER create_default_project_trigger
      AFTER INSERT ON users
      FOR EACH ROW EXECUTE FUNCTION create_default_project_for_user();
    ```

    - **[MCP] ETAPA 4.7: Views para relatórios e analytics**
    ```sql
    -- View para estatísticas de uso por usuário
    CREATE VIEW user_chat_statistics AS
    SELECT 
      u.id as user_id,
      u.email,
      COUNT(DISTINCT c.id) as total_conversations,
      COUNT(DISTINCT m.id) as total_messages,
      COUNT(DISTINCT p.id) as total_projects,
      COUNT(DISTINCT f.id) as total_files,
      SUM(COALESCE(m.token_count, 0)) as total_tokens_used,
      AVG(COALESCE(m.processing_time, 0)) as avg_response_time,
      MAX(c.updated_at) as last_activity
    FROM users u
    LEFT JOIN conversations c ON u.id = c.user_id
    LEFT JOIN messages m ON c.id = m.conversation_id
    LEFT JOIN projects p ON u.id = p.user_id
    LEFT JOIN file_attachments f ON u.id = f.user_id
    GROUP BY u.id, u.email;

    -- View para estatísticas de modelos
    CREATE VIEW model_usage_statistics AS
    SELECT 
      model_used,
      COUNT(*) as usage_count,
      AVG(processing_time) as avg_processing_time,
      SUM(token_count) as total_tokens,
      COUNT(CASE WHEN success = false THEN 1 END) as error_count
    FROM api_usage_logs
    GROUP BY model_used
    ORDER BY usage_count DESC;
    ```

19. **Agrupamento de conversas**
    - Associação de conversas a projetos
    - Migração de conversas existentes
    - Interface de movimentação entre projetos

#### Sprint 11: Interface Avançada (1 semana)
20. **Filtros e organização**
    - Filtros por projeto na sidebar
    - Busca avançada com múltiplos critérios
    - Ordenação personalizada

21. **Configurações de projeto**
    - Modelo padrão por projeto
    - Configurações específicas por projeto
    - Permissões e compartilhamento (preparação futura)

#### Sprint 12: Finalização e Deploy (1 semana)
22. **Testes finais e documentação**
    - Testes end-to-end de todos os fluxos
    - Documentação técnica completa
    - Guias de uso para usuários

23. **Deploy em produção**
    - Migração de dados de desenvolvimento
    - Configuração de monitoramento
    - Treinamento da equipe de suporte

### **Atividades Transversais (Durante todas as fases)**

24. **[MCP] Monitoramento e Logs - Database**
    ```sql
    -- ETAPA TRANSVERSAL 1: Tabela de eventos do sistema
    CREATE TABLE system_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type VARCHAR(50) NOT NULL,
      user_id UUID,
      conversation_id UUID,
      event_data JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX idx_system_events_type ON system_events(event_type);
    CREATE INDEX idx_system_events_user_id ON system_events(user_id);
    CREATE INDEX idx_system_events_created_at ON system_events(created_at DESC);

    -- ETAPA TRANSVERSAL 2: Função para logging automático
    CREATE OR REPLACE FUNCTION log_conversation_activity()
    RETURNS TRIGGER AS $
    BEGIN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO system_events (event_type, user_id, conversation_id, event_data)
        VALUES ('conversation_created', NEW.user_id, NEW.id, 
                json_build_object('model_used', NEW.model_used, 'title', NEW.title));
        RETURN NEW;
      ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO system_events (event_type, user_id, conversation_id, event_data)
        VALUES ('conversation_updated', NEW.user_id, NEW.id, 
                json_build_object('old_title', OLD.title, 'new_title', NEW.title));
        RETURN NEW;
      END IF;
      RETURN NULL;
    END;
    $ language 'plpgsql';

    CREATE TRIGGER log_conversation_activity_trigger
      AFTER INSERT OR UPDATE ON conversations
      FOR EACH ROW EXECUTE FUNCTION log_conversation_activity();
    ```

25. **[MCP] Segurança e Compliance - Database**
    ```sql
    -- ETAPA TRANSVERSAL 3: Auditoria de acesso a dados sensíveis
    CREATE TABLE audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      table_name VARCHAR(50) NOT NULL,
      operation VARCHAR(10) NOT NULL,
      user_id UUID,
      old_data JSONB,
      new_data JSONB,
      changed_at TIMESTAMP DEFAULT NOW()
    );

    -- Função genérica de auditoria
    CREATE OR REPLACE FUNCTION audit_trigger_function()
    RETURNS TRIGGER AS $
    BEGIN
      IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, user_id, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD));
        RETURN OLD;
      ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, user_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
      ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, user_id, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(NEW));
        RETURN NEW;
      END IF;
      RETURN NULL;
    END;
    $ language 'plpgsql';

    -- Aplicar auditoria nas tabelas sensíveis
    CREATE TRIGGER audit_conversations_trigger
      AFTER INSERT OR UPDATE OR DELETE ON conversations
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

    CREATE TRIGGER audit_file_attachments_trigger
      AFTER INSERT OR UPDATE OR DELETE ON file_attachments
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    ```

26. **[MCP] Performance e Otimização - Database**
    ```sql
    -- ETAPA TRANSVERSAL 4: Particionamento para logs (performance)
    CREATE TABLE api_usage_logs_partitioned (
      LIKE api_usage_logs INCLUDING ALL
    ) PARTITION BY RANGE (timestamp);

    -- Criar partições mensais
    CREATE TABLE api_usage_logs_2025_08 PARTITION OF api_usage_logs_partitioned
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

    -- Função para criar partições automaticamente
    CREATE OR REPLACE FUNCTION create_monthly_partition()
    RETURNS void AS $
    DECLARE
      start_date date;
      end_date date;
      partition_name text;
    BEGIN
      start_date := date_trunc('month', CURRENT_DATE + interval '1 month');
      end_date := start_date + interval '1 month';
      partition_name := 'api_usage_logs_' || to_char(start_date, 'YYYY_MM');
      
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF api_usage_logs_partitioned
                      FOR VALUES FROM (%L) TO (%L)',
                     partition_name, start_date, end_date);
    END;
    $ language 'plpgsql';

    -- ETAPA TRANSVERSAL 5: Limpeza automática de dados antigos
    CREATE OR REPLACE FUNCTION cleanup_old_data()
    RETURNS void AS $
    BEGIN
      -- Limpar logs de API antigos (> 6 meses)
      DELETE FROM api_usage_logs 
      WHERE timestamp < NOW() - INTERVAL '6 months';
      
      -- Limpar eventos de sistema antigos (> 3 meses)
      DELETE FROM system_events 
      WHERE created_at < NOW() - INTERVAL '3 months';
      
      -- Limpar logs de auditoria antigos (> 1 ano)
      DELETE FROM audit_log 
      WHERE changed_at < NOW() - INTERVAL '1 year';
    END;
    $ language 'plpgsql';

    -- Agendar limpeza automática (requires pg_cron extension)
    -- SELECT cron.schedule('cleanup-old-data', '0 2 1 * *', 'SELECT cleanup_old_data();');
    ```

24. **Monitoramento e Logs - Application**
    - Implementação de métricas de performance
    - Logs estruturados para debugging
    - Alertas para falhas críticas

25. **Segurança e Compliance - Application**
    - Revisões de segurança por sprint
    - Testes de penetração básicos
    - Documentação de conformidade

26. **Testes Automatizados**
    - Testes unitários para funções críticas
    - Testes de integração com APIs externas
    - Testes de performance e carga

### **Marcos de Entrega**

- **Marco 1 (Fim da Fase 1):** 
  - Chat básico funcional com todos os modelos
  - **[MCP]** Estrutura base de dados implementada (users, conversations, messages)
  - **[MCP]** RLS e índices de performance configurados

- **Marco 2 (Fim da Fase 2):** 
  - Persistência completa e histórico operacional  
  - **[MCP]** Sistema de logs e configurações implementado
  - **[MCP]** Triggers de auditoria e timestamps funcionando

- **Marco 3 (Fim da Fase 3):** 
  - Funcionalidade multimodal totalmente implementada
  - **[MCP]** Sistema de arquivos e Supabase Storage configurado
  - **[MCP]** Políticas de segurança para arquivos ativas

- **Marco 4 (Fim da Fase 4):** 
  - Sistema completo com organização por projetos
  - **[MCP]** Views de analytics e relatórios implementadas
  - **[MCP]** Sistema de limpeza automática de dados funcionando

**Timeline Total Estimado:** 10-14 semanas
**Equipe Recomendada:** 2-3 desenvolvedores full-stack + 1 DevOps + 1 QA + 1 DBA (para MCP)

---

## 🔄 **Workflow de Execução MCP**

### **Processo de Implementação de Database por Fase:**

#### **1. Preparação (Antes de cada Sprint)**
```bash
# Backup do estado atual
MCP: CREATE SCHEMA backup_YYYYMMDD AS SELECT * FROM information_schema.tables;

# Validação do ambiente
MCP: SELECT version(), current_database(), current_user;
```

#### **2. Execução (Durante o Sprint)**
```sql
-- Template de execução segura
BEGIN;
  -- Executar comandos SQL da etapa
  -- Validar resultados
  -- Logs de controle
COMMIT; -- ou ROLLBACK em caso de erro
```

#### **3. Validação (Após cada Etapa)**
```sql
-- Verificar integridade
SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public';

-- Verificar performance
EXPLAIN ANALYZE SELECT * FROM conversations WHERE user_id = 'test-uuid';

-- Verificar RLS
SET ROLE authenticated; -- Testar como usuário normal
```

#### **4. Documentação (Fim de cada Sprint)**
- Log de todas as operações MCP executadas
- Resultados de validação e performance
- Scripts de rollback para cada alteração
- Documentação de novas tabelas/campos

---

## 📊 **Controle de Qualidade Database**

### **Checklist por Fase:**

#### **FASE 1 - Checklist MCP:**
- [ ] Tabelas criadas com tipos corretos
- [ ] Relacionamentos (foreign keys) funcionando
- [ ] Índices de performance implementados
- [ ] RLS configurado e testado
- [ ] Backup realizado antes das alterações

#### **FASE 2 - Checklist MCP:**
- [ ] Triggers de timestamp funcionando
- [ ] Sistema de logs capturando eventos
- [ ] Preferências de usuário persistindo
- [ ] Performance mantida com novos índices

#### **FASE 3 - Checklist MCP:**
- [ ] Supabase Storage configurado
- [ ] Políticas de arquivo funcionando
- [ ] Metadados sendo salvos corretamente
- [ ] Integridade referencial mantida

#### **FASE 4 - Checklist MCP:**
- [ ] Sistema de projetos integrado
- [ ] Views de relatório funcionando
- [ ] Limpeza automática agendada
- [ ] Auditoria completa implementada

---

## 🚨 **Plano de Contingência Database**

### **Cenários de Rollback:**

#### **Falha Crítica durante MCP:**
```sql
-- Rollback imediato
ROLLBACK;

-- Restaurar de backup se necessário
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Restore from backup_YYYYMMDD
```

#### **Performance Degradada:**
```sql
-- Analisar queries lentas
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Otimizar índices
CREATE INDEX CONCURRENTLY idx_new_optimization ON table_name(column);
```

#### **Problema de RLS:**
```sql
-- Desabilitar temporariamente (emergency only)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Corrigir políticas
DROP POLICY policy_name ON table_name;
CREATE POLICY new_policy_name ON table_name ...;

-- Reabilitar
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

## 📈 **Monitoramento Database em Tempo Real**

### **Métricas a Acompanhar:**

#### **Performance:**
```sql
-- Query mais lentas
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
WHERE mean_time > 1000 -- > 1 segundo
ORDER BY mean_time DESC;

-- Tamanho das tabelas
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### **Segurança:**
```sql
-- Verificar RLS ativo
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public';

-- Logs de acesso suspeito
SELECT event_type, COUNT(*), MIN(created_at), MAX(created_at)
FROM system_events 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type
ORDER BY COUNT(*) DESC;
```

#### **Integridade:**
```sql
-- Verificar foreign keys órfãs
SELECT c.id, c.user_id, u.id as user_exists
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id
WHERE u.id IS NULL;

-- Verificar inconsistências de dados
SELECT conversation_id, COUNT(*) as message_count
FROM messages
GROUP BY conversation_id
HAVING COUNT(*) > 1000; -- Conversas muito longas
```