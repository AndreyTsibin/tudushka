import TaskCard from '../components/TaskCard.js';
import Modal from '../components/Modal.js';
import Calendar from '../components/Calendar.js';
import API from '../api.js';

/**
 * HomePage - Main application page with task management
 */
class HomePage {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onTaskCreate: options.onTaskCreate || (() => {}),
            onTaskUpdate: options.onTaskUpdate || (() => {}),
            onTaskDelete: options.onTaskDelete || (() => {}),
            ...options
        };

        this.element = null;
        this.tasks = [];
        this.taskCards = new Map();
        this.currentTab = 'today';
        this.isLoading = false;
        this.lastRefresh = null;
        this.refreshThreshold = 30000; // 30 seconds
        this.calendar = null;
        this.currentDate = new Date();

        // Pagination
        this.currentPage = 1;
        this.pageSize = 20;
        this.hasMoreTasks = true;
        this.isLoadingMore = false;

        // Pull to refresh
        this.pullToRefreshEnabled = true;
        this.pullStartY = 0;
        this.pullDistance = 0;
        this.isPulling = false;

        this.bindMethods();
    }

    bindMethods() {
        this.handleTabChange = this.handleTabChange.bind(this);
        this.handleAddTask = this.handleAddTask.bind(this);
        this.handleTaskComplete = this.handleTaskComplete.bind(this);
        this.handleTaskEdit = this.handleTaskEdit.bind(this);
        this.handleTaskDelete = this.handleTaskDelete.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handlePullToRefresh = this.handlePullToRefresh.bind(this);
        this.handleDateSelect = this.handleDateSelect.bind(this);
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'home-page';
        this.element.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Тудушка</h1>
                <div class="header-actions">
                    <button class="header-btn search-btn" aria-label="Search tasks" title="Поиск">
                        <svg viewBox="0 0 24 24">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                    </button>
                    <button class="header-btn calendar-toggle-btn" aria-label="Toggle calendar" title="Календарь">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="tabs-container">
                <div class="tabs" role="tablist">
                    <button class="tab active" data-tab="today" role="tab" aria-selected="true" aria-controls="today-content">
                        Сегодня
                    </button>
                    <button class="tab" data-tab="week" role="tab" aria-selected="false" aria-controls="week-content">
                        Неделя
                    </button>
                    <button class="tab" data-tab="month" role="tab" aria-selected="false" aria-controls="month-content">
                        Месяц
                    </button>
                </div>
            </div>

            <div class="pull-to-refresh-indicator">
                <div class="refresh-spinner"></div>
                <span class="refresh-text">Потяните для обновления</span>
            </div>

            <div class="calendar-container" style="display: none;">
                <div class="calendar-wrapper"></div>
            </div>

            <div class="tab-content-container">
                <div class="tab-content active" id="today-content" role="tabpanel" aria-labelledby="today-tab">
                    <div class="date-header">
                        <h2 class="current-date">${this.formatCurrentDate()}</h2>
                        <span class="tasks-count">0 задач</span>
                    </div>
                    <div class="task-list-container">
                        <div class="task-list" id="taskList" role="list">
                            <!-- Task cards will be inserted here -->
                        </div>
                        <div class="loading-indicator" style="display: none;">
                            <div class="loading-spinner"></div>
                            <span>Загрузка задач...</span>
                        </div>
                        <div class="load-more-container" style="display: none;">
                            <button class="load-more-btn">Загрузить еще</button>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="week-content" role="tabpanel" aria-labelledby="week-tab">
                    <div class="week-view">
                        <div class="week-header">
                            <button class="week-nav-btn prev-week" aria-label="Previous week">‹</button>
                            <h3 class="week-title">Эта неделя</h3>
                            <button class="week-nav-btn next-week" aria-label="Next week">›</button>
                        </div>
                        <div class="week-days"></div>
                    </div>
                </div>

                <div class="tab-content" id="month-content" role="tabpanel" aria-labelledby="month-tab">
                    <div class="month-view">
                        <div class="month-calendar-container"></div>
                        <div class="month-tasks">
                            <h3 class="selected-date-title">Выберите дату</h3>
                            <div class="selected-date-tasks"></div>
                        </div>
                    </div>
                </div>

                <div class="empty-state" style="display: none;">
                    <div class="empty-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                        </svg>
                    </div>
                    <h3 class="empty-title">Пока нет задач</h3>
                    <p class="empty-description">Создайте свою первую задачу, чтобы начать планирование</p>
                    <button class="empty-action-btn">Создать задачу</button>
                </div>
            </div>

            <button class="add-task-btn" id="addTaskBtn" aria-label="Add new task" title="Добавить задачу">
                <svg class="add-icon" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span class="add-text">Добавить задачу</span>
            </button>
        `;

        this.bindEvents();
        this.setupPullToRefresh();
        this.setupInfiniteScroll();
        
        if (this.container) {
            this.container.appendChild(this.element);
        }

        // Initialize data
        this.loadTasks();

        return this.element;
    }

    bindEvents() {
        if (!this.element) return;

        // Tab navigation
        const tabs = this.element.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', this.handleTabChange);
        });

        // Add task button
        const addTaskBtn = this.element.querySelector('#addTaskBtn');
        const emptyActionBtn = this.element.querySelector('.empty-action-btn');
        
        addTaskBtn.addEventListener('click', this.handleAddTask);
        emptyActionBtn.addEventListener('click', this.handleAddTask);

        // Header actions
        const searchBtn = this.element.querySelector('.search-btn');
        const calendarToggleBtn = this.element.querySelector('.calendar-toggle-btn');
        
        searchBtn.addEventListener('click', this.showSearchModal.bind(this));
        calendarToggleBtn.addEventListener('click', this.toggleCalendar.bind(this));

        // Load more button
        const loadMoreBtn = this.element.querySelector('.load-more-btn');
        loadMoreBtn.addEventListener('click', this.loadMoreTasks.bind(this));

        // Week navigation
        const prevWeekBtn = this.element.querySelector('.prev-week');
        const nextWeekBtn = this.element.querySelector('.next-week');
        
        if (prevWeekBtn) prevWeekBtn.addEventListener('click', this.previousWeek.bind(this));
        if (nextWeekBtn) nextWeekBtn.addEventListener('click', this.nextWeek.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
                return;
            }

            switch (e.key) {
                case 'n':
                case 'N':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.handleAddTask();
                    }
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.refreshTasks();
                    }
                    break;
                case '1':
                case '2':
                case '3':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const tabIndex = parseInt(e.key) - 1;
                        const tabButtons = this.element.querySelectorAll('.tab');
                        if (tabButtons[tabIndex]) {
                            tabButtons[tabIndex].click();
                        }
                    }
                    break;
            }
        });
    }

    setupPullToRefresh() {
        if (!this.pullToRefreshEnabled) return;

        const container = this.element.querySelector('.task-list-container');
        const indicator = this.element.querySelector('.pull-to-refresh-indicator');

        container.addEventListener('touchstart', (e) => {
            if (container.scrollTop === 0) {
                this.pullStartY = e.touches[0].clientY;
                this.isPulling = false;
            }
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!this.pullStartY || container.scrollTop > 0) return;

            const currentY = e.touches[0].clientY;
            this.pullDistance = currentY - this.pullStartY;

            if (this.pullDistance > 50) {
                this.isPulling = true;
                e.preventDefault();
                
                const progress = Math.min(this.pullDistance / 100, 1);
                indicator.style.transform = `translateY(${this.pullDistance}px)`;
                indicator.style.opacity = progress;
                
                if (this.pullDistance > 100) {
                    indicator.querySelector('.refresh-text').textContent = 'Отпустите для обновления';
                } else {
                    indicator.querySelector('.refresh-text').textContent = 'Потяните для обновления';
                }
            }
        }, { passive: false });

        container.addEventListener('touchend', () => {
            if (this.isPulling && this.pullDistance > 100) {
                this.refreshTasks();
            }

            indicator.style.transform = '';
            indicator.style.opacity = '';
            indicator.querySelector('.refresh-text').textContent = 'Потяните для обновления';
            
            this.pullStartY = 0;
            this.pullDistance = 0;
            this.isPulling = false;
        }, { passive: true });
    }

    setupInfiniteScroll() {
        const container = this.element.querySelector('.task-list-container');
        container.addEventListener('scroll', this.handleScroll);
    }

    handleScroll(e) {
        const container = e.target;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Load more tasks when near bottom
        if (scrollTop + clientHeight >= scrollHeight - 100 && this.hasMoreTasks && !this.isLoadingMore) {
            this.loadMoreTasks();
        }
    }

    handleTabChange(e) {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        const tabName = tab.getAttribute('data-tab');
        if (tabName === this.currentTab) return;

        // Update tab UI
        this.element.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Update content
        this.element.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = this.element.querySelector(`#${tabName}-content`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        this.currentTab = tabName;
        this.loadTabContent(tabName);
    }

    loadTabContent(tabName) {
        switch (tabName) {
            case 'today':
                this.currentDate = new Date();
                this.loadTasks();
                break;
            case 'week':
                this.loadWeekView();
                break;
            case 'month':
                this.loadMonthView();
                break;
        }
    }

    loadWeekView() {
        const weekDaysContainer = this.element.querySelector('.week-days');
        if (!weekDaysContainer) return;

        const startOfWeek = this.getStartOfWeek(this.currentDate);
        let html = '';

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            
            const dayTasks = this.getTasksForDate(date);
            const isToday = this.isSameDate(date, new Date());

            html += `
                <div class="week-day ${isToday ? 'today' : ''}">
                    <div class="week-day-header">
                        <span class="day-name">${this.getDayName(date, true)}</span>
                        <span class="day-number">${date.getDate()}</span>
                    </div>
                    <div class="week-day-tasks">
                        ${dayTasks.slice(0, 3).map(task => `
                            <div class="week-task ${task.completed ? 'completed' : ''}">
                                <span class="task-title">${this.escapeHtml(task.title)}</span>
                            </div>
                        `).join('')}
                        ${dayTasks.length > 3 ? `<div class="more-tasks">+${dayTasks.length - 3}</div>` : ''}
                    </div>
                </div>
            `;
        }

        weekDaysContainer.innerHTML = html;
        this.updateWeekTitle();
    }

    loadMonthView() {
        const calendarContainer = this.element.querySelector('.month-calendar-container');
        if (!calendarContainer) return;

        if (!this.calendar) {
            this.calendar = new Calendar(calendarContainer, {
                selectedDate: this.currentDate,
                tasks: this.tasks,
                onDateSelect: this.handleDateSelect,
                onMonthChange: (date) => {
                    this.currentDate = new Date(date);
                    this.calendar.updateTasks(this.tasks);
                }
            });
            this.calendar.render();
        } else {
            this.calendar.updateTasks(this.tasks);
        }
    }

    handleDateSelect(date) {
        this.currentDate = new Date(date);
        this.showTasksForDate(date);
    }

    showTasksForDate(date) {
        const container = this.element.querySelector('.selected-date-tasks');
        const titleElement = this.element.querySelector('.selected-date-title');
        
        if (!container || !titleElement) return;

        const tasksForDate = this.getTasksForDate(date);
        titleElement.textContent = this.formatDate(date);

        if (tasksForDate.length === 0) {
            container.innerHTML = '<p class="no-tasks">Нет задач на эту дату</p>';
            return;
        }

        container.innerHTML = '';
        tasksForDate.forEach(task => {
            const taskCard = new TaskCard(task, {
                onComplete: this.handleTaskComplete,
                onEdit: this.handleTaskEdit,
                onDelete: this.handleTaskDelete
            });
            container.appendChild(taskCard.render());
            this.taskCards.set(task.id, taskCard);
        });
    }

    async loadTasks() {
        if (this.isLoading) return;

        this.showLoading();
        this.isLoading = true;

        try {
            const filters = this.getTaskFilters();
            const response = await API.getTasks(filters);
            
            this.tasks = response.tasks || [];
            this.hasMoreTasks = response.hasMore || false;
            this.currentPage = 1;
            
            this.renderTasks();
            this.updateTaskCount();
            this.lastRefresh = Date.now();
            
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Ошибка загрузки задач');
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    async loadMoreTasks() {
        if (this.isLoadingMore || !this.hasMoreTasks) return;

        this.isLoadingMore = true;
        this.showLoadingMore();

        try {
            const filters = this.getTaskFilters();
            filters.page = this.currentPage + 1;
            
            const response = await API.getTasks(filters);
            const newTasks = response.tasks || [];
            
            this.tasks = [...this.tasks, ...newTasks];
            this.hasMoreTasks = response.hasMore || false;
            this.currentPage++;
            
            this.renderNewTasks(newTasks);
            this.updateTaskCount();
            
        } catch (error) {
            console.error('Error loading more tasks:', error);
            this.showError('Ошибка загрузки задач');
        } finally {
            this.hideLoadingMore();
            this.isLoadingMore = false;
        }
    }

    getTaskFilters() {
        const filters = {
            page: this.currentPage,
            limit: this.pageSize
        };

        switch (this.currentTab) {
            case 'today':
                filters.date = this.currentDate.toISOString().split('T')[0];
                break;
            case 'week':
                const startOfWeek = this.getStartOfWeek(this.currentDate);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                
                filters.startDate = startOfWeek.toISOString().split('T')[0];
                filters.endDate = endOfWeek.toISOString().split('T')[0];
                break;
            case 'month':
                const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
                const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
                
                filters.startDate = startOfMonth.toISOString().split('T')[0];
                filters.endDate = endOfMonth.toISOString().split('T')[0];
                break;
        }

        return filters;
    }

    renderTasks() {
        const taskList = this.element.querySelector('#taskList');
        if (!taskList) return;

        // Clear existing task cards
        this.taskCards.forEach(card => card.destroy());
        this.taskCards.clear();
        taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        this.renderNewTasks(this.tasks);
    }

    renderNewTasks(tasks) {
        const taskList = this.element.querySelector('#taskList');
        if (!taskList) return;

        tasks.forEach(task => {
            const taskCard = new TaskCard(task, {
                onComplete: this.handleTaskComplete,
                onEdit: this.handleTaskEdit,
                onDelete: this.handleTaskDelete
            });
            
            taskList.appendChild(taskCard.render());
            this.taskCards.set(task.id, taskCard);
        });

        // Update load more button visibility
        const loadMoreContainer = this.element.querySelector('.load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = this.hasMoreTasks ? 'block' : 'none';
        }
    }

    async handleTaskComplete(task) {
        try {
            const updatedTask = await API.updateTask(task.id, { completed: task.completed });
            this.updateTaskInList(updatedTask);
            this.options.onTaskUpdate(updatedTask);
        } catch (error) {
            console.error('Error updating task:', error);
            this.showError('Ошибка обновления задачи');
            
            // Revert the task state
            task.completed = !task.completed;
            const taskCard = this.taskCards.get(task.id);
            if (taskCard) {
                taskCard.updateTask(task);
            }
        }
    }

    handleTaskEdit(task) {
        this.showTaskModal(task);
    }

    async handleTaskDelete(task) {
        const confirmed = await Modal.confirm(
            `Вы уверены, что хотите удалить задачу "${task.title}"?`,
            'Удаление задачи'
        );

        if (!confirmed) return;

        try {
            await API.deleteTask(task.id);
            this.removeTaskFromList(task.id);
            this.options.onTaskDelete(task);
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showError('Ошибка удаления задачи');
        }
    }

    handleAddTask() {
        this.showTaskModal();
    }

    showTaskModal(task = null) {
        const isEdit = !!task;
        const title = isEdit ? 'Редактирование задачи' : 'Новая задача';
        
        const modal = new Modal({
            title,
            size: 'large',
            content: this.generateTaskFormHTML(task),
            onShow: (modal) => {
                this.setupTaskForm(modal, task);
            }
        });

        modal.show();
    }

    generateTaskFormHTML(task = null) {
        const isEdit = !!task;
        
        return `
            <form class="task-form">
                <div class="form-group">
                    <label for="taskTitle" class="form-label">Название задачи</label>
                    <input 
                        type="text" 
                        id="taskTitle" 
                        class="form-input" 
                        value="${task ? this.escapeHtml(task.title) : ''}"
                        placeholder="Введите название задачи"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="taskDescription" class="form-label">Описание</label>
                    <textarea 
                        id="taskDescription" 
                        class="form-textarea" 
                        rows="3"
                        placeholder="Добавьте описание (необязательно)"
                    >${task ? this.escapeHtml(task.description || '') : ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="taskDueDate" class="form-label">Срок выполнения</label>
                        <input 
                            type="date" 
                            id="taskDueDate" 
                            class="form-input"
                            value="${task && task.due_date ? task.due_date.split('T')[0] : ''}"
                        >
                    </div>
                    <div class="form-group">
                        <label for="taskPriority" class="form-label">Приоритет</label>
                        <select id="taskPriority" class="form-select">
                            <option value="normal" ${!task || task.priority === 'normal' ? 'selected' : ''}>Обычный</option>
                            <option value="low" ${task && task.priority === 'low' ? 'selected' : ''}>Низкий</option>
                            <option value="high" ${task && task.priority === 'high' ? 'selected' : ''}>Высокий</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="taskRepeat" class="form-label">Повторение</label>
                    <select id="taskRepeat" class="form-select">
                        <option value="" ${!task || !task.repeat_interval ? 'selected' : ''}>Не повторять</option>
                        <option value="daily" ${task && task.repeat_interval === 'daily' ? 'selected' : ''}>Ежедневно</option>
                        <option value="weekly" ${task && task.repeat_interval === 'weekly' ? 'selected' : ''}>Еженедельно</option>
                        <option value="monthly" ${task && task.repeat_interval === 'monthly' ? 'selected' : ''}>Ежемесячно</option>
                    </select>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary cancel-btn">Отмена</button>
                    <button type="submit" class="btn btn-primary save-btn">
                        ${isEdit ? 'Сохранить' : 'Создать'}
                    </button>
                </div>
            </form>
        `;
    }

    setupTaskForm(modal, task = null) {
        const form = modal.element.querySelector('.task-form');
        const titleInput = form.querySelector('#taskTitle');
        const cancelBtn = form.querySelector('.cancel-btn');
        const saveBtn = form.querySelector('.save-btn');

        titleInput.focus();

        cancelBtn.addEventListener('click', () => {
            modal.hide();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const taskData = {
                title: form.querySelector('#taskTitle').value.trim(),
                description: form.querySelector('#taskDescription').value.trim(),
                due_date: form.querySelector('#taskDueDate').value || null,
                priority: form.querySelector('#taskPriority').value,
                repeat_interval: form.querySelector('#taskRepeat').value || null
            };

            if (!taskData.title) {
                titleInput.focus();
                return;
            }

            modal.showLoading(task ? 'Сохранение...' : 'Создание...');
            saveBtn.disabled = true;

            try {
                let updatedTask;
                if (task) {
                    updatedTask = await API.updateTask(task.id, taskData);
                    this.updateTaskInList(updatedTask);
                    this.options.onTaskUpdate(updatedTask);
                } else {
                    updatedTask = await API.createTask(taskData);
                    this.addTaskToList(updatedTask);
                    this.options.onTaskCreate(updatedTask);
                }

                modal.hide();
            } catch (error) {
                console.error('Error saving task:', error);
                modal.hideLoading();
                this.showError(task ? 'Ошибка сохранения задачи' : 'Ошибка создания задачи');
                saveBtn.disabled = false;
            }
        });
    }

    addTaskToList(task) {
        this.tasks.unshift(task);
        this.renderTasks();
        this.updateTaskCount();
    }

    updateTaskInList(updatedTask) {
        const index = this.tasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
            this.tasks[index] = updatedTask;
            const taskCard = this.taskCards.get(updatedTask.id);
            if (taskCard) {
                taskCard.updateTask(updatedTask);
            }
        }
        this.updateTaskCount();
    }

    removeTaskFromList(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        const taskCard = this.taskCards.get(taskId);
        if (taskCard) {
            taskCard.destroy();
            this.taskCards.delete(taskId);
        }
        this.updateTaskCount();
        
        if (this.tasks.length === 0) {
            this.showEmptyState();
        }
    }

    async refreshTasks() {
        if (this.lastRefresh && Date.now() - this.lastRefresh < this.refreshThreshold) {
            return;
        }

        this.currentPage = 1;
        this.hasMoreTasks = true;
        await this.loadTasks();
    }

    showLoading() {
        const indicator = this.element.querySelector('.loading-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
        }
    }

    hideLoading() {
        const indicator = this.element.querySelector('.loading-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    showLoadingMore() {
        const loadMoreBtn = this.element.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'Загрузка...';
            loadMoreBtn.disabled = true;
        }
    }

    hideLoadingMore() {
        const loadMoreBtn = this.element.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'Загрузить еще';
            loadMoreBtn.disabled = false;
        }
    }

    showEmptyState() {
        const emptyState = this.element.querySelector('.empty-state');
        const taskList = this.element.querySelector('#taskList');
        
        if (emptyState && taskList) {
            emptyState.style.display = 'block';
            taskList.style.display = 'none';
        }
    }

    hideEmptyState() {
        const emptyState = this.element.querySelector('.empty-state');
        const taskList = this.element.querySelector('#taskList');
        
        if (emptyState && taskList) {
            emptyState.style.display = 'none';
            taskList.style.display = 'block';
        }
    }

    updateTaskCount() {
        const countElement = this.element.querySelector('.tasks-count');
        if (countElement) {
            const count = this.tasks.length;
            const word = count === 1 ? 'задача' : count <= 4 ? 'задачи' : 'задач';
            countElement.textContent = `${count} ${word}`;
        }
    }

    showSearchModal() {
        // TODO: Implement search functionality
        Modal.alert('Поиск будет реализован в следующей версии', 'Поиск задач');
    }

    toggleCalendar() {
        const calendarContainer = this.element.querySelector('.calendar-container');
        const isVisible = calendarContainer.style.display !== 'none';
        
        calendarContainer.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible && !this.calendar) {
            const calendarWrapper = calendarContainer.querySelector('.calendar-wrapper');
            this.calendar = new Calendar(calendarWrapper, {
                selectedDate: this.currentDate,
                tasks: this.tasks,
                onDateSelect: this.handleDateSelect
            });
            this.calendar.render();
        }
    }

    showError(message) {
        Modal.alert(message, 'Ошибка');
    }

    // Utility methods
    formatCurrentDate() {
        return this.currentDate.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    getDayName(date, short = false) {
        const days = short ? 
            ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] :
            ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        return days[date.getDay()];
    }

    getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
        start.setDate(diff);
        return start;
    }

    getTasksForDate(date) {
        return this.tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            return this.isSameDate(taskDate, date);
        });
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    updateWeekTitle() {
        const titleElement = this.element.querySelector('.week-title');
        if (!titleElement) return;

        const startOfWeek = this.getStartOfWeek(this.currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const today = new Date();
        const thisWeekStart = this.getStartOfWeek(today);
        
        if (this.isSameDate(startOfWeek, thisWeekStart)) {
            titleElement.textContent = 'Эта неделя';
        } else {
            titleElement.textContent = `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('ru-RU', { month: 'long' })}`;
        }
    }

    previousWeek() {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        this.loadWeekView();
    }

    nextWeek() {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        this.loadWeekView();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        // Clean up event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Destroy task cards
        this.taskCards.forEach(card => card.destroy());
        this.taskCards.clear();
        
        // Destroy calendar
        if (this.calendar) {
            this.calendar.destroy();
        }

        // Remove element
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
    }
}

export default HomePage;