/**
 * Calendar Component
 * Month view calendar with task indicators and date selection
 */
class Calendar {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            selectedDate: options.selectedDate || new Date(),
            tasks: options.tasks || [],
            onDateSelect: options.onDateSelect || (() => {}),
            onMonthChange: options.onMonthChange || (() => {}),
            showWeekNumbers: options.showWeekNumbers || false,
            firstDayOfWeek: options.firstDayOfWeek || 1, // 0 = Sunday, 1 = Monday
            locale: options.locale || 'ru-RU',
            ...options
        };

        this.currentDate = new Date(this.options.selectedDate);
        this.today = new Date();
        this.viewDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        this.element = null;
        this.isNavigating = false;

        this.monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];

        this.dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        this.dayNamesLong = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'calendar';
        this.element.setAttribute('role', 'application');
        this.element.setAttribute('aria-label', 'Календарь');

        this.element.innerHTML = `
            <div class="calendar-header">
                <button class="calendar-nav-btn prev-month" type="button" aria-label="Previous month">
                    <svg viewBox="0 0 24 24">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                </button>
                
                <div class="calendar-title">
                    <button class="month-year-btn" type="button" aria-label="Select month and year">
                        <span class="month-name">${this.monthNames[this.viewDate.getMonth()]}</span>
                        <span class="year">${this.viewDate.getFullYear()}</span>
                    </button>
                </div>
                
                <button class="calendar-nav-btn next-month" type="button" aria-label="Next month">
                    <svg viewBox="0 0 24 24">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                </button>
            </div>
            
            <div class="calendar-grid">
                <div class="calendar-weekdays">
                    ${this.renderWeekdays()}
                </div>
                <div class="calendar-days" role="grid" aria-label="Calendar days">
                    ${this.renderDays()}
                </div>
            </div>
            
            <div class="calendar-today-btn-container">
                <button class="calendar-today-btn" type="button">
                    Сегодня
                </button>
            </div>
        `;

        this.bindEvents();

        if (this.container) {
            this.container.appendChild(this.element);
        }

        return this.element;
    }

    renderWeekdays() {
        let html = '';
        for (let i = 0; i < 7; i++) {
            const dayIndex = (i + this.options.firstDayOfWeek) % 7;
            html += `
                <div class="calendar-weekday" role="columnheader">
                    <span class="weekday-short">${this.dayNames[dayIndex]}</span>
                    <span class="weekday-long">${this.dayNamesLong[dayIndex]}</span>
                </div>
            `;
        }
        return html;
    }

    renderDays() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        
        // Adjust start date to show complete weeks
        const dayOfWeek = (firstDay.getDay() - this.options.firstDayOfWeek + 7) % 7;
        startDate.setDate(startDate.getDate() - dayOfWeek);

        let html = '';
        let currentDate = new Date(startDate);
        let weekCount = 0;

        while (currentDate <= lastDay || currentDate.getMonth() === month || weekCount < 6) {
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = this.isSameDate(currentDate, this.today);
            const isSelected = this.isSameDate(currentDate, this.currentDate);
            const tasksForDate = this.getTasksForDate(currentDate);
            const hasOverdueTasks = this.hasOverdueTasksForDate(currentDate);

            const classes = [
                'calendar-day',
                isCurrentMonth ? 'current-month' : 'other-month',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                tasksForDate.length > 0 ? 'has-tasks' : '',
                hasOverdueTasks ? 'has-overdue' : ''
            ].filter(Boolean).join(' ');

            html += `
                <button 
                    class="${classes}"
                    type="button"
                    data-date="${currentDate.toISOString().split('T')[0]}"
                    aria-label="${this.formatDateForAccessibility(currentDate, tasksForDate.length)}"
                    ${!isCurrentMonth ? 'tabindex="-1"' : ''}
                    role="gridcell"
                >
                    <span class="day-number">${currentDate.getDate()}</span>
                    ${tasksForDate.length > 0 ? `
                        <div class="task-indicators">
                            ${tasksForDate.slice(0, 3).map(task => `
                                <span class="task-dot ${task.completed ? 'completed' : ''} priority-${task.priority || 'normal'}"
                                      title="${this.escapeHtml(task.title)}"></span>
                            `).join('')}
                            ${tasksForDate.length > 3 ? `<span class="task-count">+${tasksForDate.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                </button>
            `;

            currentDate.setDate(currentDate.getDate() + 1);
            
            if (currentDate.getDay() === this.options.firstDayOfWeek) {
                weekCount++;
            }
            
            if (weekCount >= 6 && currentDate.getMonth() !== month) {
                break;
            }
        }

        return html;
    }

    bindEvents() {
        if (!this.element) return;

        // Navigation buttons
        const prevBtn = this.element.querySelector('.prev-month');
        const nextBtn = this.element.querySelector('.next-month');
        const todayBtn = this.element.querySelector('.calendar-today-btn');
        const monthYearBtn = this.element.querySelector('.month-year-btn');

        prevBtn.addEventListener('click', this.previousMonth.bind(this));
        nextBtn.addEventListener('click', this.nextMonth.bind(this));
        todayBtn.addEventListener('click', this.goToToday.bind(this));
        monthYearBtn.addEventListener('click', this.showMonthYearPicker.bind(this));

        // Date selection
        const daysContainer = this.element.querySelector('.calendar-days');
        daysContainer.addEventListener('click', this.handleDateClick.bind(this));

        // Keyboard navigation
        this.element.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Touch gestures for month navigation
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;

        this.element.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = false;
        }, { passive: true });

        this.element.addEventListener('touchmove', (e) => {
            if (!touchStartX) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchStartX - touchX;
            const deltaY = touchStartY - touchY;

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                isSwiping = true;
                e.preventDefault();
            }
        }, { passive: false });

        this.element.addEventListener('touchend', (e) => {
            if (!isSwiping || !touchStartX) return;

            const touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchStartX - touchEndX;

            if (Math.abs(deltaX) > 100) {
                if (deltaX > 0) {
                    this.nextMonth();
                } else {
                    this.previousMonth();
                }
            }

            touchStartX = 0;
            touchStartY = 0;
            isSwiping = false;
        }, { passive: true });
    }

    handleDateClick(e) {
        const dayButton = e.target.closest('.calendar-day');
        if (!dayButton) return;

        const dateStr = dayButton.getAttribute('data-date');
        const selectedDate = new Date(dateStr + 'T00:00:00');
        
        this.selectDate(selectedDate);
    }

    handleKeyDown(e) {
        const focusedDay = this.element.querySelector('.calendar-day:focus');
        if (!focusedDay) return;

        const currentDateStr = focusedDay.getAttribute('data-date');
        const currentDate = new Date(currentDateStr + 'T00:00:00');
        let newDate = new Date(currentDate);

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                newDate.setDate(newDate.getDate() - 1);
                this.navigateToDate(newDate);
                break;
            case 'ArrowRight':
                e.preventDefault();
                newDate.setDate(newDate.getDate() + 1);
                this.navigateToDate(newDate);
                break;
            case 'ArrowUp':
                e.preventDefault();
                newDate.setDate(newDate.getDate() - 7);
                this.navigateToDate(newDate);
                break;
            case 'ArrowDown':
                e.preventDefault();
                newDate.setDate(newDate.getDate() + 7);
                this.navigateToDate(newDate);
                break;
            case 'Home':
                e.preventDefault();
                newDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1);
                this.navigateToDate(newDate);
                break;
            case 'End':
                e.preventDefault();
                newDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 0);
                this.navigateToDate(newDate);
                break;
            case 'PageUp':
                e.preventDefault();
                if (e.shiftKey) {
                    newDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
                } else {
                    newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
                }
                this.navigateToDate(newDate);
                break;
            case 'PageDown':
                e.preventDefault();
                if (e.shiftKey) {
                    newDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
                } else {
                    newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
                }
                this.navigateToDate(newDate);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.selectDate(currentDate);
                break;
        }
    }

    navigateToDate(date) {
        if (date.getMonth() !== this.viewDate.getMonth() || date.getFullYear() !== this.viewDate.getFullYear()) {
            this.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
            this.updateCalendar();
        }
        
        // Focus the date
        setTimeout(() => {
            const dateStr = date.toISOString().split('T')[0];
            const dayButton = this.element.querySelector(`[data-date="${dateStr}"]`);
            if (dayButton) {
                dayButton.focus();
            }
        }, 100);
    }

    selectDate(date) {
        this.currentDate = new Date(date);
        this.updateCalendar();
        this.options.onDateSelect(date);
    }

    previousMonth() {
        if (this.isNavigating) return;
        this.isNavigating = true;

        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.updateCalendar();
        this.options.onMonthChange(this.viewDate);

        setTimeout(() => {
            this.isNavigating = false;
        }, 300);
    }

    nextMonth() {
        if (this.isNavigating) return;
        this.isNavigating = true;

        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        this.updateCalendar();
        this.options.onMonthChange(this.viewDate);

        setTimeout(() => {
            this.isNavigating = false;
        }, 300);
    }

    goToToday() {
        const today = new Date();
        this.currentDate = new Date(today);
        this.viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
        this.updateCalendar();
        this.options.onDateSelect(today);
    }

    showMonthYearPicker() {
        // This could be enhanced with a proper month/year picker modal
        const currentYear = this.viewDate.getFullYear();
        const currentMonth = this.viewDate.getMonth();
        
        const year = prompt('Введите год:', currentYear);
        if (year && !isNaN(year) && year >= 1900 && year <= 2100) {
            const month = prompt('Введите месяц (1-12):', currentMonth + 1);
            if (month && !isNaN(month) && month >= 1 && month <= 12) {
                this.viewDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                this.updateCalendar();
                this.options.onMonthChange(this.viewDate);
            }
        }
    }

    updateCalendar() {
        if (!this.element) return;

        // Update header
        const monthName = this.element.querySelector('.month-name');
        const year = this.element.querySelector('.year');
        
        monthName.textContent = this.monthNames[this.viewDate.getMonth()];
        year.textContent = this.viewDate.getFullYear();

        // Update days
        const daysContainer = this.element.querySelector('.calendar-days');
        daysContainer.innerHTML = this.renderDays();

        // Update accessibility
        this.element.setAttribute('aria-label', 
            `Календарь, ${this.monthNames[this.viewDate.getMonth()]} ${this.viewDate.getFullYear()}`
        );
    }

    updateTasks(tasks) {
        this.options.tasks = tasks || [];
        this.updateCalendar();
    }

    getTasksForDate(date) {
        return this.options.tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            return this.isSameDate(taskDate, date);
        });
    }

    hasOverdueTasksForDate(date) {
        const tasks = this.getTasksForDate(date);
        return tasks.some(task => !task.completed && new Date(task.due_date) < this.today);
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    formatDateForAccessibility(date, taskCount) {
        const dayName = this.dayNamesLong[date.getDay()];
        const dateStr = date.toLocaleDateString(this.options.locale);
        let description = `${dayName}, ${dateStr}`;
        
        if (taskCount > 0) {
            description += `, ${taskCount} ${this.getTaskCountLabel(taskCount)}`;
        }
        
        if (this.isSameDate(date, this.today)) {
            description += ', сегодня';
        }
        
        return description;
    }

    getTaskCountLabel(count) {
        if (count === 1) return 'задача';
        if (count >= 2 && count <= 4) return 'задачи';
        return 'задач';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    // Public API methods
    getSelectedDate() {
        return new Date(this.currentDate);
    }

    setSelectedDate(date) {
        this.selectDate(date);
    }

    getCurrentViewDate() {
        return new Date(this.viewDate);
    }

    setCurrentViewDate(date) {
        this.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
        this.updateCalendar();
    }
}

export default Calendar;