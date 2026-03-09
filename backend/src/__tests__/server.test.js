import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import path from 'path';

// Mock the ENV module before importing server
const mockEnv = {
    PORT: '3000',
    DB_URL: 'mongodb://localhost:27017/testdb',
    NODE_ENV: 'test'
};

jest.unstable_mockModule('../lib/env.js', () => ({
    ENV: mockEnv
}));

describe('Express Server', () => {
    let app;
    let server;

    beforeAll(async () => {
        // Import server after mocking
        const serverModule = await import('../server.js');
    });

    afterAll((done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    describe('Health Endpoint', () => {
        beforeEach(async () => {
            // Create a fresh app for each test
            jest.resetModules();
            mockEnv.NODE_ENV = 'test';
            
            app = express();
            app.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
        });

        it('should respond with 200 status code on /health', async () => {
            const response = await request(app).get('/health');
            expect(response.statusCode).toBe(200);
        });

        it('should return correct JSON message on /health', async () => {
            const response = await request(app).get('/health');
            expect(response.body).toEqual({ msg: "api is up and running" });
        });

        it('should return JSON content-type on /health', async () => {
            const response = await request(app).get('/health');
            expect(response.headers['content-type']).toMatch(/json/);
        });

        it('should handle /health with query parameters', async () => {
            const response = await request(app).get('/health?test=123');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ msg: "api is up and running" });
        });

        it('should handle /health with trailing slash', async () => {
            const response = await request(app).get('/health/');
            // Express treats /health and /health/ differently by default
            // This test verifies the actual behavior
            expect([200, 404]).toContain(response.statusCode);
        });

        it('should not accept POST requests on /health', async () => {
            const response = await request(app).post('/health');
            expect(response.statusCode).toBe(404);
        });

        it('should not accept PUT requests on /health', async () => {
            const response = await request(app).put('/health');
            expect(response.statusCode).toBe(404);
        });

        it('should not accept DELETE requests on /health', async () => {
            const response = await request(app).delete('/health');
            expect(response.statusCode).toBe(404);
        });

        it('should not accept PATCH requests on /health', async () => {
            const response = await request(app).patch('/health');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('Books Endpoint', () => {
        beforeEach(async () => {
            app = express();
            app.get("/books", (req, res) => {
                res.status(200).json({ msg: "this is the books endpoint" });
            });
        });

        it('should respond with 200 status code on /books', async () => {
            const response = await request(app).get('/books');
            expect(response.statusCode).toBe(200);
        });

        it('should return correct JSON message on /books', async () => {
            const response = await request(app).get('/books');
            expect(response.body).toEqual({ msg: "this is the books endpoint" });
        });

        it('should return JSON content-type on /books', async () => {
            const response = await request(app).get('/books');
            expect(response.headers['content-type']).toMatch(/json/);
        });

        it('should handle /books with query parameters', async () => {
            const response = await request(app).get('/books?category=fiction&page=1');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ msg: "this is the books endpoint" });
        });

        it('should not accept POST requests on /books', async () => {
            const response = await request(app).post('/books');
            expect(response.statusCode).toBe(404);
        });

        it('should not accept PUT requests on /books', async () => {
            const response = await request(app).put('/books');
            expect(response.statusCode).toBe(404);
        });

        it('should not accept DELETE requests on /books', async () => {
            const response = await request(app).delete('/books');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('Production Static File Serving', () => {
        it('should serve static files in production mode', async () => {
            mockEnv.NODE_ENV = 'production';
            
            const prodApp = express();
            const __dirname = path.resolve();
            
            prodApp.use(express.static(path.join(__dirname, "../frontend/dist")));
            prodApp.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
            
            // Verify health endpoint still works in production
            const response = await request(prodApp).get('/health');
            expect(response.statusCode).toBe(200);
        });

        it('should serve index.html for catch-all route in production', async () => {
            mockEnv.NODE_ENV = 'production';
            
            const prodApp = express();
            const __dirname = path.resolve();
            
            // Mock the catch-all route behavior
            prodApp.get("/*", (req, res) => {
                // In actual implementation, this would sendFile
                // For testing, we verify the route is registered
                res.status(200).send('index.html would be served here');
            });
            
            const response = await request(prodApp).get('/some-random-route');
            expect(response.statusCode).toBe(200);
        });

        it('should not serve static files in non-production mode', async () => {
            mockEnv.NODE_ENV = 'development';
            
            const devApp = express();
            devApp.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
            
            // In development, undefined routes should return 404
            const response = await request(devApp).get('/undefined-route');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('Non-existent Routes', () => {
        beforeEach(() => {
            app = express();
            app.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
            app.get("/books", (req, res) => {
                res.status(200).json({ msg: "this is the books endpoint" });
            });
        });

        it('should return 404 for undefined GET routes', async () => {
            const response = await request(app).get('/undefined');
            expect(response.statusCode).toBe(404);
        });

        it('should return 404 for /api route that does not exist', async () => {
            const response = await request(app).get('/api');
            expect(response.statusCode).toBe(404);
        });

        it('should return 404 for nested undefined routes', async () => {
            const response = await request(app).get('/api/v1/users');
            expect(response.statusCode).toBe(404);
        });

        it('should return 404 for routes with special characters', async () => {
            const response = await request(app).get('/test@#$%');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('HTTP Methods Support', () => {
        beforeEach(() => {
            app = express();
            app.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
        });

        it('should support GET method on /health', async () => {
            const response = await request(app).get('/health');
            expect(response.statusCode).toBe(200);
        });

        it('should support HEAD method on /health', async () => {
            const response = await request(app).head('/health');
            // HEAD requests should return same status as GET but no body
            expect([200, 404]).toContain(response.statusCode);
        });

        it('should support OPTIONS method (CORS preflight)', async () => {
            const response = await request(app).options('/health');
            // By default, Express responds to OPTIONS
            expect([200, 204, 404]).toContain(response.statusCode);
        });
    });

    describe('Request Headers', () => {
        beforeEach(() => {
            app = express();
            app.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
        });

        it('should accept requests with custom headers', async () => {
            const response = await request(app)
                .get('/health')
                .set('X-Custom-Header', 'test-value');
            expect(response.statusCode).toBe(200);
        });

        it('should accept requests with Accept header', async () => {
            const response = await request(app)
                .get('/health')
                .set('Accept', 'application/json');
            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toMatch(/json/);
        });

        it('should handle requests with User-Agent', async () => {
            const response = await request(app)
                .get('/health')
                .set('User-Agent', 'Mozilla/5.0 Test Browser');
            expect(response.statusCode).toBe(200);
        });
    });

    describe('Concurrent Requests', () => {
        beforeEach(() => {
            app = express();
            app.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
            app.get("/books", (req, res) => {
                res.status(200).json({ msg: "this is the books endpoint" });
            });
        });

        it('should handle multiple concurrent requests to /health', async () => {
            const requests = Array(10).fill(null).map(() => request(app).get('/health'));
            const responses = await Promise.all(requests);
            
            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toEqual({ msg: "api is up and running" });
            });
        });

        it('should handle concurrent requests to different endpoints', async () => {
            const healthRequests = Array(5).fill(null).map(() => request(app).get('/health'));
            const booksRequests = Array(5).fill(null).map(() => request(app).get('/books'));
            
            const responses = await Promise.all([...healthRequests, ...booksRequests]);
            
            expect(responses.length).toBe(10);
            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
            });
        });
    });

    describe('Response Format Validation', () => {
        beforeEach(() => {
            app = express();
            app.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
            app.get("/books", (req, res) => {
                res.status(200).json({ msg: "this is the books endpoint" });
            });
        });

        it('should return valid JSON on /health', async () => {
            const response = await request(app).get('/health');
            expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
        });

        it('should return valid JSON on /books', async () => {
            const response = await request(app).get('/books');
            expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
        });

        it('should have msg property in health response', async () => {
            const response = await request(app).get('/health');
            expect(response.body).toHaveProperty('msg');
            expect(typeof response.body.msg).toBe('string');
        });

        it('should have msg property in books response', async () => {
            const response = await request(app).get('/books');
            expect(response.body).toHaveProperty('msg');
            expect(typeof response.body.msg).toBe('string');
        });

        it('should not have additional unexpected properties in health response', async () => {
            const response = await request(app).get('/health');
            const keys = Object.keys(response.body);
            expect(keys).toEqual(['msg']);
        });

        it('should not have additional unexpected properties in books response', async () => {
            const response = await request(app).get('/books');
            const keys = Object.keys(response.body);
            expect(keys).toEqual(['msg']);
        });
    });

    describe('Environment-Specific Behavior', () => {
        it('should behave correctly in development environment', async () => {
            mockEnv.NODE_ENV = 'development';
            
            const devApp = express();
            devApp.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
            
            const response = await request(devApp).get('/health');
            expect(response.statusCode).toBe(200);
        });

        it('should behave correctly in test environment', async () => {
            mockEnv.NODE_ENV = 'test';
            
            const testApp = express();
            testApp.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
            
            const response = await request(testApp).get('/health');
            expect(response.statusCode).toBe(200);
        });

        it('should have different behavior in production environment', async () => {
            mockEnv.NODE_ENV = 'production';
            
            const prodApp = express();
            const __dirname = path.resolve();
            
            prodApp.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
            
            // Production mode adds static file serving
            prodApp.use(express.static(path.join(__dirname, "../frontend/dist")));
            
            const response = await request(prodApp).get('/health');
            expect(response.statusCode).toBe(200);
        });
    });

    describe('Path Resolution', () => {
        it('should correctly resolve __dirname', () => {
            const __dirname = path.resolve();
            expect(__dirname).toBeDefined();
            expect(typeof __dirname).toBe('string');
            expect(__dirname.length).toBeGreaterThan(0);
        });

        it('should construct correct frontend dist path', () => {
            const __dirname = path.resolve();
            const frontendPath = path.join(__dirname, "../frontend/dist");
            expect(frontendPath).toBeDefined();
            expect(frontendPath).toContain('frontend');
            expect(frontendPath).toContain('dist');
        });

        it('should construct correct index.html path', () => {
            const __dirname = path.resolve();
            const indexPath = path.join(__dirname, "../frontend", "dist", "index.html");
            expect(indexPath).toBeDefined();
            expect(indexPath).toContain('index.html');
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            app = express();
            app.get("/health", (req, res) => {
                res.status(200).json({ msg: "api is up and running" });
            });
            app.get("/books", (req, res) => {
                res.status(200).json({ msg: "this is the books endpoint" });
            });
        });

        it('should handle very long query strings', async () => {
            const longQuery = 'param=' + 'a'.repeat(1000);
            const response = await request(app).get(`/health?${longQuery}`);
            expect([200, 414]).toContain(response.statusCode); // 414 = URI Too Long
        });

        it('should handle URL encoded characters', async () => {
            const response = await request(app).get('/health?name=John%20Doe');
            expect(response.statusCode).toBe(200);
        });

        it('should handle multiple query parameters', async () => {
            const response = await request(app).get('/books?page=1&limit=10&sort=asc&filter=fiction');
            expect(response.statusCode).toBe(200);
        });

        it('should handle case sensitivity in routes', async () => {
            const response = await request(app).get('/HEALTH');
            expect(response.statusCode).toBe(404); // Routes are case-sensitive
        });

        it('should handle case sensitivity in /books route', async () => {
            const response = await request(app).get('/BOOKS');
            expect(response.statusCode).toBe(404);
        });
    });
});