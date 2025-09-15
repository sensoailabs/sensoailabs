import React from 'react';
import { FileX, RefreshCw, Upload, X } from 'lucide-react';
import ErrorBoundary from './error-boundary';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Progress } from './progress';

interface UploadErrorBoundaryProps {
  children: React.ReactNode;
  onRetryUpload?: () => void;
  onCancelUpload?: () => void;
  onRemoveFile?: (fileId: string) => void;
  uploadProgress?: number;
  fileName?: string;
  fileSize?: number;
  maxFileSize?: number;
}

const UploadErrorFallback: React.FC<{
  onRetryUpload?: () => void;
  onCancelUpload?: () => void;
  fileName?: string;
  fileSize?: number;
  maxFileSize?: number;
  uploadProgress?: number;
}> = ({ 
  onRetryUpload, 
  onCancelUpload, 
  fileName, 
  fileSize, 
  maxFileSize,
  uploadProgress 
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getErrorMessage = () => {
    if (fileSize && maxFileSize && fileSize > maxFileSize) {
      return `Arquivo muito grande. Tamanho máximo: ${formatFileSize(maxFileSize)}`;
    }
    return 'Falha no upload do arquivo. Verifique sua conexão e tente novamente.';
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <FileX className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-lg">
            Erro no Upload
          </CardTitle>
          <CardDescription>
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fileName && (
            <div className="text-sm bg-muted p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Arquivo:</strong> {fileName}
                  {fileSize && (
                    <div className="text-muted-foreground">
                      Tamanho: {formatFileSize(fileSize)}
                    </div>
                  )}
                </div>
              </div>
              
              {uploadProgress !== undefined && uploadProgress > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progresso</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {onRetryUpload && (
              <Button 
                onClick={onRetryUpload}
                className="w-full"
                variant="default"
              >
                <Upload className="h-4 w-4 mr-2" />
                Tentar Upload Novamente
              </Button>
            )}
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Página
            </Button>
            
            {onCancelUpload && (
              <Button 
                onClick={onCancelUpload}
                variant="destructive"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar Upload
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Dicas:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Verifique sua conexão com a internet</li>
              <li>Certifique-se de que o arquivo não está corrompido</li>
              <li>Tente usar um arquivo menor se possível</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const UploadErrorBoundary: React.FC<UploadErrorBoundaryProps> = ({
  children,
  onRetryUpload,
  onCancelUpload,
  // onRemoveFile,
  uploadProgress,
  fileName,
  fileSize,
  maxFileSize
}) => {
  const handleUploadError = (error: Error, errorInfo: any) => {
    // Log específico para erros de upload
    console.error('[UploadErrorBoundary] Erro no upload:', {
      error: error.message,
      fileName,
      fileSize,
      maxFileSize,
      uploadProgress,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Aqui poderia enviar para serviço de monitoramento
    // trackError('upload_error', { fileName, fileSize, error: error.message });
  };

  return (
    <ErrorBoundary
      contextName="Upload"
      onError={handleUploadError}
      maxRetries={3}
      resetKeys={[fileName || '', fileSize || 0]}
      resetOnPropsChange={true}
      fallback={
        <UploadErrorFallback 
          onRetryUpload={onRetryUpload}
          onCancelUpload={onCancelUpload}
          fileName={fileName}
          fileSize={fileSize}
          maxFileSize={maxFileSize}
          uploadProgress={uploadProgress}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default UploadErrorBoundary;

// Hook específico para erros de upload
export const useUploadErrorHandler = () => {
  const handleFileError = React.useCallback((error: Error, context?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    uploadProgress?: number;
  }) => {
    console.error('[UploadError] Erro no arquivo:', {
      error: error.message,
      ...context,
      timestamp: new Date().toISOString()
    });

    // Determinar tipo de erro
    if (error.message.includes('size') || error.message.includes('large')) {
      return 'file_too_large';
    }
    if (error.message.includes('type') || error.message.includes('format')) {
      return 'invalid_file_type';
    }
    if (error.message.includes('network') || error.message.includes('connection')) {
      return 'network_error';
    }
    return 'unknown_error';
  }, []);

  const handleUploadProgress = React.useCallback((progress: number, context?: {
    fileName?: string;
    totalSize?: number;
  }) => {
    // Log de progresso apenas em desenvolvimento ou para debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[UploadProgress]:', {
        progress,
        ...context,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  return {
    handleFileError,
    handleUploadProgress
  };
};

// Wrapper para componentes de upload
export const withUploadErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  uploadErrorProps?: Omit<UploadErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <UploadErrorBoundary {...uploadErrorProps}>
      <Component {...props} />
    </UploadErrorBoundary>
  );
  
  WrappedComponent.displayName = `withUploadErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};