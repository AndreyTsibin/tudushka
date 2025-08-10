// Утилиты для преобразования данных между API и фронтенд типами

import type { APITask, APICustomPriority, APIUserProfile } from '../types/api';

// Интерфейсы фронтенда (соответствуют App.tsx)
export interface Task {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  priority: string;
  completed: boolean;
}

export interface CustomPriority {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isDefault: boolean;
}

export interface UserSettings {
  language: "ru" | "en";
  theme: "light" | "dark";
  aiPersonality: string;
  aiModel: "chatgpt" | "perplexity";
  plan: "free" | "plus" | "pro";
  aiUsage: {
    descriptionsUsed: number;
    chatRequestsUsed: number;
    lastResetDate: string;
  };
}

// Преобразование API задачи в фронтенд задачу
export function apiTaskToTask(apiTask: APITask): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    time: apiTask.time,
    date: apiTask.date,
    priority: apiTask.priority,
    completed: apiTask.completed
  };
}

// Преобразование фронтенд задачи в API данные для создания/обновления
export function taskToApiTaskRequest(task: Partial<Task>): {
  title?: string;
  description?: string;
  time?: string;
  date?: string;
  priority?: string;
  completed?: boolean;
} {
  const apiData: any = {};
  
  if (task.title !== undefined) apiData.title = task.title;
  if (task.description !== undefined) apiData.description = task.description;
  if (task.time !== undefined) apiData.time = task.time;
  if (task.date !== undefined) apiData.date = task.date;
  if (task.priority !== undefined) apiData.priority = task.priority;
  if (task.completed !== undefined) apiData.completed = task.completed;
  
  return apiData;
}

// Преобразование API приоритета в фронтенд приоритет
export function apiPriorityToPriority(apiPriority: APICustomPriority): CustomPriority {
  return {
    id: apiPriority.id,
    name: apiPriority.name,
    displayName: apiPriority.display_name,
    color: apiPriority.color,
    isDefault: apiPriority.is_default
  };
}

// Преобразование фронтенд приоритета в API данные
export function priorityToApiPriorityRequest(priority: Partial<CustomPriority>): {
  name?: string;
  display_name?: string;
  color?: string;
  is_default?: boolean;
} {
  const apiData: any = {};
  
  if (priority.name !== undefined) apiData.name = priority.name;
  if (priority.displayName !== undefined) apiData.display_name = priority.displayName;
  if (priority.color !== undefined) apiData.color = priority.color;
  if (priority.isDefault !== undefined) apiData.is_default = priority.isDefault;
  
  return apiData;
}

// Преобразование API профиля в фронтенд настройки
export function apiProfileToUserSettings(apiProfile: APIUserProfile): UserSettings {
  return {
    language: apiProfile.language,
    theme: apiProfile.theme,
    aiPersonality: apiProfile.ai_personality,
    aiModel: apiProfile.ai_model,
    plan: apiProfile.plan,
    aiUsage: {
      descriptionsUsed: apiProfile.ai_descriptions_used,
      chatRequestsUsed: apiProfile.ai_chat_requests_used,
      lastResetDate: apiProfile.ai_usage_last_reset
    }
  };
}

// Преобразование фронтенд настроек в API данные профиля
export function userSettingsToApiProfileRequest(settings: Partial<UserSettings>): {
  language?: "ru" | "en";
  theme?: "light" | "dark";
  ai_personality?: string;
  ai_model?: "chatgpt" | "perplexity";
  plan?: "free" | "plus" | "pro";
  ai_descriptions_used?: number;
  ai_chat_requests_used?: number;
  ai_usage_last_reset?: string;
} {
  const apiData: any = {};
  
  if (settings.language !== undefined) apiData.language = settings.language;
  if (settings.theme !== undefined) apiData.theme = settings.theme;
  if (settings.aiPersonality !== undefined) apiData.ai_personality = settings.aiPersonality;
  if (settings.aiModel !== undefined) apiData.ai_model = settings.aiModel;
  if (settings.plan !== undefined) apiData.plan = settings.plan;
  if (settings.aiUsage?.descriptionsUsed !== undefined) {
    apiData.ai_descriptions_used = settings.aiUsage.descriptionsUsed;
  }
  if (settings.aiUsage?.chatRequestsUsed !== undefined) {
    apiData.ai_chat_requests_used = settings.aiUsage.chatRequestsUsed;
  }
  if (settings.aiUsage?.lastResetDate !== undefined) {
    apiData.ai_usage_last_reset = settings.aiUsage.lastResetDate;
  }
  
  return apiData;
}