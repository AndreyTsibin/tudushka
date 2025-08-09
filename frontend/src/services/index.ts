// Основной экспорт всех API services

// Базовый API клиент
export { apiClient } from './api';
export type { APIResponse, APIError } from './api';

// API services
export { tasksAPI, prioritiesAPI } from './tasks';
export { usersAPI, profileUtils } from './users';
export { chatAPI, chatUtils } from './chat';

// TypeScript типы
export type * from '../types/api';

// Утилитарная функция для обработки ошибок API
export const handleAPIError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const apiError = error as { message: string; data?: any };
    
    // Если есть данные валидации, форматируем их
    if (apiError.data && typeof apiError.data === 'object') {
      const validationErrors = Object.entries(apiError.data)
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`;
          }
          return `${field}: ${messages}`;
        })
        .join('; ');
      
      if (validationErrors) {
        return validationErrors;
      }
    }
    
    return apiError.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Произошла неожиданная ошибка';
};

// Утилитарная функция для проверки доступности API
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    // Пробуем выполнить простой запрос к API
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tasks/`, {
      method: 'HEAD',
      mode: 'cors'
    });
    return true;
  } catch {
    return false;
  }
};