/**
 * Calendar module for Tudushka
 * Handles calendar display and month view functionality
 */

class CalendarModule {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.tasksModule = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the calendar module
     */
    async init() {
        console.log('Initializing Calendar module...');
        
        try {
            this.currentDate = new Date();
            this.setupEventListeners();
            this.renderCalendar();
            this.isInitialized = true;
            
            console.log('Calendar module initialized successfully');
        } catch (error) {
            console.error('Failed to initialize calendar module:', error);
        }
    }

    /**
     * Set tasks module reference for data integration
     */
    setTasksModule(tasksModule) {
        this.tasksModule = tasksModule;
    }

    /**
     * Setup event listeners for calendar navigation
     */
    setupEventListeners() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar();
            });
        }
    }

    /**
     * Render the calendar grid
     */
    renderCalendar() {
        const monthYearEl = document.getElementById('calendarMonthYear');
        const calendarDaysEl = document.getElementById('calendarDays');

        if (!monthYearEl || !calendarDaysEl) return;

        // Update month/year header
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        monthYearEl.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        // Generate calendar days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let daysHTML = '';
        const today = new Date();

        for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);

            const isCurrentMonth = currentDay.getMonth() === this.currentDate.getMonth();
            const isToday = currentDay.toDateString() === today.toDateString();
            
            // Format date correctly to avoid timezone issues
            const year = currentDay.getFullYear();
            const month = String(currentDay.getMonth() + 1).padStart(2, '0');
            const day = String(currentDay.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            
            const hasTasks = this.hasTasksForDate(dateKey);

            let classes = ['calendar-day'];
            if (!isCurrentMonth) classes.push('calendar-day--other-month');
            if (isToday) classes.push('calendar-day--today');
            if (hasTasks) classes.push('calendar-day--has-tasks');

            daysHTML += `
                <div class="${classes.join(' ')}" data-date="${dateKey}">
                    ${currentDay.getDate()}
                </div>
            `;
        }

        calendarDaysEl.innerHTML = daysHTML;

        // Add click listeners to calendar days
        const dayElements = calendarDaysEl.querySelectorAll('.calendar-day');
        dayElements.forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const dateAttr = e.target.getAttribute('data-date');
                if (dateAttr) {
                    this.selectDate(dateAttr);
                }
            });
        });
    }

    /**
     * Select a date and show tasks for that date
     */
    selectDate(dateString) {
        // Remove previous selection
        const prevSelected = document.querySelector('.calendar-day--selected');
        if (prevSelected) {
            prevSelected.classList.remove('calendar-day--selected');
        }

        // Add selection to clicked day
        const selectedEl = document.querySelector(`[data-date="${dateString}"]`);
        if (selectedEl) {
            selectedEl.classList.add('calendar-day--selected');
        }

        this.selectedDate = dateString;
        this.showTasksForDate(dateString);
    }

    /**
     * Show tasks for selected date
     */
    showTasksForDate(dateString) {
        const selectedDayInfo = document.getElementById('selectedDayInfo');
        const selectedDayTasks = document.getElementById('selectedDayTasks');

        if (!selectedDayInfo || !selectedDayTasks) return;

        // Get tasks for this date
        const tasks = this.getTasksForDate(dateString);

        if (tasks.length === 0) {
            selectedDayTasks.innerHTML = `
                <div class="no-tasks-message">
                    На этот день задач нет
                </div>
            `;
        } else {
            const tasksHTML = tasks.map(task => this.renderTaskItem(task, dateString)).join('');
            selectedDayTasks.innerHTML = tasksHTML;
        }

        selectedDayInfo.style.display = 'block';
    }

    /**
     * Check if date has tasks
     */
    hasTasksForDate(dateString) {
        if (!this.tasksModule || !this.tasksModule.allTasks) return false;
        
        const tasks = this.getTasksForDate(dateString);
        return tasks.length > 0;
    }

    /**
     * Get tasks for specific date
     */
    getTasksForDate(dateString) {
        if (!this.tasksModule || !this.tasksModule.allTasks) {
            // Fallback to mock data if tasks module not available
            const mockTasks = {
                '2025-07-25': [
                    {
                        id: 1,
                        title: 'Заголовок задачи которую нужно выполнить',
                        description: 'Описание задачи если есть, Описание задачи если есть, Описание задачи если есть.....',
                        time: '14:30',
                        priority: 'urgent'
                    }
                ],
                '2025-07-26': [
                    {
                        id: 2,
                        title: 'Вторая задача',
                        description: 'Описание второй задачи',
                        time: '10:00',
                        priority: 'medium'
                    }
                ]
            };
            return mockTasks[dateString] || [];
        }
        
        return this.tasksModule.getTasksForDate(dateString);
    }

    /**
     * Render individual task item for calendar
     */
    renderTaskItem(task, dateString) {
        // Parse date correctly - add timezone offset to avoid date shift
        const date = new Date(dateString + 'T12:00:00');
        const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

        const priorityText = this.getPriorityText(task.priority);
        const priorityClass = `task-priority--${task.priority}`;
        
        return `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-header">
                    ${task.priority === 'urgent' ? `<div class="task-priority ${priorityClass}">${priorityText}</div>` : ''}
                    <div class="task-time">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M7 3V7L9.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        ${task.time || task.due_date ? this.formatTime(task.due_date || task.time) : ''}
                    </div>
                    <div class="task-date">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M5 1V3M9 1V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M2 6H12" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}
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
    formatTime(timeString) {
        if (!timeString) return '';
        
        if (timeString.includes(':') && timeString.length <= 5) {
            return timeString; // Already formatted as HH:MM
        }
        
        const date = new Date(timeString);
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

// Create global CalendarManager for compatibility
window.CalendarManager = new CalendarModule();

// Export the module
if (typeof window !== 'undefined') {
    window.CalendarModule = CalendarModule;
}