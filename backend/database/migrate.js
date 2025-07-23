const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');

class MigrationRunner {
    constructor() {
        this.migrationsDir = path.join(__dirname, 'migrations');
        this.historyTable = 'migrations_history';
    }

    async init() {
        // Create migrations history table if it doesn't exist
        const createHistoryTable = `
            CREATE TABLE IF NOT EXISTS ${this.historyTable} (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT NOW(),
                checksum VARCHAR(64) NOT NULL
            );
        `;
        
        await db.query(createHistoryTable);
        console.log('Migrations history table initialized');
    }

    async getAppliedMigrations() {
        const result = await db.query(
            `SELECT filename FROM ${this.historyTable} ORDER BY filename`
        );
        return result.rows.map(row => row.filename);
    }

    async getMigrationFiles() {
        try {
            const files = await fs.readdir(this.migrationsDir);
            return files
                .filter(file => file.endsWith('.sql'))
                .sort();
        } catch (error) {
            console.error('Error reading migrations directory:', error);
            return [];
        }
    }

    async readMigrationFile(filename) {
        const filePath = path.join(this.migrationsDir, filename);
        return await fs.readFile(filePath, 'utf8');
    }

    calculateChecksum(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    async executeMigration(filename, content) {
        return await db.transaction(async (client) => {
            // Remove ROLLBACK section before executing
            const rollbackIndex = content.indexOf('-- ROLLBACK');
            const cleanContent = rollbackIndex !== -1 ? content.substring(0, rollbackIndex).trim() : content;
            
            // Split content into statements, handling dollar-quoted strings and functions
            const statements = this.parseSQL(cleanContent);

            for (const statement of statements) {
                if (statement.trim().length > 0) {
                    await client.query(statement);
                }
            }

            // Record migration in history
            const checksum = this.calculateChecksum(content);
            await client.query(
                `INSERT INTO ${this.historyTable} (filename, checksum) VALUES ($1, $2)`,
                [filename, checksum]
            );

            console.log(`✓ Applied migration: ${filename}`);
        });
    }

    parseSQL(content) {
        const statements = [];
        let current = '';
        let inDollarQuote = null;
        let dollarTag = '';
        let i = 0;

        while (i < content.length) {
            const char = content[i];
            
            if (inDollarQuote) {
                // We're inside a dollar-quoted string
                current += char;
                
                // Check if we're at the end of the dollar quote
                if (char === '$' && content.substring(i).startsWith(dollarTag)) {
                    current += content.substring(i + 1, i + dollarTag.length);
                    i += dollarTag.length;
                    inDollarQuote = null;
                    dollarTag = '';
                } else {
                    i++;
                }
            } else if (char === '$') {
                // Potential start of dollar quote
                const match = content.substring(i).match(/^\$([^$]*)\$/);
                if (match) {
                    dollarTag = match[0];
                    inDollarQuote = true;
                    current += dollarTag;
                    i += dollarTag.length;
                } else {
                    current += char;
                    i++;
                }
            } else if (char === ';' && !inDollarQuote) {
                // End of statement (only if not in dollar quote)
                if (current.trim().length > 0) {
                    statements.push(current.trim());
                }
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        // Add the last statement if it exists
        if (current.trim().length > 0) {
            statements.push(current.trim());
        }
        
        return statements;
    }

    async validateMigration(filename, content) {
        const checksum = this.calculateChecksum(content);
        const result = await db.query(
            `SELECT checksum FROM ${this.historyTable} WHERE filename = $1`,
            [filename]
        );

        if (result.rows.length > 0) {
            const storedChecksum = result.rows[0].checksum;
            if (storedChecksum !== checksum) {
                throw new Error(
                    `Migration ${filename} has been modified after being applied. ` +
                    `Stored checksum: ${storedChecksum}, Current checksum: ${checksum}`
                );
            }
        }
    }

    async run() {
        try {
            console.log('Starting database migrations...');
            
            await this.init();
            
            const appliedMigrations = await this.getAppliedMigrations();
            const migrationFiles = await this.getMigrationFiles();
            
            console.log(`Found ${migrationFiles.length} migration files`);
            console.log(`${appliedMigrations.length} migrations already applied`);
            
            let appliedCount = 0;
            
            for (const filename of migrationFiles) {
                const content = await this.readMigrationFile(filename);
                
                if (appliedMigrations.includes(filename)) {
                    // Validate existing migration hasn't changed
                    await this.validateMigration(filename, content);
                    console.log(`- Skipped (already applied): ${filename}`);
                } else {
                    // Apply new migration
                    await this.executeMigration(filename, content);
                    appliedCount++;
                }
            }
            
            console.log(`\nMigrations completed successfully!`);
            console.log(`Applied ${appliedCount} new migrations`);
            
        } catch (error) {
            console.error('Migration failed:', error.message);
            throw error;
        }
    }

    async rollback(targetMigration = null) {
        try {
            console.log('Starting migration rollback...');
            
            const appliedMigrations = await this.getAppliedMigrations();
            
            if (appliedMigrations.length === 0) {
                console.log('No migrations to rollback');
                return;
            }
            
            let migrationsToRollback;
            if (targetMigration) {
                const targetIndex = appliedMigrations.indexOf(targetMigration);
                if (targetIndex === -1) {
                    throw new Error(`Migration ${targetMigration} not found in applied migrations`);
                }
                migrationsToRollback = appliedMigrations.slice(targetIndex + 1).reverse();
            } else {
                // Rollback last migration only
                migrationsToRollback = [appliedMigrations[appliedMigrations.length - 1]];
            }
            
            for (const filename of migrationsToRollback) {
                const content = await this.readMigrationFile(filename);
                
                // Look for rollback section in migration file
                const rollbackMatch = content.match(/-- ROLLBACK\s*\n([\s\S]*?)(?=-- ROLLBACK END|\n-- |$)/i);
                
                if (!rollbackMatch) {
                    console.warn(`No rollback section found in ${filename}, skipping...`);
                    continue;
                }
                
                const rollbackSQL = rollbackMatch[1].trim();
                
                await db.transaction(async (client) => {
                    // Execute rollback statements
                    const statements = rollbackSQL
                        .split(';')
                        .map(stmt => stmt.trim())
                        .filter(stmt => stmt.length > 0);

                    for (const statement of statements) {
                        await client.query(statement);
                    }
                    
                    // Remove from history
                    await client.query(
                        `DELETE FROM ${this.historyTable} WHERE filename = $1`,
                        [filename]
                    );
                    
                    console.log(`✓ Rolled back migration: ${filename}`);
                });
            }
            
            console.log('Rollback completed successfully!');
            
        } catch (error) {
            console.error('Rollback failed:', error.message);
            throw error;
        }
    }

    async status() {
        const appliedMigrations = await this.getAppliedMigrations();
        const migrationFiles = await this.getMigrationFiles();
        
        console.log('\nMigration Status:');
        console.log('=================');
        
        for (const filename of migrationFiles) {
            const status = appliedMigrations.includes(filename) ? '✓ Applied' : '✗ Pending';
            console.log(`${status} ${filename}`);
        }
        
        console.log(`\nTotal: ${migrationFiles.length} migrations`);
        console.log(`Applied: ${appliedMigrations.length}`);
        console.log(`Pending: ${migrationFiles.length - appliedMigrations.length}`);
    }
}

// CLI interface
if (require.main === module) {
    const runner = new MigrationRunner();
    const command = process.argv[2];
    
    (async () => {
        try {
            switch (command) {
                case 'run':
                case 'up':
                    await runner.run();
                    break;
                case 'rollback':
                case 'down':
                    const target = process.argv[3];
                    await runner.rollback(target);
                    break;
                case 'status':
                    await runner.status();
                    break;
                default:
                    console.log(`
Usage: node migrate.js <command>

Commands:
  run, up          Apply pending migrations
  rollback, down   Rollback last migration (or specify target)
  status           Show migration status

Examples:
  node migrate.js run
  node migrate.js rollback
  node migrate.js rollback 001_create_users_table.sql
  node migrate.js status
                    `);
            }
        } catch (error) {
            console.error('Migration runner error:', error);
            process.exit(1);
        } finally {
            await db.close();
        }
    })();
}

module.exports = MigrationRunner;