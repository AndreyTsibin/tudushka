import TaskCard from '../components/TaskCard.js';
import Modal from '../components/Modal.js';
import API from '../api.js';

/**
 * ArchivePage - View for completed tasks and AI chat history
 */
class ArchivePage {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onTaskRestore: options.onTaskRestore || (() => {}),
            onTaskPermanentDelete: options.onTaskPermanentDelete || (() => {}),
            ...options
        };

        this.element = null;
        this.currentTab = 'tasks';
        this.completedTasks = [];
        this.archivedChats = [];
        this.taskCards = new Map();
        this.isLoading = false;
        this.searchQuery = '';
        this.dateFilter = '';
        this.currentPage = 1;
        this.pageSize = 20;
        this.hasMoreItems = true;

        this.bindMethods();
    }

    bindMethods() {
        this.handleTabChange = this.handleTabChange.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleDateFilter = this.handleDateFilter.bind(this);
        this.handleTaskRestore = this.handleTaskRestore.bind(this);
        this.handleTaskDelete = this.handleTaskDelete.bind(this);
        this.handleChatView = this.handleChatView.bind(this);
        this.handleChatDelete = this.handleChatDelete.bind(this);
        this.handleLoadMore = this.handleLoadMore.bind(this);
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'archive-page';
        this.element.innerHTML = `
            <div class="archive-header">
                <h1 class="archive-title">Архив</h1>
                <div class="archive-actions">
                    <button class="header-btn clear-archive-btn" aria-label="Clear archive" title="Очистить архив">
                        <svg viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="archive-filters">
                <div class="filter-search">
                    <div class="search-input-container">
                        <svg class="search-icon" viewBox="0 0 24 24">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <input 
                            type="text" 
                            class="search-input" 
                            placeholder="Поиск в архиве..."
                            aria-label="Search archive"
                        >
                    </div>
                </div>
                
                <div class="filter-date">
                    <select class="date-filter" aria-label="Filter by date">
                        <option value="">Все время</option>
                        <option value="today">Сегодня</option>
                        <option value="week">Эта неделя</option>
                        <option value="month">Этот месяц</option>
                        <option value="year">Этот год</option>
                        <option value="custom">Выбрать период</option>
                    </select>
                </div>
            </div>

            <div class="archive-tabs">
                <div class="tabs" role="tablist">
                    <button class="tab active" data-tab="tasks" role="tab" aria-selected="true" aria-controls="tasks-content">
                        <svg class="tab-icon" viewBox="0 0 24 24">
                            <path d="M14,2A8,8 0 0,0 6,10A8,8 0 0,0 14,18A8,8 0 0,0 22,10H20C20,13.32 17.32,16 14,16A6,6 0 0,1 8,10A6,6 0 0,1 14,4C14.43,4 14.86,4.05 15.27,4.14L16.88,2.54C15.96,2.18 15,2 14,2M20.59,3.58L14,10.17L11.41,7.58L10,9L14,13L22,5L20.59,3.58Z"/>
                        </svg>
                        Выполненные задачи
                        <span class="tab-counter" id="tasks-counter">0</span>
                    </button>
                    <button class="tab" data-tab="chats" role="tab" aria-selected="false" aria-controls="chats-content">
                        <svg class="tab-icon" viewBox="0 0 24 24">
                            <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z"/>
                        </svg>
                        История чатов
                        <span class="tab-counter" id="chats-counter">0</span>
                    </button>
                </div>
            </div>

            <div class="archive-content">
                <div class="tab-content active" id="tasks-content" role="tabpanel" aria-labelledby="tasks-tab">
                    <div class="completed-tasks-container">
                        <div class="tasks-list" role="list">
                            <!-- Completed tasks will be inserted here -->
                        </div>
                        <div class="loading-indicator" style="display: none;">
                            <div class="loading-spinner"></div>
                            <span>Загрузка...</span>
                        </div>
                        <div class="load-more-container" style="display: none;">
                            <button class="load-more-btn">Загрузить еще</button>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="chats-content" role="tabpanel" aria-labelledby="chats-tab">
                    <div class="archived-chats-container">
                        <div class="chats-list" role="list">
                            <!-- Archived chats will be inserted here -->
                        </div>
                        <div class="loading-indicator" style="display: none;">
                            <div class="loading-spinner"></div>
                            <span>Загрузка...</span>
                        </div>
                        <div class="load-more-container" style="display: none;">
                            <button class="load-more-btn">Загрузить еще</button>
                        </div>
                    </div>
                </div>

                <div class="empty-state" style="display: none;">
                    <div class="empty-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M4,6H20V16H4M20,18A2,2 0 0,0 22,16V6C22,4.89 21.1,4 20,4H4C2.89,4 2,4.89 2,6V16A2,2 0 0,0 4,18H0V20H24V18H20Z"/>
                        </svg>
                    </div>
                    <h3 class="empty-title">Архив пуст</h3>
                    <p class="empty-description">Здесь будут отображаться завершенные задачи и архивные чаты</p>
                </div>
            </div>

            <div class="bulk-actions" style="display: none;">
                <div class="bulk-actions-content">
                    <span class="selected-count">Выбрано: 0</span>
                    <div class="bulk-buttons">
                        <button class="bulk-btn restore-selected">Восстановить</button>
                        <button class="bulk-btn delete-selected">Удалить</button>
                    </div>
                    <button class="bulk-cancel">Отмена</button>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadData();

        if (this.container) {
            this.container.appendChild(this.element);
        }

        return this.element;
    }

    bindEvents() {
        if (!this.element) return;

        // Tab navigation
        const tabs = this.element.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', this.handleTabChange);
        });

        // Search input
        const searchInput = this.element.querySelector('.search-input');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchQuery = e.target.value.trim();
                this.handleSearch();
            }, 300);
        });

        // Date filter
        const dateFilter = this.element.querySelector('.date-filter');
        dateFilter.addEventListener('change', this.handleDateFilter);

        // Clear archive button
        const clearArchiveBtn = this.element.querySelector('.clear-archive-btn');
        clearArchiveBtn.addEventListener('click', this.showClearArchiveModal.bind(this));

        // Load more buttons
        const loadMoreBtns = this.element.querySelectorAll('.load-more-btn');
        loadMoreBtns.forEach(btn => {
            btn.addEventListener('click', this.handleLoadMore);
        });

        // Bulk actions
        const bulkCancel = this.element.querySelector('.bulk-cancel');
        const restoreSelected = this.element.querySelector('.restore-selected');
        const deleteSelected = this.element.querySelector('.delete-selected');

        bulkCancel.addEventListener('click', this.cancelBulkSelection.bind(this));
        restoreSelected.addEventListener('click', this.restoreSelectedItems.bind(this));
        deleteSelected.addEventListener('click', this.deleteSelectedItems.bind(this));
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
        this.resetPagination();
        this.loadData();
    }

    async handleSearch() {
        this.resetPagination();
        await this.loadData();
    }

    async handleDateFilter(e) {
        this.dateFilter = e.target.value;
        
        if (this.dateFilter === 'custom') {
            // TODO: Show date range picker modal
            Modal.alert('Выбор произвольного периода будет реализован в следующей версии', 'Фильтр по дате');
            e.target.value = '';
            this.dateFilter = '';
            return;
        }

        this.resetPagination();
        await this.loadData();
    }

    async loadData() {
        if (this.isLoading) return;

        this.showLoading();
        this.isLoading = true;

        try {
            if (this.currentTab === 'tasks') {
                await this.loadCompletedTasks();
            } else {
                await this.loadArchivedChats();
            }
        } catch (error) {
            console.error('Error loading archive data:', error);
            this.showError('Ошибка загрузки данных архива');
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    async loadCompletedTasks() {
        const filters = {
            completed: true,
            search: this.searchQuery,
            dateFilter: this.dateFilter,
            page: this.currentPage,
            limit: this.pageSize
        };

        const response = await API.getTasks(filters);
        
        if (this.currentPage === 1) {
            this.completedTasks = response.tasks || [];
            this.renderCompletedTasks();
        } else {
            this.completedTasks = [...this.completedTasks, ...(response.tasks || [])];
            this.appendCompletedTasks(response.tasks || []);
        }

        this.hasMoreItems = response.hasMore || false;
        this.updateTasksCounter();
        this.updateLoadMoreVisibility();
    }

    async loadArchivedChats() {
        const filters = {
            archived: true,
            search: this.searchQuery,
            dateFilter: this.dateFilter,
            page: this.currentPage,
            limit: this.pageSize
        };

        const response = await API.getAIChats(filters);
        
        if (this.currentPage === 1) {
            this.archivedChats = response.chats || [];
            this.renderArchivedChats();
        } else {
            this.archivedChats = [...this.archivedChats, ...(response.chats || [])];
            this.appendArchivedChats(response.chats || []);
        }

        this.hasMoreItems = response.hasMore || false;
        this.updateChatsCounter();
        this.updateLoadMoreVisibility();
    }

    renderCompletedTasks() {
        const tasksList = this.element.querySelector('.tasks-list');
        if (!tasksList) return;

        // Clear existing content
        this.taskCards.forEach(card => card.destroy());
        this.taskCards.clear();
        tasksList.innerHTML = '';

        if (this.completedTasks.length === 0) {
            this.showEmptyState('Нет завершенных задач', 'Завершенные задачи появятся здесь');
            return;
        }

        this.hideEmptyState();
        this.appendCompletedTasks(this.completedTasks);
    }

    appendCompletedTasks(tasks) {
        const tasksList = this.element.querySelector('.tasks-list');
        if (!tasksList) return;

        tasks.forEach(task => {
            const taskElement = this.createCompletedTaskElement(task);
            tasksList.appendChild(taskElement);
        });
    }

    createCompletedTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'completed-task-item';
        taskElement.setAttribute('data-task-id', task.id);

        const completedDate = new Date(task.completed_at || task.updated_at);
        
        taskElement.innerHTML = `
            <div class="task-checkbox-container">
                <input type="checkbox" class="bulk-select-checkbox" data-id="${task.id}">
            </div>
            
            <div class="task-content">
                <div class="task-header">
                    <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                    <div class="task-completion-date">
                        ${this.formatCompletionDate(completedDate)}
                    </div>
                </div>
                
                ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                
                <div class="task-meta">
                    ${task.due_date ? `
                        <span class="task-due-date">
                            Срок: ${this.formatDate(new Date(task.due_date))}
                        </span>
                    ` : ''}
                    ${task.priority && task.priority !== 'normal' ? `
                        <span class="task-priority priority-${task.priority}">
                            ${this.getPriorityLabel(task.priority)}
                        </span>
                    ` : ''}
                </div>
            </div>
            
            <div class="task-actions">
                <button class="action-btn restore-btn" data-task-id="${task.id}" aria-label="Restore task" title="Восстановить">
                    <svg viewBox="0 0 24 24">
                        <path d="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z"/>
                    </svg>
                </button>
                <button class="action-btn delete-btn" data-task-id="${task.id}" aria-label="Delete permanently" title="Удалить навсегда">
                    <svg viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;

        // Bind events
        const restoreBtn = taskElement.querySelector('.restore-btn');
        const deleteBtn = taskElement.querySelector('.delete-btn');
        const checkbox = taskElement.querySelector('.bulk-select-checkbox');

        restoreBtn.addEventListener('click', () => this.handleTaskRestore(task));
        deleteBtn.addEventListener('click', () => this.handleTaskDelete(task));
        checkbox.addEventListener('change', this.updateBulkActions.bind(this));

        return taskElement;
    }

    renderArchivedChats() {
        const chatsList = this.element.querySelector('.chats-list');
        if (!chatsList) return;

        chatsList.innerHTML = '';

        if (this.archivedChats.length === 0) {
            this.showEmptyState('Нет архивных чатов', 'Архивные чаты появятся здесь');
            return;
        }

        this.hideEmptyState();
        this.appendArchivedChats(this.archivedChats);
    }

    appendArchivedChats(chats) {
        const chatsList = this.element.querySelector('.chats-list');
        if (!chatsList) return;

        chats.forEach(chat => {
            const chatElement = this.createArchivedChatElement(chat);
            chatsList.appendChild(chatElement);
        });
    }

    createArchivedChatElement(chat) {
        const chatElement = document.createElement('div');
        chatElement.className = 'archived-chat-item';
        chatElement.setAttribute('data-chat-id', chat.id);

        const archivedDate = new Date(chat.archived_at || chat.updated_at);
        
        chatElement.innerHTML = `
            <div class="chat-checkbox-container">
                <input type="checkbox" class="bulk-select-checkbox" data-id="${chat.id}">
            </div>
            
            <div class="chat-content">
                <div class="chat-header">
                    <h3 class="chat-title">${this.escapeHtml(chat.title)}</h3>
                    <div class="chat-archived-date">
                        ${this.formatArchiveDate(archivedDate)}
                    </div>
                </div>
                
                <p class="chat-preview">${this.escapeHtml(chat.last_message || 'Пустой чат')}</p>
                
                <div class="chat-meta">
                    <span class="messages-count">${chat.message_count || 0} сообщений</span>
                    <span class="chat-date">Создан: ${this.formatDate(new Date(chat.created_at))}</span>
                </div>
            </div>
            
            <div class="chat-actions">
                <button class="action-btn view-btn" data-chat-id="${chat.id}" aria-label="View chat" title="Просмотреть">
                    <svg viewBox="0 0 24 24">
                        <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                    </svg>
                </button>
                <button class="action-btn delete-btn" data-chat-id="${chat.id}" aria-label="Delete permanently" title="Удалить навсегда">
                    <svg viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;

        // Bind events
        const viewBtn = chatElement.querySelector('.view-btn');
        const deleteBtn = chatElement.querySelector('.delete-btn');
        const checkbox = chatElement.querySelector('.bulk-select-checkbox');

        viewBtn.addEventListener('click', () => this.handleChatView(chat));
        deleteBtn.addEventListener('click', () => this.handleChatDelete(chat));
        checkbox.addEventListener('change', this.updateBulkActions.bind(this));

        return chatElement;
    }

    async handleTaskRestore(task) {
        try {
            await API.updateTask(task.id, { completed: false });
            this.removeTaskFromList(task.id);
            this.options.onTaskRestore(task);
            this.showSuccessMessage('Задача восстановлена');
        } catch (error) {
            console.error('Error restoring task:', error);
            this.showError('Ошибка восстановления задачи');
        }
    }

    async handleTaskDelete(task) {
        const confirmed = await Modal.confirm(
            `Вы уверены, что хотите навсегда удалить задачу "${task.title}"?`,
            'Удаление задачи'
        );

        if (!confirmed) return;

        try {
            await API.deleteTask(task.id);
            this.removeTaskFromList(task.id);
            this.options.onTaskPermanentDelete(task);
            this.showSuccessMessage('Задача удалена навсегда');
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showError('Ошибка удаления задачи');
        }
    }

    handleChatView(chat) {
        // Show chat in modal
        this.showChatViewModal(chat);
    }

    async handleChatDelete(chat) {
        const confirmed = await Modal.confirm(
            `Вы уверены, что хотите навсегда удалить чат "${chat.title}"?`,
            'Удаление чата'
        );

        if (!confirmed) return;

        try {
            await API.deleteAIChat(chat.id);
            this.removeChatFromList(chat.id);
            this.showSuccessMessage('Чат удален навсегда');
        } catch (error) {
            console.error('Error deleting chat:', error);
            this.showError('Ошибка удаления чата');
        }
    }

    async showChatViewModal(chat) {
        const modal = new Modal({
            title: `Чат: ${chat.title}`,
            size: 'large',
            content: '<div class="chat-view-loading">Загрузка сообщений...</div>'
        });

        modal.show();

        try {
            const response = await API.getAIMessages(chat.id);
            const messages = response.messages || [];
            
            const content = `
                <div class="archived-chat-view">
                    <div class="chat-info">
                        <div class="chat-stats">
                            <span>Сообщений: ${messages.length}</span>
                            <span>Создан: ${this.formatDate(new Date(chat.created_at))}</span>
                        </div>
                    </div>
                    <div class="chat-messages-archive">
                        ${messages.map(msg => `
                            <div class="message message-${msg.role}">
                                <div class="message-content">
                                    <div class="message-text">${this.formatMessageContent(msg.content)}</div>
                                    <div class="message-time">${this.formatDate(new Date(msg.timestamp))}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            modal.setContent(content);
        } catch (error) {
            console.error('Error loading chat messages:', error);
            modal.setContent('<div class="error-message">Ошибка загрузки сообщений</div>');
        }
    }

    async handleLoadMore() {
        if (!this.hasMoreItems || this.isLoading) return;

        this.currentPage++;
        await this.loadData();
    }

    updateBulkActions() {
        const checkboxes = this.element.querySelectorAll('.bulk-select-checkbox:checked');
        const bulkActions = this.element.querySelector('.bulk-actions');
        const selectedCount = this.element.querySelector('.selected-count');

        if (checkboxes.length > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = `Выбрано: ${checkboxes.length}`;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    cancelBulkSelection() {
        const checkboxes = this.element.querySelectorAll('.bulk-select-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateBulkActions();
    }

    async restoreSelectedItems() {
        const checkboxes = this.element.querySelectorAll('.bulk-select-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));

        if (ids.length === 0) return;

        const confirmed = await Modal.confirm(
            `Восстановить ${ids.length} выбранных элементов?`,
            'Массовое восстановление'
        );

        if (!confirmed) return;

        try {
            if (this.currentTab === 'tasks') {
                await Promise.all(ids.map(id => 
                    API.updateTask(id, { completed: false })
                ));
            }
            // Refresh data
            this.resetPagination();
            await this.loadData();
            this.showSuccessMessage('Элементы восстановлены');
        } catch (error) {
            console.error('Error restoring items:', error);
            this.showError('Ошибка восстановления элементов');
        }
    }

    async deleteSelectedItems() {
        const checkboxes = this.element.querySelectorAll('.bulk-select-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));

        if (ids.length === 0) return;

        const confirmed = await Modal.confirm(
            `Навсегда удалить ${ids.length} выбранных элементов?`,
            'Массовое удаление'
        );

        if (!confirmed) return;

        try {
            if (this.currentTab === 'tasks') {
                await Promise.all(ids.map(id => API.deleteTask(id)));
            } else {
                await Promise.all(ids.map(id => API.deleteAIChat(id)));
            }
            // Refresh data
            this.resetPagination();
            await this.loadData();
            this.showSuccessMessage('Элементы удалены');
        } catch (error) {
            console.error('Error deleting items:', error);
            this.showError('Ошибка удаления элементов');
        }
    }

    async showClearArchiveModal() {
        const modal = new Modal({
            title: 'Очистка архива',
            content: `
                <div class="clear-archive-options">
                    <p>Выберите, что хотите очистить:</p>
                    <div class="option-group">
                        <label class="option-label">
                            <input type="checkbox" id="clearTasks"> 
                            Все завершенные задачи
                        </label>
                        <label class="option-label">
                            <input type="checkbox" id="clearChats"> 
                            Все архивные чаты
                        </label>
                    </div>
                    <div class="warning-text">
                        ⚠️ Это действие нельзя отменить
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary cancel-clear">Отмена</button>
                        <button class="btn btn-danger confirm-clear">Очистить</button>
                    </div>
                </div>
            `,
            showCloseButton: false,
            closeOnOverlay: false
        });

        modal.show();

        const cancelBtn = modal.element.querySelector('.cancel-clear');
        const confirmBtn = modal.element.querySelector('.confirm-clear');
        const clearTasks = modal.element.querySelector('#clearTasks');
        const clearChats = modal.element.querySelector('#clearChats');

        cancelBtn.addEventListener('click', () => modal.hide());

        confirmBtn.addEventListener('click', async () => {
            if (!clearTasks.checked && !clearChats.checked) {
                Modal.alert('Выберите хотя бы один вариант', 'Ошибка');
                return;
            }

            modal.showLoading('Очистка архива...');

            try {
                if (clearTasks.checked) {
                    await API.clearCompletedTasks();
                }
                if (clearChats.checked) {
                    await API.clearArchivedChats();
                }

                modal.hide();
                this.resetPagination();
                await this.loadData();
                this.showSuccessMessage('Архив очищен');
            } catch (error) {
                console.error('Error clearing archive:', error);
                modal.hideLoading();
                this.showError('Ошибка очистки архива');
            }
        });
    }

    resetPagination() {
        this.currentPage = 1;
        this.hasMoreItems = true;
    }

    removeTaskFromList(taskId) {
        this.completedTasks = this.completedTasks.filter(task => task.id !== taskId);
        const taskElement = this.element.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.remove();
        }
        this.updateTasksCounter();
        
        if (this.completedTasks.length === 0) {
            this.showEmptyState('Нет завершенных задач', 'Завершенные задачи появятся здесь');
        }
    }

    removeChatFromList(chatId) {
        this.archivedChats = this.archivedChats.filter(chat => chat.id !== chatId);
        const chatElement = this.element.querySelector(`[data-chat-id="${chatId}"]`);
        if (chatElement) {
            chatElement.remove();
        }
        this.updateChatsCounter();
        
        if (this.archivedChats.length === 0) {
            this.showEmptyState('Нет архивных чатов', 'Архивные чаты появятся здесь');
        }
    }

    updateTasksCounter() {
        const counter = this.element.querySelector('#tasks-counter');
        if (counter) {
            counter.textContent = this.completedTasks.length;
        }
    }

    updateChatsCounter() {
        const counter = this.element.querySelector('#chats-counter');
        if (counter) {
            counter.textContent = this.archivedChats.length;
        }
    }

    updateLoadMoreVisibility() {
        const loadMoreContainer = this.element.querySelector(`#${this.currentTab}-content .load-more-container`);
        if (loadMoreContainer) {
            loadMoreContainer.style.display = this.hasMoreItems ? 'block' : 'none';
        }
    }

    showLoading() {
        const indicator = this.element.querySelector(`#${this.currentTab}-content .loading-indicator`);
        if (indicator) {
            indicator.style.display = 'flex';
        }
    }

    hideLoading() {
        const indicator = this.element.querySelector(`#${this.currentTab}-content .loading-indicator`);
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    showEmptyState(title, description) {
        const emptyState = this.element.querySelector('.empty-state');
        if (emptyState) {
            emptyState.querySelector('.empty-title').textContent = title;
            emptyState.querySelector('.empty-description').textContent = description;
            emptyState.style.display = 'block';
        }
    }

    hideEmptyState() {
        const emptyState = this.element.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    showSuccessMessage(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showError(message) {
        Modal.alert(message, 'Ошибка');
    }

    // Utility methods
    formatCompletionDate(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 86400000) { // Less than 24 hours
            return `Завершено ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return `Завершено ${this.formatDate(date)}`;
        }
    }

    formatArchiveDate(date) {
        return `Архивировано ${this.formatDate(date)}`;
    }

    formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    formatMessageContent(content) {
        // Basic formatting - escape HTML and preserve line breaks
        return this.escapeHtml(content).replace(/\n/g, '<br>');
    }

    getPriorityLabel(priority) {
        const labels = {
            high: 'Высокий',
            medium: 'Средний',
            low: 'Низкий'
        };
        return labels[priority] || priority;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        // Clean up task cards
        this.taskCards.forEach(card => card.destroy());
        this.taskCards.clear();

        // Remove element
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
    }
}

export default ArchivePage;