import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Интерфейс для состояния загрузки API
interface APIState {
  loading: boolean;
  error: string | null;
}

// Типы для обработки ошибок
interface APIError {
  message: string;
  status?: number;
  details?: any;
}

// Хук для управления состоянием API вызовов
export function useAPIState() {
  const [apiState, setAPIState] = useState<APIState>({
    loading: false,
    error: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setAPIState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setAPIState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setAPIState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...apiState,
    setLoading,
    setError,
    clearError
  };
}

// Хук для выполнения API вызовов с обработкой ошибок
export function useAPICall() {
  const { loading, error, setLoading, setError, clearError } = useAPIState();

  const executeAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: APIError) => void;
      showSuccessToast?: string;
      showErrorToast?: boolean;
    }
  ): Promise<T | null> => {
    try {
      setLoading(true);
      clearError();

      const result = await apiCall();

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      if (options?.showSuccessToast) {
        toast.success(options.showSuccessToast);
      }

      return result;
    } catch (err: any) {
      const error: APIError = {
        message: err.message || 'Произошла ошибка при обращении к API',
        status: err.status,
        details: err.response?.data
      };

      setError(error.message);

      if (options?.onError) {
        options.onError(error);
      } else if (options?.showErrorToast !== false) {
        // По умолчанию показываем toast с ошибкой
        toast.error(`Ошибка: ${error.message}`);
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearError]);

  return {
    loading,
    error,
    executeAPICall,
    clearError
  };
}

// Хук специально для задач с предустановленными сообщениями
export function useTasksAPI() {
  const { executeAPICall, loading, error, clearError } = useAPICall();

  const createTask = useCallback(async (apiCall: () => Promise<any>) => {
    return executeAPICall(apiCall, {
      showSuccessToast: 'Задача создана успешно',
      showErrorToast: true
    });
  }, [executeAPICall]);

  const updateTask = useCallback(async (apiCall: () => Promise<any>) => {
    return executeAPICall(apiCall, {
      showSuccessToast: 'Задача обновлена успешно',
      showErrorToast: true
    });
  }, [executeAPICall]);

  const deleteTask = useCallback(async (apiCall: () => Promise<any>) => {
    return executeAPICall(apiCall, {
      showSuccessToast: 'Задача удалена успешно',
      showErrorToast: true
    });
  }, [executeAPICall]);

  const completeTask = useCallback(async (apiCall: () => Promise<any>) => {
    return executeAPICall(apiCall, {
      showErrorToast: true
    });
  }, [executeAPICall]);

  const loadTasks = useCallback(async (apiCall: () => Promise<any>) => {
    return executeAPICall(apiCall, {
      showErrorToast: true
    });
  }, [executeAPICall]);

  return {
    loading,
    error,
    clearError,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    loadTasks
  };
}