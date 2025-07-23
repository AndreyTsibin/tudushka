require('dotenv').config();
const { Pool } = require('pg');

class Database {
    constructor() {
        this.pool = null;
        this.init();
    }

    init() {
        const config = {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false,
            max: 20, // maximum number of clients in pool
            idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
            connectionTimeoutMillis: 2000, // how long to wait when connecting
        };

        this.pool = new Pool(config);

        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('PostgreSQL pool error:', err);
        });

        // Handle pool connection
        this.pool.on('connect', () => {
            console.log('PostgreSQL client connected');
        });

        // Handle pool disconnection
        this.pool.on('remove', () => {
            console.log('PostgreSQL client removed');
        });
    }

    async query(text, params) {
        const client = await this.pool.connect();
        try {
            const start = Date.now();
            const result = await client.query(text, params);
            const duration = Date.now() - start;
            
            if (process.env.NODE_ENV === 'development') {
                console.log('Query executed:', { text, duration, rows: result.rowCount });
            }
            
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Transaction error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async testConnection() {
        try {
            const result = await this.query('SELECT NOW() as current_time');
            console.log('Database connection successful:', result.rows[0].current_time);
            return true;
        } catch (error) {
            console.error('Database connection failed:', error.message);
            return false;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Database pool closed');
        }
    }
}

const db = new Database();

module.exports = db;