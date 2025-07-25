import Modal from '../components/Modal.js';
import API from '../api.js';

/**
 * SettingsPage - User settings and preferences
 */
class SettingsPage {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onProfileUpdate: options.onProfileUpdate || (() => {}),
            onAccountDelete: options.onAccountDelete || (() => {}),
            ...options
        };

        this.element = null;
        this.user = null;
        this.subscription = null;
        this.isLoading = false;
        this.isDirty = false;

        this.bindMethods();
    }

    bindMethods() {
        this.handleProfileSave = this.handleProfileSave.bind(this);
        this.handleLanguageChange = this.handleLanguageChange.bind(this);
        this.handleSubscriptionManage = this.handleSubscriptionManage.bind(this);
        this.handleAccountDelete = this.handleAccountDelete.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleDataExport = this.handleDataExport.bind(this);
        this.handleDataImport = this.handleDataImport.bind(this);
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'settings-page';
        this.element.innerHTML = `
            <div class="settings-header">
                <h1 class="settings-title">Настройки</h1>
                <div class="settings-actions">
                    <button class="header-btn save-btn" style="display: none;" title="Сохранить изменения">
                        <svg viewBox="0 0 24 24">
                            <path d="M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3M19,19H5V5H16.17L19,7.83V19M12,12A3,3 0 0,0 9,15A3,3 0 0,0 12,18A3,3 0 0,0 15,15A3,3 0 0,0 12,12M6,6V10H15V6H6Z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="settings-content">
                <div class="settings-section">
                    <h2 class="section-title">
                        <svg class="section-icon" viewBox="0 0 24 24">
                            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                        </svg>
                        Профиль
                    </h2>
                    
                    <div class="profile-form">
                        <div class="form-group">
                            <label for="firstName" class="form-label">Имя</label>
                            <input 
                                type="text" 
                                id="firstName" 
                                class="form-input" 
                                placeholder="Введите ваше имя"
                                maxlength="50"
                            >
                        </div>

                        <div class="form-group">
                            <label for="lastName" class="form-label">Фамилия</label>
                            <input 
                                type="text" 
                                id="lastName" 
                                class="form-input" 
                                placeholder="Введите вашу фамилию"
                                maxlength="50"
                            >
                        </div>

                        <div class="form-group">
                            <label for="birthDate" class="form-label">Дата рождения</label>
                            <input 
                                type="date" 
                                id="birthDate" 
                                class="form-input"
                                max="${new Date().toISOString().split('T')[0]}"
                            >
                        </div>

                        <div class="form-group">
                            <label for="timezone" class="form-label">Часовой пояс</label>
                            <select id="timezone" class="form-select">
                                <option value="Europe/Moscow">Москва (UTC+3)</option>
                                <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
                                <option value="Europe/Samara">Самара (UTC+4)</option>
                                <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                                <option value="Asia/Omsk">Омск (UTC+6)</option>
                                <option value="Asia/Krasnoyarsk">Красноярск (UTC+7)</option>
                                <option value="Asia/Irkutsk">Иркутск (UTC+8)</option>
                                <option value="Asia/Yakutsk">Якутск (UTC+9)</option>
                                <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
                                <option value="Asia/Magadan">Магадан (UTC+11)</option>
                                <option value="Asia/Kamchatka">Камчатка (UTC+12)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h2 class="section-title">
                        <svg class="section-icon" viewBox="0 0 24 24">
                            <path d="M12.87,15.07L10.33,12.56L10.36,12.53C12.1,10.59 13.34,8.36 14.07,6H17V4H10V2H8V4H1V6H12.17C11.5,7.92 10.44,9.75 9,11.35C8.07,10.32 7.3,9.19 6.69,8H4.69C5.42,9.63 6.42,11.17 7.67,12.56L2.58,17.58L4,19L9,14L12.11,17.11L12.87,15.07Z"/>
                        </svg>
                        Язык и регион
                    </h2>
                    
                    <div class="language-settings">
                        <div class="form-group">
                            <label for="language" class="form-label">Язык интерфейса</label>
                            <select id="language" class="form-select">
                                <option value="ru">Русский</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="dateFormat" class="form-label">Формат даты</label>
                            <select id="dateFormat" class="form-select">
                                <option value="DD.MM.YYYY">ДД.ММ.ГГГГ (31.12.2023)</option>
                                <option value="MM/DD/YYYY">ММ/ДД/ГГГГ (12/31/2023)</option>
                                <option value="YYYY-MM-DD">ГГГГ-ММ-ДД (2023-12-31)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="timeFormat" class="form-label">Формат времени</label>
                            <select id="timeFormat" class="form-select">
                                <option value="24">24-часовой (15:30)</option>
                                <option value="12">12-часовой (3:30 PM)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="firstDayOfWeek" class="form-label">Первый день недели</label>
                            <select id="firstDayOfWeek" class="form-select">
                                <option value="0">Воскресенье</option>
                                <option value="1">Понедельник</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h2 class="section-title">
                        <svg class="section-icon" viewBox="0 0 24 24">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                        </svg>
                        Уведомления
                    </h2>
                    
                    <div class="notification-settings">
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="taskReminders" class="setting-checkbox">
                                <div class="setting-content">
                                    <div class="setting-title">Напоминания о задачах</div>
                                    <div class="setting-description">Получать уведомления о предстоящих дедлайнах</div>
                                </div>
                            </label>
                        </div>

                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="dailyDigest" class="setting-checkbox">
                                <div class="setting-content">
                                    <div class="setting-title">Ежедневная сводка</div>
                                    <div class="setting-description">Ежедневное уведомление с планами на день</div>
                                </div>
                            </label>
                        </div>

                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="aiNotifications" class="setting-checkbox">
                                <div class="setting-content">
                                    <div class="setting-title">Уведомления от AI</div>
                                    <div class="setting-description">Получать советы и рекомендации от AI помощника</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h2 class="section-title">
                        <svg class="section-icon" viewBox="0 0 24 24">
                            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                        </svg>
                        Подписка
                    </h2>
                    
                    <div class="subscription-info">
                        <div class="current-plan">
                            <div class="plan-badge">
                                <span class="plan-name">Бесплатный</span>
                                <span class="plan-status">Активный</span>
                            </div>
                            <div class="plan-features">
                                <ul>
                                    <li>3 AI сообщения в день</li>
                                    <li>3 файла на задачу (до 10MB)</li>
                                    <li>Базовые функции планирования</li>
                                </ul>
                            </div>
                        </div>

                        <div class="usage-stats">
                            <h4>Использование сегодня</h4>
                            <div class="usage-bar">
                                <div class="usage-label">AI сообщения</div>
                                <div class="usage-progress">
                                    <div class="usage-bar-fill" style="width: 33%"></div>
                                </div>
                                <div class="usage-text">1 / 3</div>
                            </div>
                        </div>

                        <button class="upgrade-btn">
                            <svg viewBox="0 0 24 24">
                                <path d="M16,17V19H2V17S2,13 9,13 16,17 16,17M12.5,7.5A3.5,3.5 0 0,0 9,11A3.5,3.5 0 0,0 12.5,14.5A3.5,3.5 0 0,0 16,11A3.5,3.5 0 0,0 12.5,7.5M15.94,13A5.32,5.32 0 0,1 18,17V19H22V17S22,13.37 15.94,13M15,4A3.39,3.39 0 0,0 13.07,4.59A5,5 0 0,1 13.07,10.41A3.39,3.39 0 0,0 15,11A3.5,3.5 0 0,0 18.5,7.5A3.5,3.5 0 0,0 15,4Z"/>
                            </svg>
                            Улучшить план
                        </button>
                    </div>
                </div>

                <div class="settings-section">
                    <h2 class="section-title">
                        <svg class="section-icon" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                        Данные
                    </h2>
                    
                    <div class="data-management">
                        <div class="data-actions">
                            <button class="data-btn export-btn">
                                <svg viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                                Экспорт данных
                            </button>
                            <button class="data-btn import-btn">
                                <svg viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                                Импорт данных
                            </button>
                        </div>
                        <input type="file" id="importFile" accept=".json" style="display: none;">
                    </div>
                </div>

                <div class="settings-section">
                    <h2 class="section-title">
                        <svg class="section-icon" viewBox="0 0 24 24">
                            <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
                        </svg>
                        О приложении
                    </h2>
                    
                    <div class="app-info">
                        <div class="info-row">
                            <span class="info-label">Версия</span>
                            <span class="info-value">1.0.0</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Платформа</span>
                            <span class="info-value">Telegram Mini App</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Разработчик</span>
                            <span class="info-value">Тудушка Team</span>
                        </div>
                        
                        <div class="app-links">
                            <button class="link-btn privacy-btn">Политика конфиденциальности</button>
                            <button class="link-btn terms-btn">Условия использования</button>
                            <button class="link-btn support-btn">Поддержка</button>
                        </div>
                    </div>
                </div>

                <div class="settings-section danger-section">
                    <h2 class="section-title">
                        <svg class="section-icon" viewBox="0 0 24 24">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        Опасная зона
                    </h2>
                    
                    <div class="danger-actions">
                        <button class="danger-btn delete-account-btn">
                            <svg viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                            Удалить аккаунт
                        </button>
                        <p class="danger-description">
                            Это действие нельзя отменить. Все ваши данные будут удалены навсегда.
                        </p>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadUserData();

        if (this.container) {
            this.container.appendChild(this.element);
        }

        return this.element;
    }

    bindEvents() {
        if (!this.element) return;

        // Form inputs
        const formInputs = this.element.querySelectorAll('input, select');
        formInputs.forEach(input => {
            input.addEventListener('input', this.handleFormChange);
            input.addEventListener('change', this.handleFormChange);
        });

        // Save button
        const saveBtn = this.element.querySelector('.save-btn');
        saveBtn.addEventListener('click', this.handleProfileSave);

        // Language change
        const languageSelect = this.element.querySelector('#language');
        languageSelect.addEventListener('change', this.handleLanguageChange);

        // Subscription management
        const upgradeBtn = this.element.querySelector('.upgrade-btn');
        upgradeBtn.addEventListener('click', this.handleSubscriptionManage);

        // Data management
        const exportBtn = this.element.querySelector('.export-btn');
        const importBtn = this.element.querySelector('.import-btn');
        const importFile = this.element.querySelector('#importFile');

        exportBtn.addEventListener('click', this.handleDataExport);
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', this.handleDataImport);

        // App info links
        const privacyBtn = this.element.querySelector('.privacy-btn');
        const termsBtn = this.element.querySelector('.terms-btn');
        const supportBtn = this.element.querySelector('.support-btn');

        privacyBtn.addEventListener('click', () => this.showInfoModal('privacy'));
        termsBtn.addEventListener('click', () => this.showInfoModal('terms'));
        supportBtn.addEventListener('click', () => this.showInfoModal('support'));

        // Delete account
        const deleteAccountBtn = this.element.querySelector('.delete-account-btn');
        deleteAccountBtn.addEventListener('click', this.handleAccountDelete);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    if (this.isDirty) {
                        this.handleProfileSave();
                    }
                }
            }
        });
    }

    async loadUserData() {
        this.showLoading();

        try {
            // Load user profile
            const userResponse = await API.getCurrentUser();
            this.user = userResponse.user;
            this.fillProfileForm();

            // Load subscription info
            const subscriptionResponse = await API.getSubscription();
            this.subscription = subscriptionResponse.subscription;
            this.updateSubscriptionInfo();

        } catch (error) {
            console.error('Error loading user data:', error);
            this.showError('Ошибка загрузки данных пользователя');
        } finally {
            this.hideLoading();
        }
    }

    fillProfileForm() {
        if (!this.user) return;

        const firstName = this.element.querySelector('#firstName');
        const lastName = this.element.querySelector('#lastName');
        const birthDate = this.element.querySelector('#birthDate');
        const timezone = this.element.querySelector('#timezone');
        const language = this.element.querySelector('#language');
        const dateFormat = this.element.querySelector('#dateFormat');
        const timeFormat = this.element.querySelector('#timeFormat');
        const firstDayOfWeek = this.element.querySelector('#firstDayOfWeek');

        if (firstName) firstName.value = this.user.first_name || '';
        if (lastName) lastName.value = this.user.last_name || '';
        if (birthDate && this.user.birth_date) {
            birthDate.value = this.user.birth_date.split('T')[0];
        }
        if (timezone) timezone.value = this.user.timezone || 'Europe/Moscow';
        if (language) language.value = this.user.language || 'ru';
        if (dateFormat) dateFormat.value = this.user.date_format || 'DD.MM.YYYY';
        if (timeFormat) timeFormat.value = this.user.time_format || '24';
        if (firstDayOfWeek) firstDayOfWeek.value = this.user.first_day_of_week || '1';

        // Notification settings
        const taskReminders = this.element.querySelector('#taskReminders');
        const dailyDigest = this.element.querySelector('#dailyDigest');
        const aiNotifications = this.element.querySelector('#aiNotifications');

        if (taskReminders) taskReminders.checked = this.user.notifications?.task_reminders !== false;
        if (dailyDigest) dailyDigest.checked = this.user.notifications?.daily_digest !== false;
        if (aiNotifications) aiNotifications.checked = this.user.notifications?.ai_notifications !== false;

        this.isDirty = false;
        this.updateSaveButtonVisibility();
    }

    updateSubscriptionInfo() {
        if (!this.subscription) return;

        const planName = this.element.querySelector('.plan-name');
        const planStatus = this.element.querySelector('.plan-status');
        const usageBarFill = this.element.querySelector('.usage-bar-fill');
        const usageText = this.element.querySelector('.usage-text');

        if (planName) {
            const planNames = {
                'free': 'Бесплатный',
                'plus': 'Плюс',
                'pro': 'Про'
            };
            planName.textContent = planNames[this.subscription.plan] || 'Неизвестный';
        }

        if (planStatus) {
            planStatus.textContent = this.subscription.active ? 'Активный' : 'Неактивный';
            planStatus.className = `plan-status ${this.subscription.active ? 'active' : 'inactive'}`;
        }

        // Update usage stats
        if (this.subscription.usage && usageBarFill && usageText) {
            const { ai_messages_used, ai_messages_limit } = this.subscription.usage;
            const percentage = (ai_messages_used / ai_messages_limit) * 100;
            
            usageBarFill.style.width = `${percentage}%`;
            usageText.textContent = `${ai_messages_used} / ${ai_messages_limit}`;
        }
    }

    handleFormChange() {
        this.isDirty = true;
        this.updateSaveButtonVisibility();
    }

    updateSaveButtonVisibility() {
        const saveBtn = this.element.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.style.display = this.isDirty ? 'flex' : 'none';
        }
    }

    async handleProfileSave() {
        if (!this.isDirty || this.isLoading) return;

        this.showLoading();

        try {
            const formData = {
                first_name: this.element.querySelector('#firstName').value.trim(),
                last_name: this.element.querySelector('#lastName').value.trim(),
                birth_date: this.element.querySelector('#birthDate').value || null,
                timezone: this.element.querySelector('#timezone').value,
                language: this.element.querySelector('#language').value,
                date_format: this.element.querySelector('#dateFormat').value,
                time_format: this.element.querySelector('#timeFormat').value,
                first_day_of_week: parseInt(this.element.querySelector('#firstDayOfWeek').value),
                notifications: {
                    task_reminders: this.element.querySelector('#taskReminders').checked,
                    daily_digest: this.element.querySelector('#dailyDigest').checked,
                    ai_notifications: this.element.querySelector('#aiNotifications').checked
                }
            };

            const response = await API.updateProfile(formData);
            this.user = response.user;
            this.isDirty = false;
            this.updateSaveButtonVisibility();
            this.options.onProfileUpdate(this.user);
            this.showSuccessMessage('Профиль обновлен');

        } catch (error) {
            console.error('Error saving profile:', error);
            this.showError('Ошибка сохранения профиля');
        } finally {
            this.hideLoading();
        }
    }

    async handleLanguageChange(e) {
        const newLanguage = e.target.value;
        
        try {
            await API.updateProfile({ language: newLanguage });
            
            // Show confirmation about language change
            Modal.alert(
                'Язык интерфейса будет изменен после перезагрузки приложения.',
                'Изменение языка'
            );
            
        } catch (error) {
            console.error('Error updating language:', error);
            this.showError('Ошибка изменения языка');
            // Revert the selection
            e.target.value = this.user.language || 'ru';
        }
    }

    handleSubscriptionManage() {
        const modal = new Modal({
            title: 'Управление подпиской',
            size: 'large',
            content: `
                <div class="subscription-plans">
                    <div class="plan-card current">
                        <div class="plan-header">
                            <h3>Бесплатный</h3>
                            <div class="plan-price">0₽</div>
                        </div>
                        <ul class="plan-features">
                            <li>3 AI сообщения в день</li>
                            <li>3 файла на задачу (до 10MB)</li>
                            <li>Базовые функции планирования</li>
                        </ul>
                        <button class="plan-btn current-plan" disabled>Текущий план</button>
                    </div>

                    <div class="plan-card recommended">
                        <div class="plan-badge">Рекомендуем</div>
                        <div class="plan-header">
                            <h3>Плюс</h3>
                            <div class="plan-price">149₽<span>/месяц</span></div>
                        </div>
                        <ul class="plan-features">
                            <li>30 AI сообщений в день</li>
                            <li>10 файлов на задачу (до 20MB)</li>
                            <li>Расширенная аналитика</li>
                            <li>Приоритетная поддержка</li>
                        </ul>
                        <button class="plan-btn upgrade">Выбрать план</button>
                    </div>

                    <div class="plan-card">
                        <div class="plan-header">
                            <h3>Про</h3>
                            <div class="plan-price">299₽<span>/месяц</span></div>
                        </div>
                        <ul class="plan-features">
                            <li>Неограниченные AI сообщения</li>
                            <li>Неограниченные файлы (до 50MB)</li>
                            <li>Все функции Плюс</li>
                            <li>API доступ</li>
                            <li>Персональная поддержка</li>
                        </ul>
                        <button class="plan-btn upgrade">Выбрать план</button>
                    </div>
                </div>

                <div class="subscription-notice">
                    <p>Платежи будут доступны в следующей версии приложения.</p>
                </div>
            `
        });

        modal.show();

        // Bind upgrade buttons
        const upgradeButtons = modal.element.querySelectorAll('.upgrade');
        upgradeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                Modal.alert('Платежи будут доступны в следующей версии приложения.', 'Обновление подписки');
            });
        });
    }

    async handleDataExport() {
        try {
            this.showLoading();
            
            const data = await API.exportUserData();
            
            // Create and download file
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tudushka-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccessMessage('Данные экспортированы');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Ошибка экспорта данных');
        } finally {
            this.hideLoading();
        }
    }

    async handleDataImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            this.showLoading();
            
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate data structure
            if (!this.validateImportData(data)) {
                throw new Error('Неверный формат файла');
            }
            
            const confirmed = await Modal.confirm(
                'Импорт данных заменит существующие задачи и настройки. Продолжить?',
                'Подтверждение импорта'
            );
            
            if (!confirmed) return;
            
            await API.importUserData(data);
            
            this.showSuccessMessage('Данные импортированы. Перезагрузите приложение.');
            
        } catch (error) {
            console.error('Error importing data:', error);
            this.showError('Ошибка импорта данных: ' + error.message);
        } finally {
            this.hideLoading();
            e.target.value = '';
        }
    }

    validateImportData(data) {
        // Basic validation of import data structure
        return data && 
               typeof data === 'object' && 
               (data.tasks || data.chats || data.settings);
    }

    async handleAccountDelete() {
        const modal = new Modal({
            title: 'Удаление аккаунта',
            content: `
                <div class="delete-account-form">
                    <div class="warning-message">
                        <svg class="warning-icon" viewBox="0 0 24 24">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        <div class="warning-text">
                            <h4>Это действие нельзя отменить!</h4>
                            <p>Все ваши данные, включая задачи, чаты и настройки, будут удалены навсегда.</p>
                        </div>
                    </div>
                    
                    <div class="confirmation-input">
                        <label for="deleteConfirmation">
                            Для подтверждения введите "УДАЛИТЬ":
                        </label>
                        <input 
                            type="text" 
                            id="deleteConfirmation" 
                            class="form-input"
                            placeholder="УДАЛИТЬ"
                            autocomplete="off"
                        >
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-secondary cancel-delete">Отмена</button>
                        <button class="btn btn-danger confirm-delete" disabled>Удалить аккаунт</button>
                    </div>
                </div>
            `,
            showCloseButton: false,
            closeOnOverlay: false
        });

        modal.show();

        const confirmationInput = modal.element.querySelector('#deleteConfirmation');
        const confirmBtn = modal.element.querySelector('.confirm-delete');
        const cancelBtn = modal.element.querySelector('.cancel-delete');

        confirmationInput.addEventListener('input', (e) => {
            confirmBtn.disabled = e.target.value !== 'УДАЛИТЬ';
        });

        cancelBtn.addEventListener('click', () => modal.hide());

        confirmBtn.addEventListener('click', async () => {
            try {
                modal.showLoading('Удаление аккаунта...');
                
                await API.deleteAccount();
                
                modal.hide();
                this.options.onAccountDelete();
                
            } catch (error) {
                console.error('Error deleting account:', error);
                modal.hideLoading();
                this.showError('Ошибка удаления аккаунта');
            }
        });
    }

    showInfoModal(type) {
        const content = {
            privacy: {
                title: 'Политика конфиденциальности',
                content: `
                    <div class="info-content">
                        <h3>Сбор данных</h3>
                        <p>Мы собираем только необходимые данные для работы приложения.</p>
                        
                        <h3>Использование данных</h3>
                        <p>Ваши данные используются исключительно для предоставления услуг.</p>
                        
                        <h3>Безопасность</h3>
                        <p>Мы используем современные методы защиты данных.</p>
                    </div>
                `
            },
            terms: {
                title: 'Условия использования',
                content: `
                    <div class="info-content">
                        <h3>Использование сервиса</h3>
                        <p>Сервис предоставляется "как есть" для личного использования.</p>
                        
                        <h3>Ограничения</h3>
                        <p>Запрещено использовать сервис для незаконных целей.</p>
                        
                        <h3>Ответственность</h3>
                        <p>Пользователь несет ответственность за свои действия в приложении.</p>
                    </div>
                `
            },
            support: {
                title: 'Поддержка',
                content: `
                    <div class="info-content">
                        <h3>Связь с нами</h3>
                        <p>Email: support@tudushka.ru</p>
                        <p>Telegram: @tudushka_support</p>
                        
                        <h3>Часы работы</h3>
                        <p>Понедельник - Пятница: 9:00 - 18:00 (МСК)</p>
                        
                        <h3>FAQ</h3>
                        <p>Ответы на частые вопросы доступны в нашем канале.</p>
                    </div>
                `
            }
        };

        const info = content[type];
        if (!info) return;

        const modal = new Modal({
            title: info.title,
            content: info.content,
            size: 'medium'
        });

        modal.show();
    }

    showLoading() {
        this.isLoading = true;
        // Could add a global loading indicator
    }

    hideLoading() {
        this.isLoading = false;
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

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}

export default SettingsPage;