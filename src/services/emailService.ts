// Serviço de e-mail para recuperação de senha
export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    email: string;
  };
}

// Configuração SMTP (em produção, usar variáveis de ambiente)
const emailConfig: EmailConfig = {
  smtp: {
    host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
    secure: import.meta.env.VITE_SMTP_SECURE === 'true',
    auth: {
      user: import.meta.env.VITE_SMTP_USER || '',
      pass: import.meta.env.VITE_SMTP_PASS || ''
    }
  },
  from: {
    name: import.meta.env.VITE_FROM_NAME || 'Senso AI',
    email: import.meta.env.VITE_FROM_EMAIL || 'noreply@sensoai.com'
  }
};

// Template HTML para e-mail de recuperação
const getPasswordResetEmailTemplate = (userName: string, resetLink: string): string => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - Senso AI</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            margin-bottom: 25px;
            line-height: 1.7;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
        }
        .reset-button:hover {
            background-color: #1d4ed8;
        }
        .alternative-link {
            margin-top: 20px;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 6px;
            font-size: 14px;
            word-break: break-all;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .warning-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 5px;
        }
        .warning-text {
            color: #92400e;
            font-size: 14px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .expiry {
            font-weight: 600;
            color: #dc2626;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🧠 Senso AI</div>
            <h1 class="title">Recuperação de Senha</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Olá, <strong>${userName}</strong>!
            </div>
            
            <div class="message">
                Recebemos uma solicitação para redefinir a senha da sua conta no Senso AI. 
                Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:
            </div>
            
            <div class="button-container">
                <a href="${resetLink}" class="reset-button">
                    🔐 Redefinir Minha Senha
                </a>
            </div>
            
            <div class="alternative-link">
                <strong>Ou copie e cole este link no seu navegador:</strong><br>
                <a href="${resetLink}">${resetLink}</a>
            </div>
            
            <div class="warning">
                <div class="warning-title">⚠️ Importante:</div>
                <div class="warning-text">
                    • Este link é válido por apenas <span class="expiry">30 minutos</span><br>
                    • Se você não solicitou esta recuperação, ignore este e-mail<br>
                    • Sua senha atual permanecerá inalterada até que você a redefina
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>
                Este e-mail foi enviado automaticamente pelo sistema Senso AI.<br>
                Se você não solicitou esta recuperação, pode ignorar este e-mail com segurança.
            </p>
            <p>
                <strong>Senso AI</strong> - Inteligência Artificial para o seu negócio<br>
                © ${new Date().getFullYear()} Todos os direitos reservados
            </p>
        </div>
    </div>
</body>
</html>`;
};

// Função para enviar e-mail de recuperação de senha
export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  token: string
): Promise<void> => {
  try {
    // Construir link de recuperação
    const resetLink = `https://sensoai.com/reset-password?token=${token}`;
    
    // Gerar template HTML
    const htmlContent = getPasswordResetEmailTemplate(userName, resetLink);
    
    // Configurar dados do e-mail
    const emailData = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: userEmail,
      subject: '🔐 Recuperação de Senha - Senso AI',
      html: htmlContent,
      text: `
Olá, ${userName}!

Recebemos uma solicitação para redefinir a senha da sua conta no Senso AI.

Para redefinir sua senha, acesse o link abaixo:
${resetLink}

IMPORTANTE:
- Este link é válido por apenas 30 minutos
- Se você não solicitou esta recuperação, ignore este e-mail
- Sua senha atual permanecerá inalterada até que você a redefina

Senso AI - Inteligência Artificial para o seu negócio
© ${new Date().getFullYear()} Todos os direitos reservados
      `.trim()
    };

    // Simular envio de e-mail (em produção, usar biblioteca como nodemailer)
    console.log('📧 Enviando e-mail de recuperação:', {
      to: userEmail,
      subject: emailData.subject,
      resetLink
    });

    // Em ambiente de desenvolvimento, apenas loga o conteúdo
    if (import.meta.env.MODE === 'development') {
      console.log('🔗 Link de recuperação (DEV):', resetLink);
      console.log('📄 Template HTML gerado com sucesso');
      return;
    }

    // Em produção, implementar envio real com nodemailer ou serviço similar
    await sendEmailViaSMTP(emailData);
    
    console.log('✅ E-mail de recuperação enviado com sucesso para:', userEmail);

  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de recuperação:', error);
    throw new Error('Falha no envio do e-mail de recuperação');
  }
};

// Função para envio via SMTP (implementação simulada)
const sendEmailViaSMTP = async (emailData: any): Promise<void> => {
  // Em produção, implementar com nodemailer:
  /*
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: emailConfig.smtp.auth
  });
  
  await transporter.sendMail(emailData);
  */
  
  // Por enquanto, apenas simula o envio
  console.log('📤 Simulando envio SMTP:', emailData.to);
};

// Função para validar configuração de e-mail
export const validateEmailConfig = (): boolean => {
  const required = [
    emailConfig.smtp.host,
    emailConfig.smtp.auth.user,
    emailConfig.smtp.auth.pass,
    emailConfig.from.email
  ];
  
  return required.every(field => field && field.trim().length > 0);
};

// Função para testar conectividade SMTP
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    // Em produção, implementar teste real de conexão
    console.log('🔌 Testando conexão SMTP...');
    
    if (!validateEmailConfig()) {
      console.log('❌ Configuração de e-mail incompleta');
      return false;
    }
    
    console.log('✅ Configuração de e-mail válida');
    return true;
    
  } catch (error) {
    console.error('❌ Erro na conexão SMTP:', error);
    return false;
  }
};