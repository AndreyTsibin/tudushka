/**
 * Tasks module for Tudushka
 * Handles task display, creation, editing and management
 */

class TasksModule {
    constructor() {
        this.tasks = [];
        this.container = null;
        this.isLoading = false;
    }

    /**
     * Initialize the tasks module
     */
    async init() {
        console.log('Initializing Tasks module...');
        
        try {
            this.container = document.querySelector('.tasks-container');
            if (!this.container) {
                console.error('Tasks container not found');
                return;
            }

            // Render initial UI
            this.renderTasksInterface();
            
            // Load tasks from API
            await this.loadTasks();
            
            console.log('Tasks module initialized successfully');
        } catch (error) {
            console.error('Failed to initialize tasks module:', error);
            this.showError('Ошибка загрузки модуля задач');
        }
    }

    /**
     * Render the main tasks interface
     */
    renderTasksInterface() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="tasks-view">
                <div class="tasks-header">
                    <div class="tasks-header__actions">
                        <button class="btn btn--primary" id="addTaskBtn">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            Добавить задачу
                        </button>
                    </div>
                </div>
                
                <div class="tasks-list" id="tasksList">
                    <div class="tasks-loading">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <p>03@C7:0 7040G...</p>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners for tasks interface
     */
    setupEventListeners() {
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.showAddTaskModal();
            });
        }
    }

    /**
     * Load tasks from API
     */
    async loadTasks() {
        this.isLoading = true;
        
        try {
            // For now, show mock data since API returns 501
            this.tasks = [
                {
                    id: 1,
                    title: '@8<5@ 7040G8',
                    description: '-B> 45<>=AB@0F8>==0O 7040G0',
                    completed: false,
                    due_date: new Date().toISOString(),
                    priority: 'medium'
                },
                {
                    id: 2,
                    title: '025@H5==0O 7040G0',
                    description: '-B0 7040G0 C65 2K?>;=5=0',
                    completed: true,
                    due_date: new Date().toISOString(),
                    priority: 'low'
                }
            ];
            
            this.renderTasks();
            
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.showError('H81:0 703@C7:8 7040G');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render tasks list
     */
    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        if (!tasksList) return;

        if (this.tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="tasks-empty">
                    <div class="tasks-empty__icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M24 4C35.046 4 44 12.954 44 24C44 35.046 35.046 44 24 44C12.954 44 4 35.046 4 24C4 12.954 12.954 4 24 4Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M16 24L22 30L32 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Нет задач</h3>
                    <p>Добавьте первую задачу, чтобы начать работу</p>
                </div>
            `;
            return;
        }

        const tasksHTML = this.tasks.map(task => this.renderTaskItem(task)).join('');
        tasksList.innerHTML = `
            <div class="tasks-items">
                ${tasksHTML}
            </div>
        `;

        this.setupTaskEventListeners();
    }

    /**
     * Render individual task item
     */
    renderTaskItem(task) {
        const priorityClass = `task-priority--${task.priority}`;
        const completedClass = task.completed ? 'task-item--completed' : '';
        
        return `
            <div class="task-item ${completedClass}" data-task-id="${task.id}">
                <div class="task-item__checkbox">
                    <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''}>
                    <label for="task-${task.id}"></label>
                </div>
                
                <div class="task-item__content">
                    <div class="task-item__header">
                        <h4 class="task-item__title">${task.title}</h4>
                        <div class="task-item__priority ${priorityClass}"></div>
                    </div>
                    
                    ${task.description ? `<p class="task-item__description">${task.description}</p>` : ''}
                    
                    ${task.due_date ? `
                        <div class="task-item__meta">
                            <span class="task-item__date">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M2 6H14M2 8V12C2 12.5304 2.21071 13.0391 2.58579 13.4142C2.96086 13.7893 3.46957 14 4 14H12C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12V8M2 8V6C2 5.46957 2.21071 4.96086 2.58579 4.58579C2.96086 4.21071 3.46957 4 4 4H12C12.5304 4 13.0391 4.21071 13.4142 4.58579C13.7893 4.96086 14 5.46957 14 6V8" stroke="currentColor" stroke-width="1.5"/>
                                </svg>
                                ${this.formatDate(task.due_date)}
                            </span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="task-item__actions">
                    <button class="task-action-btn" data-action="edit" title=" 540:B8@>20BL">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2L14 8L8 14L2 8L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="task-action-btn task-action-btn--danger" data-action="delete" title="#40;8BL">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4H14M6 4V2C6 1.46957 6.21071 0.960859 6.58579 0.585786C6.96086 0.210714 7.46957 0 8 0C8.53043 0 9.03914 0.210714 9.41421 0.585786C9.78929 0.960859 10 1.46957 10 2V4M12 4V12C12 12.5304 11.7893 13.0391 11.4142 13.4142C11.0391 13.7893 10.5304 14 10 14H6C5.46957 14 4.96086 13.7893 4.58579 13.4142C4.21071 13.0391 4 12.5304 4 12V4H12Z" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for task items
     */
    setupTaskEventListeners() {
        // Checkbox change handlers
        const checkboxes = document.querySelectorAll('.task-item__checkbox input');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.id.replace('task-', ''));
                this.toggleTaskCompletion(taskId, e.target.checked);
            });
        });

        // Action button handlers
        const actionBtns = document.querySelectorAll('.task-action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const taskItem = btn.closest('.task-item');
                const taskId = parseInt(taskItem.getAttribute('data-task-id'));
                
                if (action === 'edit') {
                    this.editTask(taskId);
                } else if (action === 'delete') {
                    this.deleteTask(taskId);
                }
            });
        });
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
                        <h3>>20O 7040G0</h3>
                        <button class="modal__close" aria-label="0:@KBL">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    
                    <form class="task-form" id="taskForm">
                        <div class="form-group">
                            <label for="taskTitle" class="form-label">0720=85 7040G8</label>
                            <input type="text" id="taskTitle" class="form-input" placeholder="2548B5 =0720=85 7040G8" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="taskDescription" class="form-label">?8A0=85 (=5>1O70B5;L=>)</label>
                            <textarea id="taskDescription" class="form-input" rows="3" placeholder=">102LB5 >?8A0=85"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="taskPriority" class="form-label">@8>@8B5B</label>
                                <select id="taskPriority" class="form-select">
                                    <option value="low">87:89</option>
                                    <option value="medium" selected>!@54=89</option>
                                    <option value="high">KA>:89</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="taskDueDate" class="form-label">0B0 2K?>;=5=8O</label>
                                <input type="date" id="taskDueDate" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn--secondary" id="cancelTask">B<5=0</button>
                            <button type="submit" class="btn btn--primary">!>740BL 7040GC</button>
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
            this.showError('0720=85 7040G8 >1O70B5;L=>');
            return;
        }

        const newTask = {
            id: Date.now(), // Temporary ID
            title,
            description,
            priority,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            completed: false
        };

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
     * Toggle task completion status
     */
    toggleTaskCompletion(taskId, completed) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = completed;
            this.renderTasks();
            console.log('Task completion toggled:', taskId, completed);
        }
    }

    /**
     * Edit task
     */
    editTask(taskId) {
        console.log('Edit task:', taskId);
        // Implementation would show edit modal similar to add task modal
    }

    /**
     * Delete task
     */
    deleteTask(taskId) {
        if (confirm('#40;8BL MBC 7040GC?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.renderTasks();
            console.log('Task deleted:', taskId);
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Сегодня';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Завтра';
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short'
            });
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Tasks module error:', message);
        
        const tasksList = document.getElementById('tasksList');
        if (tasksList) {
            tasksList.innerHTML = `
                <div class="tasks-error">
                    <div class="error-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2"/>
                            <line x1="24" y1="16" x2="24" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <line x1="24" y1="32" x2="24.01" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h3>H81:0 703@C7:8</h3>
                    <p>${message}</p>
                    <button class="btn btn--primary" onclick="window.location.reload()">1=>28BL</button>
                </div>
            `;
        }
    }
}

// Export the module
if (typeof window !== 'undefined') {
    window.TasksModule = TasksModule;
}