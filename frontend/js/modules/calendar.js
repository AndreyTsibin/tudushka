/**
 * Calendar module for Tudushka
 * Handles calendar display, date selection and month navigation
 */

class CalendarModule {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.onDateSelect = null;
        this.months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        this.weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    }

    /**
     * Show date picker modal
     * @param {Function} callback - Function to call when date is selected
     */
    showDatePicker(callback) {
        this.onDateSelect = callback;
        this.selectedDate = new Date();
        
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        modalContainer.innerHTML = `
            <div class="modal modal--calendar">
                <div class="modal__backdrop"></div>
                <div class="modal__content">
                    <div class="modal__header">
                        <h3>Выберите дату</h3>
                        <button class="modal__close" aria-label="Закрыть">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <button class="calendar-nav-btn" id="prevMonth" aria-label="Предыдущий месяц">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            
                            <div class="calendar-title" id="calendarTitle">
                                ${this.months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}
                            </div>
                            
                            <button class="calendar-nav-btn" id="nextMonth" aria-label="Следующий месяц">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="calendar-grid">
                            <div class="calendar-weekdays">
                                ${this.weekDays.map(day => `<div class="calendar-weekday">${day}</div>`).join('')}
                            </div>
                            
                            <div class="calendar-days" id="calendarDays">
                                ${this.renderCalendarDays()}
                            </div>
                        </div>
                        
                        <div class="calendar-actions">
                            <button class="btn btn--secondary" id="cancelCalendar">Отмена</button>
                            <button class="btn btn--primary" id="selectToday">Сегодня</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupCalendarEventListeners();
    }

    /**
     * Render calendar days for current month
     */
    renderCalendarDays() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        
        // Get first Monday before or on the first day
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(firstDay.getDate() - mondayOffset);
        
        const days = [];
        const today = new Date();
        const currentDate = new Date(startDate);
        
        // Generate 6 weeks (42 days) to fill the calendar grid
        for (let i = 0; i < 42; i++) {
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === today.toDateString();
            const isSelected = this.selectedDate && currentDate.toDateString() === this.selectedDate.toDateString();
            
            let classes = ['calendar-day'];
            if (!isCurrentMonth) classes.push('calendar-day--other-month');
            if (isToday) classes.push('calendar-day--today');
            if (isSelected) classes.push('calendar-day--selected');
            
            const dateStr = currentDate.toISOString().split('T')[0];
            
            days.push(`
                <button class="${classes.join(' ')}" data-date="${dateStr}" type="button">
                    ${currentDate.getDate()}
                </button>
            `);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return days.join('');
    }

    /**
     * Setup calendar event listeners
     */
    setupCalendarEventListeners() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        // Close modal handlers
        const closeBtn = modalContainer.querySelector('.modal__close');
        const cancelBtn = modalContainer.querySelector('#cancelCalendar');
        const backdrop = modalContainer.querySelector('.modal__backdrop');

        [closeBtn, cancelBtn, backdrop].forEach(element => {
            if (element) {
                element.addEventListener('click', () => {
                    modalContainer.innerHTML = '';
                });
            }
        });

        // Month navigation
        const prevBtn = modalContainer.querySelector('#prevMonth');
        const nextBtn = modalContainer.querySelector('#nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.updateCalendar();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.updateCalendar();
            });
        }

        // Today button
        const todayBtn = modalContainer.querySelector('#selectToday');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                const today = new Date();
                this.selectDate(today.toISOString().split('T')[0]);
            });
        }

        // Date selection
        this.setupDayClickListeners();
    }

    /**
     * Setup click listeners for calendar days
     */
    setupDayClickListeners() {
        const dayButtons = document.querySelectorAll('.calendar-day');
        dayButtons.forEach(button => {
            button.addEventListener('click', () => {
                const dateStr = button.getAttribute('data-date');
                this.selectDate(dateStr);
            });
        });
    }

    /**
     * Update calendar display after month change
     */
    updateCalendar() {
        const titleElement = document.getElementById('calendarTitle');
        const daysElement = document.getElementById('calendarDays');
        
        if (titleElement) {
            titleElement.textContent = `${this.months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
        
        if (daysElement) {
            daysElement.innerHTML = this.renderCalendarDays();
            this.setupDayClickListeners();
        }
    }

    /**
     * Select a date and close the calendar
     */
    selectDate(dateStr) {
        this.selectedDate = new Date(dateStr);
        
        // Update visual selection
        const dayButtons = document.querySelectorAll('.calendar-day');
        dayButtons.forEach(button => {
            button.classList.remove('calendar-day--selected');
            if (button.getAttribute('data-date') === dateStr) {
                button.classList.add('calendar-day--selected');
            }
        });

        // Call the callback with the selected date
        if (this.onDateSelect) {
            this.onDateSelect(dateStr);
        }

        // Close modal
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
    }

    /**
     * Get current month name
     */
    getCurrentMonthName() {
        return this.months[this.currentDate.getMonth()];
    }

    /**
     * Get current year
     */
    getCurrentYear() {
        return this.currentDate.getFullYear();
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Сегодня';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Завтра';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Вчера';
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long'
            });
        }
    }

    /**
     * Check if date is today
     */
    isToday(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    /**
     * Check if date is in current month
     */
    isCurrentMonth(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const current = new Date();
        return date.getMonth() === current.getMonth() && 
               date.getFullYear() === current.getFullYear();
    }

    /**
     * Get days in month
     */
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    /**
     * Get week number
     */
    getWeekNumber(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const jan4 = new Date(target.getFullYear(), 0, 4);
        const dayDiff = (target - jan4) / 86400000;
        return 1 + Math.ceil(dayDiff / 7);
    }
}

// Export the module
if (typeof window !== 'undefined') {
    window.CalendarModule = CalendarModule;
}