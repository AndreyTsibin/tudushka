import { apiClient } from './api';
import type {
  APIChatSession,
  APIChatSessionList,
  APIChatMessage,
  CreateChatSessionRequest,
  SendChatMessageRequest
} from '../types/api';

// API service для работы с чат-сессиями и сообщениями
export const chatAPI = {
  // === Управление сессиями чата ===
  
  // Получение всех сессий пользователя (облегченная версия)
  async getSessions(): Promise<APIChatSessionList[]> {
    return apiClient.get<APIChatSessionList[]>('/chat/sessions/');
  },

  // Получение сессии по ID (с полным списком сообщений)
  async getSession(id: string): Promise<APIChatSession> {
    return apiClient.get<APIChatSession>(`/chat/sessions/${id}/`);
  },

  // Создание новой сессии чата
  async createSession(data: CreateChatSessionRequest): Promise<APIChatSession> {
    return apiClient.post<APIChatSession>('/chat/sessions/', data);
  },

  // Обновление сессии (например, изменение названия)
  async updateSession(id: string, data: Partial<CreateChatSessionRequest>): Promise<APIChatSession> {
    return apiClient.put<APIChatSession>(`/chat/sessions/${id}/`, data);
  },

  // Удаление сессии
  async deleteSession(id: string): Promise<void> {
    return apiClient.delete<void>(`/chat/sessions/${id}/`);
  },

  // === Управление сообщениями ===

  // Получение всех сообщений сессии
  async getSessionMessages(sessionId: string): Promise<APIChatMessage[]> {
    return apiClient.get<APIChatMessage[]>(`/chat/sessions/${sessionId}/messages/`);
  },

  // Отправка сообщения в сессию (с автоматической генерацией AI ответа)
  async sendMessage(sessionId: string, data: SendChatMessageRequest): Promise<APIChatMessage[]> {
    return apiClient.post<APIChatMessage[]>(`/chat/sessions/${sessionId}/send_message/`, data);
  },

  // Создание сообщения напрямую (без AI ответа)
  async createMessage(sessionId: string, data: SendChatMessageRequest & { sender: 'user' | 'ai' }): Promise<APIChatMessage> {
    return apiClient.post<APIChatMessage>('/chat/messages/', {
      ...data,
      session_id: sessionId
    });
  },

  // Получение сообщения по ID
  async getMessage(id: string): Promise<APIChatMessage> {
    return apiClient.get<APIChatMessage>(`/chat/messages/${id}/`);
  },

  // Обновление сообщения
  async updateMessage(id: string, data: Partial<SendChatMessageRequest>): Promise<APIChatMessage> {
    return apiClient.put<APIChatMessage>(`/chat/messages/${id}/`, data);
  },

  // Удаление сообщения
  async deleteMessage(id: string): Promise<void> {
    return apiClient.delete<void>(`/chat/messages/${id}/`);
  }
};

// Утилитарные функции для работы с чатом
export const chatUtils = {
  // Создать новую сессию с первым сообщением
  async startNewChat(title: string, initialMessage: string): Promise<APIChatSession> {
    // Создаем сессию
    const session = await chatAPI.createSession({ title });
    
    // Отправляем первое сообщение
    await chatAPI.sendMessage(session.id, { text: initialMessage });
    
    // Возвращаем обновленную сессию
    return chatAPI.getSession(session.id);
  },

  // Получить последнее сообщение пользователя в сессии
  getLastUserMessage(session: APIChatSession): APIChatMessage | null {
    const userMessages = session.messages.filter(msg => msg.sender === 'user');
    return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
  },

  // Получить последнее сообщение AI в сессии
  getLastAIMessage(session: APIChatSession): APIChatMessage | null {
    const aiMessages = session.messages.filter(msg => msg.sender === 'ai');
    return aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : null;
  },

  // Проверить, ожидается ли ответ AI (последнее сообщение от пользователя)
  isWaitingForAI(session: APIChatSession): boolean {
    if (session.messages.length === 0) return false;
    const lastMessage = session.messages[session.messages.length - 1];
    return lastMessage.sender === 'user';
  },

  // Создать заголовок сессии на основе первого сообщения
  generateSessionTitle(firstMessage: string, maxLength: number = 50): string {
    if (firstMessage.length <= maxLength) return firstMessage;
    return firstMessage.substring(0, maxLength - 3) + '...';
  },

  // Форматировать дату сообщения для отображения
  formatMessageTime(createdAt: string): string {
    const date = new Date(createdAt);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },

  // Форматировать дату сессии для отображения
  formatSessionDate(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Сегодня';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Вчера';
    }
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    });
  }
};