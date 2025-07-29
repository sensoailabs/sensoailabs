# APIs REST - Sistema de Recuperação de Senha

## Visão Geral
Sistema completo de recuperação de senha com APIs REST, integração com Supabase e serviço de e-mail.

## Endpoints Implementados

### 1. POST /api/auth/forgot-password

**Descrição:** Inicia o processo de recuperação de senha

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Processo:**
- ✅ Verificar se e-mail existe e usuário está ativo
- ✅ Gerar token seguro usando função `generate_secure_token()`
- ✅ Invalidar tokens anteriores do usuário via `cleanup_user_password_resets()`
- ✅ Salvar token com expiração de 30min via `create_password_reset_token()`
- ✅ Enviar e-mail com link de recuperação
- ✅ Sempre retornar sucesso (não revelar se e-mail existe)

**Response:**
```json
{
  "message": "Se o e-mail estiver cadastrado, você receberá instruções"
}
```

### 2. POST /api/auth/reset-password

**Descrição:** Redefine a senha do usuário

**Request Body:**
```json
{
  "token": "string (required)",
  "newPassword": "string (required, critérios de segurança)",
  "confirmPassword": "string (required, match newPassword)"
}
```

**Processo:**
- ✅ Validar token (existe, não expirado, não usado)
- ✅ Validar nova senha (critérios de segurança)
- ✅ Criptografar nova senha
- ✅ Atualizar senha do usuário
- ✅ Marcar token como usado
- ✅ Invalidar todas as sessões ativas do usuário

**Responses:**
```json
// Sucesso
{
  "message": "Senha redefinida com sucesso"
}

// Erro - Token inválido
{
  "error": "Token inválido ou expirado"
}

// Erro - Senha fraca
{
  "error": "Nova senha não atende aos critérios"
}

// Erro - Servidor
{
  "error": "Erro interno do servidor"
}
```

## Estrutura do Banco de Dados

### Tabela: password_resets
```sql
CREATE TABLE password_resets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Índices Criados:
- `idx_password_resets_token` - Busca rápida por token
- `idx_password_resets_user_id` - Busca por usuário
- `idx_password_resets_expires_at` - Limpeza de tokens expirados
- `idx_password_resets_is_used` - Filtro de tokens utilizados
- `idx_password_resets_created_at` - Ordenação temporal

### Funções do Banco:
- `generate_secure_token()` - Gera tokens criptograficamente seguros
- `create_password_reset_token(user_id)` - Cria novo token de recuperação
- `cleanup_password_resets()` - Remove tokens expirados e utilizados
- `cleanup_user_password_resets(user_id)` - Limpa tokens de usuário específico

### Triggers:
- `tr_cleanup_before_insert` - Limpeza automática antes de inserir novos tokens

## Serviço de E-mail

### Configuração SMTP:
```typescript
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}
```

### Template HTML:
- Design responsivo
- Link seguro: `https://sensoai.com/reset-password?token={token}`
- Instruções claras
- Tempo de expiração (30 minutos)

### Tratamento de Falhas:
- Logs detalhados
- Fallback para modo desenvolvimento
- Validação de configuração

## Integração Front-end

### Funções JavaScript:
- `requestPasswordReset(email)` - Solicita recuperação
- `resetUserPassword(token, newPassword, confirmPassword)` - Redefine senha
- `validateTokenFromURL()` - Valida token da URL
- `validatePasswordCriteria(password)` - Valida critérios de senha
- `redirectAfterSuccess()` - Redirecionamento automático
- `showFeedback()` - Feedback visual

### Páginas Atualizadas:
- `ForgotPasswordPage.tsx` - Formulário de solicitação
- `ResetPasswordPage.tsx` - Formulário de redefinição

### Validações Implementadas:
- ✅ Validação de e-mail
- ✅ Critérios de senha (8+ chars, maiúscula, minúscula, número, especial)
- ✅ Confirmação de senha
- ✅ Validação de token na URL
- ✅ Estados de carregamento
- ✅ Tratamento de erros
- ✅ Feedback visual

## Segurança Implementada

### Tokens:
- Geração criptograficamente segura
- Expiração automática (30 minutos)
- Uso único (marcados como utilizados)
- Limpeza automática

### Senhas:
- Critérios rigorosos de segurança
- Hash seguro antes do armazenamento
- Invalidação de sessões ativas

### Proteções:
- Rate limiting implícito (limpeza automática)
- Não revelação de existência de e-mails
- Validação server-side
- Logs de segurança

## Testes e Monitoramento

### Logs Implementados:
- ✅ Solicitações de recuperação
- ✅ Validações de token
- ✅ Redefinições de senha
- ✅ Erros de e-mail
- ✅ Falhas de validação

### Métricas Disponíveis:
- Tokens gerados vs utilizados
- Taxa de sucesso de e-mails
- Tempo de resposta das APIs
- Erros por tipo

## Status da Implementação

### ✅ Concluído:
- [x] Estrutura do banco de dados
- [x] Funções e triggers automáticos
- [x] Endpoints REST completos
- [x] Serviço de e-mail
- [x] Integração front-end
- [x] Validações de segurança
- [x] Tratamento de erros
- [x] Feedback visual
- [x] Documentação

### 🔄 Em Produção:
- Sistema rodando em `http://localhost:5175/`
- Banco integrado com Supabase
- APIs funcionais
- Interface responsiva

## Próximos Passos (Opcionais):

1. **Rate Limiting:** Implementar limitação de tentativas por IP
2. **Auditoria:** Log detalhado de todas as operações
3. **Notificações:** E-mail de confirmação após redefinição
4. **Analytics:** Dashboard de métricas de recuperação
5. **Testes:** Suite de testes automatizados