import { useState, useCallback, useMemo } from 'react';
import { validateField } from '@/utils/validation';
import type { FormErrors } from '@/utils/validation';

export interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, (value: any, formData: T) => string>>;
  onSubmit?: (data: T) => Promise<void> | void;
}

export interface UseFormReturn<T> {
  formData: T;
  errors: FormErrors;
  isLoading: boolean;
  isValid: boolean;
  isDirty: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validateField: (field: keyof T) => void;
  validateForm: () => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  setLoading: (loading: boolean) => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit
}: UseFormOptions<T>): UseFormReturn<T> {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Verificar se o formulário é válido
  const isValid = useMemo(() => {
    return Object.keys(errors).every(key => !errors[key]) && 
           Object.values(formData).some(value => value !== '');
  }, [errors, formData]);

  // Atualizar valor de campo
  const setValue = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Validação em tempo real
    const customRule = validationRules[field];
    let error = '';
    
    if (customRule) {
      error = customRule(value, { ...formData, [field]: value });
    } else {
      // Usar validação padrão
      if (field === 'confirmPassword') {
        error = validateField(field as string, value, formData.newPassword || formData.password);
      } else {
        error = validateField(field as string, value);
      }
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [formData, validationRules]);

  // Definir erro manualmente
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Limpar erro específico
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  // Limpar todos os erros
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Validar campo específico
  const validateFieldCallback = useCallback((field: keyof T) => {
    const value = formData[field];
    const customRule = validationRules[field];
    let error = '';
    
    if (customRule) {
      error = customRule(value, formData);
    } else {
      if (field === 'confirmPassword') {
        error = validateField(field as string, value, formData.newPassword || formData.password);
      } else {
        error = validateField(field as string, value);
      }
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [formData, validationRules]);

  // Validar todo o formulário
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach(field => {
      const value = formData[field];
      const customRule = validationRules[field as keyof T];
      let error = '';
      
      if (customRule) {
        error = customRule(value, formData);
      } else {
        if (field === 'confirmPassword') {
          error = validateField(field, value, formData.newPassword || formData.password);
        } else {
          error = validateField(field, value);
        }
      }
      
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validationRules]);

  // Submeter formulário
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      return;
    }
    
    if (onSubmit) {
      setIsLoading(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Erro no submit:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [formData, validateForm, onSubmit]);

  // Resetar formulário
  const reset = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setIsDirty(false);
    setIsLoading(false);
  }, [initialValues]);

  // Controlar loading manualmente
  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    formData,
    errors,
    isLoading,
    isValid,
    isDirty,
    setValue,
    setError,
    clearError,
    clearAllErrors,
    validateField: validateFieldCallback,
    validateForm,
    handleSubmit,
    reset,
    setLoading: setLoadingState
  };
}