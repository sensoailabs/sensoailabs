// Configuração das APIs de IA com fallback
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from './clientLogger';
import { userRateLimiter } from './rateLimiter';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Configuração robusta do PDF.js com verificação de compatibilidade
const configurePDFJS = () => {
  try {
    // Configurar worker do PDF.js usando URL dinâmica
    const workerUrl = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    
    // Log da configuração para debug
    logger.info('PDF.js configurado com sucesso:', {
      version: pdfjsLib.version,
      workerSrc: workerUrl,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    logger.error('Erro ao configurar PDF.js:', error);
    return false;
  }
};

// Inicializar configuração do PDF.js
const pdfConfigured = configurePDFJS();
if (!pdfConfigured) {
  logger.warn('PDF.js não foi configurado corretamente - processamento de PDF pode falhar');
}

// Tipos
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  files?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  base64?: string;
  file_object?: File;
}

export interface AIResponse {
  content: string;
  model: string;
  tokenCount?: number;
  processingTime: number;
}

export interface StreamResponse {
  content: string;
  isComplete: boolean;
  model: string;
}

// Função inteligente de fallback para conversão de arquivo
const convertFileWithFallback = async (fileAttachment: FileAttachment): Promise<string> => {
  const { file_object, url, name, type } = fileAttachment;
  
  logger.info('Starting file conversion with intelligent fallback:', { 
    hasFileObject: !!file_object, 
    hasUrl: !!url, 
    name, 
    type 
  });
  
  // Estratégia 1: Priorizar file_object se disponível (mais confiável)
  if (file_object) {
    try {
      logger.info('Attempting conversion via File object (Strategy 1)');
      const base64 = await convertFileObjectToBase64(file_object);
      logger.info('File conversion successful via File object');
      return base64;
    } catch (error) {
      logger.warn('File object conversion failed, trying URL fallback:', error);
    }
  }
  
  // Estratégia 2: Fallback para URL se file_object falhar ou não estiver disponível
  if (url) {
    try {
      logger.info('Attempting conversion via URL (Strategy 2):', { url });
      const base64 = await convertFileToBase64(url);
      logger.info('File conversion successful via URL');
      return base64;
    } catch (error) {
      logger.error('URL conversion also failed:', error);
      throw new Error(`Both file object and URL conversion failed. File: ${name}, URL: ${url}`);
    }
  }
  
  // Se chegou aqui, não há como converter o arquivo
  throw new Error(`No valid conversion method available for file: ${name}. Neither file_object nor url is available.`);
};

// Função utilitária para converter arquivo para base64
const convertFileToBase64 = async (url: string): Promise<string> => {
  try {
    logger.info('Converting file to base64:', { url });
    
    // Tentar fetch da URL primeiro
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'SensoAI-Chat/1.0'
        }
      });
      
      if (!response.ok) {
        const errorDetails = {
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          contentType: response.headers.get('content-type')
        };
        
        logger.error('Failed to fetch file from URL, URL may be invalid or inaccessible', errorDetails);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - URL: ${url}`);
      }
      
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      logger.info('File fetch successful, converting to base64', {
        url,
        contentType,
        contentLength
      });
      
      const blob = await response.blob();
      logger.info('File fetched successfully:', { size: blob.size, type: blob.type });
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove o prefixo data:mime/type;base64,
          const base64Data = base64.split(',')[1];
          logger.info('File converted to base64 successfully:', { 
            originalSize: blob.size, 
            base64Length: base64Data.length 
          });
          resolve(base64Data);
        };
        reader.onerror = (error) => {
          logger.error('FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (fetchError) {
      const errorDetails = {
        url,
        errorType: fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError,
        errorMessage: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : undefined
      };
      
      logger.error('Failed to fetch file from URL, URL may be invalid or inaccessible:', errorDetails);
      
      // Verificar se é um erro específico do Supabase ou CORS
      if (fetchError instanceof Error) {
        if (fetchError.message.includes('CORS') || fetchError.message.includes('cors')) {
          throw new Error(`CORS error accessing file at URL: ${url}. This may be a browser security restriction.`);
        }
        if (fetchError.message.includes('404') || fetchError.message.includes('Not Found')) {
          throw new Error(`File not found at URL: ${url}. The file may have been deleted or moved.`);
        }
        if (fetchError.message.includes('403') || fetchError.message.includes('Forbidden')) {
          throw new Error(`Access denied to file at URL: ${url}. Check file permissions.`);
        }
      }
      
      throw new Error(`Cannot access file at URL: ${url}. File may not exist or URL is invalid.`);
    }
  } catch (error) {
    const errorDetails = {
      url,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    
    logger.error('Error converting file to base64:', errorDetails);
    throw new Error(`Failed to convert file to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Função alternativa para converter File object diretamente para base64
const convertFileObjectToBase64 = async (file: File): Promise<string> => {
  try {
    logger.info('Converting File object to base64:', { name: file.name, size: file.size, type: file.type });
    
    // Validar se o arquivo é válido
    if (!file || file.size === 0) {
      throw new Error('Invalid file: file is empty or null');
    }
    
    // Verificar se o arquivo não está corrompido
    if (file.size > 100 * 1024 * 1024) { // 100MB limite
      throw new Error(`File too large: ${file.size} bytes. Maximum allowed: 100MB`);
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Timeout para evitar travamento
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('File reading timeout after 30 seconds'));
      }, 30000);
      
      reader.onloadend = () => {
        clearTimeout(timeout);
        try {
          const result = reader.result;
          if (!result || typeof result !== 'string') {
            throw new Error('FileReader returned invalid result');
          }
          
          const base64 = result as string;
          // Verificar se o resultado contém o prefixo esperado
          if (!base64.includes(',')) {
            throw new Error('Invalid base64 format: missing data URL prefix');
          }
          
          // Remove o prefixo data:mime/type;base64,
          const base64Data = base64.split(',')[1];
          
          if (!base64Data || base64Data.length === 0) {
            throw new Error('Empty base64 data after processing');
          }
          
          logger.info('File object converted to base64 successfully:', { 
            fileName: file.name,
            originalSize: file.size, 
            base64Length: base64Data.length 
          });
          resolve(base64Data);
        } catch (error) {
          logger.error('Error processing FileReader result:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        clearTimeout(timeout);
        logger.error('FileReader error for File object:', error);
        reject(new Error(`FileReader failed: ${error}`));
      };
      
      reader.onabort = () => {
        clearTimeout(timeout);
        reject(new Error('File reading was aborted'));
      };
      
      // Iniciar a leitura
      reader.readAsDataURL(file);
    });
  } catch (error) {
    logger.error('Error converting File object to base64:', { fileName: file.name, error });
    throw new Error(`Failed to convert File object to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Função para estimar tokens de um PDF baseado no tamanho (processamento multimodal)
const estimatePDFTokens = (fileSizeBytes: number): number => {
  // CORREÇÃO: GPT-5 é multimodal e processa PDFs nativamente como imagens
  // Para processamento multimodal, o custo é muito menor que texto base64
  // Estimativa baseada no processamento de imagem multimodal do OpenAI
  
  // Para PDFs pequenos (< 1MB), custo fixo baixo
  if (fileSizeBytes < 1024 * 1024) {
    const estimatedTokens = 1000; // Custo fixo baixo para PDFs pequenos
    
    logger.info('PDF token estimation (multimodal - pequeno):', {
      fileSizeBytes,
      fileSizeKB: Math.round(fileSizeBytes / 1024),
      estimatedTokens,
      processingType: 'multimodal_native'
    });
    
    return estimatedTokens;
  }
  
  // Para PDFs maiores, estimativa baseada no tamanho com fator multimodal
  // Muito mais eficiente que processamento de texto
  const estimatedTokens = Math.ceil(fileSizeBytes / 10000); // ~1 token por 10KB
  
  logger.info('PDF token estimation (multimodal - grande):', {
    fileSizeBytes,
    fileSizeMB: Math.round(fileSizeBytes / (1024 * 1024) * 100) / 100,
    estimatedTokens,
    processingType: 'multimodal_native'
  });
  
  return estimatedTokens;
};

// Função para extrair texto do PDF e preparar para análise
const extractPDFTextAndPrepare = async (base64Data: string, fileName: string, maxTokens: number = 15000): Promise<string[]> => {
  try {
    // Verificar se PDF.js foi configurado corretamente
    if (!pdfConfigured) {
      logger.warn('PDF.js não configurado, tentando reconfigurar...', { fileName });
      const reconfigured = configurePDFJS();
      if (!reconfigured) {
        throw new Error('PDF.js não pôde ser configurado');
      }
    }
    
    // Converter base64 para Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    logger.info('Iniciando extração de texto do PDF:', {
      fileName,
      fileSize: bytes.length,
      pdfVersion: pdfjsLib.version
    });
    
    // Carregar PDF com PDF.js com configurações otimizadas
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      verbosity: 0, // Reduzir logs verbosos
      standardFontDataUrl: undefined // Evitar carregamento de fontes desnecessárias
    });
    
    const pdf = await loadingTask.promise;
    let extractedText = '';
    
    // Extrair texto de todas as páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => item.str)
        .map((item: any) => item.str)
        .join(' ');
      extractedText += pageText + '\n';
    }
    
    extractedText = extractedText.trim();
    
    if (!extractedText) {
      logger.warn('Nenhum texto extraído do PDF, usando base64 como fallback', { fileName });
      return [`[PDF Document: ${fileName}]\nPlease analyze this PDF document:\ndata:application/pdf;base64,${base64Data}`];
    }
    
    // Preparar prompt específico para DANFE se detectado
    const isDanfe = fileName.toLowerCase().includes('danfe') || extractedText.toLowerCase().includes('danfe') || extractedText.toLowerCase().includes('nota fiscal');
    
    let prompt = '';
    if (isDanfe) {
      prompt = `[DANFE - Documento Auxiliar da Nota Fiscal Eletrônica: ${fileName}]\n\nAnalise este documento fiscal brasileiro (DANFE) e extraia as seguintes informações:\n\n1. **Dados do Emitente**: Nome, CNPJ, endereço\n2. **Dados do Destinatário**: Nome, CNPJ/CPF, endereço\n3. **Dados da Nota Fiscal**: Número, série, data de emissão\n4. **Produtos/Serviços**: Descrição, quantidade, valor unitário, valor total\n5. **Impostos**: ICMS, IPI, PIS, COFINS e outros\n6. **Totais**: Valor total dos produtos, impostos, valor final\n7. **Informações Adicionais**: Condições de pagamento, observações\n\nConteúdo do documento:\n\n${extractedText}`;
    } else {
      prompt = `[PDF Document: ${fileName}]\n\nAnalise o seguinte documento PDF:\n\n${extractedText}`;
    }
    
    const estimatedTokens = Math.ceil(prompt.length / 4);
    
    if (estimatedTokens <= maxTokens) {
      logger.info('PDF processado com sucesso - texto extraído', {
        fileName,
        textLength: extractedText.length,
        estimatedTokens,
        isDanfe
      });
      return [prompt];
    }
    
    // Se muito grande, dividir o texto em chunks
    const numChunks = Math.ceil(estimatedTokens / maxTokens);
    const chunkSize = Math.floor(extractedText.length / numChunks);
    const chunks: string[] = [];
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = i === numChunks - 1 ? extractedText.length : (i + 1) * chunkSize;
      const chunkText = extractedText.slice(start, end);
      
      let chunkPrompt = '';
      if (isDanfe) {
        chunkPrompt = `[DANFE - Parte ${i + 1}/${numChunks}: ${fileName}]\n\nAnalise esta parte do documento fiscal brasileiro:\n\n${chunkText}`;
      } else {
        chunkPrompt = `[PDF Document - Parte ${i + 1}/${numChunks}: ${fileName}]\n\nAnalise esta parte do documento:\n\n${chunkText}`;
      }
      
      chunks.push(chunkPrompt);
    }
    
    logger.info('PDF dividido em chunks de texto:', {
      fileName,
      originalTokens: estimatedTokens,
      numChunks,
      textLength: extractedText.length,
      isDanfe
    });
    
    return chunks;
    
  } catch (error) {
    logger.error('Erro ao extrair texto do PDF, usando base64 como fallback:', { fileName, error });
    return [`[PDF Document: ${fileName}]\nPlease analyze this PDF document:\ndata:application/pdf;base64,${base64Data}`];
  }
};

// Função para processar arquivos de texto (.txt)
const processTextFile = async (base64Data: string, fileName: string, maxTokens: number = 15000): Promise<string[]> => {
  try {
    // Decodificar base64 para texto UTF-8
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Converter para texto UTF-8
    const decoder = new TextDecoder('utf-8');
    let textContent = decoder.decode(bytes);
    
    // Limpar e normalizar o texto
    textContent = textContent.trim();
    
    if (!textContent) {
      logger.warn('Arquivo de texto vazio:', { fileName });
      return [`[Text File: ${fileName}]\nO arquivo de texto está vazio ou não pôde ser lido.`];
    }
    
    const prompt = `[Text File: ${fileName}]\n\nConteúdo do arquivo de texto:\n\n${textContent}`;
    const estimatedTokens = Math.ceil(prompt.length / 4);
    
    if (estimatedTokens <= maxTokens) {
      logger.info('Arquivo de texto processado com sucesso:', {
        fileName,
        textLength: textContent.length,
        estimatedTokens
      });
      return [prompt];
    }
    
    // Se muito grande, dividir em chunks
    const numChunks = Math.ceil(estimatedTokens / maxTokens);
    const chunkSize = Math.floor(textContent.length / numChunks);
    const chunks: string[] = [];
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = i === numChunks - 1 ? textContent.length : (i + 1) * chunkSize;
      const chunkText = textContent.slice(start, end);
      
      const chunkPrompt = `[Text File - Parte ${i + 1}/${numChunks}: ${fileName}]\n\nConteúdo desta parte:\n\n${chunkText}`;
      chunks.push(chunkPrompt);
    }
    
    logger.info('Arquivo de texto dividido em chunks:', {
      fileName,
      originalTokens: estimatedTokens,
      numChunks,
      textLength: textContent.length
    });
    
    return chunks;
    
  } catch (error) {
    logger.error('Erro ao processar arquivo de texto:', { fileName, error });
    return [`[Text File: ${fileName}]\nErro ao processar arquivo de texto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`];
  }
};

// Função para processar documentos Word (.doc/.docx)
const processWordDocument = async (base64Data: string, fileName: string, maxTokens: number = 15000): Promise<string[]> => {
  try {
    // Converter base64 para ArrayBuffer
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Usar mammoth para extrair texto do documento Word
    const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
    let textContent = result.value;
    
    // Limpar e normalizar o texto
    textContent = textContent.trim();
    
    if (!textContent) {
      logger.warn('Documento Word vazio ou não pôde ser processado:', { fileName });
      return [`[Word Document: ${fileName}]\nO documento Word está vazio ou não pôde ser processado.`];
    }
    
    // Log de avisos se houver
    if (result.messages && result.messages.length > 0) {
      logger.info('Avisos ao processar documento Word:', {
        fileName,
        warnings: result.messages.map(m => m.message)
      });
    }
    
    const prompt = `[Word Document: ${fileName}]\n\nConteúdo do documento:\n\n${textContent}`;
    const estimatedTokens = Math.ceil(prompt.length / 4);
    
    if (estimatedTokens <= maxTokens) {
      logger.info('Documento Word processado com sucesso:', {
        fileName,
        textLength: textContent.length,
        estimatedTokens
      });
      return [prompt];
    }
    
    // Se muito grande, dividir em chunks
    const numChunks = Math.ceil(estimatedTokens / maxTokens);
    const chunkSize = Math.floor(textContent.length / numChunks);
    const chunks: string[] = [];
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = i === numChunks - 1 ? textContent.length : (i + 1) * chunkSize;
      const chunkText = textContent.slice(start, end);
      
      const chunkPrompt = `[Word Document - Parte ${i + 1}/${numChunks}: ${fileName}]\n\nConteúdo desta parte:\n\n${chunkText}`;
      chunks.push(chunkPrompt);
    }
    
    logger.info('Documento Word dividido em chunks:', {
      fileName,
      originalTokens: estimatedTokens,
      numChunks,
      textLength: textContent.length
    });
    
    return chunks;
    
  } catch (error) {
    logger.error('Erro ao processar documento Word:', { fileName, error });
    return [`[Word Document: ${fileName}]\nErro ao processar documento Word: ${error instanceof Error ? error.message : 'Erro desconhecido'}`];
  }
};

// Função para processar arquivos CSV
const processCSVFile = async (base64Data: string, fileName: string, maxTokens: number = 15000): Promise<string[]> => {
  try {
    // Converter base64 para ArrayBuffer
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Usar XLSX para ler o CSV
    const workbook = XLSX.read(bytes, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON para análise estruturada
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!jsonData || jsonData.length === 0) {
      logger.warn('Arquivo CSV vazio:', { fileName });
      return [`[CSV File: ${fileName}]\nO arquivo CSV está vazio ou não pôde ser lido.`];
    }
    
    // Extrair cabeçalhos e dados
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);
    
    // Criar resumo estruturado
    let structuredContent = `[CSV File: ${fileName}]\n\n`;
    structuredContent += `**Estrutura do arquivo:**\n`;
    structuredContent += `- Total de linhas: ${dataRows.length}\n`;
    structuredContent += `- Colunas (${headers.length}): ${headers.join(', ')}\n\n`;
    
    // Mostrar primeiras linhas como exemplo
    const sampleSize = Math.min(5, dataRows.length);
    structuredContent += `**Primeiras ${sampleSize} linhas:**\n`;
    
    for (let i = 0; i < sampleSize; i++) {
      const row = dataRows[i] as any[];
      structuredContent += `\nLinha ${i + 1}:\n`;
      headers.forEach((header, index) => {
        const value = row[index] || '';
        structuredContent += `  - ${header}: ${value}\n`;
      });
    }
    
    // Análise estatística básica para colunas numéricas
    structuredContent += `\n**Análise dos dados:**\n`;
    headers.forEach((header, colIndex) => {
      const columnValues = dataRows.map(row => (row as any[])[colIndex]).filter(val => val !== undefined && val !== '');
      const numericValues = columnValues.filter(val => !isNaN(Number(val))).map(val => Number(val));
      
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const avg = sum / numericValues.length;
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        
        structuredContent += `  - ${header}: ${numericValues.length} valores numéricos (Min: ${min}, Max: ${max}, Média: ${avg.toFixed(2)})\n`;
      } else {
        const uniqueValues = [...new Set(columnValues)].length;
        structuredContent += `  - ${header}: ${columnValues.length} valores de texto (${uniqueValues} únicos)\n`;
      }
    });
    
    const estimatedTokens = Math.ceil(structuredContent.length / 4);
    
    if (estimatedTokens <= maxTokens) {
      logger.info('Arquivo CSV processado com sucesso:', {
        fileName,
        rows: dataRows.length,
        columns: headers.length,
        estimatedTokens
      });
      return [structuredContent];
    }
    
    // Se muito grande, criar chunks com resumos
    const chunks: string[] = [];
    const chunkSize = Math.floor(dataRows.length / Math.ceil(estimatedTokens / maxTokens));
    
    for (let i = 0; i < dataRows.length; i += chunkSize) {
      const chunkRows = dataRows.slice(i, i + chunkSize);
      const chunkNumber = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(dataRows.length / chunkSize);
      
      let chunkContent = `[CSV File - Parte ${chunkNumber}/${totalChunks}: ${fileName}]\n\n`;
      chunkContent += `**Linhas ${i + 1} a ${Math.min(i + chunkSize, dataRows.length)}:**\n`;
      
      chunkRows.forEach((row, rowIndex) => {
        const actualRowNumber = i + rowIndex + 1;
        chunkContent += `\nLinha ${actualRowNumber}:\n`;
        headers.forEach((header, colIndex) => {
          const value = (row as any[])[colIndex] || '';
          chunkContent += `  - ${header}: ${value}\n`;
        });
      });
      
      chunks.push(chunkContent);
    }
    
    logger.info('Arquivo CSV dividido em chunks:', {
      fileName,
      totalRows: dataRows.length,
      columns: headers.length,
      numChunks: chunks.length
    });
    
    return chunks;
    
  } catch (error) {
    logger.error('Erro ao processar arquivo CSV:', { fileName, error });
    return [`[CSV File: ${fileName}]\nErro ao processar arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`];
  }
};

// Função para processar arquivos Excel (.xls/.xlsx)
const processExcelFile = async (base64Data: string, fileName: string, maxTokens: number = 15000): Promise<string[]> => {
  try {
    // Converter base64 para ArrayBuffer
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Usar XLSX para ler o arquivo Excel
    const workbook = XLSX.read(bytes, { type: 'array' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      logger.warn('Arquivo Excel sem planilhas:', { fileName });
      return [`[Excel File: ${fileName}]\nO arquivo Excel não contém planilhas ou não pôde ser lido.`];
    }
    
    let structuredContent = `[Excel File: ${fileName}]\n\n`;
    structuredContent += `**Estrutura do arquivo:**\n`;
    structuredContent += `- Total de planilhas: ${workbook.SheetNames.length}\n`;
    structuredContent += `- Nomes das planilhas: ${workbook.SheetNames.join(', ')}\n\n`;
    
    // Processar cada planilha
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!jsonData || jsonData.length === 0) {
        structuredContent += `**Planilha "${sheetName}":** Vazia\n\n`;
        continue;
      }
      
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);
      
      structuredContent += `**Planilha "${sheetName}":**\n`;
      structuredContent += `- Linhas de dados: ${dataRows.length}\n`;
      structuredContent += `- Colunas (${headers.length}): ${headers.join(', ')}\n`;
      
      // Mostrar primeiras linhas como exemplo
      const sampleSize = Math.min(3, dataRows.length);
      if (sampleSize > 0) {
        structuredContent += `\nPrimeiras ${sampleSize} linhas:\n`;
        
        for (let i = 0; i < sampleSize; i++) {
          const row = dataRows[i] as any[];
          structuredContent += `  Linha ${i + 1}: `;
          const rowData = headers.map((header, index) => {
            const value = row[index] || '';
            return `${header}=${value}`;
          }).join(', ');
          structuredContent += `${rowData}\n`;
        }
      }
      
      // Análise estatística básica
      structuredContent += `\nResumo dos dados:\n`;
      headers.forEach((header, colIndex) => {
        const columnValues = dataRows.map(row => (row as any[])[colIndex]).filter(val => val !== undefined && val !== '');
        const numericValues = columnValues.filter(val => !isNaN(Number(val))).map(val => Number(val));
        
        if (numericValues.length > 0) {
          const sum = numericValues.reduce((a, b) => a + b, 0);
          const avg = sum / numericValues.length;
          structuredContent += `  - ${header}: ${numericValues.length} valores numéricos (Soma: ${sum}, Média: ${avg.toFixed(2)})\n`;
        } else {
          const uniqueValues = [...new Set(columnValues)].length;
          structuredContent += `  - ${header}: ${columnValues.length} valores (${uniqueValues} únicos)\n`;
        }
      });
      
      structuredContent += `\n`;
    }
    
    const estimatedTokens = Math.ceil(structuredContent.length / 4);
    
    if (estimatedTokens <= maxTokens) {
      logger.info('Arquivo Excel processado com sucesso:', {
        fileName,
        sheets: workbook.SheetNames.length,
        estimatedTokens
      });
      return [structuredContent];
    }
    
    // Se muito grande, processar planilha por planilha
    const chunks: string[] = [];
    
    for (let sheetIndex = 0; sheetIndex < workbook.SheetNames.length; sheetIndex++) {
      const sheetName = workbook.SheetNames[sheetIndex];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!jsonData || jsonData.length === 0) continue;
      
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);
      
      let chunkContent = `[Excel File - Planilha "${sheetName}": ${fileName}]\n\n`;
      chunkContent += `**Dados da planilha ${sheetIndex + 1}/${workbook.SheetNames.length}:**\n`;
      chunkContent += `- Linhas: ${dataRows.length}\n`;
      chunkContent += `- Colunas: ${headers.join(', ')}\n\n`;
      
      // Incluir todas as linhas desta planilha
      dataRows.forEach((row, rowIndex) => {
        chunkContent += `Linha ${rowIndex + 1}: `;
        const rowData = headers.map((header, colIndex) => {
          const value = (row as any[])[colIndex] || '';
          return `${header}=${value}`;
        }).join(', ');
        chunkContent += `${rowData}\n`;
      });
      
      chunks.push(chunkContent);
    }
    
    logger.info('Arquivo Excel dividido em chunks por planilha:', {
      fileName,
      sheets: workbook.SheetNames.length,
      numChunks: chunks.length
    });
    
    return chunks;
    
  } catch (error) {
    logger.error('Erro ao processar arquivo Excel:', { fileName, error });
    return [`[Excel File: ${fileName}]\nErro ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`];
  }
};

// Função para validar se arquivo pode ser processado pela OpenAI (limite de tokens)
const validateOpenAITokenLimit = (file: FileAttachment): { canProcess: boolean, estimatedTokens: number, reason?: string } => {
  // Limites ajustados para processamento multimodal
  const OPENAI_MULTIMODAL_TOKEN_LIMIT = 100000; // Limite muito maior para multimodal
  const OPENAI_PDF_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB - limite real da API OpenAI
  
  if (file.type === 'application/pdf') {
    // Verificar primeiro o limite de tamanho de arquivo (mais importante que tokens)
    if (file.size > OPENAI_PDF_SIZE_LIMIT) {
      return {
        canProcess: false,
        estimatedTokens: 0,
        reason: `PDF muito grande: ${Math.round(file.size / (1024 * 1024))}MB (limite: 50MB). Arquivo: ${file.name}`
      };
    }
    
    const estimatedTokens = estimatePDFTokens(file.size);
    
    logger.info('Validando limite de tokens OpenAI (multimodal):', {
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: Math.round(file.size / (1024 * 1024) * 100) / 100,
      estimatedTokens,
      tokenLimit: OPENAI_MULTIMODAL_TOKEN_LIMIT,
      sizeLimit: '50MB',
      canProcess: estimatedTokens <= OPENAI_MULTIMODAL_TOKEN_LIMIT,
      processingType: 'multimodal'
    });
    
    if (estimatedTokens > OPENAI_MULTIMODAL_TOKEN_LIMIT) {
      return {
        canProcess: false,
        estimatedTokens,
        reason: `PDF com muitos tokens: ${estimatedTokens} tokens estimados (limite: ${OPENAI_MULTIMODAL_TOKEN_LIMIT}). Arquivo: ${file.name}`
      };
    }
    
    return { canProcess: true, estimatedTokens };
  }
  
  // Para imagens, assumimos que são processáveis (OpenAI tem boa compressão)
  return { canProcess: true, estimatedTokens: 1000 }; // Estimativa baixa para imagens
};

// Configurações de suporte a arquivos por provedor
const PROVIDER_FILE_SUPPORT = {
  openai: {
    supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxFileSize: 20 * 1024 * 1024, // 20MB geral
    maxFilesPerMessage: 10,
    // Limites específicos por tipo de arquivo
    fileSizeLimits: {
      'image/*': 10 * 1024 * 1024, // 10MB para imagens
      'application/pdf': 15 * 1024 * 1024, // 15MB para PDFs
      'text/plain': 5 * 1024 * 1024, // 5MB para texto
      'text/csv': 10 * 1024 * 1024, // 10MB para CSV
      'application/msword': 10 * 1024 * 1024, // 10MB para Word antigo
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024, // 10MB para Word moderno
      'application/vnd.ms-excel': 15 * 1024 * 1024, // 15MB para Excel antigo
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 15 * 1024 * 1024 // 15MB para Excel moderno
    }
  },
  anthropic: {
    supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxFileSize: 32 * 1024 * 1024, // 32MB geral (Anthropic limit)
    maxFilesPerMessage: 5,
    fileSizeLimits: {
      'image/*': 20 * 1024 * 1024, // 20MB para imagens
      'application/pdf': 25 * 1024 * 1024, // 25MB para PDFs
      'text/plain': 10 * 1024 * 1024, // 10MB para texto
      'text/csv': 20 * 1024 * 1024, // 20MB para CSV
      'application/msword': 20 * 1024 * 1024, // 20MB para Word antigo
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 20 * 1024 * 1024, // 20MB para Word moderno
      'application/vnd.ms-excel': 25 * 1024 * 1024, // 25MB para Excel antigo
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 25 * 1024 * 1024 // 25MB para Excel moderno
    }
  },
  google: {
    supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxFileSize: 50 * 1024 * 1024, // 50MB geral (Google limit)
    maxFilesPerMessage: 16,
    fileSizeLimits: {
      'image/*': 30 * 1024 * 1024, // 30MB para imagens
      'application/pdf': 40 * 1024 * 1024, // 40MB para PDFs
      'text/plain': 20 * 1024 * 1024, // 20MB para texto
      'text/csv': 30 * 1024 * 1024, // 30MB para CSV
      'application/msword': 30 * 1024 * 1024, // 30MB para Word antigo
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 30 * 1024 * 1024, // 30MB para Word moderno
      'application/vnd.ms-excel': 40 * 1024 * 1024, // 40MB para Excel antigo
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 40 * 1024 * 1024 // 40MB para Excel moderno
    }
  }
};

// Função para tentar processar arquivo não suportado como texto
async function tryProcessUnsupportedFileAsText(file: FileAttachment): Promise<string | null> {
  try {
    // Tentar ler como texto simples
    const base64Data = await convertFileWithFallback(file);
    const textContent = atob(base64Data);
    
    // Verificar se o conteúdo parece ser texto válido
    const validTextRatio = textContent.split('').filter(char => {
      const code = char.charCodeAt(0);
      return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
    }).length / textContent.length;
    
    if (validTextRatio > 0.7) {
      return `[Conteúdo do arquivo ${file.name} (processado como texto):]\n${textContent.substring(0, 5000)}${textContent.length > 5000 ? '\n[...conteúdo truncado...]' : ''}`;
    }
    
    return null;
  } catch (error) {
    logger.warn('Failed to process unsupported file as text:', { fileName: file.name, error });
    return null;
  }
}

// Função para validar arquivos por provedor com fallback inteligente
function validateFilesForProvider(files: FileAttachment[], provider: string): { valid: FileAttachment[], invalid: FileAttachment[], errors: string[], fallbackProcessable: FileAttachment[] } {
  const config = PROVIDER_FILE_SUPPORT[provider as keyof typeof PROVIDER_FILE_SUPPORT];
  if (!config) {
    return { valid: [], invalid: files, errors: [`Provider ${provider} not supported`], fallbackProcessable: [] };
  }

  const valid: FileAttachment[] = [];
  const invalid: FileAttachment[] = [];
  const fallbackProcessable: FileAttachment[] = [];
  const errors: string[] = [];

  if (files.length > config.maxFilesPerMessage) {
    errors.push(`Too many files: ${files.length}. Maximum allowed: ${config.maxFilesPerMessage}`);
    return { valid: [], invalid: files, errors, fallbackProcessable: [] };
  }

  for (const file of files) {
    if (!config.supportedTypes.includes(file.type)) {
      // Verificar se pode ser processado como fallback
      if (file.size < 5 * 1024 * 1024) { // Máximo 5MB para fallback
        fallbackProcessable.push(file);
        errors.push(`File type ${file.type} not natively supported by ${provider}, will try text fallback`);
      } else {
        invalid.push(file);
        errors.push(`File type ${file.type} not supported by ${provider} and too large for fallback`);
      }
      continue;
    }

    // Verificar limite específico por tipo de arquivo
    let maxSizeForType = config.maxFileSize;
    if (config.fileSizeLimits) {
      const limits = config.fileSizeLimits as Record<string, number>;
      // Verificar se há limite específico para o tipo exato
      if (limits[file.type]) {
        maxSizeForType = limits[file.type];
      }
      // Verificar se há limite para categoria (ex: image/*)
      else if (file.type.startsWith('image/') && limits['image/*']) {
        maxSizeForType = limits['image/*'];
      }
    }

    if (file.size > maxSizeForType) {
      invalid.push(file);
      const maxSizeMB = (maxSizeForType / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      errors.push(`File ${file.name} too large: ${fileSizeMB}MB. Maximum for ${file.type}: ${maxSizeMB}MB`);
      continue;
    }

    valid.push(file);
  }

  return { valid, invalid, errors, fallbackProcessable };
}

// Configuração dos provedores
class AIProviderManager {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private googleAI: GoogleGenerativeAI | null = null;
  
  private providers: string[] = [];
  
  constructor() {
    this.initializeProviders();
  }
  
  private initializeProviders() {
    // OpenAI
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true, // APENAS para desenvolvimento
      });
      this.providers.push('openai');
      logger.info('OpenAI provider initialized');
    }
    
    // Anthropic
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true, // APENAS para desenvolvimento
      });
      this.providers.push('anthropic');
      logger.info('Anthropic provider initialized');
    }
    
    // Google AI
    if (import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      this.googleAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
      this.providers.push('google');
      logger.info('Google AI provider initialized');
    }
    
    if (this.providers.length === 0) {
      logger.error('No AI providers configured');
      throw new Error('No AI providers available');
    }
    
    logger.info(`AI providers initialized: ${this.providers.join(', ')}`);
  }
  
  // Método principal para chat com fallback
  async chat(
    messages: AIMessage[],
    userId: string,
    preferredProvider?: string
  ): Promise<AIResponse> {
    // Rate limiting
    if (!userRateLimiter.isAllowed(userId)) {
      throw new Error('Rate limit exceeded');
    }
    
    const startTime = Date.now();
    
    // Determinar ordem dos provedores
    const providerOrder = this.getProviderOrder(preferredProvider);
    
    for (const provider of providerOrder) {
      try {
        logger.info(`Attempting chat with provider: ${provider}`, { userId, provider });
        
        const response = await this.chatWithProvider(provider, messages, preferredProvider);
        const processingTime = Date.now() - startTime;
        
        logger.info('Chat completed successfully', {
          userId,
          provider,
          model: response.model,
          processingTime,
          tokenCount: response.tokenCount
        });
        
        return {
          ...response,
          processingTime
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Detectar erros específicos de limite de tokens
        const isTokenLimitError = errorMessage.includes('Request too large') || 
                                 errorMessage.includes('tokens') || 
                                 errorMessage.includes('Arquivo muito grande');
        
        logger.error(`Provider ${provider} failed`, {
          userId,
          provider,
          error: errorMessage,
          isTokenLimitError
        });
        
        // Se não é o último provedor, continua para o próximo
        if (provider !== providerOrder[providerOrder.length - 1]) {
          if (isTokenLimitError) {
            logger.info(`Trying next provider due to token limit issue with ${provider}`);
          }
          continue;
        }
        
        // Se é o último provedor, personalizar a mensagem de erro
        if (isTokenLimitError) {
          throw new Error('Arquivo muito grande para todos os provedores disponíveis. Tente com um arquivo menor ou divida o conteúdo.');
        }
        
        // Se é o último provedor, lança o erro original
        throw error;
      }
    }
    
    throw new Error('All AI providers failed');
  }
  
  // Chat com streaming
  async *chatStream(
    messages: AIMessage[],
    userId: string,
    preferredProvider?: string
  ): AsyncGenerator<StreamResponse> {
    // Rate limiting
    if (!userRateLimiter.isAllowed(userId)) {
      throw new Error('Rate limit exceeded');
    }
    
    const providerOrder = this.getProviderOrder(preferredProvider);
    
    for (const provider of providerOrder) {
      try {
        logger.info(`Attempting streaming chat with provider: ${provider}`, { userId, provider });
        
        yield* this.streamWithProvider(provider, messages, preferredProvider);
        return; // Se chegou aqui, foi bem-sucedido
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Detectar erros específicos de limite de tokens
        const isTokenLimitError = errorMessage.includes('Request too large') || 
                                 errorMessage.includes('tokens') || 
                                 errorMessage.includes('Arquivo muito grande');
        
        logger.error(`Streaming provider ${provider} failed`, {
          userId,
          provider,
          error: errorMessage,
          isTokenLimitError
        });
        
        // Se não é o último provedor, continua para o próximo
        if (provider !== providerOrder[providerOrder.length - 1]) {
          if (isTokenLimitError) {
            logger.info(`Trying next streaming provider due to token limit issue with ${provider}`);
          }
          continue;
        }
        
        // Se é o último provedor, personalizar a mensagem de erro
        if (isTokenLimitError) {
          throw new Error('Arquivo muito grande para todos os provedores disponíveis. Tente com um arquivo menor ou divida o conteúdo.');
        }
        
        throw error;
      }
    }
  }
  
  // Mapear modelo para provedor
  private getProviderFromModel(model?: string): string | undefined {
    if (!model) return undefined;
    
    // Log do modelo sendo mapeado
    logger.info('🔍 Mapeando modelo para provedor:', {
      requestedModel: model
    });
    
    // Mapeamento de modelos para provedores (incluindo GPT-5)
    const modelToProvider: Record<string, string> = {
      'gpt-4o': 'openai',
      'gpt-4o-mini': 'openai',
      'gpt-4': 'openai',
      'gpt-3.5-turbo': 'openai',
      'gpt-5': 'openai',
      'gpt-5-chat-latest': 'openai',
      'gpt-5-nano': 'openai',
      'gpt-5-mini': 'openai',
      'claude-3-5-sonnet-20241022': 'anthropic',
      'claude-3-5-haiku-20241022': 'anthropic',
      'claude-3-opus-20240229': 'anthropic',
      'gemini-2.0-flash-exp': 'google',
      'gemini-1.5-pro': 'google',
      'gemini-1.5-flash': 'google'
    };
    
    return modelToProvider[model];
  }

  // Mapear modelo para o modelo correto do provedor
  private getModelForProvider(provider: string, requestedModel?: string): string | undefined {
    if (!requestedModel) return undefined;
    
    // Log do mapeamento de modelo para provedor
    logger.info('🔄 Mapeando modelo para provedor específico:', {
      provider,
      requestedModel
    });
    
    // Se o modelo já pertence ao provedor, usar diretamente
    const originalProvider = this.getProviderFromModel(requestedModel);
    if (originalProvider === provider) {
      return requestedModel;
    }
    
    // Mapeamento de modelos equivalentes entre provedores
    const modelEquivalents: Record<string, Record<string, string>> = {
      'openai': {
        'gpt-5': 'gpt-5',
        'gpt-4o': 'gpt-4o',
        'gpt-4': 'gpt-4',
        'claude-3-5-sonnet-20241022': 'gpt-4o',
        'gemini-2.0-flash-exp': 'gpt-4o',
        'gemini-1.5-pro': 'gpt-4o'
      },
      'anthropic': {
        'gpt-5': 'claude-3-5-sonnet-20241022',
        'gpt-4o': 'claude-3-5-sonnet-20241022',
        'gpt-4': 'claude-3-5-sonnet-20241022',
        'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
        'gemini-2.0-flash-exp': 'claude-3-5-sonnet-20241022',
        'gemini-1.5-pro': 'claude-3-5-sonnet-20241022'
      },
      'google': {
        'gpt-5': 'gemini-2.0-flash-exp',
        'gpt-4o': 'gemini-2.0-flash-exp',
        'gpt-4': 'gemini-1.5-pro',
        'claude-3-5-sonnet-20241022': 'gemini-2.0-flash-exp',
        'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
        'gemini-1.5-pro': 'gemini-1.5-pro'
      }
    };
    
    const equivalentModel = modelEquivalents[provider]?.[requestedModel];
    
    logger.info('✅ Modelo mapeado:', {
      provider,
      requestedModel,
      equivalentModel: equivalentModel || 'default'
    });
    
    return equivalentModel;
  }

  private getProviderOrder(preferredProvider?: string): string[] {
    // Primeiro, tentar mapear modelo para provedor
    let actualProvider = preferredProvider;
    if (preferredProvider && !this.providers.includes(preferredProvider)) {
      actualProvider = this.getProviderFromModel(preferredProvider);
    }
    
    // Log detalhado para debug do modelo selecionado
    logger.info('🔄 PROVIDER ORDER DEBUG:', {
      originalPreferred: preferredProvider,
      mappedProvider: actualProvider,
      availableProviders: this.providers,
      isModelName: preferredProvider && !this.providers.includes(preferredProvider),
      finalOrder: actualProvider && this.providers.includes(actualProvider) 
        ? [actualProvider, ...this.providers.filter(p => p !== actualProvider)]
        : [...this.providers]
    });
    
    // Se um provedor específico foi selecionado, colocá-lo primeiro com fallbacks
    if (actualProvider && this.providers.includes(actualProvider)) {
      return [actualProvider, ...this.providers.filter(p => p !== actualProvider)];
    }
    
    // Fallback para todos os provedores se nenhum foi especificado
    return [...this.providers];
  }
  
  private async chatWithProvider(provider: string, messages: AIMessage[], model?: string): Promise<AIResponse> {
    // Mapear modelo para o provedor correto
    const providerModel = this.getModelForProvider(provider, model);
    
    // Log detalhado do modelo sendo enviado para o provedor
    logger.info('📤 Enviando para provedor:', {
      provider,
      requestedModel: model,
      providerModel,
      messageCount: messages.length
    });
    
    switch (provider) {
      case 'openai':
        return this.chatWithOpenAI(messages, providerModel);
      case 'anthropic':
        return this.chatWithAnthropic(messages, providerModel);
      case 'google':
        return this.chatWithGoogle(messages, providerModel);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
  
  private async *streamWithProvider(
    provider: string,
    messages: AIMessage[],
    model?: string
  ): AsyncGenerator<StreamResponse> {
    // Mapear modelo para o provedor correto
    const providerModel = this.getModelForProvider(provider, model);
    
    switch (provider) {
      case 'openai':
        yield* this.streamWithOpenAI(messages, providerModel);
        break;
      case 'anthropic':
        yield* this.streamWithAnthropic(messages, providerModel);
        break;
      case 'google':
        yield* this.streamWithGoogle(messages, providerModel);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
  
  // Implementações específicas dos provedores
  private async chatWithOpenAI(messages: AIMessage[], model?: string): Promise<AIResponse> {
    if (!this.openai) throw new Error('OpenAI not initialized');
    
    // Converter mensagens para formato OpenAI com suporte multimodal
    const openaiMessages = await Promise.all(
      messages.map(async (msg) => {
        if (msg.files && msg.files.length > 0) {
          // Validar arquivos para OpenAI
          const { valid: validFiles, invalid: invalidFiles, errors, fallbackProcessable } = validateFilesForProvider(msg.files, 'openai');
          
          if (errors.length > 0) {
            logger.warn('Some files not supported by OpenAI:', { errors, invalidFiles: invalidFiles.map(f => f.name), fallbackCount: fallbackProcessable.length });
          }
          
          // Mensagem com arquivos válidos - suporte multimodal
          const content: any[] = [{ type: 'text', text: msg.content }];
          
          for (const file of validFiles) {
            try {
              let base64Data: string;
              
              // Usar fallback inteligente para conversão
              base64Data = await convertFileWithFallback(file);
              
              if (file.type.startsWith('image/')) {
                content.push({
                  type: 'image_url',
                  image_url: {
                    url: `data:${file.type};base64,${base64Data}`
                  }
                });
              } else if (file.type === 'application/pdf') {
                // OpenAI não suporta PDFs multimodais nativamente - extrair texto
                logger.info('Extraindo texto do PDF para OpenAI:', { fileName: file.name });
                
                try {
                  const textChunks = await extractPDFTextAndPrepare(base64Data, file.name);
                  
                  logger.info('PDF processado como texto para OpenAI:', {
                    fileName: file.name,
                    numChunks: textChunks.length
                  });
                  
                  // Adicionar cada chunk como texto
                  textChunks.forEach((chunk) => {
                    content.push({
                      type: 'text',
                      text: chunk
                    });
                  });
                } catch (error) {
                  logger.error('Erro ao extrair texto do PDF para OpenAI:', error);
                  // Fallback: adicionar como texto simples
                  content.push({
                    type: 'text',
                    text: `[PDF Document: ${file.name}]\nNão foi possível extrair o texto deste PDF. Por favor, descreva o conteúdo do documento.`
                  });
                }
              } else if (file.type === 'text/plain') {
                // Processar arquivo de texto
                const textChunks = await processTextFile(base64Data, file.name);
                
                logger.info('Processando arquivo de texto para OpenAI:', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: textChunks.length
                });
                
                // Adicionar cada chunk como uma mensagem separada
                textChunks.forEach((chunk) => {
                  content.push({
                    type: 'text',
                    text: chunk
                  });
                });
              } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                // Processar documento Word
                const wordChunks = await processWordDocument(base64Data, file.name);
                
                logger.info('Processando documento Word para OpenAI:', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: wordChunks.length
                });
                
                // Adicionar cada chunk como uma mensagem separada
                wordChunks.forEach((chunk) => {
                  content.push({
                    type: 'text',
                    text: chunk
                  });
                });
              } else if (file.type === 'text/csv') {
                // Processar arquivo CSV
                const csvChunks = await processCSVFile(base64Data, file.name);
                
                logger.info('Processando arquivo CSV para OpenAI:', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: csvChunks.length
                });
                
                // Adicionar cada chunk como texto
                csvChunks.forEach((chunk) => {
                  content.push({
                    type: 'text',
                    text: chunk
                  });
                });
              } else if (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                // Processar arquivo Excel
                const excelChunks = await processExcelFile(base64Data, file.name);
                
                logger.info('Processando arquivo Excel para OpenAI:', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: excelChunks.length
                });
                
                // Adicionar cada chunk como texto
                excelChunks.forEach((chunk) => {
                  content.push({
                    type: 'text',
                    text: chunk
                  });
                });
              }
            } catch (error) {
              logger.error(`Error processing ${file.type.startsWith('image/') ? 'image' : 'PDF'} for OpenAI:`, error);
              // Continua sem o arquivo se houver erro
            }
          }
          
          // Processar arquivos com fallback
          for (const file of fallbackProcessable) {
            try {
              const fallbackContent = await tryProcessUnsupportedFileAsText(file);
              if (fallbackContent) {
                content.push({
                  type: 'text',
                  text: `\n\n--- Conteúdo extraído do arquivo ${file.name} (fallback) ---\n${fallbackContent}`
                });
                logger.info('Arquivo processado com fallback para OpenAI streaming:', {
                  fileName: file.name,
                  fileType: file.type,
                  contentLength: fallbackContent.length
                });
              }
            } catch (error) {
              logger.warn('Falha no processamento de fallback para OpenAI streaming:', {
                fileName: file.name,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
          
          // Adicionar informação sobre arquivos não suportados ao texto
          if (invalidFiles.length > 0) {
            const unsupportedInfo = `\n\n[Nota: ${invalidFiles.length} arquivo(s) não puderam ser processados: ${invalidFiles.map(f => f.name).join(', ')}]`;
            content[0].text += unsupportedInfo;
          }
          
          return {
            role: msg.role,
            content
          };
        } else {
          // Mensagem apenas texto
          return {
            role: msg.role,
            content: msg.content
          };
        }
      })
    );
    
    // Usar o modelo solicitado (tentar GPT-5 primeiro se solicitado)
    let actualModel = model || 'gpt-4o';
    
    // Log detalhado do modelo que será enviado para a API OpenAI (streaming)
    logger.info('🚀 OPENAI STREAMING API CALL:', {
      requestedModel: model,
      actualModelUsed: actualModel,
      temperature: actualModel.startsWith('gpt-5') ? 1.0 : 0.7,
      messageCount: openaiMessages.length
    });
    
    // Log do modelo que será tentado
    logger.info('Tentando usar modelo OpenAI:', {
      requestedModel: model,
      actualModel: actualModel
    });
    
    // Ajustar temperatura baseada no modelo
    const temperature = actualModel.startsWith('gpt-5') ? 1.0 : 0.7;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: actualModel,
        messages: openaiMessages,
        temperature,
      });
      
      return {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        tokenCount: response.usage?.total_tokens,
        processingTime: 0 // Será preenchido pelo método principal
      };
    } catch (error: any) {
      // Tratamento específico para erro de verificação organizacional ou modelo não encontrado
      if (error?.error?.code === 'organization_verification_required' || 
          error?.message?.includes('organization verification') ||
          error?.message?.includes('verification required') ||
          (error?.status === 404 && actualModel.includes('gpt-5')) ||
          error?.error?.code === 'model_not_found') {
        
        logger.warn('Erro com modelo OpenAI detectado, usando fallback para GPT-4o', {
          originalModel: actualModel,
          fallbackModel: 'gpt-4o',
          errorType: error?.error?.code || error?.status || 'unknown',
          error: error.message
        });
        
        // Usar GPT-4o como fallback
        const fallbackResponse = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: openaiMessages,
          temperature,
        });
        
        // Adicionar nota sobre a limitação na resposta
        const noteContent = `[Nota: O modelo ${actualModel} requer verificação organizacional da OpenAI. Usando GPT-4o como alternativa.]\n\n`;
        
        return {
          content: noteContent + (fallbackResponse.choices[0]?.message?.content || ''),
          model: 'gpt-4o',
          tokenCount: fallbackResponse.usage?.total_tokens,
          processingTime: 0
        };
      } else {
        // Re-lançar outros erros
        throw error;
      }
    }
  }
  
  private async *streamWithOpenAI(messages: AIMessage[], model?: string): AsyncGenerator<StreamResponse> {
    if (!this.openai) throw new Error('OpenAI not initialized');
    
    // Converter mensagens para formato OpenAI com suporte multimodal
    const openaiMessages = await Promise.all(
      messages.map(async (msg) => {
        if (msg.files && msg.files.length > 0) {
          // Validar arquivos para OpenAI
          const { valid: validFiles, invalid: invalidFiles, errors, fallbackProcessable } = validateFilesForProvider(msg.files, 'openai');
          
          if (errors.length > 0) {
            logger.warn('Some files not supported by OpenAI streaming:', { errors, invalidFiles: invalidFiles.map(f => f.name), fallbackCount: fallbackProcessable.length });
          }
          
          // Validar limite de tokens para cada arquivo
          const processableFiles: FileAttachment[] = [];
          const fallbackFiles: FileAttachment[] = [];
          
          for (const file of validFiles) {
            const validation = validateOpenAITokenLimit(file);
            if (validation.canProcess) {
              processableFiles.push(file);
            } else {
              logger.warn('File exceeds OpenAI token limit for streaming:', validation.reason);
              fallbackFiles.push(file);
            }
          }
          
          // Se há arquivos que excedem o limite, lançar erro para fallback
          if (fallbackFiles.length > 0) {
            logger.info('Files exceed OpenAI token limit, will trigger fallback:', fallbackFiles.map(f => f.name));
            throw new Error(`Arquivo muito grande para OpenAI (${fallbackFiles[0]?.name}). Tentando próximo provedor.`);
          }
          
          // Mensagem com arquivos válidos - suporte multimodal
          const content: any[] = [{ type: 'text', text: msg.content }];
          
          for (const file of processableFiles) {
            try {
              let base64Data: string;
              
              // Usar fallback inteligente para conversão
              base64Data = await convertFileWithFallback(file);
              
              if (file.type.startsWith('image/')) {
                content.push({
                  type: 'image_url',
                  image_url: {
                    url: `data:${file.type};base64,${base64Data}`
                  }
                });
              } else if (file.type === 'application/pdf') {
                // OpenAI não suporta PDFs multimodais nativamente - extrair texto
                logger.info('Extraindo texto do PDF para OpenAI (streaming):', { fileName: file.name });
                
                try {
                  const textChunks = await extractPDFTextAndPrepare(base64Data, file.name);
                  
                  logger.info('PDF processado como texto para OpenAI (streaming):', {
                    fileName: file.name,
                    numChunks: textChunks.length
                  });
                  
                  // Adicionar cada chunk como texto
                  textChunks.forEach((chunk) => {
                    content.push({
                      type: 'text',
                      text: chunk
                    });
                  });
                } catch (error) {
                  logger.error('Erro ao extrair texto do PDF para OpenAI (streaming):', error);
                  // Fallback: adicionar como texto simples
                  content.push({
                    type: 'text',
                    text: `[PDF Document: ${file.name}]\nNão foi possível extrair o texto deste PDF. Por favor, descreva o conteúdo do documento.`
                  });
                }
              } else if (file.type === 'text/plain') {
                // Processar arquivo de texto (streaming)
                const textChunks = await processTextFile(base64Data, file.name);
                
                logger.info('Processando arquivo de texto para OpenAI (streaming):', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: textChunks.length
                });
                
                // Adicionar cada chunk como uma mensagem separada
                textChunks.forEach((chunk) => {
                  content.push({
                    type: 'text',
                    text: chunk
                  });
                });
              } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                // Processar documento Word (streaming)
                const wordChunks = await processWordDocument(base64Data, file.name);
                
                logger.info('Processando documento Word para OpenAI (streaming):', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: wordChunks.length
                });
                
                // Adicionar cada chunk como uma mensagem separada
                wordChunks.forEach((chunk) => {
                  content.push({
                    type: 'text',
                    text: chunk
                  });
                });
              } else if (file.type === 'text/csv') {
                // Processar arquivo CSV (streaming)
                const csvChunks = await processCSVFile(base64Data, file.name);
                
                logger.info('Processando arquivo CSV para OpenAI (streaming):', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: csvChunks.length
                });
                
                // Adicionar cada chunk como texto
                csvChunks.forEach((chunk) => {
                  content.push({
                    type: 'text',
                    text: chunk
                  });
                });
              } else if (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                // Processar arquivo Excel (streaming)
                const excelChunks = await processExcelFile(base64Data, file.name);
                
                logger.info('Processando arquivo Excel para OpenAI (streaming):', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: excelChunks.length
                });
                
                // Adicionar cada chunk como texto
                excelChunks.forEach((chunk) => {
                  content.push({
                    type: 'text',
                    text: chunk
                  });
                });
              }
            } catch (error) {
              logger.error(`Error processing ${file.type.startsWith('image/') ? 'image' : 'PDF'} for OpenAI streaming:`, error);
              // Continua sem o arquivo se houver erro
            }
          }
          
          // Adicionar informação sobre arquivos não suportados ao texto
          if (invalidFiles.length > 0) {
            const unsupportedInfo = `\n\n[Nota: ${invalidFiles.length} arquivo(s) não puderam ser processados: ${invalidFiles.map(f => f.name).join(', ')}]`;
            content[0].text += unsupportedInfo;
          }
          
          return {
            role: msg.role,
            content
          };
        } else {
          // Mensagem apenas texto
          return {
            role: msg.role,
            content: msg.content
          };
        }
      })
    );
    
    // Usar o modelo solicitado (tentar GPT-5 primeiro se solicitado)
    let actualModel = model || 'gpt-4o';
    
    // Log do modelo que será tentado para streaming
    logger.info('Tentando usar modelo OpenAI para streaming:', {
      requestedModel: model,
      actualModel: actualModel
    });
    
    // Ajustar temperatura baseada no modelo para streaming
    const temperature = actualModel.startsWith('gpt-5') ? 1.0 : 0.7;
    
    try {
      const stream = await this.openai.chat.completions.create({
        model: actualModel,
        messages: openaiMessages,
        temperature,
        stream: true,
      });
      
      let content = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        content += delta;
        
        yield {
          content: delta,
          isComplete: false,
          model: chunk.model
        };
      }
      
      yield {
        content: '',
        isComplete: true,
        model: actualModel
      };
    } catch (error: any) {
      // Tratamento específico para erro de verificação organizacional ou streaming não suportado
      if (error?.error?.code === 'organization_verification_required' || 
          error?.error?.code === 'unsupported_value' ||
          error?.message?.includes('organization verification') ||
          error?.message?.includes('verification required') ||
          error?.message?.includes('must be verified to stream')) {
        
        logger.warn('Erro de streaming OpenAI detectado, tentando modo não-streaming', {
          originalModel: actualModel,
          errorCode: error?.error?.code,
          error: error.message
        });
        
        try {
          // Tentar modo não-streaming primeiro com o modelo original
          const nonStreamResponse = await this.openai.chat.completions.create({
            model: actualModel,
            messages: openaiMessages,
            temperature,
            stream: false,
          });
          
          const responseContent = nonStreamResponse.choices[0]?.message?.content || '';
          
          // Informar ao usuário sobre a limitação
          yield {
            content: `[Nota: Streaming não disponível para ${actualModel}. Usando modo padrão.]\n\n`,
            isComplete: false,
            model: actualModel
          };
          
          // Simular streaming dividindo a resposta em chunks
          const words = responseContent.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            yield {
              content: chunk,
              isComplete: false,
              model: actualModel
            };
            // Pequeno delay para simular streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          yield {
            content: '',
            isComplete: true,
            model: actualModel
          };
          
        } catch (nonStreamError: any) {
          // Se modo não-streaming também falhar, usar GPT-4o como fallback
          logger.warn('Modo não-streaming também falhou, usando GPT-4o como fallback', {
            originalModel: actualModel,
            fallbackModel: 'gpt-4o',
            error: nonStreamError.message
          });
          
          const fallbackStream = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: openaiMessages,
            temperature,
            stream: true,
          });
          
          // Informar ao usuário sobre o fallback
          yield {
            content: `[Nota: O modelo ${actualModel} não está disponível no momento. Usando GPT-4o como alternativa.]\n\n`,
            isComplete: false,
            model: 'gpt-4o'
          };
          
          let content = '';
          for await (const chunk of fallbackStream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            content += delta;
            
            yield {
              content: delta,
              isComplete: false,
              model: 'gpt-4o'
            };
          }
          
          yield {
            content: '',
            isComplete: true,
            model: 'gpt-4o'
          };
        }
      } else {
        // Re-lançar outros erros
        throw error;
      }
    }
  }
  
  private async chatWithAnthropic(messages: AIMessage[], model?: string): Promise<AIResponse> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');
    
    // Converter mensagens para formato Anthropic com suporte multimodal
    const anthropicMessages = await Promise.all(
      messages.filter(msg => msg.role !== 'system').map(async (msg) => {
        if (msg.files && msg.files.length > 0) {
          // Validar arquivos para Anthropic
          const { valid: validFiles, invalid: invalidFiles, errors, fallbackProcessable } = validateFilesForProvider(msg.files, 'anthropic');
          
          if (errors.length > 0) {
            logger.warn('Some files not supported by Anthropic:', { errors, invalidFiles: invalidFiles.map(f => f.name), fallbackCount: fallbackProcessable.length });
          }
          
          // Mensagem com arquivos válidos - suporte multimodal
          const content: any[] = [{ type: 'text', text: msg.content }];
          
          for (const file of validFiles) {
            if (file.type.startsWith('image/')) {
              try {
                let base64Data: string;
                
                // Usar fallback inteligente para conversão
                base64Data = await convertFileWithFallback(file);
                
                content.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: file.type,
                    data: base64Data
                  }
                });
              } catch (error) {
                logger.error('Error processing image for Anthropic:', error);
                // Continua sem a imagem se houver erro
              }
            } else if (file.type === 'application/pdf') {
              try {
                let base64Data: string;
                
                // Usar fallback inteligente para conversão
                base64Data = await convertFileWithFallback(file);
                
                content.push({
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: file.type,
                    data: base64Data
                  }
                });
              } catch (error) {
                logger.error('Error processing PDF for Anthropic:', error);
                // Continua sem o PDF se houver erro
              }
            } else if (file.type === 'text/plain') {
              try {
                let base64Data: string;
                
                // Usar fallback inteligente para conversão
                base64Data = await convertFileWithFallback(file);
                
                // Processar arquivo de texto
                const textChunks = await processTextFile(base64Data, file.name);
                
                logger.info('Processando arquivo de texto para Anthropic:', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: textChunks.length
                });
                
                // Adicionar cada chunk como texto
                textChunks.forEach((chunk, index) => {
                  content.push({
                    type: 'text',
                    text: `\n\n--- Conteúdo do arquivo ${file.name} (parte ${index + 1}/${textChunks.length}) ---\n${chunk}`
                  });
                });
              } catch (error) {
                logger.error('Error processing text file for Anthropic:', error);
                // Continua sem o arquivo se houver erro
              }
            } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              try {
                let base64Data: string;
                
                // Usar fallback inteligente para conversão
                base64Data = await convertFileWithFallback(file);
                
                // Processar documento Word
                const wordChunks = await processWordDocument(base64Data, file.name);
                
                logger.info('Processando documento Word para Anthropic:', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: wordChunks.length
                });
                
                // Adicionar cada chunk como texto
                wordChunks.forEach((chunk, index) => {
                  content.push({
                    type: 'text',
                    text: `\n\n--- Conteúdo do documento ${file.name} (parte ${index + 1}/${wordChunks.length}) ---\n${chunk}`
                  });
                });
              } catch (error) {
                logger.error('Error processing Word document for Anthropic:', error);
                // Continua sem o documento se houver erro
              }
            }
          }
          
          // Adicionar informação sobre arquivos não suportados ao texto
          if (invalidFiles.length > 0) {
            const unsupportedInfo = `\n\n[Nota: ${invalidFiles.length} arquivo(s) não puderam ser processados: ${invalidFiles.map(f => f.name).join(', ')}]`;
            content[0].text += unsupportedInfo;
          }
          
          return {
            role: msg.role as 'user' | 'assistant',
            content
          };
        } else {
          // Mensagem apenas texto
          return {
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          };
        }
      })
    );
    
    const response = await this.anthropic.messages.create({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: anthropicMessages,
      system: messages.find(msg => msg.role === 'system')?.content
    });
    
    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    return {
      content,
      model: response.model,
      tokenCount: response.usage.input_tokens + response.usage.output_tokens,
      processingTime: 0
    };
  }
  
  private async *streamWithAnthropic(messages: AIMessage[], model?: string): AsyncGenerator<StreamResponse> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');
    
    // Converter mensagens para formato Anthropic com suporte multimodal
    const anthropicMessages = await Promise.all(
      messages.filter(msg => msg.role !== 'system').map(async (msg) => {
        if (msg.files && msg.files.length > 0) {
          // Validar arquivos para Anthropic
          const { valid: validFiles, invalid: invalidFiles, errors, fallbackProcessable } = validateFilesForProvider(msg.files, 'anthropic');
          
          if (errors.length > 0) {
            logger.warn('Some files not supported by Anthropic streaming:', { errors, invalidFiles: invalidFiles.map(f => f.name), fallbackCount: fallbackProcessable.length });
          }
          
          // Mensagem com arquivos válidos - suporte multimodal
          const content: any[] = [{ type: 'text', text: msg.content }];
          
          for (const file of validFiles) {
            if (file.type.startsWith('image/')) {
              try {
                let base64Data: string;
                
                // Usar fallback inteligente para conversão
                base64Data = await convertFileWithFallback(file);
                
                content.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: file.type,
                    data: base64Data
                  }
                });
              } catch (error) {
                logger.error('Error processing image for Anthropic streaming:', error);
                // Continua sem a imagem se houver erro
              }
            } else if (file.type === 'application/pdf') {
              try {
                let base64Data: string;
                
                // Usar fallback inteligente para conversão
                base64Data = await convertFileWithFallback(file);
                
                content.push({
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: file.type,
                    data: base64Data
                  }
                });
              } catch (error) {
                logger.error('Error processing PDF for Anthropic streaming:', error);
                // Continua sem o PDF se houver erro
              }
            } else if (file.type === 'text/plain') {
              try {
                let base64Data: string;
                
                // Usar fallback inteligente para conversão
                base64Data = await convertFileWithFallback(file);
                
                // Processar arquivo de texto
                const textChunks = await processTextFile(base64Data, file.name);
                
                logger.info('Processando arquivo de texto para Anthropic (streaming):', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: textChunks.length
                });
                
                // Adicionar cada chunk como texto
                textChunks.forEach((chunk, index) => {
                  content.push({
                    type: 'text',
                    text: `\n\n--- Conteúdo do arquivo ${file.name} (parte ${index + 1}/${textChunks.length}) ---\n${chunk}`
                  });
                });
              } catch (error) {
                logger.error('Error processing text file for Anthropic streaming:', error);
                // Continua sem o arquivo se houver erro
              }
            } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              try {
                let base64Data: string;
                
                // Usar fallback inteligente para conversão
                base64Data = await convertFileWithFallback(file);
                
                // Processar documento Word
                const wordChunks = await processWordDocument(base64Data, file.name);
                
                logger.info('Processando documento Word para Anthropic (streaming):', {
                  fileName: file.name,
                  fileSize: file.size,
                  numChunks: wordChunks.length
                });
                
                // Adicionar cada chunk como texto
                wordChunks.forEach((chunk, index) => {
                  content.push({
                    type: 'text',
                    text: `\n\n--- Conteúdo do documento ${file.name} (parte ${index + 1}/${wordChunks.length}) ---\n${chunk}`
                  });
                });
              } catch (error) {
                logger.error('Error processing Word document for Anthropic streaming:', error);
                // Continua sem o documento se houver erro
              }
            }
          }
          
          // Adicionar informação sobre arquivos não suportados ao texto
          if (invalidFiles.length > 0) {
            const unsupportedInfo = `\n\n[Nota: ${invalidFiles.length} arquivo(s) não puderam ser processados: ${invalidFiles.map(f => f.name).join(', ')}]`;
            content[0].text += unsupportedInfo;
          }
          
          return {
            role: msg.role as 'user' | 'assistant',
            content
          };
        } else {
          // Mensagem apenas texto
          return {
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          };
        }
      })
    );
    
    const stream = await this.anthropic.messages.create({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: anthropicMessages,
      system: messages.find(msg => msg.role === 'system')?.content,
      stream: true
    });
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield {
          content: chunk.delta.text,
          isComplete: false,
          model: model || 'claude-3-5-sonnet-20241022'
        };
      }
    }
    
    yield {
      content: '',
      isComplete: true,
      model: model || 'claude-3-5-sonnet-20241022'
    };
  }
  
  private async chatWithGoogle(messages: AIMessage[], model?: string): Promise<AIResponse> {
    if (!this.googleAI) throw new Error('Google AI not initialized');
    
    const googleModel = this.googleAI.getGenerativeModel({ model: model || 'gemini-2.0-flash-exp' });
    
    // Converter mensagens para formato do Google com suporte multimodal
    const history = await Promise.all(
      messages.slice(0, -1).map(async (msg) => {
        const parts: any[] = [{ text: msg.content }];
        
        if (msg.files && msg.files.length > 0) {
          // Validar arquivos para Google
          const { valid: validFiles, invalid: invalidFiles, errors, fallbackProcessable } = validateFilesForProvider(msg.files, 'google');
          
          if (errors.length > 0) {
            logger.warn('Some files not supported by Google:', { errors, invalidFiles: invalidFiles.map(f => f.name), fallbackCount: fallbackProcessable.length });
          }
          
          for (const file of validFiles) {
            if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'text/plain' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              try {
                logger.info('Processing file for Google AI:', { 
                  fileName: file.name, 
                  fileType: file.type, 
                  fileSize: file.size,
                  hasBase64: !!file.base64,
                  hasFileObject: !!file.file_object,
                  fileUrl: file.url 
                });
                
                const base64Data = await convertFileWithFallback(file);
                
                logger.info('File processed successfully for Google AI:', {
                  fileName: file.name,
                  base64Length: base64Data.length,
                  mimeType: file.type
                });
                
                // Para arquivos de texto e Word, processar o conteúdo e adicionar como texto
                if (file.type === 'text/plain') {
                  const textChunks = await processTextFile(base64Data, file.name);
                  textChunks.forEach((chunk, index) => {
                    parts.push({
                      text: `\n\n--- Conteúdo do arquivo ${file.name} (parte ${index + 1}/${textChunks.length}) ---\n${chunk}`
                    });
                  });
                } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                  const wordChunks = await processWordDocument(base64Data, file.name);
                  wordChunks.forEach((chunk, index) => {
                    parts.push({
                      text: `\n\n--- Conteúdo do documento ${file.name} (parte ${index + 1}/${wordChunks.length}) ---\n${chunk}`
                    });
                  });
                } else {
                  // Para outros tipos (imagens, PDF, CSV, Excel), usar inlineData
                  parts.push({
                    inlineData: {
                      mimeType: file.type,
                      data: base64Data
                    }
                  });
                }
              } catch (error) {
                const fileTypeDescription = file.type.startsWith('image/') ? 'image' : 
                  file.type === 'application/pdf' ? 'PDF' : 
                  file.type === 'text/csv' ? 'CSV' : 
                  file.type.includes('excel') || file.type.includes('spreadsheet') ? 'Excel' : 
                  file.type === 'text/plain' ? 'text file' : 
                  file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'Word document' : 'file';
                logger.error(`Error processing ${fileTypeDescription} for Google AI:`, {
                  fileName: file.name,
                  fileType: file.type,
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
                // Continua sem o arquivo se houver erro
              }
            }
          }
          
          // Adicionar informação sobre arquivos não suportados ao texto
          if (invalidFiles.length > 0) {
            const unsupportedInfo = `\n\n[Nota: ${invalidFiles.length} arquivo(s) não puderam ser processados: ${invalidFiles.map(f => f.name).join(', ')}]`;
            parts[0].text += unsupportedInfo;
          }
        }
        
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        };
      })
    );
    
    const lastMessage = messages[messages.length - 1];
    
    // Verificar tipos de arquivo para ajustar o prompt
    const hasPdfs = lastMessage.files?.some(f => f.type === 'application/pdf') || false;
    const hasCsvs = lastMessage.files?.some(f => f.type === 'text/csv') || false;
    const hasExcel = lastMessage.files?.some(f => f.type === 'application/vnd.ms-excel' || f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || false;
    let enhancedContent = lastMessage.content;
    
    if (hasPdfs) {
      enhancedContent = `${lastMessage.content}

[INSTRUÇÃO IMPORTANTE: Analise semanticamente o conteúdo do documento PDF fornecido. Não faça apenas OCR ou extração de texto. Compreenda o contexto, identifique o tipo de documento, extraia informações relevantes e forneça insights úteis sobre o conteúdo. Se for uma DANFE (Documento Auxiliar da Nota Fiscal Eletrônica), identifique produtos, valores, impostos, dados do emissor/destinatário, etc.]`;
    } else if (hasCsvs) {
      enhancedContent = `${lastMessage.content}

[INSTRUÇÃO IMPORTANTE: Analise o arquivo CSV fornecido como dados tabulares. Identifique as colunas, tipos de dados, padrões, tendências e insights relevantes. Forneça um resumo estruturado dos dados, estatísticas básicas quando aplicável, e responda às perguntas do usuário com base no conteúdo da planilha.]`;
    } else if (hasExcel) {
      enhancedContent = `${lastMessage.content}

[INSTRUÇÃO IMPORTANTE: Analise a planilha Excel fornecida. Identifique as abas, colunas, fórmulas, gráficos e dados. Extraia informações relevantes, calcule estatísticas quando necessário, e forneça insights baseados no conteúdo da planilha. Responda às perguntas considerando a estrutura e dados da planilha.]`;
    }
    
    const lastMessageParts: any[] = [{ text: enhancedContent }];
    
    if (lastMessage.files && lastMessage.files.length > 0) {
      // Validar arquivos para Google
      const { valid: validFiles, invalid: invalidFiles, errors, fallbackProcessable } = validateFilesForProvider(lastMessage.files, 'google');
      
      if (errors.length > 0) {
        logger.warn('Some files not supported by Google:', { errors, invalidFiles: invalidFiles.map(f => f.name), fallbackCount: fallbackProcessable.length });
      }
      
      for (const file of validFiles) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'text/plain' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          try {
            logger.info('Processing file for Google AI (last message):', { 
              fileName: file.name, 
              fileType: file.type, 
              fileSize: file.size,
              hasBase64: !!file.base64,
              hasFileObject: !!file.file_object,
              fileUrl: file.url 
            });
            
            const base64Data = await convertFileWithFallback(file);
            
            logger.info('File processed successfully for Google AI (last message):', {
              fileName: file.name,
              base64Length: base64Data.length,
              mimeType: file.type
            });
            
            // Para arquivos de texto e Word, processar o conteúdo e adicionar como texto
            if (file.type === 'text/plain') {
              const textChunks = await processTextFile(base64Data, file.name);
              textChunks.forEach((chunk, index) => {
                lastMessageParts[0].text += `\n\n--- Conteúdo do arquivo ${file.name} (parte ${index + 1}/${textChunks.length}) ---\n${chunk}`;
              });
            } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              const wordChunks = await processWordDocument(base64Data, file.name);
              wordChunks.forEach((chunk, index) => {
                lastMessageParts[0].text += `\n\n--- Conteúdo do documento ${file.name} (parte ${index + 1}/${wordChunks.length}) ---\n${chunk}`;
              });
            } else if (file.type === 'text/csv') {
              const csvChunks = await processCSVFile(base64Data, file.name);
              csvChunks.forEach((chunk, index) => {
                lastMessageParts[0].text += `\n\n--- Dados do CSV ${file.name} (parte ${index + 1}/${csvChunks.length}) ---\n${chunk}`;
              });
            } else if (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
              const excelChunks = await processExcelFile(base64Data, file.name);
              excelChunks.forEach((chunk, index) => {
                lastMessageParts[0].text += `\n\n--- Dados do Excel ${file.name} (parte ${index + 1}/${excelChunks.length}) ---\n${chunk}`;
              });
            } else {
              // Para outros tipos (imagens, PDF), usar inlineData
              lastMessageParts.push({
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              });
            }
          } catch (error) {
                const fileTypeDescription = file.type.startsWith('image/') ? 'image' : 
                  file.type === 'application/pdf' ? 'PDF' : 
                  file.type === 'text/csv' ? 'CSV' : 
                  file.type.includes('excel') || file.type.includes('spreadsheet') ? 'Excel' : 
                  file.type === 'text/plain' ? 'text file' : 
                  file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'Word document' : 'file';
                logger.error(`Error processing ${fileTypeDescription} for Google AI (last message):`, {
              fileName: file.name,
              fileType: file.type,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Continua sem o arquivo se houver erro
          }
        }
      }
      
      // Adicionar informação sobre arquivos não suportados ao texto
      if (invalidFiles.length > 0) {
        const unsupportedInfo = `\n\n[Nota: ${invalidFiles.length} arquivo(s) não puderam ser processados: ${invalidFiles.map(f => f.name).join(', ')}]`;
        lastMessageParts[0].text += unsupportedInfo;
      }
    }
    
    const chat = googleModel.startChat({ history });
    const result = await chat.sendMessage(lastMessageParts);
    
    return {
      content: result.response.text(),
      model: model || 'gemini-2.0-flash-exp',
      tokenCount: result.response.usageMetadata?.totalTokenCount,
      processingTime: 0
    };
  }
  
  private async *streamWithGoogle(messages: AIMessage[], model?: string): AsyncGenerator<StreamResponse> {
    if (!this.googleAI) throw new Error('Google AI not initialized');
    
    const googleModel = this.googleAI.getGenerativeModel({ model: model || 'gemini-2.0-flash-exp' });
    
    // Converter mensagens para formato do Google com suporte multimodal
    const history = await Promise.all(
      messages.slice(0, -1).map(async (msg) => {
        const parts: any[] = [{ text: msg.content }];
        
        if (msg.files && msg.files.length > 0) {
          // Validar arquivos para Google
          const { valid: validFiles, invalid: invalidFiles, errors, fallbackProcessable } = validateFilesForProvider(msg.files, 'google');
          
          if (errors.length > 0) {
            logger.warn('Some files not supported by Google streaming:', { errors, invalidFiles: invalidFiles.map(f => f.name), fallbackCount: fallbackProcessable.length });
          }
          
          for (const file of validFiles) {
            if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'text/plain' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              try {
                // Processar arquivos de texto e Word
                if (file.type === 'text/plain') {
                  const chunks = await processTextFile(file.base64 || '', file.name);
                  logger.info('Text file processed for Google AI streaming (history):', {
                    fileName: file.name,
                    chunksCount: chunks.length
                  });
                  
                  // Adicionar chunks como texto
                  const textContent = chunks.join('\n\n');
                  parts[0].text += `\n\n[Conteúdo do arquivo ${file.name}:]\n${textContent}`;
                } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                  const chunks = await processWordDocument(file.base64 || '', file.name);
                  logger.info('Word document processed for Google AI streaming (history):', {
                    fileName: file.name,
                    chunksCount: chunks.length
                  });
                  
                  // Adicionar chunks como texto
                  const textContent = chunks.join('\n\n');
                  parts[0].text += `\n\n[Conteúdo do documento ${file.name}:]\n${textContent}`;
                } else if (file.type === 'text/csv') {
                  const chunks = await processCSVFile(file.base64 || '', file.name);
                  logger.info('CSV file processed for Google AI streaming (history):', {
                    fileName: file.name,
                    chunksCount: chunks.length
                  });
                  
                  // Adicionar chunks como texto
                  const textContent = chunks.join('\n\n');
                  parts[0].text += `\n\n[Dados do CSV ${file.name}:]\n${textContent}`;
                } else if (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                  const chunks = await processExcelFile(file.base64 || '', file.name);
                  logger.info('Excel file processed for Google AI streaming (history):', {
                    fileName: file.name,
                    chunksCount: chunks.length
                  });
                  
                  // Adicionar chunks como texto
                  const textContent = chunks.join('\n\n');
                  parts[0].text += `\n\n[Dados do Excel ${file.name}:]\n${textContent}`;
                } else {
                  // Processar outros tipos de arquivo (imagens, PDF)
                  const base64Data = await convertFileWithFallback(file);
                  
                  parts.push({
                    inlineData: {
                      mimeType: file.type,
                      data: base64Data
                    }
                  });
                }
              } catch (error) {
                const fileTypeDescription = file.type.startsWith('image/') ? 'image' : 
                  file.type === 'application/pdf' ? 'PDF' : 
                  file.type === 'text/csv' ? 'CSV' : 
                  file.type.includes('excel') || file.type.includes('spreadsheet') ? 'Excel' : 'file';
                logger.error(`Error processing ${fileTypeDescription} for Google AI streaming:`, error);
                // Continua sem o arquivo se houver erro
              }
            }
          }
          
          // Adicionar informação sobre arquivos não suportados ao texto
          if (invalidFiles.length > 0) {
            const unsupportedInfo = `\n\n[Nota: ${invalidFiles.length} arquivo(s) não puderam ser processados: ${invalidFiles.map(f => f.name).join(', ')}]`;
            parts[0].text += unsupportedInfo;
          }
        }
        
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        };
      })
    );
    
    const lastMessage = messages[messages.length - 1];
    
    // Verificar tipos de arquivo para ajustar o prompt
    const hasPdfs = lastMessage.files?.some(f => f.type === 'application/pdf') || false;
    const hasCsvs = lastMessage.files?.some(f => f.type === 'text/csv') || false;
    const hasExcel = lastMessage.files?.some(f => f.type === 'application/vnd.ms-excel' || f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || false;
    let enhancedContent = lastMessage.content;
    
    if (hasPdfs) {
      enhancedContent = `${lastMessage.content}

[INSTRUÇÃO IMPORTANTE: Analise semanticamente o conteúdo do documento PDF fornecido. Não faça apenas OCR ou extração de texto. Compreenda o contexto, identifique o tipo de documento, extraia informações relevantes e forneça insights úteis sobre o conteúdo. Se for uma DANFE (Documento Auxiliar da Nota Fiscal Eletrônica), identifique produtos, valores, impostos, dados do emissor/destinatário, etc.]`;
    } else if (hasCsvs) {
      enhancedContent = `${lastMessage.content}

[INSTRUÇÃO IMPORTANTE: Analise o arquivo CSV fornecido como dados tabulares. Identifique as colunas, tipos de dados, padrões, tendências e insights relevantes. Forneça um resumo estruturado dos dados, estatísticas básicas quando aplicável, e responda às perguntas do usuário com base no conteúdo da planilha.]`;
    } else if (hasExcel) {
      enhancedContent = `${lastMessage.content}

[INSTRUÇÃO IMPORTANTE: Analise a planilha Excel fornecida. Identifique as abas, colunas, fórmulas, gráficos e dados. Extraia informações relevantes, calcule estatísticas quando necessário, e forneça insights baseados no conteúdo da planilha. Responda às perguntas considerando a estrutura e dados da planilha.]`;
    }
    
    const lastMessageParts: any[] = [{ text: enhancedContent }];
    
    if (lastMessage.files && lastMessage.files.length > 0) {
      // Validar arquivos para Google
      const { valid: validFiles, invalid: invalidFiles, errors, fallbackProcessable } = validateFilesForProvider(lastMessage.files, 'google');
      
      if (errors.length > 0) {
        logger.warn('Some files not supported by Google streaming:', { errors, invalidFiles: invalidFiles.map(f => f.name), fallbackCount: fallbackProcessable.length });
      }
      
      for (const file of validFiles) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'text/plain' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          try {
            // Processar arquivos de texto e Word
            if (file.type === 'text/plain') {
              const chunks = await processTextFile(file.base64 || '', file.name);
              logger.info('Text file processed for Google AI streaming (last message):', {
                fileName: file.name,
                chunksCount: chunks.length
              });
              
              // Adicionar chunks como texto
              const textContent = chunks.join('\n\n');
              lastMessageParts[0].text += `\n\n[Conteúdo do arquivo ${file.name}:]\n${textContent}`;
            } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              const chunks = await processWordDocument(file.base64 || '', file.name);
              logger.info('Word document processed for Google AI streaming (last message):', {
                fileName: file.name,
                chunksCount: chunks.length
              });
              
              // Adicionar chunks como texto
              const textContent = chunks.join('\n\n');
              lastMessageParts[0].text += `\n\n[Conteúdo do documento ${file.name}:]\n${textContent}`;
            } else if (file.type === 'text/csv') {
              const chunks = await processCSVFile(file.base64 || '', file.name);
              logger.info('CSV file processed for Google AI streaming (last message):', {
                fileName: file.name,
                chunksCount: chunks.length
              });
              
              // Adicionar chunks como texto
              const textContent = chunks.join('\n\n');
              lastMessageParts[0].text += `\n\n[Dados do CSV ${file.name}:]\n${textContent}`;
            } else if (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
              const chunks = await processExcelFile(file.base64 || '', file.name);
              logger.info('Excel file processed for Google AI streaming (last message):', {
                fileName: file.name,
                chunksCount: chunks.length
              });
              
              // Adicionar chunks como texto
              const textContent = chunks.join('\n\n');
              lastMessageParts[0].text += `\n\n[Dados do Excel ${file.name}:]\n${textContent}`;
            } else {
              // Processar outros tipos de arquivo (imagens, PDF)
              const base64Data = await convertFileWithFallback(file);
              
              lastMessageParts.push({
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              });
            }
          } catch (error) {
              const fileTypeDescription = file.type.startsWith('image/') ? 'image' : 
                file.type === 'application/pdf' ? 'PDF' : 
                file.type === 'text/csv' ? 'CSV' : 
                file.type.includes('excel') || file.type.includes('spreadsheet') ? 'Excel' : 
                file.type === 'text/plain' ? 'text file' : 
                file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'Word document' : 'file';
              logger.error(`Error processing ${fileTypeDescription} for Google AI streaming:`, error);
            // Continua sem o arquivo se houver erro
          }
        }
      }
      
      // Adicionar informação sobre arquivos não suportados ao texto
      if (invalidFiles.length > 0) {
        const unsupportedInfo = `\n\n[Nota: ${invalidFiles.length} arquivo(s) não puderam ser processados: ${invalidFiles.map(f => f.name).join(', ')}]`;
        lastMessageParts[0].text += unsupportedInfo;
      }
    }
    
    const chat = googleModel.startChat({ history });
    const result = await chat.sendMessageStream(lastMessageParts);
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield {
          content: text,
          isComplete: false,
          model: model || 'gemini-2.0-flash-exp'
        };
      }
    }
    
    yield {
      content: '',
      isComplete: true,
      model: model || 'gemini-2.0-flash-exp'
    };
  }
  
  // Métodos utilitários
  getAvailableProviders(): string[] {
    return [...this.providers];
  }
  
  isProviderAvailable(provider: string): boolean {
    return this.providers.includes(provider);
  }
}

// Instância singleton
export const aiProviderManager = new AIProviderManager();

// Funções de conveniência
export const chatWithAI = (messages: AIMessage[], userId: string, preferredProvider?: string) => 
  aiProviderManager.chat(messages, userId, preferredProvider);

export const streamChatWithAI = (messages: AIMessage[], userId: string, preferredProvider?: string) => 
  aiProviderManager.chatStream(messages, userId, preferredProvider);

export const getAvailableAIProviders = () => aiProviderManager.getAvailableProviders();

// Função para mapear modelo para provedor
export const getProviderFromModel = (model: string): string => {
  const modelToProvider: Record<string, string> = {
    'gpt-4o': 'openai',
    'gpt-4o-mini': 'openai',
    'gpt-4': 'openai',
    'gpt-3.5-turbo': 'openai',
    'gpt-5': 'openai',
    'gpt-5-chat': 'openai',
    'gpt-5-nano': 'openai',
    'gpt-5-mini': 'openai',
    'claude-3-5-sonnet-20241022': 'anthropic',
    'claude-3-5-haiku-20241022': 'anthropic',
    'claude-3-opus-20240229': 'anthropic',
    'gemini-2.0-flash-exp': 'google',
    'gemini-1.5-pro': 'google',
    'gemini-1.5-flash': 'google'
  };
  
  return modelToProvider[model] || 'openai';
};