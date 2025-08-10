// TypeScript интерфейсы для API ответов

// Базовые типы
export interface APITask {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  priority: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface APICustomPriority {
  id: string;
  name: string;
  display_name: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface APIUserProfile {
  language: 'ru' | 'en';
  theme: 'light' | 'dark';
  ai_personality: string;
  ai_model: 'chatgpt' | 'claude' | 'perplexity';
  plan: 'free' | 'plus' | 'pro';
  ai_descriptions_used: number;
  ai_chat_requests_used: number;
  ai_usage_last_reset: string;
  ai_descriptions_limit: number;
  ai_chat_requests_limit: number;
  created_at: string;
  updated_at: string;
}

export interface APIUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface APIUserWithProfile extends APIUser {
  profile: APIUserProfile;
}

export interface APIChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  created_at: string;
}

export interface APIChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: APIChatMessage[];
  message_count: number;
}

export interface APIChatSessionList {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message: {
    text: string;
    sender: 'user' | 'ai';
    created_at: string;
  } | null;
}

// Типы для создания/обновления
export interface CreateTaskRequest {
  title: string;
  description?: string;
  time: string;
  date: string;
  priority: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  completed?: boolean;
}

export interface CreateCustomPriorityRequest {
  name: string;
  display_name: string;
  color: string;
  is_default?: boolean;
}

export type UpdateUserProfileRequest = Partial<APIUserProfile>;

export interface CreateChatSessionRequest {
  title: string;
}

export interface SendChatMessageRequest {
  text: string;
}

// Типы для AI usage
export interface AIUsageResponse {
  ai_descriptions_used: number;
  ai_descriptions_limit: number;
  ai_chat_requests_used?: number;
  ai_chat_requests_limit?: number;
}

// Типы для ошибок API
export interface APIValidationError {
  [field: string]: string[];
}

// Типы для фильтрации
export interface TaskFilters {
  completed?: boolean;
  priority?: string;
  date?: string;
}

export interface TelegramAuthResponse {
  token: string;
}

export interface TelegramInvoiceResponse {
  ok: boolean;
  result?: {
    link: string;
  };
}

export interface TaskDescriptionGenerateRequest {
  title: string;
  language?: 'ru' | 'en';
}

export interface TaskDescriptionGenerateResponse {
  description: string;
  remaining_uses: number;
}

export interface APIKeyValidationResponse {
  valid: boolean;
  error?: string;
}
