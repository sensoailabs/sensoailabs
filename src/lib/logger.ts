import winston from 'winston';

// Configuração do logger Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'senso-chat' },
  transports: [
    // Arquivo de erro
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Arquivo combinado
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Se não estiver em produção, também log no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;

// Tipos para estruturação de logs
export interface LogContext {
  userId?: string;
  conversationId?: string;
  messageId?: string;
  model?: string;
  action?: string;
  duration?: number;
  tokenCount?: number;
  error?: Error;
}

// Funções auxiliares para logs estruturados
export const logApiCall = (context: LogContext & { success: boolean }) => {
  const { success, ...logData } = context;
  if (success) {
    logger.info('API call successful', logData);
  } else {
    logger.error('API call failed', logData);
  }
};

export const logUserAction = (action: string, context: LogContext) => {
  logger.info('User action', { action, ...context });
};

export const logSystemEvent = (event: string, context: LogContext) => {
  logger.info('System event', { event, ...context });
};