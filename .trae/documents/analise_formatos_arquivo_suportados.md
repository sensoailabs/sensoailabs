# Análise Completa dos Formatos de Arquivo Suportados

## 1. Estado Atual do Sistema

### 1.1 Formatos Aceitos no Frontend (ChatInput)
```typescript
accept: "image/*,application/pdf,.doc,.docx,.txt,.zip,.rar,.csv,.xls,.xlsx"
```

### 1.2 Formatos Validados no Backend (chatService)
```typescript
ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
```

### 1.3 Formatos Processados pelos AI Providers

#### OpenAI (ChatGPT)
- **Suportados**: image/jpeg, image/png, image/gif, image/webp, application/pdf, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- **Processamento**: Imagens e PDFs com extração de texto + fallback base64

#### Google AI (Gemini)
- **Suportados**: image/jpeg, image/png, image/gif, image/webp, application/pdf, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- **Processamento**: Imagens e PDFs com extração de texto + fallback base64

#### Anthropic (Claude)
- **Suportados**: image/jpeg, image/png, image/gif, image/webp, application/pdf
- **Processamento**: Apenas imagens e PDFs

## 2. Gaps Identificados

### 2.1 Formatos Aceitos mas Não Processados
- **.doc/.docx**: Aceitos no frontend e backend, mas não têm processamento específico nos AI providers
- **.txt**: Aceito no frontend e backend, mas não processado pelos AI providers
- **.zip/.rar**: Aceitos no frontend, mas não validados no backend nem processados

### 2.2 Processamento Limitado
- **CSV/Excel**: Aceitos em todos os providers, mas apenas convertidos para base64 sem extração de dados estruturados
- **PDFs**: Funcionando corretamente após correção da versão do pdfjs-dist

### 2.3 Inconsistências entre Providers
- **Anthropic**: Não suporta CSV/Excel, limitado a imagens e PDFs
- **OpenAI/Google**: Suportam mais formatos mas com processamento básico

## 3. Plano de Implementação

### 3.1 Prioridade Alta - Documentos Word

**Objetivo**: Adicionar suporte completo para .doc e .docx

**Implementação**:
- Instalar biblioteca `mammoth` para extração de texto de documentos Word
- Adicionar processamento específico em `aiProviders.ts`
- Implementar fallback para base64 se extração falhar

```typescript
// Exemplo de implementação
import mammoth from 'mammoth';

async function processWordDocument(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.warn('Falha na extração de texto do Word, usando base64:', error);
    return await fileToBase64(file);
  }
}
```

### 3.2 Prioridade Alta - Arquivos de Texto

**Objetivo**: Processar arquivos .txt diretamente

**Implementação**:
- Ler conteúdo do arquivo como texto UTF-8
- Adicionar ao contexto da mensagem como texto puro

```typescript
async function processTextFile(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.warn('Falha na leitura do arquivo de texto:', error);
    return await fileToBase64(file);
  }
}
```

### 3.3 Prioridade Média - CSV/Excel Estruturado

**Objetivo**: Extrair dados estruturados ao invés de base64

**Implementação**:
- Instalar biblioteca `xlsx` para processamento de planilhas
- Converter dados para formato JSON estruturado
- Incluir metadados (colunas, tipos de dados, resumo)

```typescript
import * as XLSX from 'xlsx';

async function processSpreadsheet(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    return JSON.stringify({
      fileName: file.name,
      sheetName,
      rowCount: jsonData.length,
      columns: Object.keys(jsonData[0] || {}),
      data: jsonData.slice(0, 100) // Limitar para evitar tokens excessivos
    }, null, 2);
  } catch (error) {
    console.warn('Falha no processamento da planilha, usando base64:', error);
    return await fileToBase64(file);
  }
}
```

### 3.4 Prioridade Baixa - Arquivos Comprimidos

**Objetivo**: Extrair e processar conteúdo de arquivos .zip/.rar

**Considerações**:
- Complexidade de implementação alta
- Riscos de segurança (arquivos maliciosos)
- Necessidade de limites de tamanho e tipos de arquivo internos
- Recomendação: Remover do frontend por enquanto

## 4. Recomendações Técnicas

### 4.1 Bibliotecas Necessárias

```json
{
  "dependencies": {
    "mammoth": "^1.6.0",
    "xlsx": "^0.18.5"
  }
}
```

### 4.2 Limites de Tamanho por Tipo

| Formato | Tamanho Máximo | Justificativa |
|---------|----------------|---------------|
| Imagens | 10MB | Processamento visual |
| PDFs | 20MB | Documentos complexos |
| Word | 15MB | Documentos longos |
| Excel/CSV | 10MB | Dados estruturados |
| Texto | 5MB | Arquivos de código/logs |

### 4.3 Estratégias de Fallback

1. **Extração de Texto**: Tentar extrair texto estruturado primeiro
2. **Base64 Fallback**: Se extração falhar, converter para base64
3. **Chunking**: Para arquivos grandes, dividir em chunks menores
4. **Compressão**: Comprimir texto extraído se necessário

### 4.4 Otimizações de Performance

- **Lazy Loading**: Carregar bibliotecas apenas quando necessário
- **Web Workers**: Processar arquivos grandes em background
- **Cache**: Cachear resultados de extração de texto
- **Streaming**: Para arquivos muito grandes, processar em streams

## 5. Implementação Gradual

### Fase 1 (Imediata)
- Adicionar processamento para arquivos .txt
- Implementar extração de texto para documentos Word
- Remover .zip/.rar do frontend temporariamente

### Fase 2 (Curto Prazo)
- Melhorar processamento de CSV/Excel com dados estruturados
- Adicionar suporte para PowerPoint (.ppt/.pptx)
- Implementar chunking inteligente para arquivos grandes

### Fase 3 (Médio Prazo)
- Adicionar suporte para mais formatos de imagem (SVG, TIFF)
- Implementar processamento de arquivos comprimidos com segurança
- Adicionar OCR para imagens com texto

## 6. Monitoramento e Métricas

- **Taxa de Sucesso**: Porcentagem de arquivos processados com sucesso
- **Tempo de Processamento**: Tempo médio por tipo de arquivo
- **Uso de Fallback**: Frequência de uso do fallback base64
- **Erros por Formato**: Identificar formatos problemáticos

## 7. Conclusão

O sistema atual tem uma base sólida para processamento multimodal, mas existem gaps significativos entre os formatos aceitos no frontend e o processamento real pelos AI providers. A implementação das melhorias propostas garantirá que todos os formatos aceitos sejam processados adequadamente, melhorando a experiência do usuário e a capacidade de análise da IA.

**Próximos Passos**:
1. Implementar suporte para documentos Word (.doc/.docx)
2. Adicionar processamento de arquivos de texto (.txt)
3. Melhorar processamento de planilhas com dados estruturados
4. Testar com diferentes tipos de arquivo e tamanhos
5. Monitorar performance e ajustar conforme necessário