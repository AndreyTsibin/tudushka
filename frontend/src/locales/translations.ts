// Локализация для приложения Tudushka
export type TranslationKey = keyof typeof translations.ru;

export const translations = {
  ru: {
    // Заголовок приложения
    appTitle: "TUDUSHKA",
    
    // Навигация
    today: "Сегодня",
    week: "Неделя", 
    month: "Месяц",
    home: "Главная",
    aiAssistant: "AI Ассистент",
    archive: "Архив",
    
    // Задачи
    addTask: "Добавить задачу",
    editTask: "Редактировать задачу",
    saveTask: "Сохранить задачу",
    completeTask: "Завершить",
    completing: "Завершается...",
    taskTitle: "Заголовок задачи",
    taskDescription: "Описание задачи",
    taskPriority: "Приоритет задачи",
    priority: "Приоритет",
    
    // Приоритеты
    low: "Низкий",
    medium: "Средний", 
    high: "Высокий",
    critical: "Критический",
    createPriority: "Создать новый приоритет",
    priorityName: "Название приоритета",
    priorityColor: "Цвет приоритета",
    priorityExample: "Например: Срочно",
    create: "Создать",
    cancel: "Отмена",
    
    // AI функции
    aiDescription: "AI описание",
    aiGenerateDescription: "AI Генерация описания",
    generateDescription: "Сгенерировать описание",
    aiDescriptionText: "AI создаст подробное описание задачи на основе введенного заголовка. Убедитесь, что заголовок задачи заполнен.",
    usageRemaining: "Осталось использований",
    newChat: "Новый чат",
    sendMessage: "Напишите сообщение...",
    clickToEdit: "Нажмите, чтобы изменить название",
    startDialogWithAI: "Начните диалог с AI ассистентом",
    
    // Настройки
    settings: "Настройки",
    general: "Общие",
    ai: "AI-ассистент",
    subscription: "Подписка",
    language: "Язык интерфейса",
    selectLanguage: "Выберите язык приложения",
    russian: "Русский",
    english: "English",
    theme: "Тема",
    lightTheme: "Светлая тема",
    darkTheme: "Темная тема",
    light: "Светлая",
    dark: "Темная",
    
    // AI настройки
    aiModel: "Модель AI",
    selectModel: "Выберите нейросеть для работы",
    aiPersonality: "Персонализация ассистента",
    aiPersonalityDescription: "Расскажите о себе или настройте стиль ответов",
    personalityPlaceholder: "Опишите свои предпочтения для AI ассистента. Например: 'Я студент, отвечай кратко и по делу' или 'Помоги мне с планированием задач на каждый день'...",
    defaultPersonality: "Дружелюбный и профессиональный помощник, который помогает с планированием задач и повышением продуктивности.",
    aiUsageToday: "Использование AI сегодня",
    descriptionsGeneration: "Генерация описаний",
    chatRequests: "Запросы в чат",
    
    // Подписки
    currentPlan: "Текущий тариф",
    availablePlans: "Доступные тарифы",
    free: "Free",
    freePlan: "Бесплатный",
    plus: "Plus",
    pro: "Pro",
    active: "Активен",
    switchToFree: "Переключиться на Free",
    payForPlus: "Оплатить Plus - 250 ₽",
    payForPro: "Оплатить Pro - 550 ₽",
    
    // Планы особенности
    freeFeatures: "3 описания задач в день\n3 запроса в чат в день\nБазовая функциональность",
    plusFeatures: "10 описаний задач в день\n20 запросов в чат в день\nРасширенные возможности AI",
    proFeatures: "20 описаний задач в день\n100 запросов в чат в день\nМаксимальные возможности AI\nПриоритетная поддержка",
    
    // Чаты и архив
    chats: "Чаты",
    tasks: "Задачи",
    messages: "сообщений",
    planningWeek: "Планирование недели",
    
    // Пустые состояния
    noTasksToday: "Нет задач на сегодня",
    noTasksThisDay: "На этот день задач нет",
    noCompletedTasks: "Нет завершенных задач",
    
    // Календарь и даты
    weekdays: "Вс,Пн,Вт,Ср,Чт,Пт,Сб",
    months: "Январь,Февраль,Март,Апрель,Май,Июнь,Июль,Август,Сентябрь,Октябрь,Ноябрь,Декабрь",
    
    // Сообщения и уведомления
    taskAdded: "Задача добавлена",
    taskUpdated: "Задача обновлена",
    titleRequired: "Заголовок задачи обязателен",
    priorityRequired: "Название приоритета обязательно",
    priorityExists: "Приоритет с таким названием уже существует",
    priorityDeleted: "удален",
    cannotDeletePriority: "Нельзя удалить приоритет",
    tasksWithPriority: "есть",
    taskWord: "задача",
    tasksWord: "задачи",
    tasksWordMany: "задач",
    withThisPriority: "с этим приоритетом",
    newPriorityAdded: "добавлен!",
    chatTitleUpdated: "Название чата обновлено",
    switchedToFree: "Переключение на бесплатный тариф выполнено",
    paymentSuccess: "Оплата прошла успешно! Тариф активирован.",
    aiLimitReached: "Достигнут лимит генерацией описаний на сегодня. Обновите тариф для увеличения лимита.",
    chatLimitReached: "Достигнут лимит запросов к AI на сегодня. Обновите тариф для увеличения лимита.",
    enterTitleForAI: "Введите заголовок задачи для генерации описания",
    aiDescriptionGenerated: "Описание сгенерировано AI",
    aiResponseText: "Отличная идея! Я могу помочь вам создать задачу. Какое время и приоритет вы хотите установить?",
    
    // Кнопки навигации
    goToHome: "Перейти на главную",
    
    // Дополнительные переводы для описаний задач
    meetingDescription: "Подготовиться к встрече, просмотреть материалы, составить список вопросов и целей для обсуждения.",
    callDescription: "Подготовить план разговора, проверить контактную информацию, выбрать удобное время для звонка.", 
    shoppingDescription: "Составить список необходимых товаров, проверить цены, выбрать подходящий магазин.",
    workDescription: "Определить приоритетные задачи, выделить время для концентрированной работы, подготовить необходимые материалы.",
    studyDescription: "Подготовить учебные материалы, выбрать подходящее место для занятий, составить план изучения.",
    sportsDescription: "Подготовить спортивную форму, выбрать подходящее время, составить программу тренировки.",
    healthDescription: "Записаться на прием, подготовить документы, составить список вопросов для специалиста.",
    defaultDescription: "Выполнить поставленную задачу согласно плану и достичь желаемого результата."
  },
  
  en: {
    // App title
    appTitle: "TUDUSHKA",
    
    // Navigation
    today: "Today",
    week: "Week",
    month: "Month", 
    home: "Home",
    aiAssistant: "AI Assistant",
    archive: "Archive",
    
    // Tasks
    addTask: "Add Task",
    editTask: "Edit Task",
    saveTask: "Save Task", 
    completeTask: "Complete",
    completing: "Completing...",
    taskTitle: "Task Title",
    taskDescription: "Task Description",
    taskPriority: "Task Priority",
    priority: "Priority",
    
    // Priorities
    low: "Low",
    medium: "Medium",
    high: "High", 
    critical: "Critical",
    createPriority: "Create New Priority",
    priorityName: "Priority Name",
    priorityColor: "Priority Color",
    priorityExample: "e.g.: Urgent",
    create: "Create",
    cancel: "Cancel",
    
    // AI functions
    aiDescription: "AI Description",
    aiGenerateDescription: "AI Generate Description",
    generateDescription: "Generate Description",
    aiDescriptionText: "AI will create a detailed task description based on the entered title. Make sure the task title is filled in.",
    usageRemaining: "Remaining uses",
    newChat: "New Chat",
    sendMessage: "Type a message...",
    clickToEdit: "Click to edit title",
    startDialogWithAI: "Start a dialog with AI assistant",
    
    // Settings
    settings: "Settings",
    general: "General",
    ai: "AI Assistant", 
    subscription: "Subscription",
    language: "Interface Language",
    selectLanguage: "Select application language",
    russian: "Русский",
    english: "English",
    theme: "Theme",
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",
    light: "Light",
    dark: "Dark",
    
    // AI settings
    aiModel: "AI Model",
    selectModel: "Select neural network to work with",
    aiPersonality: "Assistant Personalization", 
    aiPersonalityDescription: "Tell about yourself or customize response style",
    personalityPlaceholder: "Describe your preferences for the AI assistant. For example: 'I'm a student, reply briefly and to the point' or 'Help me with daily task planning'...",
    defaultPersonality: "Friendly and professional assistant that helps with task planning and productivity enhancement.",
    aiUsageToday: "AI Usage Today",
    descriptionsGeneration: "Description Generation",
    chatRequests: "Chat Requests",
    
    // Subscriptions
    currentPlan: "Current Plan",
    availablePlans: "Available Plans",
    free: "Free",
    freePlan: "Free",
    plus: "Plus", 
    pro: "Pro",
    active: "Active",
    switchToFree: "Switch to Free",
    payForPlus: "Pay for Plus - $3.99",
    payForPro: "Pay for Pro - $8.99",
    
    // Plan features
    freeFeatures: "3 task descriptions per day\n3 chat requests per day\nBasic functionality",
    plusFeatures: "10 task descriptions per day\n20 chat requests per day\nAdvanced AI capabilities",
    proFeatures: "20 task descriptions per day\n100 chat requests per day\nMaximum AI capabilities\nPriority support",
    
    // Chats and archive
    chats: "Chats",
    tasks: "Tasks",
    messages: "messages",
    planningWeek: "Week Planning",
    
    // Empty states
    noTasksToday: "No tasks for today", 
    noTasksThisDay: "No tasks for this day",
    noCompletedTasks: "No completed tasks",
    
    // Calendar and dates
    weekdays: "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
    months: "January,February,March,April,May,June,July,August,September,October,November,December",
    
    // Messages and notifications
    taskAdded: "Task added",
    taskUpdated: "Task updated", 
    titleRequired: "Task title is required",
    priorityRequired: "Priority name is required",
    priorityExists: "Priority with this name already exists",
    priorityDeleted: "deleted",
    cannotDeletePriority: "Cannot delete priority",
    tasksWithPriority: "there are",
    taskWord: "task",
    tasksWord: "tasks", 
    tasksWordMany: "tasks",
    withThisPriority: "with this priority",
    newPriorityAdded: "added!",
    chatTitleUpdated: "Chat title updated",
    switchedToFree: "Switched to free plan successfully",
    paymentSuccess: "Payment successful! Plan activated.",
    aiLimitReached: "Daily AI description limit reached. Upgrade your plan to increase the limit.",
    chatLimitReached: "Daily AI chat limit reached. Upgrade your plan to increase the limit.",
    enterTitleForAI: "Enter task title to generate description",
    aiDescriptionGenerated: "Description generated by AI",
    aiResponseText: "Great idea! I can help you create a task. What time and priority would you like to set?",
    
    // Navigation buttons
    goToHome: "Go to Home",
    
    // Additional translations for task descriptions
    meetingDescription: "Prepare for the meeting, review materials, make a list of questions and discussion goals.",
    callDescription: "Prepare conversation plan, check contact information, choose convenient time for the call.",
    shoppingDescription: "Make a list of necessary items, check prices, choose a suitable store.",
    workDescription: "Define priority tasks, allocate time for focused work, prepare necessary materials.",
    studyDescription: "Prepare study materials, choose a suitable place for classes, make a study plan.",
    sportsDescription: "Prepare sports gear, choose suitable time, create training program.",
    healthDescription: "Make an appointment, prepare documents, make a list of questions for the specialist.", 
    defaultDescription: "Complete the assigned task according to the plan and achieve the desired result."
  }
} as const;

// Хук для получения переводов
export function useTranslations(language: "ru" | "en") {
  return translations[language];
}

// Функция для получения перевода по ключу
export function t(language: "ru" | "en", key: TranslationKey): string {
  return translations[language][key];
}

// Функция для форматирования даты в зависимости от языка
export function formatDate(dateString: string, language: "ru" | "en") {
  // Создаем дату из компонентов, чтобы избежать смещения по таймзоне
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const locale = language === "ru" ? "ru-RU" : "en-US";
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const formatted = new Intl.DateTimeFormat(locale, options).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Функция для получения локализованного времени
export function formatTime(timestamp: string, language: "ru" | "en") {
  // Поддержка формата времени HH:mm без смещения даты
  const [hours, minutes] = timestamp.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  const locale = language === "ru" ? "ru-RU" : "en-US";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Функция для получения дней недели
export function getWeekdays(language: "ru" | "en") {
  return (translations[language].weekdays as unknown as string).split(',') as string[];
}

// Функция для получения месяцев
export function getMonths(language: "ru" | "en") {
  return (translations[language].months as unknown as string).split(',') as string[];
}

// Функция для плюрализации (склонение слов)
export function pluralize(count: number, language: "ru" | "en", singularKey: TranslationKey, pluralKey?: TranslationKey, manyKey?: TranslationKey) {
  if (language === "en") {
    return count === 1 ? translations.en[singularKey] : translations.en[pluralKey || singularKey];
  }
  
  // Русский язык - сложная плюрализация
  if (count === 1) {
    return translations.ru[singularKey];
  } else if (count >= 2 && count <= 4) {
    return translations.ru[pluralKey || singularKey];
  } else {
    return translations.ru[manyKey || pluralKey || singularKey];
  }
}