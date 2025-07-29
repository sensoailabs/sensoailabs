# API REST - Sistema de Autenticação

## Endpoint de Cadastro

### POST /api/auth/register

**URL Completa:** `https://kdpdpcwjdkcbuvjksokd.supabase.co/functions/v1/register`

#### Request Body
```json
{
  "name": "string (required)",
  "email": "string (required, @sensoramadesign.com.br)",
  "password": "string (required, min 8 chars + critérios)",
  "confirmPassword": "string (required, match password)"
}
```

#### Validações Backend
- ✅ Verificar se e-mail já existe
- ✅ Validar domínio @sensoramadesign.com.br
- ✅ Validar critérios de senha:
  - Mínimo 8 caracteres
  - 1 letra maiúscula
  - 1 letra minúscula
  - 1 número
  - 1 caractere especial
- ✅ Criptografar senha antes de salvar (SHA-256)

#### Responses

**201 - Sucesso**
```json
{
  "message": "Usuário cadastrado com sucesso",
  "userId": 123
}
```

**400 - Dados Inválidos**
```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "field": "email",
      "message": "E-mail deve ser do domínio @sensoramadesign.com.br"
    },
    {
      "field": "password",
      "message": "Senha deve ter pelo menos 8 caracteres"
    }
  ]
}
```

**409 - E-mail Já Cadastrado**
```json
{
  "error": "E-mail já cadastrado"
}
```

**500 - Erro Interno**
```json
{
  "error": "Erro interno do servidor"
}
```

## Integração Frontend

### Serviço de Autenticação
Arquivo: `src/services/authService.ts`

```typescript
import { registerUser, getErrorMessage, getFieldErrors } from '../services/authService';

// Exemplo de uso
try {
  const response = await registerUser({
    name: "João Silva",
    email: "joao.silva@sensoramadesign.com.br",
    password: "MinhaSenh@123",
    confirmPassword: "MinhaSenh@123"
  });
  
  console.log(response.message); // "Usuário cadastrado com sucesso"
  console.log(response.userId);  // 123
  
} catch (error) {
  if (error.status === 400) {
    const fieldErrors = getFieldErrors(error);
    // Tratar erros específicos por campo
  } else if (error.status === 409) {
    // E-mail já cadastrado
  } else {
    // Erro interno
  }
}
```

### Configuração de Ambiente
Arquivo: `.env`
```
VITE_SUPABASE_URL=https://kdpdpcwjdkcbuvjksokd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Funcionalidades Implementadas

### ✅ Backend (Edge Function)
- Validação completa de dados
- Verificação de e-mail duplicado
- Criptografia de senha
- Tratamento de erros específicos
- CORS configurado
- Integração com banco PostgreSQL

### ✅ Frontend (React + TypeScript)
- Formulário de cadastro responsivo
- Validações em tempo real
- Integração com API real
- Tratamento de erros da API
- Feedback visual para usuário
- Estados de loading
- Redirecionamento após sucesso

### ✅ Segurança
- Validação de domínio corporativo
- Critérios rigorosos de senha
- Criptografia SHA-256
- Sanitização de dados
- Prevenção de SQL injection
- CORS configurado

## Testes Realizados

### ✅ Validações
- E-mail fora do domínio: ❌ Rejeitado
- Senha fraca: ❌ Rejeitado
- Senhas não coincidem: ❌ Rejeitado
- Dados válidos: ✅ Aceito

### ✅ Banco de Dados
- Inserção de usuário: ✅ Funcionando
- Verificação de duplicatas: ✅ Funcionando
- Triggers automáticos: ✅ Funcionando

### ✅ API
- Edge Function deployada: ✅ Ativa
- CORS funcionando: ✅ Configurado
- Responses corretas: ✅ Implementadas

## Próximos Passos

1. **Implementar autenticação JWT**
2. **Criar endpoint de login**
3. **Adicionar recuperação de senha**
4. **Implementar middleware de autenticação**
5. **Adicionar logs de auditoria**