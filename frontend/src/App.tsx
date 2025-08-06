import { useState, useEffect } from "react";
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
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  priority: "critical" | "high" | "medium" | "low";
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

export default function App() {
  const [activeView, setActiveView] = useState("today");
  const [currentPage, setCurrentPage] = useState("home"); // home, ai-assistant, archive, settings
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Заголовок задачи которую нужно выполнить",
      description:
        "Описание задачи если есть, Описание задачи если есть, Описание задачи если есть....",
      time: "14:30",
      date: "2025-07-26",
      priority: "critical",
      completed: false,
    },
  ]);

  const [chatSessions, setChatSessions] = useState<
    ChatSession[]
  >([
    {
      id: "1",
      title: "Планирование недели",
      date: "2025-07-26",
      messages: [
        {
          id: "1",
          text: "Помоги мне запланировать задачи на завтра",
          sender: "user",
          timestamp: "14:30",
        },
        {
          id: "2",
          text: "Конечно! Давайте составим план на завтра. Какие у вас основные приоритеты?",
          sender: "ai",
          timestamp: "14:31",
        },
      ],
    },
  ]);

  const [userSettings, setUserSettings] =
    useState<UserSettings>({
      language: "ru",
      theme: "light",
      aiPersonality:
        "Дружелюбный и профессиональный помощник, который помогает с планированием задач и повышением продуктивности.",
      aiModel: "chatgpt",
      plan: "free",
      aiUsage: {
        descriptionsUsed: 0,
        chatRequestsUsed: 0,
        lastResetDate: new Date().toISOString().split("T")[0],
      },
    });

  const [currentChatId, setCurrentChatId] = useState<
    string | null
  >(null);
  const [aiMessage, setAiMessage] = useState("");
  const [archiveTab, setArchiveTab] = useState("chats"); // chats, tasks
  const [settingsTab, setSettingsTab] = useState("general"); // general, ai, subscription
  const [selectedPlan] = useState<
    "free" | "plus" | "pro"
  >("free");
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
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    time: "",
    date: "",
    priority: "medium" as const,
  });

  const today = new Date();
  const weekStart = new Date(today);
  // Начинаем неделю с понедельника (1), воскресенье становится 7-м днем
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(today.getDate() - daysFromMonday);

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

  const useAIDescription = () => {
    setUserSettings((prev) => ({
      ...prev,
      aiUsage: {
        ...prev.aiUsage,
        descriptionsUsed: prev.aiUsage.descriptionsUsed + 1,
      },
    }));
  };

  const useAIChat = () => {
    setUserSettings((prev) => ({
      ...prev,
      aiUsage: {
        ...prev.aiUsage,
        chatRequestsUsed: prev.aiUsage.chatRequestsUsed + 1,
      },
    }));
  };

  const addTask = () => {
    if (!newTask.title.trim()) {
      toast.error("Заголовок задачи обязателен");
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      time: newTask.time || "12:00",
      date: newTask.date || today.toISOString().split("T")[0],
      priority: newTask.priority,
      completed: false,
    };

    setTasks([...tasks, task]);
    setNewTask({
      title: "",
      description: "",
      time: "",
      date: "",
      priority: "medium",
    });
    setIsAddDialogOpen(false);
    toast.success("Задача добавлена");
  };

  const toggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      // Если задача не завершена, запускаем анимацию
      setAnimatingTasks((prev) => new Set(prev).add(taskId));

      // Завершаем задачу после анимации
      setTimeout(() => {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId ? { ...t, completed: true } : t,
          ),
        );
        setAnimatingTasks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 500); // Длительность анимации
    } else {
      // Если задача уже завершена, просто переключаем обратно
      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, completed: false } : t,
        ),
      );
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
        ) as HTMLInputElement;
        if (titleInput) {
          titleInput.selectionStart = titleInput.selectionEnd =
            titleInput.value.length;
        }
      }, 100);
    }
  }, [isEditDialogOpen]);

  const updateTask = () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error("Заголовок задачи обязателен");
      return;
    }

    setTasks(
      tasks.map((task) =>
        task.id === editingTask.id ? editingTask : task,
      ),
    );

    setEditingTask(null);
    setIsEditDialogOpen(false);
    toast.success("Задача обновлена");
  };

  const generateTaskDescription = () => {
    if (!newTask.title.trim()) {
      toast.error(
        "Введите заголовок задачи для генерации описания",
      );
      return;
    }

    if (!canUseAIDescription()) {
      toast.error(
        "Достигнут лимит генерацией описаний на сегодня. Обновите тариф для увеличения лимита.",
      );
      return;
    }

    // Простая AI-генерация описания на основе заголовка
    const descriptions = {
      встреча:
        "Подготовиться к встрече, просмотреть материалы, составить список вопросов и целей для обсуждения.",
      звонок:
        "Подготовить план разговора, проверить контактную информацию, выбрать удобное время для звонка.",
      покупки:
        "Составить список необходимых товаров, проверить цены, выбрать подходящий магазин.",
      работа:
        "Определить приоритетные задачи, выделить время для концентрированной работы, подготовить необходимые материалы.",
      учеба:
        "Подготовить учебные материалы, выбрать подходящее место для занятий, составить план изучения.",
      спорт:
        "Подготовить спортивную форму, выбрать подходящее время, составить программу тренировки.",
      здоровье:
        "Записаться на прием, подготовить документы, составить список вопросов для специалиста.",
    };

    const title = newTask.title.toLowerCase();
    let generatedDescription =
      "Выполнить поставленную задачу согласно плану и достичь желаемого результата.";

    // Ищем ключевые слова в заголовке
    for (const [keyword, description] of Object.entries(
      descriptions,
    )) {
      if (title.includes(keyword)) {
        generatedDescription = description;
        break;
      }
    }

    setNewTask({
      ...newTask,
      description: generatedDescription,
    });

    useAIDescription();
    setIsAIHelpDialogOpen(false);
    toast.success("Описание сгенерировано AI");
  };

  const generateEditTaskDescription = () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error(
        "Введите заголовок задачи для генерации описания",
      );
      return;
    }

    if (!canUseAIDescription()) {
      toast.error(
        "Достигнут лимит генерацией описаний на сегодня. Обновите тариф для увеличения лимита.",
      );
      return;
    }

    // Простая AI-генерация описания на основе заголовка
    const descriptions = {
      встреча:
        "Подготовиться к встрече, просмотреть материалы, составить список вопросов и целей для обсуждения.",
      звонок:
        "Подготовить план разговора, проверить контактную информацию, выбрать удобное время для звонка.",
      покупки:
        "Составить список необходимых товаров, проверить цены, выбрать подходящий магазин.",
      работа:
        "Определить приоритетные задачи, выделить время для концентрированной работы, подготовить необходимые материалы.",
      учеба:
        "Подготовить учебные материалы, выбрать подходящее место для занятий, составить план изучения.",
      спорт:
        "Подготовить спортивную форму, выбрать подходящее время, составить программу тренировки.",
      здоровье:
        "Записаться на прием, подготовить документы, составить список вопросов для специалиста.",
    };

    const title = editingTask.title.toLowerCase();
    let generatedDescription =
      "Выполнить поставленную задачу согласно плану и достичь желаемого результата.";

    // Ищем ключевые слова в заголовке
    for (const [keyword, description] of Object.entries(
      descriptions,
    )) {
      if (title.includes(keyword)) {
        generatedDescription = description;
        break;
      }
    }

    setEditingTask({
      ...editingTask,
      description: generatedDescription,
    });

    useAIDescription();
    toast.success("Описание сгенерировано AI");
  };

  const sendAiMessage = () => {
    if (!aiMessage.trim()) return;

    if (!canUseAIChat()) {
      toast.error(
        "Достигнут лимит запросов к AI на сегодня. Обновите тариф для увеличения лимита.",
      );
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

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: aiMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: "Отличная идея! Я могу помочь вам создать задачу. Какое время и приоритет вы хотите установить?",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString("ru-RU", {
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

    useAIChat();
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
      case "week":
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return incompleteTasks.filter((task) => {
          const taskDate = new Date(task.date);
          return taskDate >= weekStart && taskDate <= weekEnd;
        });
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    const formatted = new Intl.DateTimeFormat(
      "ru-RU",
      options,
    ).format(date);
    // Делаем первую букву заглавной
    return (
      formatted.charAt(0).toUpperCase() + formatted.slice(1)
    );
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isAnimating = animatingTasks.has(task.id);

    return (
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isAnimating
            ? "transform translate-x-full opacity-0 scale-95"
            : "transform translate-x-0 opacity-100 scale-100"
        }`}
      >
        <Card
          className="p-3 mb-1 cursor-pointer bg-card border-border hover:bg-accent transition-colors"
          onClick={() => !isAnimating && openEditDialog(task)}
        >
          {/* Top row with badge, time and date */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {task.priority === "critical" && (
                <Badge
                  variant="destructive"
                  className="text-xs px-2 py-1 rounded-full bg-red-600 text-white"
                >
                  Критический
                </Badge>
              )}
              {task.priority === "high" && (
                <Badge className="text-xs px-2 py-1 rounded-full bg-orange-500 text-white">
                  Высокий
                </Badge>
              )}
              {task.priority === "medium" && (
                <Badge className="text-xs px-2 py-1 rounded-full bg-blue-500 text-white">
                  Средний
                </Badge>
              )}
              {task.priority === "low" && (
                <Badge className="text-xs px-2 py-1 rounded-full bg-gray-500 text-white">
                  Низкий
                </Badge>
              )}
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                <span>{task.time}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <CalendarIcon className="w-4 h-4" />
              <span>
                {new Date(task.date).toLocaleDateString(
                  "ru-RU",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  },
                )}
              </span>
            </div>
          </div>

          {/* Task content */}
          <div className="mb-2">
            <h3
              className={`text-lg font-medium mb-1 leading-tight text-card-foreground ${task.completed ? "line-through text-muted-foreground" : ""}`}
            >
              {task.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Bottom row with complete button */}
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground border-border hover:bg-accent rounded-full px-4 py-2"
              disabled={isAnimating}
              onClick={(e) => {
                e.stopPropagation();
                if (!isAnimating) {
                  toggleTask(task.id);
                }
              }}
            >
              {isAnimating ? "Завершается..." : "Завершить"}
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
    toast.success("Название чата обновлено");
  };

  const cancelEditingChatTitle = () => {
    setIsEditingChatTitle(false);
    setEditingChatTitle("");
  };

  const purchasePlan = (plan: "free" | "plus" | "pro") => {
    if (plan === "free") {
      setUserSettings((prev) => ({ ...prev, plan: "free" }));
      toast.success(
        "Переключение на бесплатный тариф выполнено",
      );
    } else {
      // Имитация процесса оплаты
      toast.success(
        "Оплата прошла успешно! Тариф активирован.",
      );
      setUserSettings((prev) => ({ ...prev, plan }));
    }
  };

  const renderContent = () => {
    if (currentPage === "settings") {
      const limits = getPlanLimits();

      return (
        <>
          {/* Settings Navigation Tabs */}
          <div className="bg-card border-b border-border">
            <div className="max-w-container p-4">
              <Tabs
                value={settingsTab}
                onValueChange={setSettingsTab}
              >
                <TabsList className="">
                  <TabsTrigger value="general">
                    Общие
                  </TabsTrigger>
                  <TabsTrigger value="ai">
                    AI-ассистент
                  </TabsTrigger>
                  <TabsTrigger value="subscription">
                    Подписка
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
                          Язык интерфейса
                        </h3>
                        <p className="settings-description">
                          Выберите язык приложения
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
                          Русский
                        </SelectItem>
                        <SelectItem value="en">
                          English
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
                          Тема
                        </h3>
                        <p className="settings-description">
                          {userSettings.theme === "dark"
                            ? "Темная тема"
                            : "Светлая тема"}
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
                          Светлая
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4" />
                          Темная
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
                          Модель AI
                        </h3>
                        <p className="settings-description">
                          Выберите нейросеть для работы
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
                          Персонализация ассистента
                        </h3>
                        <p className="settings-description">
                          Расскажите о себе или настройте стиль
                          ответов
                        </p>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Например: Я студент, изучаю программирование. Отвечай кратко и по делу..."
                      value={userSettings.aiPersonality}
                      onChange={(e) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          aiPersonality: e.target.value,
                        }))
                      }
                      rows={4}
                      className="textarea-themed"
                    />
                  </div>
                </div>

                {/* Использование AI */}
                <div className="settings-card">
                  <div className="space-y-4">
                    <div className="settings-info">
                      <BarChart3 className="settings-icon settings-icon-usage" />
                      <h3 className="settings-title">
                        Использование AI сегодня
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-card-foreground">
                          Генерация описаний
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
                        <div className="progress-fill"
                          style={{
                            width: `${Math.min((userSettings.aiUsage.descriptionsUsed / limits.descriptions) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-card-foreground">
                          Запросы в чат
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
                        <div className="progress-fill"
                          style={{
                            width: `${Math.min((userSettings.aiUsage.chatRequestsUsed / limits.chatRequests) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="subscription"
                className="space-y-6"
              >
                {/* Текущий тариф */}
                <div className="settings-card">
                  <div className="settings-row">
                    <div className="settings-info">
                      <Crown className="settings-icon settings-icon-subscription" />
                      <div>
                        <h3 className="settings-title">
                          Текущий тариф
                        </h3>
                        <p className="settings-description">
                          {userSettings.plan === "free"
                            ? "Free"
                            : userSettings.plan === "plus"
                              ? "Plus"
                              : "Pro"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        userSettings.plan === "free"
                          ? "bg-gray-500"
                          : userSettings.plan === "plus"
                            ? "bg-blue-500"
                            : "bg-purple-500"
                      } text-white`}
                    >
                      {userSettings.plan === "free"
                        ? "Бесплатный"
                        : userSettings.plan === "plus"
                          ? "Plus"
                          : "Pro"}
                    </Badge>
                  </div>
                </div>

                {/* Тарифные планы */}
                <div className="space-y-4">
                  <h3 className="font-medium text-card-foreground">
                    Доступные тарифы
                  </h3>

                  {/* Free Plan */}
                  <Card
                    className={`p-4 transition-all bg-card border-border ${
                      selectedPlan === "free"
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-card-foreground">
                              Free
                            </h4>
                            <Badge
                              variant="outline"
                              className="border-border"
                            >
                              0 ₽
                            </Badge>
                            {userSettings.plan === "free" && (
                              <Badge className="bg-green-500 text-white">
                                Активен
                              </Badge>
                            )}
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• 3 описания задач в день</li>
                            <li>• 3 запроса в чат в день</li>
                            <li>• Базовая функциональность</li>
                          </ul>
                        </div>
                      </div>
                      {userSettings.plan !== "free" && (
                        <Button
                          variant="outline"
                          className="w-full border-border"
                          onClick={() => purchasePlan("free")}
                        >
                          Переключиться на Free
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Plus Plan */}
                  <Card
                    className={`p-4 transition-all bg-card border-border ${
                      selectedPlan === "plus"
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-card-foreground">
                              Plus
                            </h4>
                            <Badge className="bg-blue-500 text-white">
                              250 ₽
                            </Badge>
                            {userSettings.plan === "plus" && (
                              <Badge className="bg-green-500 text-white">
                                Активен
                              </Badge>
                            )}
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• 10 описаний задач в день</li>
                            <li>• 20 запросов в чат в день</li>
                            <li>
                              • Расширенные возможности AI
                            </li>
                          </ul>
                        </div>
                      </div>
                      {userSettings.plan !== "plus" && (
                        <Button
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => purchasePlan("plus")}
                        >
                          Оплатить Plus - 250 ₽
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Pro Plan */}
                  <Card
                    className={`p-4 transition-all bg-card border-border ${
                      selectedPlan === "pro"
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-card-foreground">
                              Pro
                            </h4>
                            <Badge className="bg-purple-500 text-white">
                              550 ₽
                            </Badge>
                            {userSettings.plan === "pro" && (
                              <Badge className="bg-green-500 text-white">
                                Активен
                              </Badge>
                            )}
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• 20 описаний задач в день</li>
                            <li>• 100 запросов в чат в день</li>
                            <li>
                              • Максимальные возможности AI
                            </li>
                            <li>• Приоритетная поддержка</li>
                          </ul>
                        </div>
                      </div>
                      {userSettings.plan !== "pro" && (
                        <Button
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                          onClick={() => purchasePlan("pro")}
                        >
                          Оплатить Pro - 550 ₽
                        </Button>
                      )}
                    </div>
                  </Card>
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
          <div className="bg-card border-b border-border">
            <div className="max-w-container p-4">
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
                        title="Нажмите, чтобы изменить название"
                      >
                        {currentSession.title}
                      </h2>
                    )
                  ) : (
                    <h2 className="text-xl font-semibold text-card-foreground">
                      Новый чат
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
                  Новый чат
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          <div className="max-w-container p-4 pb-bottom-nav-large">
            {currentSession ? (
              <div className="space-y-4">
                {currentSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        message.sender === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-muted text-card-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <span
                        className={`text-xs ${message.sender === "user" ? "text-blue-100" : "text-muted-foreground"}`}
                      >
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                <Bot className="w-12 h-12 mx-auto mb-2" />
                <p>Начните диалог с AI ассистентом</p>
              </div>
            )}
          </div>

          {/* Fixed Input Area */}
          <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4">
            <div className="max-w-container">
              <div className="flex gap-2">
                <Input
                  placeholder="Напишите сообщение..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && sendAiMessage()
                  }
                  className="flex-1 input-themed"
                />
                <Button
                  onClick={sendAiMessage}
                  className="button-primary-themed"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (currentPage === "archive") {
      return (
        <>
          {/* Archive Navigation Tabs */}
          <div className="bg-card border-b border-border">
            <div className="max-w-container p-4">
              <Tabs
                value={archiveTab}
                onValueChange={setArchiveTab}
              >
                <TabsList className="">
                  <TabsTrigger value="chats">
                    Чаты
                  </TabsTrigger>
                  <TabsTrigger value="tasks">
                    Задачи
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
                            {session.messages.length} сообщений
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            session.date,
                          ).toLocaleDateString("ru-RU")}
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
                    <div className="text-center text-muted-foreground py-8">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-muted" />
                      <p>Нет завершенных задач</p>
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
        <div className="bg-card border-b border-border">
          <div className="max-w-container p-4">
            <Tabs
              value={activeView}
              onValueChange={setActiveView}
            >
              <TabsList className="">
                <TabsTrigger value="today">
                  Сегодня
                </TabsTrigger>
                <TabsTrigger value="week">
                  Неделя
                </TabsTrigger>
                <TabsTrigger value="month">
                  Месяц
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-container p-4 pb-bottom-nav">
          {activeView === "today" && (
            <div>
              {getTasksForView().map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {getTasksForView().length === 0 && (
                <div className="text-center text-muted-foreground mt-8">
                  <p>Нет задач на сегодня</p>
                </div>
              )}
            </div>
          )}

          {activeView === "week" && (
            <div>
              {getAllWeekDates().map((date) => {
                const weekTasks = getTasksForView();
                const tasksForDate = weekTasks.filter(
                  (task) => task.date === date,
                );

                return (
                  <div key={date} className="mb-6">
                    <h3 className="text-muted-foreground mb-3">
                      {formatDate(date)}
                    </h3>
                    {tasksForDate.length > 0 ? (
                      tasksForDate.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))
                    ) : (
                      <Card className="p-3 mb-3 bg-card border-border">
                        <p className="text-muted-foreground text-sm text-center">
                          На этот день задач нет
                        </p>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeView === "month" && (
            <div>
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
                      "!bg-blue-500 !text-white hover:!bg-blue-500 hover:!text-white focus:!bg-blue-500 focus:!text-white rounded-full !important",
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
                      const days = [
                        "Вс",
                        "Пн",
                        "Вт",
                        "Ср",
                        "Чт",
                        "Пт",
                        "Сб",
                      ];
                      return days[date.getDay()];
                    },
                    formatCaption: (date) => {
                      const months = [
                        "Январь",
                        "Февраль",
                        "Март",
                        "Апрель",
                        "Май",
                        "Июнь",
                        "Июль",
                        "Август",
                        "Сентябрь",
                        "Октябрь",
                        "Ноябрь",
                        "Декабрь",
                      ];
                      return `${months[date.getMonth()]} ${date.getFullYear()}`;
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
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      );
                    },
                  }}
                />
              </div>
              <div className="mt-6">
                <h3 className="text-muted-foreground mb-3">
                  {selectedDate
                    .toLocaleDateString("ru-RU", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    .charAt(0)
                    .toUpperCase() +
                    selectedDate
                      .toLocaleDateString("ru-RU", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                      .slice(1)}
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
                    <Card className="p-3 mb-3 bg-card border-border">
                      <p className="text-muted-foreground text-sm text-center">
                        На этот день задач нет
                      </p>
                    </Card>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="app" data-theme={userSettings.theme}>
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1 
            className="header-title cursor-pointer hover:text-blue-500 transition-colors"
            onClick={() => {
              setCurrentPage("home");
              setActiveView("today");
            }}
            title="Перейти на главную"
          >
            TUDUSHKA
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
                Добавить
              </button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border">
              <DialogHeader>
                <DialogTitle className="text-popover-foreground">
                  Добавить задачу
                </DialogTitle>
              </DialogHeader>
              <div className="dialog-form">
                <Input
                  placeholder="Заголовок задачи"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      title: e.target.value,
                    })
                  }
                  className="dialog-field"
                />
                <Textarea
                  placeholder="Описание задачи"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description: e.target.value,
                    })
                  }
                  className="dialog-field"
                  style={{ minHeight: '3rem', resize: 'vertical' }}
                />
                <div className="dialog-form-grid">
                  <Input
                    type="time"
                    value={newTask.time}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        time: e.target.value,
                      })
                    }
                    className="dialog-field"
                  />
                  <Input
                    type="date"
                    value={newTask.date}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        date: e.target.value,
                      })
                    }
                    className="dialog-field"
                  />
                </div>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: any) =>
                    setNewTask({ ...newTask, priority: value })
                  }
                >
                  <SelectTrigger className="dialog-field">
                    <SelectValue placeholder="Приоритет" />
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">
                      Средний
                    </SelectItem>
                    <SelectItem value="high">
                      Высокий
                    </SelectItem>
                    <SelectItem value="critical">
                      Критический
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="dialog-button-row">
                  <Button
                    onClick={addTask}
                    className="dialog-button-flex bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Добавить
                  </Button>
                  <Dialog
                    open={isAIHelpDialogOpen}
                    onOpenChange={setIsAIHelpDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="dialog-button-flex border-border"
                        disabled={!canUseAIDescription()}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI-помощь
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-popover border-border">
                      <DialogHeader>
                        <DialogTitle className="text-popover-foreground">
                          AI Генерация описания
                        </DialogTitle>
                      </DialogHeader>
                      <div className="dialog-form">
                        <p className="text-popover-foreground">
                          AI создаст подробное описание задачи
                          на основе введенного заголовка.
                          Убедитесь, что заголовок задачи
                          заполнен.
                        </p>
                        <div className="text-sm text-muted-foreground">
                          Осталось использований:{" "}
                          {getPlanLimits().descriptions -
                            userSettings.aiUsage
                              .descriptionsUsed}
                        </div>
                        <Button
                          onClick={generateTaskDescription}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Сгенерировать описание
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-popover-foreground">
              Редактировать задачу
            </DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="dialog-form">
              <Input
                placeholder="Заголовок задачи"
                value={editingTask.title}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    title: e.target.value,
                  })
                }
                className="dialog-field"
              />
              <Textarea
                placeholder="Описание задачи"
                value={editingTask.description}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    description: e.target.value,
                  })
                }
                className="dialog-field"
                style={{ minHeight: '3rem', resize: 'vertical' }}
              />
              <div className="dialog-form-grid">
                <Input
                  type="time"
                  value={editingTask.time}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      time: e.target.value,
                    })
                  }
                  className="dialog-field"
                />
                <Input
                  type="date"
                  value={editingTask.date}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      date: e.target.value,
                    })
                  }
                  className="dialog-field"
                />
              </div>
              <Select
                value={editingTask.priority}
                onValueChange={(value: any) =>
                  setEditingTask({
                    ...editingTask,
                    priority: value,
                  })
                }
              >
                <SelectTrigger className="dialog-field">
                  <SelectValue placeholder="Приоритет" />
                </SelectTrigger>
                <SelectContent className="select-content">
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">
                    Средний
                  </SelectItem>
                  <SelectItem value="high">
                    Высокий
                  </SelectItem>
                  <SelectItem value="critical">
                    Критический
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="dialog-button-row">
                <Button
                  onClick={updateTask}
                  className="dialog-button-flex bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Сохранить
                </Button>
                <Dialog
                  open={isEditAIHelpDialogOpen}
                  onOpenChange={setIsEditAIHelpDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="dialog-button-flex border-border"
                      disabled={!canUseAIDescription()}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI-помощь
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-popover border-border">
                    <DialogHeader>
                      <DialogTitle className="text-popover-foreground">
                        AI Генерация описания
                      </DialogTitle>
                    </DialogHeader>
                    <div className="dialog-form">
                      <p className="text-popover-foreground">
                        AI создаст подробное описание задачи на
                        основе введенного заголовка. Убедитесь,
                        что заголовок задачи заполнен.
                      </p>
                      <div className="text-sm text-muted-foreground">
                        Осталось использований:{" "}
                        {getPlanLimits().descriptions -
                          userSettings.aiUsage.descriptionsUsed}
                      </div>
                      <Button
                        onClick={() => {
                          generateEditTaskDescription();
                          setIsEditAIHelpDialogOpen(false);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Сгенерировать описание
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
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
            <span className="bottom-nav-text">Главная</span>
          </button>

          <button
            onClick={() => setCurrentPage("ai-assistant")}
            className={`bottom-nav-item ${
              currentPage === "ai-assistant" ? "active" : ""
            }`}
          >
            <Bot className="w-6 h-6" />
            <span className="bottom-nav-text">AI Ассистент</span>
          </button>

          <button
            onClick={() => setCurrentPage("archive")}
            className={`bottom-nav-item ${
              currentPage === "archive" ? "active" : ""
            }`}
          >
            <Archive className="w-6 h-6" />
            <span className="bottom-nav-text">Архив</span>
          </button>
        </div>
      </div>
    </div>
  );
}