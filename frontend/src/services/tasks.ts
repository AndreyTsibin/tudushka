import { apiClient } from './api';
import type {
  APITask,
  APICustomPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateCustomPriorityRequest,
  TaskFilters,
  TaskDescriptionGenerateRequest,
  TaskDescriptionGenerateResponse
} from '../types/api';

// API service для работы с задачами
export const tasksAPI = {
  // Получение всех задач
  async getTasks(filters?: TaskFilters): Promise<APITask[]> {
    return apiClient.get<APITask[]>('/tasks/tasks/', filters);
  },

  // Получение задачи по ID
  async getTask(id: string): Promise<APITask> {
    return apiClient.get<APITask>(`/tasks/tasks/${id}/`);
  },

  // Создание новой задачи
  async createTask(data: CreateTaskRequest): Promise<APITask> {
    return apiClient.post<APITask>('/tasks/tasks/', data);
  },

  // Обновление задачи
  async updateTask(id: string, data: UpdateTaskRequest): Promise<APITask> {
    return apiClient.put<APITask>(`/tasks/tasks/${id}/`, data);
  },

  // Частичное обновление задачи
  async patchTask(id: string, data: Partial<UpdateTaskRequest>): Promise<APITask> {
    return apiClient.patch<APITask>(`/tasks/tasks/${id}/`, data);
  },

  // Удаление задачи
  async deleteTask(id: string): Promise<void> {
    return apiClient.delete<void>(`/tasks/tasks/${id}/`);
  },

  // Отметить задачу как выполненную
  async completeTask(id: string): Promise<APITask> {
    return apiClient.patch<APITask>(`/tasks/tasks/${id}/complete/`, {});
  },

  // Отменить выполнение задачи
  async uncompleteTask(id: string): Promise<APITask> {
    return apiClient.patch<APITask>(`/tasks/tasks/${id}/uncomplete/`, {});
  },

  // Получить задачи на сегодня
  async getTodayTasks(): Promise<APITask[]> {
    return apiClient.get<APITask[]>('/tasks/tasks/today/');
  },

  // Получить задачи на текущую неделю
  async getWeekTasks(): Promise<APITask[]> {
    return apiClient.get<APITask[]>('/tasks/tasks/week/');
  },

  // Получить задачи на текущий месяц
  async getMonthTasks(): Promise<APITask[]> {
    return apiClient.get<APITask[]>('/tasks/tasks/month/');
  },

  // Получить завершенные задачи
  async getCompletedTasks(): Promise<APITask[]> {
    return apiClient.get<APITask[]>('/tasks/tasks/completed/');
  },

  // Генерация описания задачи с помощью AI
  async generateDescription(data: TaskDescriptionGenerateRequest): Promise<TaskDescriptionGenerateResponse> {
    return apiClient.post<TaskDescriptionGenerateResponse>('/tasks/tasks/generate_description/', data);
  }
};

// API service для работы с пользовательскими приоритетами
export const prioritiesAPI = {
  // Получение всех приоритетов пользователя
  async getPriorities(): Promise<APICustomPriority[]> {
    return apiClient.get<APICustomPriority[]>('/tasks/priorities/');
  },

  // Получение приоритета по ID
  async getPriority(id: string): Promise<APICustomPriority> {
    return apiClient.get<APICustomPriority>(`/tasks/priorities/${id}/`);
  },

  // Создание нового приоритета
  async createPriority(data: CreateCustomPriorityRequest): Promise<APICustomPriority> {
    return apiClient.post<APICustomPriority>('/tasks/priorities/', data);
  },

  // Обновление приоритета
  async updatePriority(id: string, data: CreateCustomPriorityRequest): Promise<APICustomPriority> {
    return apiClient.put<APICustomPriority>(`/tasks/priorities/${id}/`, data);
  },

  // Удаление приоритета
  async deletePriority(id: string): Promise<void> {
    return apiClient.delete<void>(`/tasks/priorities/${id}/`);
  }
};