import { useState, useEffect, useCallback } from "react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { Calendar } from "./components/ui/calendar";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import {
  Clock,
  Calendar as CalendarIcon,
  Plus,
  User,
  CheckCircle2,
  Sparkles,
  Home,
  Bot,
  Archive,
  Send,
  Globe,
  Moon,
  Sun,
  Crown,
  BarChart3,
  Trash2,
  Check,
} from "lucide-react";
import { useTranslations, formatDate, pluralize, getWeekdays, getMonths } from "./locales/translations";
import { tasksAPI } from "./services/tasks";
import { useTasksAPI } from "./hooks/useAPI";
import { apiTaskToTask, taskToApiTaskRequest } from "./utils/apiTransforms";

interface CustomPriority {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isDefault: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  priority: string;
  completed: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  date: string;
}

interface UserSettings {
  language: "ru" | "en";
  theme: "light" | "dark";
  aiPersonality: string;
  aiModel: "chatgpt" | "claude" | "perplexity";
  plan: "free" | "plus" | "pro";
  aiUsage: {
    descriptionsUsed: number;
    chatRequestsUsed: number;
    lastResetDate: string;
  };
}

// Функция для динамического отображения бейджей приоритетов
const renderPriorityBadge = (priorityName: string, customPriorities: CustomPriority[]) => {
  const priority = customPriorities.find(p => p.name === priorityName);
  if (!priority) return null;
  
  return (
    <Badge 
      className="badge-priority-dynamic" 
      style={{ backgroundColor: priority.color }}
    >
      {priority.displayName}
    </Badge>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState("today");
  const [currentPage, setCurrentPage] = useState("home"); // home, ai-assistant, archive, settings
  const [tasks, setTasks] = useState<Task[]>([]);

  const [chatSessions, setChatSessions] = useState<
    ChatSession[]
  >([]);

  const [userSettings, setUserSettings] =
    useState<UserSettings>({
      language: "ru",
      theme: "light",
      aiPersonality: "", // Будет установлено в useEffect
      aiModel: "chatgpt",
      plan: "free",
      aiUsage: {
        descriptionsUsed: 0,
        chatRequestsUsed: 0,
        lastResetDate: new Date().toISOString().split("T")[0],
      },
    });

  // Получаем переводы для текущего языка
  const translations = useTranslations(userSettings.language);

  // API хук для работы с задачами
  const tasksApiHook = useTasksAPI();

  // Пользовательские приоритеты с дефолтными значениями
  const getDefaultPriorities = useCallback(() => [
    { id: "low", name: "low", displayName: translations.low, color: "#10b981", isDefault: true },
    { id: "normal", name: "normal", displayName: translations.medium, color: "#2563eb", isDefault: true },
    { id: "urgent", name: "urgent", displayName: translations.high, color: "#ea580c", isDefault: true },
  ], [translations]);
  
  const [customPriorities, setCustomPriorities] = useState<CustomPriority[]>(getDefaultPriorities());
  
  // Инициализируем чаты после получения переводов
  useEffect(() => {
    setChatSessions([{
      id: "1",
      title: translations.planningWeek,
      date: "2025-07-26",
      messages: [
        {
          id: "1",
          text: userSettings.language === "ru" 
            ? "Помоги мне запланировать задачи на завтра"
            : "Help me plan tasks for tomorrow",
          sender: "user",
          timestamp: "14:30",
        },
        {
          id: "2",
          text: userSettings.language === "ru"
            ? "Конечно! Давайте составим план на завтра. Какие у вас основные приоритеты?"
            : "Sure! Let's make a plan for tomorrow. What are your main priorities?",
          sender: "ai",
          timestamp: "14:31",
        },
      ],
    }]);
  }, [userSettings.language, translations.planningWeek]);

  const [currentChatId, setCurrentChatId] = useState<
    string | null
  >(null);
  const [aiMessage, setAiMessage] = useState("");
  const [archiveTab, setArchiveTab] = useState("chats"); // chats, tasks
  const [settingsTab, setSettingsTab] = useState("general"); // general, ai, subscription
  const [isEditingChatTitle, setIsEditingChatTitle] =
    useState(false);
  const [editingChatTitle, setEditingChatTitle] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(),
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAIHelpDialogOpen, setIsAIHelpDialogOpen] =
    useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(
    null,
  );
  const [isEditAIHelpDialogOpen, setIsEditAIHelpDialogOpen] =
    useState(false);
  const [animatingTasks, setAnimatingTasks] = useState<
    Set<string>
  >(new Set());
  
  // Состояния для создания нового приоритета
  const [isCreatePriorityDialogOpen, setIsCreatePriorityDialogOpen] = useState(false);
  const [newPriorityName, setNewPriorityName] = useState("");
  const [newPriorityColor, setNewPriorityColor] = useState("#3b82f6");
  
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    time: string;
    date: string;
    priority: string;
  }>({
    title: "",
    description: "",
    time: "",
    date: "",
    priority: "normal",
  });

  const today = new Date();
  
  // Обновляем дефолтные приоритеты при смене языка
  useEffect(() => {
    const savedPriorities = localStorage.getItem('customPriorities');
    if (savedPriorities) {
      try {
        const parsed = JSON.parse(savedPriorities);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Обновляем displayName для дефолтных приоритетов при смене языка
          const updatedPriorities = parsed.map(priority => {
            if (priority.isDefault) {
              const defaultPriorities = getDefaultPriorities();
              const defaultPriority = defaultPriorities.find(p => p.name === priority.name);
              return defaultPriority ? { ...priority, displayName: defaultPriority.displayName } : priority;
            }
            return priority;
          });
          setCustomPriorities(updatedPriorities);
        } else {
          setCustomPriorities(getDefaultPriorities());
        }
      } catch (error) {
        console.error('Ошибка загрузки приоритетов из localStorage:', error);
        setCustomPriorities(getDefaultPriorities());
      }
    } else {
      setCustomPriorities(getDefaultPriorities());
    }
  }, [userSettings.language, translations, getDefaultPriorities]);

  // Сохранение пользовательских приоритетов в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('customPriorities', JSON.stringify(customPriorities));
  }, [customPriorities]);
  
  // Функция для получения текущей даты и времени
  const getCurrentDateTimeForTask = () => {
    const now = new Date();
    
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().slice(0, 5); // HH:MM
    
    return { date, time };
  };
  const weekStart = new Date(today);
  // Начинаем неделю с понедельника (1), воскресенье становится 7-м днем
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(today.getDate() - daysFromMonday);

  // Функция автоматического изменения размера для input и textarea
  const autoResize = (element: HTMLInputElement | HTMLTextAreaElement) => {
    if (element.tagName === 'TEXTAREA') {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    } else if (element.tagName === 'INPUT') {
      // Для input создаем скрытый div для измерения высоты
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.position = 'absolute';
      hiddenDiv.style.visibility = 'hidden';
      hiddenDiv.style.height = 'auto';
      hiddenDiv.style.width = element.offsetWidth + 'px';
      hiddenDiv.style.fontSize = window.getComputedStyle(element).fontSize;
      hiddenDiv.style.fontFamily = window.getComputedStyle(element).fontFamily;
      hiddenDiv.style.lineHeight = window.getComputedStyle(element).lineHeight;
      hiddenDiv.style.padding = window.getComputedStyle(element).padding;
      hiddenDiv.style.border = window.getComputedStyle(element).border;
      hiddenDiv.style.whiteSpace = 'pre-wrap';
      hiddenDiv.style.wordBreak = 'break-word';
      hiddenDiv.textContent = element.value || element.placeholder;
      
      document.body.appendChild(hiddenDiv);
      const newHeight = Math.max(40, hiddenDiv.offsetHeight); // минимум 40px
      element.style.height = newHeight + 'px';
      document.body.removeChild(hiddenDiv);
    }
  };


  // Проверяем, нужно ли сбросить счетчики использования AI
  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    if (userSettings.aiUsage.lastResetDate !== currentDate) {
      setUserSettings((prev) => ({
        ...prev,
        aiUsage: {
          descriptionsUsed: 0,
          chatRequestsUsed: 0,
          lastResetDate: currentDate,
        },
      }));
    }
  }, [userSettings.aiUsage.lastResetDate]);

  // Применяем тему
  useEffect(() => {
    if (userSettings.theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, [userSettings.theme]);

  // Автоматическая настройка высоты textarea для персонализации AI
  useEffect(() => {
    const textarea = document.querySelector('.textarea-themed') as HTMLTextAreaElement;
    if (textarea && userSettings.aiPersonality) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [userSettings.aiPersonality]);

  // Инициализация токена для тестирования и загрузка задач при первом запуске
  useEffect(() => {
    // Устанавливаем тестовый токен (в продакшене будет из аутентификации)
    const testToken = import.meta.env.VITE_TEST_TOKEN;
    if (testToken && !localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', testToken);
    }

    // Загружаем задачи при инициализации
    loadTasksFromAPI();
  }, []); // Выполняется только при первом рендере

  // Функция для загрузки задач с API
  const loadTasksFromAPI = async () => {
    const result = await tasksApiHook.loadTasks(() => tasksAPI.getTasks());
    if (result) {
      const frontendTasks = result.map(apiTaskToTask);
      setTasks(frontendTasks);
    }
  };

  const getPlanLimits = () => {
    switch (userSettings.plan) {
      case "free":
        return { descriptions: 3, chatRequests: 3 };
      case "plus":
        return { descriptions: 10, chatRequests: 20 };
      case "pro":
        return { descriptions: 20, chatRequests: 100 };
      default:
        return { descriptions: 3, chatRequests: 3 };
    }
  };

  const canUseAIDescription = () => {
    const limits = getPlanLimits();
    return (
      userSettings.aiUsage.descriptionsUsed <
      limits.descriptions
    );
  };

  const canUseAIChat = () => {
    const limits = getPlanLimits();
    return (
      userSettings.aiUsage.chatRequestsUsed <
      limits.chatRequests
    );
  };


  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error(translations.titleRequired);
      return;
    }

    const taskData = {
      title: newTask.title,
      description: newTask.description,
      time: newTask.time || "12:00",
      date: newTask.date || today.toISOString().split("T")[0],
      priority: newTask.priority,
    };

    const result = await tasksApiHook.createTask(() => 
      tasksAPI.createTask(taskData)
    );

    if (result) {
      const frontendTask = apiTaskToTask(result);
      setTasks([...tasks, frontendTask]);
      setNewTask({
        title: "",
        description: "",
        time: "",
        date: "",
        priority: "normal",
      });
      setIsAddDialogOpen(false);
    }
  };

  // Функция для создания нового приоритета
  const createNewPriority = () => {
    if (!newPriorityName.trim()) {
      toast.error(translations.priorityRequired);
      return;
    }

    // Проверка на уникальность названия
    if (customPriorities.some(p => p.name === newPriorityName.trim())) {
      toast.error(translations.priorityExists);
      return;
    }

    const newPriority: CustomPriority = {
      id: Date.now().toString(),
      name: newPriorityName.trim().toLowerCase().replace(/\s+/g, '-'),
      displayName: newPriorityName.trim(),
      color: newPriorityColor,
      isDefault: false
    };

    setCustomPriorities([...customPriorities, newPriority]);
    setNewPriorityName("");
    setNewPriorityColor("#3b82f6");
    setIsCreatePriorityDialogOpen(false);
    
    // Показываем красивое toast уведомление
    toast.success(
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ 
          backgroundColor: '#10b981', 
          borderRadius: '50%', 
          width: '20px', 
          height: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Check size={12} color="white" />
        </div>
        <span style={{ fontWeight: '500' }}>
          {userSettings.language === "ru" 
            ? `Новый приоритет "${newPriority.displayName}" ${translations.newPriorityAdded}`
            : `New priority "${newPriority.displayName}" ${translations.newPriorityAdded}`
          }
        </span>
      </div>,
      {
        duration: 3000,
        style: {
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-card-foreground)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          fontSize: '14px'
        }
      }
    );
    
    return newPriority.name; // Возвращаем name для автовыбора
  };

  // Функция для удаления приоритета
  const deletePriority = (priorityId: string, priorityName: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Находим приоритет для получения displayName
    const priority = customPriorities.find(p => p.id === priorityId);
    const displayName = priority?.displayName || priorityName;
    
    // Проверяем, есть ли задачи с этим приоритетом
    const tasksWithPriority = tasks.filter(task => task.priority === priorityName);
    if (tasksWithPriority.length > 0) {
      const taskWord = pluralize(tasksWithPriority.length, userSettings.language, "taskWord", "tasksWord", "tasksWordMany");
      const errorMessage = userSettings.language === "ru"
        ? `${translations.cannotDeletePriority} "${displayName}" - ${translations.tasksWithPriority} ${tasksWithPriority.length} ${taskWord} ${translations.withThisPriority}`
        : `${translations.cannotDeletePriority} "${displayName}" - ${translations.tasksWithPriority} ${tasksWithPriority.length} ${taskWord} ${translations.withThisPriority}`;
      toast.error(errorMessage);
      return;
    }
    
    // Удаляем приоритет (разрешаем удаление всех приоритетов)
    const updatedPriorities = customPriorities.filter(p => p.id !== priorityId);
    setCustomPriorities(updatedPriorities);
    
    // Если удаляемый приоритет был выбран в новой задаче, сбрасываем его
    if (newTask.priority === priorityName) {
      setNewTask(prev => ({
        ...prev,
        priority: ""
      }));
    }
    
    toast.success(`${translations.priority} "${displayName}" ${translations.priorityDeleted}`);
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      // Если задача не завершена, запускаем анимацию
      setAnimatingTasks((prev) => new Set(prev).add(taskId));

      // Завершаем задачу после анимации
      setTimeout(async () => {
        const result = await tasksApiHook.completeTask(() => 
          tasksAPI.completeTask(taskId)
        );
        
        if (result) {
          const updatedTask = apiTaskToTask(result);
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === taskId ? updatedTask : t,
            ),
          );
        }
        
        setAnimatingTasks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 500); // Длительность анимации
    } else {
      // Если задача уже завершена, отменяем выполнение
      const result = await tasksApiHook.completeTask(() => 
        tasksAPI.patchTask(taskId, { completed: false })
      );
      
      if (result) {
        const updatedTask = apiTaskToTask(result);
        setTasks(
          tasks.map((t) =>
            t.id === taskId ? updatedTask : t,
          ),
        );
      }
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  // Убираем выделение текста при открытии модального окна редактирования
  useEffect(() => {
    if (isEditDialogOpen) {
      // Небольшая задержка чтобы модальное окно успело отрендериться
      setTimeout(() => {
        const titleInput = document.querySelector(
          '[placeholder="Заголовок задачи"]',
        ) as HTMLTextAreaElement;
        if (titleInput) {
          titleInput.selectionStart = titleInput.selectionEnd =
            titleInput.value.length;
        }
      }, 100);
    }
  }, [isEditDialogOpen]);

  // Настраиваем автоматическое изменение размера полей в диалогах
  useEffect(() => {
    const cleanup: (() => void)[] = [];
    
    // Настройка для полей в диалоге добавления задачи
    setTimeout(() => {
      const titleInput = document.querySelector('textarea[placeholder="Заголовок задачи"]') as HTMLTextAreaElement;
      const descTextarea = document.querySelector('textarea[placeholder="Описание задачи"]') as HTMLTextAreaElement;
      
      if (titleInput) {
        const titleHandler = (e: Event) => autoResize(e.target as HTMLTextAreaElement);
        titleInput.addEventListener('input', titleHandler);
        titleInput.addEventListener('focus', titleHandler);
        cleanup.push(() => {
          titleInput.removeEventListener('input', titleHandler);
          titleInput.removeEventListener('focus', titleHandler);
        });
      }
      
      if (descTextarea) {
        const descHandler = (e: Event) => autoResize(e.target as HTMLTextAreaElement);
        descTextarea.addEventListener('input', descHandler);
        descTextarea.addEventListener('focus', descHandler);
        cleanup.push(() => {
          descTextarea.removeEventListener('input', descHandler);
          descTextarea.removeEventListener('focus', descHandler);
        });
      }
    }, 100);
    
    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [newTask, editingTask]);

  // Автоматическое заполнение времени и даты при открытии диалога добавления задачи
  useEffect(() => {
    if (isAddDialogOpen) {
      const { date, time } = getCurrentDateTimeForTask();
      setNewTask(prev => ({
        ...prev,
        date: prev.date || date,
        time: prev.time || time,
      }));
    } else {
      // Очищаем поля при закрытии диалога
      setNewTask({
        title: "",
        description: "",
        time: "",
        date: "",
        priority: "medium" as const,
      });
    }
  }, [isAddDialogOpen]);

  const updateTask = async () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error("Заголовок задачи обязателен");
      return;
    }

    const updateData = taskToApiTaskRequest(editingTask);
    const result = await tasksApiHook.updateTask(() => 
      tasksAPI.updateTask(editingTask.id, updateData)
    );

    if (result) {
      const updatedTask = apiTaskToTask(result);
      setTasks(
        tasks.map((task) =>
          task.id === editingTask.id ? updatedTask : task,
        ),
      );

      setEditingTask(null);
      setIsEditDialogOpen(false);
    }
  };

  const generateTaskDescription = () => {
    if (!newTask.title.trim()) {
      toast.error(translations.enterTitleForAI);
      return;
    }

    if (!canUseAIDescription()) {
      toast.error(translations.aiLimitReached);
      return;
    }

    // Простая AI-генерация описания на основе заголовка
    const keywordMappings = userSettings.language === "ru" ? {
      встреча: "meetingDescription",
      звонок: "callDescription", 
      покупки: "shoppingDescription",
      работа: "workDescription",
      учеба: "studyDescription",
      спорт: "sportsDescription",
      здоровье: "healthDescription"
    } : {
      meeting: "meetingDescription",
      call: "callDescription",
      shopping: "shoppingDescription", 
      work: "workDescription",
      study: "studyDescription",
      sport: "sportsDescription",
      health: "healthDescription"
    };

    const title = newTask.title.toLowerCase();
    let generatedDescription: string = translations.defaultDescription;

    // Ищем ключевые слова в заголовке
    for (const [keyword, descriptionKey] of Object.entries(keywordMappings)) {
      if (title.includes(keyword)) {
        generatedDescription = (translations as Record<string, string>)[descriptionKey];
        break;
      }
    }

    setNewTask({
      ...newTask,
      description: generatedDescription,
    });

    setUserSettings((prev) => ({
      ...prev,
      aiUsage: {
        ...prev.aiUsage,
        descriptionsUsed: prev.aiUsage.descriptionsUsed + 1,
      },
    }));
    setIsAIHelpDialogOpen(false);
    toast.success(translations.aiDescriptionGenerated);
  };

  const generateEditTaskDescription = () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error(translations.enterTitleForAI);
      return;
    }

    if (!canUseAIDescription()) {
      toast.error(translations.aiLimitReached);
      return;
    }

    // Простая AI-генерация описания на основе заголовка
    const keywordMappings = userSettings.language === "ru" ? {
      встреча: "meetingDescription",
      звонок: "callDescription", 
      покупки: "shoppingDescription",
      работа: "workDescription",
      учеба: "studyDescription",
      спорт: "sportsDescription",
      здоровье: "healthDescription"
    } : {
      meeting: "meetingDescription",
      call: "callDescription",
      shopping: "shoppingDescription", 
      work: "workDescription",
      study: "studyDescription",
      sport: "sportsDescription",
      health: "healthDescription"
    };

    const title = editingTask.title.toLowerCase();
    let generatedDescription: string = translations.defaultDescription;

    // Ищем ключевые слова в заголовке
    for (const [keyword, descriptionKey] of Object.entries(keywordMappings)) {
      if (title.includes(keyword)) {
        generatedDescription = (translations as Record<string, string>)[descriptionKey];
        break;
      }
    }

    setEditingTask({
      ...editingTask,
      description: generatedDescription,
    });

    setUserSettings((prev) => ({
      ...prev,
      aiUsage: {
        ...prev.aiUsage,
        descriptionsUsed: prev.aiUsage.descriptionsUsed + 1,
      },
    }));
    toast.success(translations.aiDescriptionGenerated);
  };

  const sendAiMessage = () => {
    if (!aiMessage.trim()) return;

    if (!canUseAIChat()) {
      toast.error(translations.chatLimitReached);
      return;
    }

    let currentSession = currentChatId
      ? chatSessions.find((s) => s.id === currentChatId)
      : null;

    if (!currentSession) {
      // Create new chat session
      const newSessionId = Date.now().toString();
      currentSession = {
        id: newSessionId,
        title: aiMessage.slice(0, 30) + "...",
        date: today.toISOString().split("T")[0],
        messages: [],
      };
      setChatSessions([...chatSessions, currentSession]);
      setCurrentChatId(newSessionId);
    }

    const locale = userSettings.language === "ru" ? "ru-RU" : "en-US";
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: aiMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: translations.aiResponseText,
      sender: "ai",
      timestamp: new Date().toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Update the session with new messages
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentSession!.id
          ? {
              ...session,
              messages: [
                ...session.messages,
                userMessage,
                aiResponse,
              ],
            }
          : session,
      ),
    );

    setUserSettings((prev) => ({
      ...prev,
      aiUsage: {
        ...prev.aiUsage,
        chatRequestsUsed: prev.aiUsage.chatRequestsUsed + 1,
      },
    }));
    setAiMessage("");
  };

  const getTasksForView = () => {
    const incompleteTasks = tasks.filter(
      (task) => !task.completed,
    );

    switch (activeView) {
      case "today":
        return incompleteTasks.filter(
          (task) =>
            task.date === today.toISOString().split("T")[0],
        );
      case "week": {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return incompleteTasks.filter((task) => {
          const taskDate = new Date(task.date);
          return taskDate >= weekStart && taskDate <= weekEnd;
        });
      }
      case "month":
        return incompleteTasks.filter((task) => {
          const taskDate = new Date(task.date);
          return (
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getFullYear() === today.getFullYear()
          );
        });
      default:
        return incompleteTasks;
    }
  };

  // const groupTasksByDate = (tasks: Task[]) => {
  //   const grouped: { [key: string]: Task[] } = {};
  //   tasks.forEach((task) => {
  //     if (!grouped[task.date]) {
  //       grouped[task.date] = [];
  //     }
  //     grouped[task.date].push(task);
  //   });
  //   return grouped;
  // };

  const getAllWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const formatDateForView = (dateString: string) => {
    return formatDate(dateString, userSettings.language);
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isAnimating = animatingTasks.has(task.id);

    return (
      <div
        className={`task-card-wrapper ${
          isAnimating ? "task-card-animating" : "task-card-normal"
        }`}
      >
        <Card
          className="task-card"
          onClick={() => !isAnimating && openEditDialog(task)}
        >
          {/* Top row with badge, time and date */}
          <div className="task-header">
            <div className="task-priority-group">
              {renderPriorityBadge(task.priority, customPriorities)}
              <div className="task-time-info">
                <Clock className="w-4 h-4" />
                <span>{task.time}</span>
              </div>
            </div>
            <div className="task-time-info">
              <CalendarIcon className="w-4 h-4" />
              <span>
                {formatDate(task.date, userSettings.language)}
              </span>
            </div>
          </div>

          {/* Task content */}
          <div className="mb-2">
            <h3
              className={`task-title ${task.completed ? "line-through text-muted-foreground" : ""}`}
            >
              {task.title}
            </h3>
            <p className="task-description">
              {task.description}
            </p>
          </div>

          {/* Bottom row with complete button */}
          <div className="task-actions">
            <Button
              variant="outline"
              size="sm"
              className="complete-task-btn"
              disabled={isAnimating}
              onClick={(e) => {
                e.stopPropagation();
                if (!isAnimating) {
                  toggleTask(task.id);
                }
              }}
            >
              {isAnimating ? translations.completing : translations.completeTask}
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const getCompletedTasks = () => {
    return tasks.filter((task) => task.completed);
  };

  const getCurrentChatSession = () => {
    return currentChatId
      ? chatSessions.find((s) => s.id === currentChatId)
      : null;
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setAiMessage("");
  };

  const startEditingChatTitle = () => {
    const currentSession = getCurrentChatSession();
    if (currentSession) {
      setEditingChatTitle(currentSession.title);
      setIsEditingChatTitle(true);
    }
  };

  const saveChatTitle = () => {
    if (!editingChatTitle.trim() || !currentChatId) return;

    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentChatId
          ? { ...session, title: editingChatTitle.trim() }
          : session,
      ),
    );

    setIsEditingChatTitle(false);
    setEditingChatTitle("");
    toast.success(translations.chatTitleUpdated);
  };

  const cancelEditingChatTitle = () => {
    setIsEditingChatTitle(false);
    setEditingChatTitle("");
  };

  const purchasePlan = (plan: "free" | "plus" | "pro") => {
    if (plan === "free") {
      setUserSettings((prev) => ({ ...prev, plan: "free" }));
      toast.success(translations.switchedToFree);
    } else {
      // Имитация процесса оплаты
      toast.success(translations.paymentSuccess);
      setUserSettings((prev) => ({ ...prev, plan }));
    }
  };

  const renderContent = () => {
    if (currentPage === "settings") {
      const limits = getPlanLimits();

      return (
        <>
          {/* Settings Navigation Tabs */}
          <div className="tabs-header-container">
            <div className="tabs-header-content">
              <Tabs
                value={settingsTab}
                onValueChange={setSettingsTab}
              >
                <TabsList className="">
                  <TabsTrigger value="general">
                    {translations.general}
                  </TabsTrigger>
                  <TabsTrigger value="ai">
                    {translations.ai}
                  </TabsTrigger>
                  <TabsTrigger value="subscription">
                    {translations.subscription}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Settings Content */}
          <div className="max-w-container p-4 pb-bottom-nav">
            <Tabs
              value={settingsTab}
              onValueChange={setSettingsTab}
            >
              <TabsContent
                value="general"
                className="space-y-6"
              >
                {/* Язык интерфейса */}
                <Card className="settings-card">
                  <div className="settings-row">
                    <div className="settings-info">
                      <Globe className="settings-icon settings-icon-language" />
                      <div>
                        <h3 className="settings-title">
                          {translations.language}
                        </h3>
                        <p className="settings-description">
                          {translations.selectLanguage}
                        </p>
                      </div>
                    </div>
                    <Select
                      value={userSettings.language}
                      onValueChange={(value: "ru" | "en") =>
                        setUserSettings((prev) => ({
                          ...prev,
                          language: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-32 select-trigger-themed">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="select-content">
                        <SelectItem value="ru">
                          {translations.russian}
                        </SelectItem>
                        <SelectItem value="en">
                          {translations.english}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                {/* Тема */}
                <div className="settings-card">
                  <div className="settings-row">
                    <div className="settings-info">
                      {userSettings.theme === "dark" ? (
                        <Moon className="settings-icon settings-icon-theme-dark" />
                      ) : (
                        <Sun className="settings-icon settings-icon-theme-light" />
                      )}
                      <div>
                        <h3 className="settings-title">
                          {translations.theme}
                        </h3>
                        <p className="settings-description">
                          {userSettings.theme === "dark"
                            ? translations.darkTheme
                            : translations.lightTheme}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setUserSettings((prev) => ({
                          ...prev,
                          theme:
                            prev.theme === "dark"
                              ? "light"
                              : "dark",
                        }))
                      }
                      className="flex items-center gap-2 button-themed"
                    >
                      {userSettings.theme === "dark" ? (
                        <>
                          <Sun className="w-4 h-4" />
                          {translations.light}
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4" />
                          {translations.dark}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                {/* Выбор модели AI */}
                <div className="settings-card">
                  <div className="settings-row">
                    <div className="settings-info">
                      <Sparkles className="settings-icon settings-icon-ai" />
                      <div>
                        <h3 className="settings-title">
                          {translations.aiModel}
                        </h3>
                        <p className="settings-description">
                          {translations.selectModel}
                        </p>
                      </div>
                    </div>
                    <Select
                      value={userSettings.aiModel}
                      onValueChange={(
                        value:
                          | "chatgpt"
                          | "claude"
                          | "perplexity",
                      ) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          aiModel: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-40 select-trigger-themed">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="select-content">
                        <SelectItem value="chatgpt">
                          ChatGPT
                        </SelectItem>
                        <SelectItem value="claude">
                          Claude
                        </SelectItem>
                        <SelectItem value="perplexity">
                          Perplexity AI
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Персонализация AI */}
                <div className="settings-card">
                  <div className="space-y-4">
                    <div className="settings-info">
                      <Bot className="settings-icon settings-icon-personality" />
                      <div>
                        <h3 className="settings-title">
                          {translations.aiPersonality}
                        </h3>
                        <p className="settings-description">
                          {translations.aiPersonalityDescription}
                        </p>
                      </div>
                    </div>
                    <Textarea
                      placeholder={translations.personalityPlaceholder}
                      value={userSettings.aiPersonality}
                      onChange={(e) => {
                        setUserSettings((prev) => ({
                          ...prev,
                          aiPersonality: e.target.value,
                        }));
                        // Автоматический размер
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      rows={3}
                      className="textarea-themed"
                      style={{
                        minHeight: '4rem',
                        resize: 'none',
                        overflow: 'hidden'
                      }}
                    />
                  </div>
                </div>

                {/* Использование AI */}
                <div className="settings-card">
                  <div className="space-y-4">
                    <div className="settings-info">
                      <BarChart3 className="settings-icon settings-icon-usage" />
                      <h3 className="settings-title">
                        {translations.aiUsageToday}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-card-foreground">
                          {translations.descriptionsGeneration}
                        </span>
                        <span className="text-sm font-medium text-card-foreground">
                          {
                            userSettings.aiUsage
                              .descriptionsUsed
                          }{" "}
                          / {limits.descriptions}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{
                            "--progress-width": `${Math.min((userSettings.aiUsage.descriptionsUsed / limits.descriptions) * 100, 100)}%`
                          } as React.CSSProperties}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-card-foreground">
                          {translations.chatRequests}
                        </span>
                        <span className="text-sm font-medium text-card-foreground">
                          {
                            userSettings.aiUsage
                              .chatRequestsUsed
                          }{" "}
                          / {limits.chatRequests}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{
                            "--progress-width": `${Math.min((userSettings.aiUsage.chatRequestsUsed / limits.chatRequests) * 100, 100)}%`
                          } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="subscription"
                className="subscription-plans"
              >
                {/* Текущий тариф */}
                <div className="settings-card">
                  <div className="settings-row">
                    <div className="settings-info">
                      <Crown className="settings-icon settings-icon-subscription" />
                      <div>
                        <h3 className="settings-title">
                          {translations.currentPlan}
                        </h3>
                        <p className="settings-description">
                          {userSettings.plan === "free"
                            ? translations.free
                            : userSettings.plan === "plus"
                              ? translations.plus
                              : translations.pro}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`plan-badge ${
                        userSettings.plan === "free"
                          ? "plan-free"
                          : userSettings.plan === "plus"
                            ? "plan-plus"
                            : "plan-pro"
                      }`}
                    >
                      {userSettings.plan === "free"
                        ? translations.freePlan
                        : userSettings.plan === "plus"
                          ? translations.plus
                          : translations.pro}
                    </Badge>
                  </div>
                </div>

                {/* Тарифные планы */}
                <div className="subscription-plans">
                  <h3 className="subscription-plans-title">
                    {translations.availablePlans}
                  </h3>

                  {/* Free Plan */}
                  <div className="subscription-plan-card">
                    <div className="subscription-plan-content">
                      <div className="subscription-plan-header">
                        <div className="subscription-plan-info">
                          <div className="subscription-plan-title-row">
                            <h4 className="subscription-plan-title">
                              {translations.free}
                            </h4>
                            <Badge
                              variant="outline"
                              className="border-border"
                            >
                              0 ₽
                            </Badge>
                            {userSettings.plan === "free" && (
                              <Badge className="plan-badge plan-active">
                                {translations.active}
                              </Badge>
                            )}
                          </div>
                          <ul className="subscription-plan-features">
                            {translations.freeFeatures.split('\n').map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {userSettings.plan !== "free" && (
                        <Button
                          className="purchase-btn purchase-free"
                          onClick={() => purchasePlan("free")}
                        >
                          {translations.switchToFree}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Plus Plan */}
                  <div className="subscription-plan-card">
                    <div className="subscription-plan-content">
                      <div className="subscription-plan-header">
                        <div className="subscription-plan-info">
                          <div className="subscription-plan-title-row">
                            <h4 className="subscription-plan-title">
                              {translations.plus}
                            </h4>
                            <Badge className="plan-badge plan-plus">
                              250 ₽
                            </Badge>
                            {userSettings.plan === "plus" && (
                              <Badge className="plan-badge plan-active">
                                {translations.active}
                              </Badge>
                            )}
                          </div>
                          <ul className="subscription-plan-features">
                            {translations.plusFeatures.split('\n').map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {userSettings.plan !== "plus" && (
                        <Button
                          className="purchase-btn purchase-plus"
                          onClick={() => purchasePlan("plus")}
                        >
                          {translations.payForPlus}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="subscription-plan-card">
                    <div className="subscription-plan-content">
                      <div className="subscription-plan-header">
                        <div className="subscription-plan-info">
                          <div className="subscription-plan-title-row">
                            <h4 className="subscription-plan-title">
                              {translations.pro}
                            </h4>
                            <Badge className="plan-badge plan-pro">
                              550 ₽
                            </Badge>
                            {userSettings.plan === "pro" && (
                              <Badge className="plan-badge plan-active">
                                {translations.active}
                              </Badge>
                            )}
                          </div>
                          <ul className="subscription-plan-features">
                            {translations.proFeatures.split('\n').map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {userSettings.plan !== "pro" && (
                        <Button
                          className="purchase-btn purchase-pro"
                          onClick={() => purchasePlan("pro")}
                        >
                          {translations.payForPro}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      );
    }

    if (currentPage === "ai-assistant") {
      const currentSession = getCurrentChatSession();
      return (
        <>
          {/* Chat Header */}
          <div className="tabs-header-container">
            <div className="tabs-header-content">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {currentSession ? (
                    isEditingChatTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingChatTitle}
                          onChange={(e) =>
                            setEditingChatTitle(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveChatTitle();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEditingChatTitle();
                            }
                          }}
                          onBlur={saveChatTitle}
                          className="text-xl font-semibold border-none shadow-none p-0 bg-transparent"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h2
                        className="text-xl font-semibold cursor-pointer hover:text-blue-500 transition-colors text-card-foreground"
                        onClick={startEditingChatTitle}
                        title={translations.clickToEdit}
                      >
                        {currentSession.title}
                      </h2>
                    )
                  ) : (
                    <h2 className="text-xl font-semibold text-card-foreground">
                      {translations.newChat}
                    </h2>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewChat}
                  className="flex items-center gap-2 button-themed"
                >
                  <Plus className="w-4 h-4" />
                  {translations.newChat}
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          <div className="ai-chat-content">
            {currentSession ? (
              <div className="space-y-4">
                {currentSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`chat-message ${
                        message.sender === "user"
                          ? "chat-message-user"
                          : "chat-message-ai"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <span
                        className={`text-xs ${message.sender === "user" ? "chat-message-timestamp-user" : "text-muted-foreground"}`}
                      >
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ai-empty-state">
                <Bot className="ai-empty-icon" />
                <p>{translations.startDialogWithAI}</p>
              </div>
            )}
          </div>

          {/* Fixed Input Area */}
          <div className="ai-input-container">
            <div className="ai-input-wrapper">
              <input
                type="text"
                placeholder={translations.sendMessage}
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && sendAiMessage()
                }
                className="ai-input-field"
              />
              <button
                onClick={sendAiMessage}
                className="ai-send-button"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      );
    }

    if (currentPage === "archive") {
      return (
        <>
          {/* Archive Navigation Tabs */}
          <div className="tabs-header-container">
            <div className="tabs-header-content">
              <Tabs
                value={archiveTab}
                onValueChange={setArchiveTab}
              >
                <TabsList className="">
                  <TabsTrigger value="chats">
                    {translations.chats}
                  </TabsTrigger>
                  <TabsTrigger value="tasks">
                    {translations.tasks}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Archive Content */}
          <div className="max-w-container p-4 pb-bottom-nav">
            <Tabs
              value={archiveTab}
              onValueChange={setArchiveTab}
            >
              <TabsContent value="chats">
                <div className="space-y-3">
                  {chatSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="p-4 cursor-pointer bg-card border-border hover:bg-accent transition-colors"
                      onClick={() => {
                        setCurrentChatId(session.id);
                        setCurrentPage("ai-assistant");
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-card-foreground">
                            {session.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {session.messages.length} {translations.messages}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(session.date, userSettings.language)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                <div className="space-y-3">
                  {getCompletedTasks().map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {getCompletedTasks().length === 0 && (
                    <div className="text-center text-muted-foreground empty-tasks-state">
                      <CheckCircle2 className="empty-tasks-icon" />
                      <p>{translations.noCompletedTasks}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      );
    }

    // Home page (default)
    return (
      <>
        {/* Navigation Tabs */}
        <div className="tabs-header-container">
          <div className="tabs-header-content">
            <Tabs
              value={activeView}
              onValueChange={setActiveView}
            >
              <TabsList className="">
                <TabsTrigger value="today">
                  {translations.today}
                </TabsTrigger>
                <TabsTrigger value="week">
                  {translations.week}
                </TabsTrigger>
                <TabsTrigger value="month">
                  {translations.month}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-container p-4 pb-bottom-nav-extra">
          {activeView === "today" && (
            <>
              {getTasksForView().map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {getTasksForView().length === 0 && (
                <div className="text-center text-muted-foreground mt-8">
                  <p>{translations.noTasksToday}</p>
                </div>
              )}
            </>
          )}

          {activeView === "week" && (
            <>
              {getAllWeekDates().map((date) => {
                const weekTasks = getTasksForView();
                const tasksForDate = weekTasks.filter(
                  (task) => task.date === date,
                );

                return (
                  <div key={date} className="mb-6">
                    <h3 className="text-muted-foreground mb-3">
                      {formatDateForView(date)}
                    </h3>
                    {tasksForDate.length > 0 ? (
                      tasksForDate.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))
                    ) : (
                      <div className="empty-day-card">
                        <p className="empty-day-text">
                          {translations.noTasksThisDay}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {activeView === "month" && (
            <>
              <div className="bg-card rounded-lg border border-border">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) =>
                    date && setSelectedDate(date)
                  }
                  weekStartsOn={1}
                  className="w-full flex justify-center bg-transparent"
                  classNames={{
                    day_selected:
                      "calendar-day-selected",
                    day: "relative w-8 h-8 p-0 font-normal text-sm bg-transparent hover:bg-accent text-card-foreground",
                    head_cell:
                      "text-center text-muted-foreground font-normal text-[0.8rem] w-8 h-8 flex items-center justify-center",
                    caption_label:
                      "text-sm font-medium text-card-foreground",
                    cell: "relative p-0.5 text-center text-sm focus-within:relative focus-within:z-20 w-8 [&:has([aria-selected])]:bg-transparent",
                    row: "flex w-full mt-1",
                    head_row: "flex w-full mb-1",
                    table: "w-full border-collapse",
                    day_today:
                      "bg-transparent text-card-foreground font-medium",
                  }}
                  formatters={{
                    formatWeekdayName: (date) => {
                      return getWeekdays(userSettings.language)[date.getDay()];
                    },
                    formatCaption: (date) => {
                      return `${getMonths(userSettings.language)[date.getMonth()]} ${date.getFullYear()}`;
                    },
                  }}
                  components={{
                    DayContent: ({ date }) => {
                      const dateStr = date
                        .toISOString()
                        .split("T")[0];
                      const hasTasks = tasks.some(
                        (task) =>
                          task.date === dateStr &&
                          !task.completed,
                      );
                      return (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {date.getDate()}
                          {hasTasks && (
                            <div className="calendar-task-indicator"></div>
                          )}
                        </div>
                      );
                    },
                  }}
                />
              </div>
              <div className="mt-6">
                <h3 className="text-muted-foreground mb-3">
                  {formatDate(selectedDate.toISOString().split('T')[0], userSettings.language)}
                </h3>
                {(() => {
                  const tasksForSelectedDate = tasks.filter(
                    (task) =>
                      task.date ===
                        selectedDate
                          .toISOString()
                          .split("T")[0] && !task.completed,
                  );
                  return tasksForSelectedDate.length > 0 ? (
                    tasksForSelectedDate.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  ) : (
                    <div className="empty-day-card">
                      <p className="empty-day-text">
                        {translations.noTasksThisDay}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <>
    <div className="app" data-theme={userSettings.theme}>
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1 
            className="header-title"
            onClick={() => {
              setCurrentPage("home");
              setActiveView("today");
            }}
            title={translations.goToHome}
          >
            {translations.appTitle}
          </h1>
          <button
            onClick={() => setCurrentPage("settings")}
            className="btn btn-ghost btn-icon"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {renderContent()}

      {/* Floating Add Button - только на главной странице */}
      {currentPage === "home" && (
        <div className="floating-btn">
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
          >
            <DialogTrigger asChild>
              <button className="btn btn-primary btn-lg rounded-full">
                <Plus className="w-5 h-5" />
                {translations.addTask}
              </button>
            </DialogTrigger>
            <DialogContent className="dialog-content-container">
              <DialogHeader>
                <DialogTitle className="dialog-title-text">
                  {translations.addTask}
                </DialogTitle>
              </DialogHeader>
              <div className="dialog-form">
                <Textarea
                  id="new-task-title"
                  name="title"
                  placeholder={translations.taskTitle}
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      title: e.target.value.slice(0, 100),
                    })
                  }
                  className="dialog-field dialog-title-field"
                  rows={1}
                  maxLength={100}
                />
                <Textarea
                  id="new-task-description"
                  name="description"
                  placeholder={translations.taskDescription}
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description: e.target.value.slice(0, 1000),
                    })
                  }
                  className="dialog-field dialog-description-field"
                  maxLength={1000}
                />
                {/* AI описание кнопка под полем описания */}
                <Dialog
                  open={isAIHelpDialogOpen}
                  onOpenChange={setIsAIHelpDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="dialog-button-flex dialog-button-outline dialog-button-ai-description"
                      disabled={!canUseAIDescription()}
                    >
                      <Sparkles className="dialog-icon" />
                      {translations.aiDescription}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dialog-content-container dialog-content-ai">
                    <DialogHeader>
                      <DialogTitle className="dialog-title-text">
                        {translations.aiGenerateDescription}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="dialog-form">
                      <p className="dialog-text">
                        {translations.aiDescriptionText}
                      </p>
                      <div className="dialog-small-text">
                        {translations.usageRemaining}:{" "}
                        {getPlanLimits().descriptions -
                          userSettings.aiUsage
                            .descriptionsUsed}
                      </div>
                      <Button
                        onClick={generateTaskDescription}
                        className="dialog-button-primary dialog-button-ai-generate"
                      >
                        <Sparkles className="dialog-icon" />
                        {translations.generateDescription}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="dialog-form-grid">
                  {/* Custom Time Field */}
                  <div className="custom-datetime-field">
                    <input
                      id="new-task-time"
                      name="time"
                      type="time"
                      value={newTask.time}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          time: e.target.value,
                        })
                      }
                      className="custom-datetime-input"
                    />
                    <div className="custom-datetime-icon" onClick={() => {
                      const input = document.getElementById('new-task-time') as HTMLInputElement;
                      input?.showPicker?.();
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                      </svg>
                    </div>
                  </div>
                  {/* Custom Date Field */}
                  <div className="custom-datetime-field">
                    <input
                      id="new-task-date"
                      name="date"
                      type="date"
                      value={newTask.date}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          date: e.target.value,
                        })
                      }
                      className="custom-datetime-input"
                    />
                    <div className="custom-datetime-icon" onClick={() => {
                      const input = document.getElementById('new-task-date') as HTMLInputElement;
                      input?.showPicker?.();
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="priority-label">
                  <span className="field-label">{translations.taskPriority}</span>
                </div>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: string) => {
                    if (value === "create-new") {
                      setIsCreatePriorityDialogOpen(true);
                    } else {
                      setNewTask({ ...newTask, priority: value });
                    }
                  }}
                >
                  <SelectTrigger className="dialog-field">
                    <SelectValue placeholder={translations.priority} />
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    {customPriorities.length === 0 && (
                      <div className="select-item text-sm text-muted-foreground px-2 py-1">
                        {userSettings.language === "ru" 
                          ? "Приоритеты не созданы"
                          : "No priorities created"}
                      </div>
                    )}
                    {customPriorities.map(priority => (
                      <SelectItem key={priority.id} value={priority.name}>
                        <div className="priority-item">
                          <div className="priority-item-left">
                            <Check className={`priority-item-check ${newTask.priority === priority.name ? 'visible' : ''}`} />
                            <div 
                              className="priority-item-color" 
                              style={{ backgroundColor: priority.color }}
                            />
                            <span className="priority-item-name">{priority.displayName}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              deletePriority(priority.id, priority.name, e);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="priority-item-delete"
                            title={userSettings.language === "ru" ? "Удалить приоритет" : "Delete priority"}
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="create-new">
                      <div className="flex items-center gap-2">
                        <Plus className="w-3 h-3" />
                        {translations.createPriority}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="dialog-button-row">
                  <Button
                    onClick={addTask}
                    disabled={tasksApiHook.loading}
                    className="dialog-button-flex dialog-button-primary dialog-button-main-action"
                  >
                    {tasksApiHook.loading ? "Создание..." : translations.addTask}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="dialog-content-container">
          <DialogHeader>
            <DialogTitle className="dialog-title-text">
              {translations.editTask}
            </DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="dialog-form">
              <Textarea
                id="edit-task-title"
                name="title"
                placeholder="Заголовок задачи"
                value={editingTask.title}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    title: e.target.value.slice(0, 100),
                  })
                }
                className="dialog-field dialog-title-field"
                rows={1}
                maxLength={100}
              />
              <Textarea
                id="edit-task-description"
                name="description"
                placeholder="Описание задачи"
                value={editingTask.description}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    description: e.target.value.slice(0, 1000),
                  })
                }
                className="dialog-field dialog-description-field"
                maxLength={1000}
              />
              {/* AI описание кнопка под полем описания */}
              <Dialog
                open={isEditAIHelpDialogOpen}
                onOpenChange={setIsEditAIHelpDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="dialog-button-flex dialog-button-outline dialog-button-ai-description"
                    disabled={!canUseAIDescription()}
                  >
                    <Sparkles className="dialog-icon" />
                    AI описание
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-content-container dialog-content-ai">
                  <DialogHeader>
                    <DialogTitle className="dialog-title-text">
                      AI Генерация описания
                    </DialogTitle>
                  </DialogHeader>
                  <div className="dialog-form">
                    <p className="dialog-text">
                      AI создаст подробное описание задачи
                      на основе введенного заголовка.
                      Убедитесь, что заголовок задачи
                      заполнен.
                    </p>
                    <div className="dialog-small-text">
                      Осталось использований:{" "}
                      {getPlanLimits().descriptions -
                        userSettings.aiUsage
                          .descriptionsUsed}
                    </div>
                    <Button
                      onClick={generateEditTaskDescription}
                      className="dialog-button-primary dialog-button-ai-generate"
                    >
                      <Sparkles className="dialog-icon" />
                      Сгенерировать описание
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="dialog-form-grid">
                {/* Custom Time Field */}
                <div className="custom-datetime-field">
                  <input
                    id="edit-task-time"
                    name="time"
                    type="time"
                    value={editingTask.time}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        time: e.target.value,
                      })
                    }
                    className="custom-datetime-input"
                  />
                  <div className="custom-datetime-icon" onClick={() => {
                    const input = document.getElementById('edit-task-time') as HTMLInputElement;
                    input?.showPicker?.();
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                  </div>
                </div>
                {/* Custom Date Field */}
                <div className="custom-datetime-field">
                  <input
                    id="edit-task-date"
                    name="date"
                    type="date"
                    value={editingTask.date}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        date: e.target.value,
                      })
                    }
                    className="custom-datetime-input"
                  />
                  <div className="custom-datetime-icon" onClick={() => {
                    const input = document.getElementById('edit-task-date') as HTMLInputElement;
                    input?.showPicker?.();
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="priority-label">
                <span className="field-label">Приоритет задачи</span>
              </div>
              <Select
                value={editingTask.priority}
                onValueChange={(value: string) => {
                  if (value === "create-new") {
                    setIsCreatePriorityDialogOpen(true);
                  } else {
                    setEditingTask({
                      ...editingTask,
                      priority: value,
                    });
                  }
                }}
              >
                <SelectTrigger className="dialog-field">
                  <SelectValue placeholder="Приоритет" />
                </SelectTrigger>
                <SelectContent className="select-content">
                  {customPriorities.length === 0 && (
                    <div className="select-item text-sm text-muted-foreground px-2 py-1">
                      Приоритеты не созданы
                    </div>
                  )}
                  {customPriorities.map(priority => (
                    <SelectItem key={priority.id} value={priority.name}>
                      <div className="priority-item">
                        <div className="priority-item-left">
                          <Check className={`priority-item-check ${editingTask.priority === priority.name ? 'visible' : ''}`} />
                          <div 
                            className="priority-item-color" 
                            style={{ backgroundColor: priority.color }}
                          />
                          <span className="priority-item-name">{priority.displayName}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            deletePriority(priority.id, priority.name, e);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="priority-item-delete"
                          title="Удалить приоритет"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="create-new">
                    <div className="flex items-center gap-2">
                      <Plus className="w-3 h-3" />
                      Создать новый приоритет
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="dialog-button-row">
                <Button
                  onClick={updateTask}
                  disabled={tasksApiHook.loading}
                  className="dialog-button-flex dialog-button-primary dialog-button-main-action"
                >
                  {tasksApiHook.loading ? "Сохранение..." : translations.saveTask}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог создания нового приоритета */}
      <Dialog
        open={isCreatePriorityDialogOpen}
        onOpenChange={setIsCreatePriorityDialogOpen}
      >
        <DialogContent className="dialog-content-container dialog-content-priority">
          <DialogHeader>
            <DialogTitle className="dialog-title-text">
              {translations.createPriority}
            </DialogTitle>
          </DialogHeader>
          <div className="dialog-form">
            <div className="space-y-4">
              <div>
                <span className="field-label">{translations.priorityName}</span>
                <input
                  type="text"
                  name="priorityName"
                  placeholder={translations.priorityExample}
                  value={newPriorityName}
                  onChange={(e) => setNewPriorityName(e.target.value)}
                  className="dialog-field input"
                  maxLength={20}
                />
              </div>
              <div>
                <span className="field-label">{translations.priorityColor}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newPriorityColor}
                    onChange={(e) => setNewPriorityColor(e.target.value)}
                    className="w-10 h-10 rounded border-0 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    {newPriorityColor}
                  </span>
                  {newPriorityName && (
                    <Badge 
                      className="badge-priority-dynamic ml-2" 
                      style={{ backgroundColor: newPriorityColor }}
                    >
                      {newPriorityName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="dialog-button-row mt-6">
              <Button
                onClick={() => setIsCreatePriorityDialogOpen(false)}
                className="dialog-button-flex dialog-button-outline"
              >
                {translations.cancel}
              </Button>
              <Button
                onClick={createNewPriority}
                className="dialog-button-flex dialog-button-primary"
                disabled={!newPriorityName.trim()}
              >
                {translations.create}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <button
            onClick={() => {
              setCurrentPage("home");
              setActiveView("today");
            }}
            className={`bottom-nav-item ${
              currentPage === "home" ? "active" : ""
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="bottom-nav-text">{translations.home}</span>
          </button>

          <button
            onClick={() => setCurrentPage("ai-assistant")}
            className={`bottom-nav-item ${
              currentPage === "ai-assistant" ? "active" : ""
            }`}
          >
            <Bot className="w-6 h-6" />
            <span className="bottom-nav-text">{translations.aiAssistant}</span>
          </button>

          <button
            onClick={() => setCurrentPage("archive")}
            className={`bottom-nav-item ${
              currentPage === "archive" ? "active" : ""
            }`}
          >
            <Archive className="w-6 h-6" />
            <span className="bottom-nav-text">{translations.archive}</span>
          </button>
        </div>
      </div>
    </div>
    <Toaster theme={userSettings.theme} />
    </>
  );
}