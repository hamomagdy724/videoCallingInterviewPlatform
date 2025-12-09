import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('ENV Configuration', () => {
    let originalEnv;

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env };
        // Clear the module cache to force re-import
        jest.resetModules();
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('Environment Variable Loading', () => {
        it('should load PORT from environment variables', async () => {
            process.env.PORT = '3000';
            const { ENV } = await import('../env.js');
            expect(ENV.PORT).toBe('3000');
        });

        it('should load DB_URL from environment variables', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/testdb';
            const { ENV } = await import('../env.js');
            expect(ENV.DB_URL).toBe('mongodb://localhost:27017/testdb');
        });

        it('should load NODE_ENV from environment variables', async () => {
            process.env.NODE_ENV = 'production';
            const { ENV } = await import('../env.js');
            expect(ENV.NODE_ENV).toBe('production');
        });

        it('should handle all environment variables together', async () => {
            process.env.PORT = '8080';
            process.env.DB_URL = 'mongodb://prod-server:27017/proddb';
            process.env.NODE_ENV = 'production';
            
            const { ENV } = await import('../env.js');
            
            expect(ENV.PORT).toBe('8080');
            expect(ENV.DB_URL).toBe('mongodb://prod-server:27017/proddb');
            expect(ENV.NODE_ENV).toBe('production');
        });
    });

    describe('Edge Cases and Missing Variables', () => {
        it('should handle undefined PORT', async () => {
            delete process.env.PORT;
            const { ENV } = await import('../env.js');
            expect(ENV.PORT).toBeUndefined();
        });

        it('should handle undefined DB_URL', async () => {
            delete process.env.DB_URL;
            const { ENV } = await import('../env.js');
            expect(ENV.DB_URL).toBeUndefined();
        });

        it('should handle undefined NODE_ENV', async () => {
            delete process.env.NODE_ENV;
            const { ENV } = await import('../env.js');
            expect(ENV.NODE_ENV).toBeUndefined();
        });

        it('should handle empty string values', async () => {
            process.env.PORT = '';
            process.env.DB_URL = '';
            process.env.NODE_ENV = '';
            
            const { ENV } = await import('../env.js');
            
            expect(ENV.PORT).toBe('');
            expect(ENV.DB_URL).toBe('');
            expect(ENV.NODE_ENV).toBe('');
        });

        it('should handle whitespace in environment variables', async () => {
            process.env.PORT = '  3000  ';
            process.env.DB_URL = '  mongodb://localhost  ';
            
            const { ENV } = await import('../env.js');
            
            expect(ENV.PORT).toBe('  3000  ');
            expect(ENV.DB_URL).toBe('  mongodb://localhost  ');
        });
    });

    describe('Different Environment Modes', () => {
        it('should work in development mode', async () => {
            process.env.NODE_ENV = 'development';
            process.env.PORT = '3000';
            process.env.DB_URL = 'mongodb://localhost:27017/devdb';
            
            const { ENV } = await import('../env.js');
            
            expect(ENV.NODE_ENV).toBe('development');
            expect(ENV.PORT).toBe('3000');
            expect(ENV.DB_URL).toBe('mongodb://localhost:27017/devdb');
        });

        it('should work in test mode', async () => {
            process.env.NODE_ENV = 'test';
            process.env.PORT = '3001';
            process.env.DB_URL = 'mongodb://localhost:27017/testdb';
            
            const { ENV } = await import('../env.js');
            
            expect(ENV.NODE_ENV).toBe('test');
            expect(ENV.PORT).toBe('3001');
            expect(ENV.DB_URL).toBe('mongodb://localhost:27017/testdb');
        });

        it('should work in production mode', async () => {
            process.env.NODE_ENV = 'production';
            process.env.PORT = '8080';
            process.env.DB_URL = 'mongodb://prod-server:27017/proddb';
            
            const { ENV } = await import('../env.js');
            
            expect(ENV.NODE_ENV).toBe('production');
            expect(ENV.PORT).toBe('8080');
            expect(ENV.DB_URL).toBe('mongodb://prod-server:27017/proddb');
        });
    });

    describe('ENV Object Structure', () => {
        it('should export an object with correct keys', async () => {
            const { ENV } = await import('../env.js');
            
            expect(ENV).toBeDefined();
            expect(typeof ENV).toBe('object');
            expect(Object.keys(ENV)).toContain('PORT');
            expect(Object.keys(ENV)).toContain('DB_URL');
            expect(Object.keys(ENV)).toContain('NODE_ENV');
        });

        it('should have exactly three keys', async () => {
            const { ENV } = await import('../env.js');
            expect(Object.keys(ENV).length).toBe(3);
        });

        it('should not be null or undefined', async () => {
            const { ENV } = await import('../env.js');
            expect(ENV).not.toBeNull();
            expect(ENV).not.toBeUndefined();
        });
    });

    describe('Special Characters and Format Validation', () => {
        it('should handle numeric PORT values', async () => {
            process.env.PORT = '8080';
            const { ENV } = await import('../env.js');
            expect(ENV.PORT).toBe('8080');
            expect(typeof ENV.PORT).toBe('string');
        });

        it('should handle complex MongoDB connection strings', async () => {
            const complexUrl = 'mongodb://user:password@host1:27017,host2:27017/database?replicaSet=rs0&authSource=admin';
            process.env.DB_URL = complexUrl;
            
            const { ENV } = await import('../env.js');
            expect(ENV.DB_URL).toBe(complexUrl);
        });

        it('should handle DB_URL with special characters', async () => {
            process.env.DB_URL = 'mongodb://user:p@ssw0rd!@localhost:27017/db';
            const { ENV } = await import('../env.js');
            expect(ENV.DB_URL).toBe('mongodb://user:p@ssw0rd!@localhost:27017/db');
        });

        it('should handle various NODE_ENV values', async () => {
            const envModes = ['development', 'production', 'test', 'staging', 'local'];
            
            for (const mode of envModes) {
                process.env.NODE_ENV = mode;
                jest.resetModules();
                const { ENV } = await import('../env.js');
                expect(ENV.NODE_ENV).toBe(mode);
            }
        });
    });
});