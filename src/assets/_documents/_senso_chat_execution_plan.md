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

2. **Implementação da estrutura base de dados**
   - Criação das migrations Prisma para usuários, conversas e mensagens
   - Configuração de Row Level Security (RLS) no Supabase
   - Setup de índices para performance

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
8. **Expansão do schema de banco**
   - Refinamento das tabelas de conversas e mensagens
   - Implementação de soft delete para conversas
   - Configuração de backup automático

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
13. **Sistema de upload para Supabase Storage**
    - Configuração de buckets seguros
    - Validação de tipos de arquivo
    - Integração com botão de upload do frontend

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
18. **Estrutura de projetos**
    - Implementação das tabelas de projetos
    - Interface de criação e edição
    - Sistema de cores e ícones

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

24. **Monitoramento e Logs**
    - Implementação de métricas de performance
    - Logs estruturados para debugging
    - Alertas para falhas críticas

25. **Segurança e Compliance**
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
  - **Funcionalidade multimodal** totalmente implementada e testada
  - **[MCP]** Sistema de arquivos simplificado e Supabase Storage configurado  
  - **[MCP]** Integração funcional com GPT-4o, Claude 3.5 Sonnet e Gemini 2.0 Flash
  - **Upload direto** e processamento multimodal sem falhas
  - **Sistema de fallback** entre modelos multimodais operacional

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