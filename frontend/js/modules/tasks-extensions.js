/**
 * Extensions for TasksModule to add calendar and week functionality
 */

// Extend TasksModule with additional methods
if (typeof window !== 'undefined' && window.TasksModule) {
    // Add methods to TasksModule prototype
    Object.assign(window.TasksModule.prototype, {
        /**
         * Filter tasks by period
         */
        filterTasksByPeriod(tasks, period) {
            const today = new Date();
            const todayStr = today.toDateString();
            
            if (period === 'today') {
                return tasks.filter(task => {
                    if (!task.due_date) return false;
                    const taskDate = new Date(task.due_date);
                    return taskDate.toDateString() === todayStr;
                });
            } else if (period === 'week') {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                return tasks.filter(task => {
                    if (!task.due_date) return false;
                    const taskDate = new Date(task.due_date);
                    return taskDate >= weekStart && taskDate <= weekEnd;
                });
            }
            
            return tasks;
        },

        /**
         * Load and render week tasks
         */
        async loadWeekTasks() {
            await this.loadTasks('week');
        },

        /**
         * Render week tasks grouped by days
         */
        renderWeekTasks() {
            const container = document.getElementById('weekTasksContainer');
            if (!container) return;

            // Group tasks by date
            const tasksByDate = {};
            this.tasks.forEach(task => {
                const taskDate = new Date(task.due_date);
                const dateKey = taskDate.toDateString();
                if (!tasksByDate[dateKey]) {
                    tasksByDate[dateKey] = [];
                }
                tasksByDate[dateKey].push(task);
            });

            // Generate week days
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            
            let weekHTML = '';
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                const dateKey = day.toDateString();
                
                const dayTasks = tasksByDate[dateKey] || [];
                const dayName = this.getDayName(day.getDay());
                const formattedDate = this.formatDateForWeek(day);
                
                weekHTML += `
                    <div class="day-section">
                        <h3 class="day-header">${dayName}: ${formattedDate}</h3>
                        <div class="day-tasks">
                            ${dayTasks.length > 0 
                                ? dayTasks.map(task => this.renderTaskItem(task)).join('') 
                                : '<div class="no-tasks-message">На этот день задач нет</div>'
                            }
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = weekHTML;
        },

        /**
         * Get day name in Russian
         */
        getDayName(dayIndex) {
            const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
            return days[dayIndex];
        },

        /**
         * Format date for week view
         */
        formatDateForWeek(date) {
            const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
            return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        },

        /**
         * Initialize calendar for month view
         */
        initializeCalendar() {
            if (window.CalendarManager) {
                // Set tasks module reference in calendar
                window.CalendarManager.setTasksModule(this);
                if (!window.CalendarManager.isInitialized) {
                    window.CalendarManager.init();
                    window.CalendarManager.isInitialized = true;
                }
            } else {
                console.warn('CalendarManager not available');
            }
        },

        /**
         * Get tasks for specific date (used by calendar)
         */
        getTasksForDate(dateString) {
            if (!this.allTasks) return [];
            
            return this.allTasks.filter(task => {
                if (!task.due_date) return false;
                const taskDate = new Date(task.due_date);
                const year = taskDate.getFullYear();
                const month = String(taskDate.getMonth() + 1).padStart(2, '0');
                const day = String(taskDate.getDate()).padStart(2, '0');
                const taskDateString = `${year}-${month}-${day}`;
                return taskDateString === dateString;
            });
        }
    });
}