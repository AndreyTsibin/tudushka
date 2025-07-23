#!/usr/bin/env node
require('dotenv').config();
const { Client } = require('pg');
const http = require('http');
const fs = require('fs');
const path = require('path');

class UniversalTudushkaTest {
  constructor() {
    this.startTime = Date.now();
    this.stage = 'early'; // early, feature, production
    this.serverProcess = null;
    
    // Results structure for all stages
    this.results = {
      // Early Stage Tests
      database: { status: 'pending', details: '', time: 0 },
      server: { status: 'pending', details: '', time: 0 },
      staticFiles: { status: 'pending', details: '', time: 0 },
      healthEndpoint: { status: 'pending', details: '', time: 0 },
      environment: { status: 'pending', details: '', time: 0 },
      security: { status: 'pending', details: '', time: 0 },
      frontend: { status: 'pending', details: '', time: 0 },
      
      // Feature Stage Tests
      authentication: { status: 'pending', details: '', time: 0 },
      tasksCrud: { status: 'pending', details: '', time: 0 },
      aiIntegration: { status: 'pending', details: '', time: 0 },
      fileSystem: { status: 'pending', details: '', time: 0 },
      
      // Production Stage Tests
      loadTesting: { status: 'pending', details: '', time: 0 },
      securityScan: { status: 'pending', details: '', time: 0 },
      deployment: { status: 'pending', details: '', time: 0 }
    };
    
    this.metrics = {
      serverStartTime: 0,
      dbResponseTime: 0,
      apiResponseTime: 0,
      avgApiTime: 0,
      memoryUsage: 0
    };
  }

  async run() {
    console.log('🧪 УНИВЕРСАЛЬНОЕ ТЕСТИРОВАНИЕ ТУДУШКА');
    console.log('===================================\n');

    try {
      // 1. Detect project stage
      await this.detectProjectStage();
      console.log(`📊 Обнаружена стадия проекта: ${this.getStageDisplayName()}\n`);

      // 2. Run appropriate tests based on stage
      await this.runStageTests();

    } catch (error) {
      console.error('❌ Критическая ошибка тестирования:', error.message);
    } finally {
      await this.cleanup();
      this.printDetailedReport();
    }
  }

  async detectProjectStage() {
    const checks = {
      hasDatabase: await this.checkDatabaseConnection(),
      hasBasicServer: this.checkFileExists('backend/server.js'),
      hasRoutes: this.checkFileExists('backend/routes/auth.js') && 
                 this.checkFileExists('backend/routes/tasks.js'),
      hasModels: this.checkFileExists('backend/models/User.js'),
      hasAI: this.checkFileExists('backend/routes/ai.js'),
      hasFiles: this.checkFileExists('backend/routes/files.js'),
      hasFrontendModules: this.checkFileExists('frontend/js/modules/tasks.js'),
      hasProductionConfig: process.env.NODE_ENV === 'production' || 
                          this.checkFileExists('nginx.conf') ||
                          process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')
    };

    // Determine stage based on available features
    if (checks.hasProductionConfig && checks.hasAI && checks.hasFiles) {
      this.stage = 'production';
    } else if (checks.hasRoutes && checks.hasModels && (checks.hasAI || checks.hasFiles)) {
      this.stage = 'feature';
    } else {
      this.stage = 'early';
    }
  }

  async runStageTests() {
    switch (this.stage) {
      case 'production':
        await this.runProductionTests();
        break;
      case 'feature':
        await this.runFeatureTests();
        break;
      default:
        await this.runEarlyStageTests();
    }
  }

  async runEarlyStageTests() {
    console.log('🔧 Запуск тестов ранней стадии...\n');
    
    await this.testEnvironment();
    await this.testDatabase();
    await this.startTestServer();
    
    if (this.results.server.status === 'success') {
      await this.sleep(2000);
      await this.testStaticFiles();
      await this.testHealthEndpoint();
      await this.testFrontend();
      await this.testSecurity();
    }
  }

  async runFeatureTests() {
    console.log('🚀 Запуск функциональных тестов...\n');
    
    // Run early stage tests first
    await this.runEarlyStageTests();
    
    // Add feature-specific tests
    if (this.results.server.status === 'success') {
      await this.testAuthentication();
      await this.testTasksCrud();
      await this.testAIIntegration();
      await this.testFileSystem();
    }
  }

  async runProductionTests() {
    console.log('🏭 Запуск продакшн тестов...\n');
    
    // Run feature tests first
    await this.runFeatureTests();
    
    // Add production-specific tests
    await this.testLoadPerformance();
    await this.testSecurityScan();
    await this.testDeploymentReadiness();
  }

  // ============= EARLY STAGE TESTS =============

  async testEnvironment() {
    const start = Date.now();
    try {
      const requiredVars = ['DATABASE_URL', 'PORT', 'JWT_SECRET'];
      const optionalVars = ['TELEGRAM_BOT_TOKEN', 'PERPLEXITY_API_KEY'];
      
      const missing = requiredVars.filter(v => !process.env[v]);
      const missingOptional = optionalVars.filter(v => !process.env[v]);
      
      const warnings = [];
      if (missing.length > 0) {
        warnings.push(`Критические переменные: ${missing.join(', ')}`);
      }
      if (missingOptional.length > 0) {
        warnings.push(`Опциональные: ${missingOptional.join(', ')}`);
      }

      this.results.environment = {
        status: missing.length === 0 ? (missingOptional.length === 0 ? 'success' : 'warning') : 'error',
        details: warnings.length === 0 ? 'Все переменные окружения настроены' : warnings.join('; '),
        time: Date.now() - start
      };
    } catch (error) {
      this.results.environment = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async testDatabase() {
    const start = Date.now();
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL не установлена');
      }

      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      
      const result = await client.query('SELECT NOW() as current_time');
      this.metrics.dbResponseTime = Date.now() - start;
      
      // Check tables
      const tablesQuery = `
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' ORDER BY table_name;
      `;
      const tablesResult = await client.query(tablesQuery);
      const tableNames = tablesResult.rows.map(row => row.table_name);
      
      const expectedTables = ['users', 'tasks', 'task_attachments', 'ai_chats', 'ai_messages', 'usage_stats'];
      const existingTables = expectedTables.filter(table => tableNames.includes(table));
      
      await client.end();

      if (existingTables.length === 0) {
        this.results.database = {
          status: 'warning',
          details: 'Подключение OK, но таблицы не созданы (запустите миграции)',
          time: this.metrics.dbResponseTime
        };
      } else if (existingTables.length < expectedTables.length) {
        this.results.database = {
          status: 'warning',
          details: `Подключение OK, найдено ${existingTables.length}/${expectedTables.length} таблиц`,
          time: this.metrics.dbResponseTime
        };
      } else {
        this.results.database = {
          status: 'success',
          details: `Подключение успешно, все ${existingTables.length} таблиц найдены`,
          time: this.metrics.dbResponseTime
        };
      }
    } catch (error) {
      this.results.database = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async startTestServer() {
    const start = Date.now();
    try {
      const { spawn } = require('child_process');
      this.serverProcess = spawn('node', ['backend/server.js'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      await this.waitForServer();
      this.metrics.serverStartTime = Date.now() - start;

      this.results.server = {
        status: 'success',
        details: `Express сервер запущен на порту ${process.env.PORT || 3001}`,
        time: this.metrics.serverStartTime
      };
    } catch (error) {
      this.results.server = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async testStaticFiles() {
    const start = Date.now();
    try {
      const frontendPort = process.env.FRONTEND_PORT || 3000;
      const indexResponse = await this.makeRequest(`http://localhost:${frontendPort}/`, 'GET');
      
      const frontendPath = path.join(__dirname, 'frontend', 'index.html');
      const indexExists = fs.existsSync(frontendPath);
      
      if (indexExists && indexResponse.statusCode === 200) {
        this.results.staticFiles = {
          status: 'success',
          details: `Frontend доступен на порту ${frontendPort}`,
          time: Date.now() - start
        };
      } else {
        this.results.staticFiles = {
          status: 'warning',
          details: 'Frontend файлы найдены, но сервер не отвечает',
          time: Date.now() - start
        };
      }
    } catch (error) {
      this.results.staticFiles = {
        status: 'warning',
        details: 'Статические файлы недоступны',
        time: Date.now() - start
      };
    }
  }

  async testHealthEndpoint() {
    const start = Date.now();
    try {
      const port = process.env.PORT || 3001;
      const response = await this.makeRequest(`http://localhost:${port}/api/health`, 'GET');
      this.metrics.apiResponseTime = Date.now() - start;

      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        this.results.healthEndpoint = {
          status: data.status === 'OK' ? 'success' : 'warning',
          details: `Health endpoint работает (${response.statusCode})`,
          time: this.metrics.apiResponseTime
        };
      } else {
        this.results.healthEndpoint = {
          status: 'error',
          details: `Неожиданный статус код: ${response.statusCode}`,
          time: this.metrics.apiResponseTime
        };
      }
    } catch (error) {
      this.results.healthEndpoint = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async testFrontend() {
    const start = Date.now();
    try {
      const frontendPath = path.join(__dirname, 'frontend');
      const basicFiles = ['index.html', 'css/main.css', 'js/app.js'];
      const moduleFiles = ['js/modules/tasks.js', 'js/modules/ai-chat.js'];
      
      const missingBasic = basicFiles.filter(file => !fs.existsSync(path.join(frontendPath, file)));
      const existingModules = moduleFiles.filter(file => fs.existsSync(path.join(frontendPath, file)));

      let status = 'success';
      let details = '';

      if (missingBasic.length > 0) {
        status = 'error';
        details = `Отсутствуют базовые файлы: ${missingBasic.join(', ')}`;
      } else if (existingModules.length === 0) {
        status = 'warning';
        details = 'Базовые файлы найдены, модули не реализованы';
      } else {
        details = `Найдено ${existingModules.length} модулей frontend`;
      }

      this.results.frontend = { status, details, time: Date.now() - start };
    } catch (error) {
      this.results.frontend = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async testSecurity() {
    const start = Date.now();
    try {
      const issues = [];
      const port = process.env.PORT || 3001;

      // Test CORS
      try {
        const response = await this.makeRequest(`http://localhost:${port}/api/health`, 'OPTIONS', {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET'
        });
        
        if (!response.headers['access-control-allow-origin']) {
          issues.push('CORS заголовки не настроены');
        }
      } catch (error) {
        issues.push('Не удалось проверить CORS');
      }

      // Test .env accessibility
      const envExists = fs.existsSync(path.join(__dirname, '.env'));
      if (envExists) {
        try {
          const frontendPort = process.env.FRONTEND_PORT || 3000;
          const envResponse = await this.makeRequest(`http://localhost:${frontendPort}/.env`, 'GET');
          if (envResponse.statusCode !== 403 && envResponse.statusCode !== 404) {
            issues.push('.env файл доступен через веб (КРИТИЧНО!)');
          }
        } catch (error) {
          // Good - .env should not be accessible
        }
      }

      this.results.security = {
        status: issues.length === 0 ? 'success' : 'warning',
        details: issues.length === 0 ? 'Базовые проверки безопасности пройдены' : issues.join('; '),
        time: Date.now() - start
      };
    } catch (error) {
      this.results.security = {
        status: 'warning',
        details: `Ошибка проверки безопасности: ${error.message}`,
        time: Date.now() - start
      };
    }
  }

  // ============= FEATURE STAGE TESTS =============

  async testAuthentication() {
    const start = Date.now();
    try {
      const port = process.env.PORT || 3001;
      
      // Test auth endpoint exists
      const response = await this.makeRequest(`http://localhost:${port}/api/auth/telegram`, 'POST', {
        'Content-Type': 'application/json'
      }, JSON.stringify({ test: 'data' }));

      let status = 'warning';
      let details = '';

      if (response.statusCode === 404) {
        status = 'error';
        details = 'Auth endpoint не найден';
      } else if (response.statusCode === 500) {
        status = 'warning';
        details = 'Auth endpoint найден, но есть серверная ошибка';
      } else if (response.statusCode === 400 || response.statusCode === 422) {
        status = 'success';
        details = 'Auth endpoint работает корректно';
      } else {
        details = `Auth endpoint найден (статус: ${response.statusCode})`;
      }

      this.results.authentication = { status, details, time: Date.now() - start };
    } catch (error) {
      this.results.authentication = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async testTasksCrud() {
    const start = Date.now();
    try {
      const port = process.env.PORT || 3001;
      
      // Test tasks endpoints
      const endpoints = [
        { path: '/api/tasks', method: 'GET' },
        { path: '/api/tasks', method: 'POST' },
      ];

      let workingEndpoints = 0;
      for (const endpoint of endpoints) {
        try {
          const response = await this.makeRequest(`http://localhost:${port}${endpoint.path}`, endpoint.method);
          if (response.statusCode !== 404) {
            workingEndpoints++;
          }
        } catch (error) {
          // Endpoint might be protected, which is OK
        }
      }

      const status = workingEndpoints === endpoints.length ? 'success' : 
                    workingEndpoints > 0 ? 'warning' : 'error';
      const details = `Tasks endpoints: ${workingEndpoints}/${endpoints.length} найдены`;

      this.results.tasksCrud = { status, details, time: Date.now() - start };
    } catch (error) {
      this.results.tasksCrud = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async testAIIntegration() {
    const start = Date.now();
    try {
      const hasAIRoute = this.checkFileExists('backend/routes/ai.js');
      const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
      
      let status = 'error';
      let details = '';

      if (!hasAIRoute) {
        details = 'AI роуты не реализованы';
      } else if (!hasPerplexityKey) {
        status = 'warning';
        details = 'AI роуты найдены, но PERPLEXITY_API_KEY не установлен';
      } else {
        status = 'success';
        details = 'AI интеграция настроена';
      }

      this.results.aiIntegration = { status, details, time: Date.now() - start };
    } catch (error) {
      this.results.aiIntegration = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async testFileSystem() {
    const start = Date.now();
    try {
      const hasFileRoute = this.checkFileExists('backend/routes/files.js');
      const hasTelegramToken = !!process.env.TELEGRAM_BOT_TOKEN;
      
      let status = 'error';
      let details = '';

      if (!hasFileRoute) {
        details = 'File роуты не реализованы';
      } else if (!hasTelegramToken) {
        status = 'warning';
        details = 'File роуты найдены, но TELEGRAM_BOT_TOKEN не установлен';
      } else {
        status = 'success';
        details = 'Файловая система настроена';
      }

      this.results.fileSystem = { status, details, time: Date.now() - start };
    } catch (error) {
      this.results.fileSystem = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  // ============= PRODUCTION STAGE TESTS =============

  async testLoadPerformance() {
    const start = Date.now();
    try {
      const port = process.env.PORT || 3001;
      const requests = 10; // Light load test for dev environment
      const promises = [];

      for (let i = 0; i < requests; i++) {
        promises.push(this.makeRequest(`http://localhost:${port}/api/health`, 'GET'));
      }

      const responses = await Promise.all(promises);
      const avgTime = (Date.now() - start) / requests;
      this.metrics.avgApiTime = avgTime;

      const successCount = responses.filter(r => r.statusCode === 200).length;
      const successRate = (successCount / requests) * 100;

      const status = successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'error';
      const details = `Нагрузочный тест: ${successRate}% успешных запросов, среднее время ${avgTime.toFixed(0)}мс`;

      this.results.loadTesting = { status, details, time: Date.now() - start };
    } catch (error) {
      this.results.loadTesting = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async testSecurityScan() {
    const start = Date.now();
    try {
      const issues = [];
      
      // Check for common security files
      if (!this.checkFileExists('.env') && !this.checkFileExists('.env.example')) {
        issues.push('Нет файлов конфигурации окружения');
      }
      
      // Check if JWT_SECRET is strong
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        issues.push('JWT_SECRET слишком короткий (минимум 32 символа)');
      }
      
      // Check for rate limiting middleware
      if (!this.checkFileExists('backend/middleware/rateLimit.js')) {
        issues.push('Rate limiting не реализован');
      }

      const status = issues.length === 0 ? 'success' : issues.length <= 2 ? 'warning' : 'error';
      const details = issues.length === 0 ? 'Проверки безопасности пройдены' : issues.join('; ');

      this.results.securityScan = { status, details, time: Date.now() - start };
    } catch (error) {
      this.results.securityScan = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  async testDeploymentReadiness() {
    const start = Date.now();
    try {
      const checks = [];
      
      // Environment checks
      if (process.env.NODE_ENV === 'production') {
        checks.push('✅ NODE_ENV=production');
      } else {
        checks.push('⚠️ NODE_ENV не установлен в production');
      }
      
      // Database URL check
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')) {
        checks.push('✅ Продакшн БД настроена');
      } else {
        checks.push('⚠️ Используется локальная БД');
      }
      
      // SSL/Domain check
      if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('https://')) {
        checks.push('✅ HTTPS настроен');
      } else {
        checks.push('⚠️ HTTPS не настроен');
      }

      const warningCount = checks.filter(c => c.includes('⚠️')).length;
      const status = warningCount === 0 ? 'success' : warningCount <= 1 ? 'warning' : 'error';
      const details = checks.join('; ');

      this.results.deployment = { status, details, time: Date.now() - start };
    } catch (error) {
      this.results.deployment = {
        status: 'error',
        details: error.message,
        time: Date.now() - start
      };
    }
  }

  // ============= HELPER METHODS =============

  checkFileExists(filePath) {
    return fs.existsSync(path.join(__dirname, filePath));
  }

  async checkDatabaseConnection() {
    if (!process.env.DATABASE_URL) return false;
    try {
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return true;
    } catch (error) {
      return false;
    }
  }

  async waitForServer() {
    const port = process.env.PORT || 3001;
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        await this.makeRequest(`http://localhost:${port}/api/health`, 'GET');
        return;
      } catch (error) {
        attempts++;
        await this.sleep(500);
      }
    }
    throw new Error('Сервер не запустился в течение 15 секунд');
  }

  async makeRequest(url, method = 'GET', headers = {}, body = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: headers,
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  }

  async cleanup() {
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      await this.sleep(1000);
      if (!this.serverProcess.killed) {
        this.serverProcess.kill('SIGKILL');
      }
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStageDisplayName() {
    const names = {
      early: 'РАННЯЯ СТАДИЯ (Этапы 1-3)',
      feature: 'ФУНКЦИОНАЛЬНАЯ СТАДИЯ (Этапы 4-6)', 
      production: 'ПРОДАКШН СТАДИЯ (Этапы 7-10)'
    };
    return names[this.stage] || this.stage;
  }

  getStatusIcon(status) {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️ ';
      case 'error': return '❌';
      default: return '⏳';
    }
  }

  getActiveTests() {
    const stageTests = {
      early: ['database', 'server', 'staticFiles', 'healthEndpoint', 'environment', 'security', 'frontend'],
      feature: ['database', 'server', 'staticFiles', 'healthEndpoint', 'environment', 'security', 'frontend', 
                'authentication', 'tasksCrud', 'aiIntegration', 'fileSystem'],
      production: ['database', 'server', 'staticFiles', 'healthEndpoint', 'environment', 'security', 'frontend',
                   'authentication', 'tasksCrud', 'aiIntegration', 'fileSystem', 
                   'loadTesting', 'securityScan', 'deployment']
    };
    return stageTests[this.stage] || stageTests.early;
  }

  getOverallStatus() {
    const activeTests = this.getActiveTests();
    const statuses = activeTests.map(test => this.results[test]?.status).filter(Boolean);
    
    const errorCount = statuses.filter(s => s === 'error').length;
    const warningCount = statuses.filter(s => s === 'warning').length;
    
    if (errorCount > 2) return { icon: '🔴', text: 'КРИТИЧЕСКИЕ ПРОБЛЕМЫ' };
    if (errorCount > 0) return { icon: '🟡', text: 'ЕСТЬ ПРОБЛЕМЫ ДЛЯ ИСПРАВЛЕНИЯ' };
    if (warningCount > 1) return { icon: '🟡', text: 'В ОСНОВНОМ РАБОТАЕТ' };
    return { icon: '🟢', text: 'ВСЕ РАБОТАЕТ ОТЛИЧНО' };
  }

  printDetailedReport() {
    const stageEmoji = { early: '🔧', feature: '🚀', production: '🏭' };
    
    console.log(`\n${stageEmoji[this.stage]} ОТЧЕТ ПО ТЕСТИРОВАНИЮ ТУДУШКА - ${this.getStageDisplayName()}`);
    console.log('='.repeat(60) + '\n');

    // Group tests by category
    this.printTestCategory('ИНФРАСТРУКТУРА:', [
      'database', 'server', 'staticFiles', 'healthEndpoint', 'environment', 'security', 'frontend'
    ]);

    if (this.stage === 'feature' || this.stage === 'production') {
      this.printTestCategory('ФУНКЦИОНАЛЬНОСТЬ:', [
        'authentication', 'tasksCrud', 'aiIntegration', 'fileSystem'
      ]);
    }

    if (this.stage === 'production') {
      this.printTestCategory('ПРОДАКШН ГОТОВНОСТЬ:', [
        'loadTesting', 'securityScan', 'deployment'
      ]);
    }

    // Performance metrics
    console.log('\nМЕТРИКИ ПРОИЗВОДИТЕЛЬНОСТИ:');
    console.log(`- Время запуска сервера: ${(this.metrics.serverStartTime / 1000).toFixed(1)}с`);
    console.log(`- Время запроса к БД: ${this.metrics.dbResponseTime}мс`);
    console.log(`- Время ответа API: ${this.metrics.apiResponseTime}мс`);
    if (this.metrics.avgApiTime > 0) {
      console.log(`- Среднее время под нагрузкой: ${this.metrics.avgApiTime.toFixed(0)}мс`);
    }

    // Recommendations
    const recommendations = this.generateSmartRecommendations();
    if (recommendations.length > 0) {
      console.log('\nРЕКОМЕНДАЦИИ:');
      recommendations.forEach(rec => console.log(`🔧 ${rec}`));
    }

    // Overall status
    const overall = this.getOverallStatus();
    console.log(`\nОБЩИЙ СТАТУС: ${overall.icon} ${overall.text}`);
    
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`\nВремя выполнения тестов: ${totalTime}с`);
    console.log(`Тесты для стадии: ${this.getStageDisplayName()}`);

    // Progress indicator
    this.printProgressIndicator();

    // Exit with appropriate code
    const activeTests = this.getActiveTests();
    const errorCount = activeTests.filter(test => 
      this.results[test]?.status === 'error'
    ).length;
    process.exit(errorCount > 2 ? 1 : 0);
  }

  printTestCategory(title, tests) {
    console.log(title);
    tests.forEach(testName => {
      const result = this.results[testName];
      if (result && result.status !== 'pending') {
        const icon = this.getStatusIcon(result.status);
        const name = this.getTestDisplayName(testName);
        console.log(`${icon} ${name}: ${result.status.toUpperCase()} (${result.time}мс)`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
      }
    });
    console.log('');
  }

  printProgressIndicator() {
    const stages = ['early', 'feature', 'production'];
    const currentIndex = stages.indexOf(this.stage);
    
    console.log('\nПРОГРЕСС РАЗРАБОТКИ:');
    stages.forEach((stage, index) => {
      const emoji = index <= currentIndex ? '🟢' : '⚪';
      const name = this.getStageDisplayName().split(' (')[0];
      if (stage === this.stage) {
        console.log(`${emoji} ${this.getStageDisplayName()} ← ТЕКУЩАЯ СТАДИЯ`);
      } else {
        console.log(`${emoji} ${stage === 'early' ? 'РАННЯЯ СТАДИЯ' : 
                          stage === 'feature' ? 'ФУНКЦИОНАЛЬНАЯ СТАДИЯ' : 
                          'ПРОДАКШН СТАДИЯ'}`);
      }
    });
  }

  getTestDisplayName(testName) {
    const names = {
      database: 'Подключение к БД',
      server: 'Express сервер',
      staticFiles: 'Статические файлы',
      healthEndpoint: 'Health endpoint',
      environment: 'Окружение',
      security: 'Безопасность',
      frontend: 'Frontend файлы',
      authentication: 'Аутентификация',
      tasksCrud: 'CRUD задач',
      aiIntegration: 'AI интеграция',
      fileSystem: 'Файловая система',
      loadTesting: 'Нагрузочное тестирование',
      securityScan: 'Сканирование безопасности',
      deployment: 'Готовность к развертыванию'
    };
    return names[testName] || testName;
  }

  generateSmartRecommendations() {
    const recs = [];
    const activeTests = this.getActiveTests();
    
    // Early stage recommendations
    if (this.results.database?.status === 'error') {
      recs.push('Настроить подключение к PostgreSQL и DATABASE_URL');
    }
    if (this.results.database?.status === 'warning') {
      recs.push('Запустить миграции базы данных: npm run migrate');
    }
    if (this.results.environment?.status === 'warning') {
      recs.push('Создать .env файл и установить недостающие переменные');
    }
    
    // Feature stage recommendations
    if (this.stage === 'feature' || this.stage === 'production') {
      if (this.results.authentication?.status === 'error') {
        recs.push('Реализовать authentication endpoints в routes/auth.js');
      }
      if (this.results.aiIntegration?.status === 'warning') {
        recs.push('Установить PERPLEXITY_API_KEY для AI функций');
      }
      if (this.results.fileSystem?.status === 'warning') {
        recs.push('Установить TELEGRAM_BOT_TOKEN для файловой системы');
      }
    }
    
    // Production stage recommendations
    if (this.stage === 'production') {
      if (this.results.securityScan?.status !== 'success') {
        recs.push('Усилить меры безопасности перед продакшн развертыванием');
      }
      if (this.results.deployment?.status !== 'success') {
        recs.push('Настроить продакшн окружение (HTTPS, домен, БД)');
      }
    }
    
    // Stage progression recommendations
    if (this.stage === 'early' && this.getOverallStatus().icon === '🟢') {
      recs.push('🎉 Готов к переходу на функциональную стадию! Начинайте реализацию features');
    }
    if (this.stage === 'feature' && this.getOverallStatus().icon === '🟢') {
      recs.push('🎉 Готов к продакшн стадии! Настройте production окружение');
    }
    
    return recs.slice(0, 5); // Limit to 5 most important recommendations
  }
}

// Run tests
if (require.main === module) {
  const tester = new UniversalTudushkaTest();
  tester.run().catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = UniversalTudushkaTest;