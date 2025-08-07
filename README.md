# Senso AI Labs - Sistema de Autenticação

Sistema de autenticação corporativo da Sensorama Design, desenvolvido com React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticação**: API REST personalizada
- **Controle de Versão**: Git + GitHub

## 📋 Funcionalidades

### ✅ Implementadas
- [x] Página de cadastro responsiva
- [x] Validações em tempo real
- [x] API REST para cadastro de usuários
- [x] Banco de dados PostgreSQL com RLS
- [x] Validação de domínio corporativo (@sensoramadesign.com.br)
- [x] Critérios rigorosos de segurança para senhas
- [x] Criptografia de senhas (SHA-256)
- [x] Tratamento de erros específicos
- [x] Estados de loading e feedback visual

### 🔄 Em Desenvolvimento
- [ ] Sistema de login
- [ ] Autenticação JWT
- [ ] Recuperação de senha
- [ ] Dashboard do usuário
- [ ] Gerenciamento de perfis

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase

### Configuração

1. **Clone o repositório**
```bash
git clone https://github.com/sensoailabs/sensoailabs.git
cd sensoailabs
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo .env.example para .env
cp .env.example .env

# Configure as variáveis do Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. **Execute o projeto**
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base do shadcn/ui
│   └── ui/
│
├── pages/
│   ├── LoginPage.tsx      # Página de login
│   ├── SignupPage.tsx     # Página de cadastro
│   ├── ForgotPasswordPage.tsx
│   └── ResetPasswordPage.tsx
├── services/           # Serviços e APIs
│   └── authService.ts  # Serviço de autenticação
├── lib/               # Utilitários
│   └── utils.ts       # Funções auxiliares
└── App.tsx            # Componente principal
```

## 🔐 API de Autenticação

### Endpoint de Cadastro
```
POST /functions/v1/register
```

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao.silva@sensoramadesign.com.br",
  "password": "MinhaSenh@123",
  "confirmPassword": "MinhaSenh@123"
}
```

**Responses:**
- `201`: Usuário cadastrado com sucesso
- `400`: Dados inválidos
- `409`: E-mail já cadastrado
- `500`: Erro interno do servidor

### Validações
- **E-mail**: Deve ser do domínio @sensoramadesign.com.br
- **Senha**: Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 especial
- **Duplicatas**: Verificação automática de e-mails existentes

## 🗄️ Banco de Dados

### Tabela Users
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  profile VARCHAR(50) DEFAULT 'user',
  photo_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### Segurança
- **RLS (Row Level Security)** habilitado
- **Políticas específicas** para usuários e administradores
- **Triggers automáticos** para updated_at
- **Validação de domínio** via constraint

## 🧪 Testes

```bash
# Executar testes unitários
npm run test

# Executar testes de integração
npm run test:integration

# Coverage
npm run test:coverage
```

## 📚 Documentação

- [API Documentation](./api-documentation.md)
- [Database Schema](./database-schema.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Commit
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 📄 Licença

Este projeto é propriedade da **Sensorama Design** e está sob licença privada.

## 👥 Equipe

- **Desenvolvimento**: Anderson Batista
- **Design**: Equipe Sensorama
- **Product Owner**: Sensorama Design

## 🔗 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)

---

**Sensorama Design** - Transformando ideias em experiências digitais excepcionais.
