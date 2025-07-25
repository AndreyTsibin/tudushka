/**
 * Tasks module for Tudushka
 * Handles task display, creation, editing and management
 */

class TasksModule {
    constructor() {
        this.tasks = [];
        this.currentPeriod = 'today';
        this.isLoading = false;
    }

    /**
     * Initialize the tasks module
     */
    async init() {
        console.log('Initializing Tasks module...');
        
        try {
            // Setup tab switching
            this.setupTabSwitching();
            
            // Load tasks from API
            await this.loadTasks();
            
            // Setup add task button
            this.setupAddTaskButton();
            
            // Setup task interactions
            this.setupTaskInteractions();
            
            console.log('Tasks module initialized successfully');
        } catch (error) {
            console.error('Failed to initialize tasks module:', error);
            this.showError('Ошибка загрузки модуля задач');
        }
    }

    /**
     * Setup tab switching functionality
     */
    setupTabSwitching() {
        const tabs = document.querySelectorAll('.date-tab');
        const todayView = document.getElementById('todayView');
        const weekView = document.getElementById('weekView');
        const monthView = document.getElementById('monthView');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('date-tab--active'));
                
                // Add active class to clicked tab
                e.target.classList.add('date-tab--active');
                
                // Update current period
                this.currentPeriod = e.target.getAttribute('data-period');
                
                // Hide all views
                if (todayView) todayView.style.display = 'none';
                if (weekView) weekView.style.display = 'none';
                if (monthView) monthView.style.display = 'none';
                
                // Show appropriate view
                if (this.currentPeriod === 'today' && todayView) {
                    todayView.style.display = 'block';
                    this.loadTasks('today');
                } else if (this.currentPeriod === 'week' && weekView) {
                    weekView.style.display = 'block';
                    this.loadWeekTasks();
                } else if (this.currentPeriod === 'month' && monthView) {
                    monthView.style.display = 'block';
                    this.initializeCalendar();
                }
            });
        });
        
        // Initialize with today view
        if (todayView) {
            todayView.style.display = 'block';
        }
    }

    /**
     * Setup add task button
     */
    setupAddTaskButton() {
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.showAddTaskModal();
            });
        }
    }

    /**
     * Setup task interactions (complete buttons, etc.)
     */
    setupTaskInteractions() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('task-complete-btn')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = taskItem.getAttribute('data-task-id');
                if (taskId) {
                    this.completeTask(parseInt(taskId));
                }
            }
        });
    }

    /**
     * Load tasks from API
     */
    async loadTasks(period = 'today') {
        this.isLoading = true;
        this.showLoading(period);
        
        try {
            // Mock data for now since API returns 501
            this.allTasks = [
                {
                    id: 1,
                    title: 'Заголовок задачи которую нужно выполнить',
                    description: 'Описание задачи если есть, Описание задачи если есть, Описание задачи если есть.....',
                    completed: false,
                    due_date: '2025-07-25T14:30:00.000Z',
                    priority: 'urgent',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Вторая задача на завтра',
                    description: 'Описание второй задачи',
                    completed: false,
                    due_date: '2025-07-26T10:00:00.000Z',
                    priority: 'medium',
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    title: 'Задача на следующую неделю',
                    description: 'Долгосрочная задача',
                    completed: false,
                    due_date: '2025-08-01T09:00:00.000Z',
                    priority: 'low',
                    created_at: new Date().toISOString()
                }
            ];
            
            this.tasks = this.filterTasksByPeriod(this.allTasks, period);
            this.renderTasks(period);
            
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.showError('Ошибка загрузки задач');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Filter tasks by period
     */
    filterTasksByPeriod(tasks, period) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (period) {
            case 'today':
                return tasks.filter(task => {
                    if (!task.due_date) return true;
                    const dueDate = new Date(task.due_date);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate.getTime() === today.getTime();
                });
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                
                return tasks.filter(task => {
                    if (!task.due_date) return true;
                    const dueDate = new Date(task.due_date);
                    return dueDate >= weekStart && dueDate <= weekEnd;
                });
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);
                
                return tasks.filter(task => {
                    if (!task.due_date) return true;
                    const dueDate = new Date(task.due_date);
                    return dueDate >= monthStart && dueDate <= monthEnd;
                });
            default:
                return tasks;
        }
    }

    /**
     * Load week tasks
     */
    async loadWeekTasks() {
        this.isLoading = true;
        this.showLoading('week');
        
        try {
            // Use existing tasks data
            if (!this.allTasks) {
                await this.loadTasks();
            }
            
            this.tasks = this.filterTasksByPeriod(this.allTasks, 'week');
            this.renderWeekTasks();
            
        } catch (error) {
            console.error('Failed to load week tasks:', error);
            this.showError('Ошибка загрузки задач на неделю');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render week tasks grouped by days
     */
    renderWeekTasks() {
        const container = document.getElementById('weekTasksContainer');
        if (!container) return;

        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="tasks-empty">
                    <div class="tasks-empty__icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M24 4C35.046 4 44 12.954 44 24C44 35.046 35.046 44 24 44C12.954 44 4 35.046 4 24C4 12.954 12.954 4 24 4Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M16 24L22 30L32 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Нет задач на эту неделю</h3>
                    <p>Добавьте задачи на текущую неделю</p>
                </div>
            `;
            return;
        }

        // Group tasks by date
        const tasksByDate = {};
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        // Create all 7 days of the week
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            const dateKey = day.toISOString().split('T')[0];
            tasksByDate[dateKey] = [];
        }
        
        // Add tasks to appropriate dates
        this.tasks.forEach(task => {
            if (task.due_date) {
                const taskDate = new Date(task.due_date);
                const dateKey = taskDate.toISOString().split('T')[0];
                if (tasksByDate[dateKey]) {
                    tasksByDate[dateKey].push(task);
                }
            }
        });

        // Render days with tasks
        const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        let weekHTML = '';
        
        Object.keys(tasksByDate).sort().forEach(dateKey => {
            const date = new Date(dateKey + 'T12:00:00');
            const dayName = dayNames[date.getDay()];
            const dateText = date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            
            const dayTasks = tasksByDate[dateKey];
            
            weekHTML += `
                <div class="day-section">
                    <h3 class="day-header">${dayName}: ${dateText}</h3>
                    <div class="day-tasks">
            `;
            
            if (dayTasks.length === 0) {
                weekHTML += '<div class="no-tasks-message">На этот день задач нет</div>';
            } else {
                dayTasks.forEach(task => {
                    weekHTML += this.renderTaskItem(task);
                });
            }
            
            weekHTML += `
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = weekHTML;
    }

    /**
     * Initialize calendar functionality
     */
    initializeCalendar() {
        // This will be handled by the CalendarModule
        // For now, just ensure the calendar is visible and working
        if (window.CalendarModule && typeof window.CalendarModule.init === 'function') {
            window.CalendarModule.init();
        } else {
            console.warn('CalendarModule not found, using basic calendar functionality');
            this.initBasicCalendar();
        }
    }

    /**
     * Initialize basic calendar if CalendarModule is not available
     */
    initBasicCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        if (!calendarDays) return;
        
        // Basic calendar implementation
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let daysHTML = '';
        
        for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDay.getMonth() === currentMonth;
            const isToday = currentDay.toDateString() === today.toDateString();
            
            let classes = ['calendar-day'];
            if (!isCurrentMonth) classes.push('calendar-day--other-month');
            if (isToday) classes.push('calendar-day--today');
            
            daysHTML += `
                <div class="${classes.join(' ')}" data-date="${currentDay.toISOString().split('T')[0]}">
                    ${currentDay.getDate()}
                </div>
            `;
        }
        
        calendarDays.innerHTML = daysHTML;
    }

    /**
     * Show loading state
     */
    showLoading(period = 'today') {
        const containerId = period === 'week' ? 'weekTasksContainer' : 'tasksContainer';
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="tasks-loading">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <p>Загрузка задач...</p>
                </div>
            `;
        }
    }

    /**
     * Render tasks list
     */
    renderTasks(period = 'today') {
        const containerId = period === 'week' ? 'weekTasksContainer' : 'tasksContainer';
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="tasks-empty">
                    <div class="tasks-empty__icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M24 4C35.046 4 44 12.954 44 24C44 35.046 35.046 44 24 44C12.954 44 4 35.046 4 24C4 12.954 12.954 4 24 4Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M16 24L22 30L32 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Нет задач</h3>
                    <p>Добавьте первую задачу, чтобы начать работу</p>
                </div>
            `;
            return;
        }

        if (period === 'week') {
            this.renderWeekTasks();
        } else {
            const tasksHTML = this.tasks.map(task => this.renderTaskItem(task)).join('');
            container.innerHTML = tasksHTML;
        }
    }

    /**
     * Render individual task item
     */
    renderTaskItem(task) {
        const priorityText = this.getPriorityText(task.priority);
        const priorityClass = `task-priority--${task.priority}`;
        const timeText = this.formatTime(task.due_date);
        const dateText = this.formatDate(task.due_date);
        
        return `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-priority ${priorityClass}">
                        ${priorityText}
                    </div>
                    <div class="task-time">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M7 3V7L9.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        ${timeText}
                    </div>
                    <div class="task-date">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M5 1V3M9 1V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M2 6H12" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        ${dateText}
                    </div>
                </div>
                
                <div class="task-content">
                    <h3 class="task-title">${task.title}</h3>
                    ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                </div>
                
                <div class="task-footer">
                    <button class="task-complete-btn">
                        Завершить
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get priority text in Russian
     */
    getPriorityText(priority) {
        const priorityMap = {
            'urgent': 'Срочно',
            'high': 'Высокий',
            'medium': 'Средний',
            'low': 'Низкий'
        };
        return priorityMap[priority] || 'Средний';
    }

    /**
     * Format time for display
     */
    formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Сегодня';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Завтра';
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    }

    /**
     * Complete task
     */
    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = true;
            // Remove completed task from view with animation
            const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskItem) {
                taskItem.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                taskItem.style.opacity = '0';
                taskItem.style.transform = 'translateX(100%)';
                
                setTimeout(() => {
                    this.tasks = this.tasks.filter(t => t.id !== taskId);
                    this.renderTasks();
                }, 300);
            }
            
            console.log('Task completed:', taskId);
        }
    }

    /**
     * Show add task modal
     */
    showAddTaskModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        modalContainer.innerHTML = `
            <div class="modal modal--task-form">
                <div class="modal__backdrop"></div>
                <div class="modal__content">
                    <div class="modal__header">
                        <h3>Новая задача</h3>
                        <button class="modal__close" aria-label="Закрыть">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    
                    <form class="task-form" id="taskForm">
                        <div class="form-group">
                            <label for="taskTitle" class="form-label">Название задачи</label>
                            <input type="text" id="taskTitle" class="form-input" placeholder="Введите название задачи" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="taskDescription" class="form-label">Описание (необязательно)</label>
                            <textarea id="taskDescription" class="form-input" rows="3" placeholder="Добавьте описание"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="taskPriority" class="form-label">Приоритет</label>
                                <select id="taskPriority" class="form-select">
                                    <option value="low">Низкий</option>
                                    <option value="medium" selected>Средний</option>
                                    <option value="high">Высокий</option>
                                    <option value="urgent">Срочно</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="taskDueDate" class="form-label">Дата выполнения</label>
                                <input type="datetime-local" id="taskDueDate" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn--secondary" id="cancelTask">Отмена</button>
                            <button type="submit" class="btn btn--primary">Создать задачу</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.setupModalEventListeners();
    }

    /**
     * Setup modal event listeners
     */
    setupModalEventListeners() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        // Close modal handlers
        const closeBtn = modalContainer.querySelector('.modal__close');
        const cancelBtn = modalContainer.querySelector('#cancelTask');
        const backdrop = modalContainer.querySelector('.modal__backdrop');

        [closeBtn, cancelBtn, backdrop].forEach(element => {
            if (element) {
                element.addEventListener('click', () => {
                    modalContainer.innerHTML = '';
                });
            }
        });

        // Form submission
        const taskForm = modalContainer.querySelector('#taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createTask();
            });
        }
    }

    /**
     * Create new task
     */
    createTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const dueDate = document.getElementById('taskDueDate').value;

        if (!title) {
            this.showError('Название задачи обязательно');
            return;
        }

        const newTask = {
            id: Date.now(), // Temporary ID
            title,
            description,
            priority,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            completed: false,
            created_at: new Date().toISOString()
        };

        if (!this.allTasks) this.allTasks = [];
        this.allTasks.unshift(newTask);
        this.tasks.unshift(newTask);
        this.renderTasks();

        // Close modal
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }

        console.log('Task created:', newTask);
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Tasks module error:', message);
        
        const container = document.getElementById('tasksContainer');
        if (container) {
            container.innerHTML = `
                <div class="tasks-error">
                    <div class="error-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2"/>
                            <line x1="24" y1="16" x2="24" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <line x1="24" y1="32" x2="24.01" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h3>Ошибка загрузки</h3>
                    <p>${message}</p>
                    <button class="btn btn--primary" onclick="window.location.reload()">Обновить</button>
                </div>
            `;
        }
    }
}

// Export the module
if (typeof window !== 'undefined') {
    window.TasksModule = TasksModule;
}