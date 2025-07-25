/**
 * TaskCard Component
 * Displays individual task items with interaction capabilities
 */
class TaskCard {
    constructor(task, options = {}) {
        this.task = task;
        this.options = {
            onComplete: options.onComplete || (() => {}),
            onEdit: options.onEdit || (() => {}),
            onDelete: options.onDelete || (() => {}),
            ...options
        };
        this.element = null;
        this.swipeStartX = 0;
        this.swipeDistance = 0;
        this.isAnimating = false;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = `task-card ${this.task.completed ? 'completed' : ''}`;
        this.element.setAttribute('data-task-id', this.task.id);
        this.element.setAttribute('role', 'listitem');
        this.element.setAttribute('tabindex', '0');

        const dueDate = this.task.due_date ? new Date(this.task.due_date) : null;
        const isOverdue = dueDate && dueDate < new Date() && !this.task.completed;
        const isToday = dueDate && this.isToday(dueDate);

        this.element.innerHTML = `
            <div class="task-card-content">
                <div class="task-checkbox-container">
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        id="task-${this.task.id}"
                        ${this.task.completed ? 'checked' : ''}
                        aria-label="Mark task as ${this.task.completed ? 'incomplete' : 'complete'}"
                    >
                    <label for="task-${this.task.id}" class="task-checkbox-label">
                        <svg class="checkbox-icon" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                    </label>
                </div>
                
                <div class="task-info">
                    <div class="task-header">
                        <h3 class="task-title">${this.escapeHtml(this.task.title)}</h3>
                        <div class="task-indicators">
                            ${this.task.repeat_interval ? '<span class="repeat-indicator" title="Repeating task">🔄</span>' : ''}
                            ${this.task.attachment_count > 0 ? `<span class="attachment-indicator" title="${this.task.attachment_count} attachments">📎</span>` : ''}
                        </div>
                    </div>
                    
                    ${this.task.description ? `<p class="task-description">${this.escapeHtml(this.task.description)}</p>` : ''}
                    
                    <div class="task-meta">
                        ${dueDate ? `
                            <span class="task-due-date ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''}">
                                ${this.formatDueDate(dueDate)}
                            </span>
                        ` : ''}
                        ${this.task.priority && this.task.priority !== 'normal' ? `
                            <span class="task-priority priority-${this.task.priority}">
                                ${this.getPriorityLabel(this.task.priority)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <button class="task-edit-btn" aria-label="Edit task" title="Edit task">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
            </div>
            
            <div class="swipe-actions">
                <button class="swipe-action delete-action" aria-label="Delete task">
                    <svg viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;

        this.bindEvents();
        return this.element;
    }

    bindEvents() {
        if (!this.element) return;

        // Checkbox handling
        const checkbox = this.element.querySelector('.task-checkbox');
        checkbox.addEventListener('change', this.handleComplete.bind(this));

        // Edit button
        const editBtn = this.element.querySelector('.task-edit-btn');
        editBtn.addEventListener('click', this.handleEdit.bind(this));

        // Delete button (swipe action)
        const deleteBtn = this.element.querySelector('.delete-action');
        deleteBtn.addEventListener('click', this.handleDelete.bind(this));

        // Touch events for swipe gestures
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

        // Keyboard navigation
        this.element.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Click to focus
        this.element.addEventListener('click', (e) => {
            if (!e.target.closest('button, input')) {
                this.element.focus();
            }
        });
    }

    handleComplete(e) {
        e.stopPropagation();
        
        if (this.isAnimating) return;
        this.isAnimating = true;

        const wasCompleted = this.task.completed;
        this.task.completed = e.target.checked;

        if (this.task.completed && !wasCompleted) {
            this.playCompletionAnimation();
        }

        this.element.classList.toggle('completed', this.task.completed);
        
        setTimeout(() => {
            this.isAnimating = false;
            this.options.onComplete(this.task);
        }, this.task.completed ? 600 : 0);
    }

    handleEdit(e) {
        e.stopPropagation();
        this.options.onEdit(this.task);
    }

    handleDelete(e) {
        e.stopPropagation();
        this.options.onDelete(this.task);
    }

    handleTouchStart(e) {
        this.swipeStartX = e.touches[0].clientX;
        this.swipeDistance = 0;
        this.element.classList.add('swiping');
    }

    handleTouchMove(e) {
        if (!this.swipeStartX) return;

        const currentX = e.touches[0].clientX;
        this.swipeDistance = this.swipeStartX - currentX;

        // Only allow left swipe for delete action
        if (this.swipeDistance > 0) {
            e.preventDefault();
            const maxSwipe = 80;
            const distance = Math.min(this.swipeDistance, maxSwipe);
            
            this.element.style.transform = `translateX(-${distance}px)`;
            this.element.querySelector('.swipe-actions').style.opacity = distance / maxSwipe;
        }
    }

    handleTouchEnd() {
        this.element.classList.remove('swiping');
        
        if (this.swipeDistance > 60) {
            // Show swipe actions
            this.element.classList.add('swiped');
            this.element.style.transform = 'translateX(-80px)';
            this.element.querySelector('.swipe-actions').style.opacity = '1';
        } else {
            // Reset position
            this.resetSwipe();
        }
        
        this.swipeStartX = 0;
        this.swipeDistance = 0;
    }

    handleKeyDown(e) {
        switch(e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.element.querySelector('.task-checkbox').click();
                break;
            case 'e':
            case 'E':
                e.preventDefault();
                this.handleEdit(e);
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.handleDelete(e);
                break;
            case 'Escape':
                this.resetSwipe();
                break;
        }
    }

    resetSwipe() {
        this.element.classList.remove('swiped');
        this.element.style.transform = '';
        this.element.querySelector('.swipe-actions').style.opacity = '';
    }

    playCompletionAnimation() {
        const content = this.element.querySelector('.task-card-content');
        content.style.animation = 'taskComplete 0.6s ease-out';
        
        // Create celebration particles
        this.createParticles();
        
        setTimeout(() => {
            content.style.animation = '';
        }, 600);
    }

    createParticles() {
        const rect = this.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'completion-particle';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            
            const angle = (Math.PI * 2 * i) / 6;
            const distance = 30 + Math.random() * 20;
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;
            
            particle.style.setProperty('--end-x', endX + 'px');
            particle.style.setProperty('--end-y', endY + 'px');
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 800);
        }
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    formatDueDate(date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (taskDate.getTime() === today.getTime()) {
            return 'Сегодня';
        } else if (taskDate.getTime() === tomorrow.getTime()) {
            return 'Завтра';
        } else if (taskDate.getTime() === yesterday.getTime()) {
            return 'Вчера';
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short'
            });
        }
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

    updateTask(updatedTask) {
        this.task = { ...this.task, ...updatedTask };
        if (this.element) {
            const newElement = this.render();
            this.element.replaceWith(newElement);
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    focus() {
        if (this.element) {
            this.element.focus();
        }
    }
}

export default TaskCard;