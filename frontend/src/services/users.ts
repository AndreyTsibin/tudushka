import { apiClient } from './api';
import type {
  APIUser,
  APIUserProfile,
  APIUserWithProfile,
  UpdateUserProfileRequest,
  AIUsageResponse
} from '../types/api';

// API service для работы с пользователями и профилями
export const usersAPI = {
  // Получение полного профиля пользователя (с настройками)
  async getProfile(): Promise<APIUserWithProfile> {
    return apiClient.get<APIUserWithProfile>('/users/profile/');
  },

  // Обновление основной информации пользователя
  async updateProfile(data: Partial<APIUser>): Promise<APIUserWithProfile> {
    return apiClient.put<APIUserWithProfile>('/users/profile/', data);
  },

  // Получение настроек профиля пользователя
  async getProfileSettings(): Promise<APIUserProfile> {
    return apiClient.get<APIUserProfile>('/users/profile/settings/');
  },

  // Обновление настроек профиля пользователя
  async updateProfileSettings(data: UpdateUserProfileRequest): Promise<APIUserProfile> {
    return apiClient.put<APIUserProfile>('/users/profile/settings/', data);
  },

  // Частичное обновление настроек профиля
  async patchProfileSettings(data: Partial<UpdateUserProfileRequest>): Promise<APIUserProfile> {
    return apiClient.patch<APIUserProfile>('/users/profile/settings/', data);
  },

  // Обновление статистики использования AI
  async updateAIUsage(data: {
    ai_descriptions_used?: number;
    ai_chat_requests_used?: number;
  }): Promise<APIUserProfile> {
    return apiClient.patch<APIUserProfile>('/users/profile/ai-usage/', data);
  },

  // Увеличить счетчик использованных AI описаний
  async incrementAIDescriptions(): Promise<AIUsageResponse> {
    return apiClient.post<AIUsageResponse>('/users/profile/ai-descriptions/increment/');
  },

  // Увеличить счетчик использованных AI чат-запросов
  async incrementAIChatRequests(): Promise<AIUsageResponse> {
    return apiClient.post<AIUsageResponse>('/users/profile/ai-chat-requests/increment/');
  }
};

// Утилитарные функции для работы с профилем пользователя
export const profileUtils = {
  // Проверить, может ли пользователь использовать AI описания
  canUseAIDescriptions(profile: APIUserProfile): boolean {
    return profile.ai_descriptions_used < profile.ai_descriptions_limit;
  },

  // Проверить, может ли пользователь использовать AI чат
  canUseAIChat(profile: APIUserProfile): boolean {
    return profile.ai_chat_requests_used < profile.ai_chat_requests_limit;
  },

  // Получить оставшееся количество AI описаний
  getRemainingAIDescriptions(profile: APIUserProfile): number {
    return Math.max(0, profile.ai_descriptions_limit - profile.ai_descriptions_used);
  },

  // Получить оставшееся количество AI чат-запросов
  getRemainingAIChatRequests(profile: APIUserProfile): number {
    return Math.max(0, profile.ai_chat_requests_limit - profile.ai_chat_requests_used);
  },

  // Получить процент использования AI описаний
  getAIDescriptionsUsagePercent(profile: APIUserProfile): number {
    return Math.round((profile.ai_descriptions_used / profile.ai_descriptions_limit) * 100);
  },

  // Получить процент использования AI чат-запросов
  getAIChatUsagePercent(profile: APIUserProfile): number {
    return Math.round((profile.ai_chat_requests_used / profile.ai_chat_requests_limit) * 100);
  }
};