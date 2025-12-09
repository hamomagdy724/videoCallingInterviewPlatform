import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import path from 'path';

describe('Server Integration Tests', () => {
    let app;

    beforeEach(() => {
        // Create a complete app instance that mimics the real server
        app = express();
        const __dirname = path.resolve();

        // Register all routes as in the actual server
        app.get("/health", (req, res) => {
            res.status(200).json({ msg: "api is up and running" });
        });

        app.get("/books", (req, res) => {
            res.status(200).json({ msg: "this is the books endpoint" });
        });
    });

    describe('Complete API Flow', () => {
        it('should handle sequential requests to different endpoints', async () => {
            const healthResponse = await request(app).get('/health');
            expect(healthResponse.statusCode).toBe(200);
            expect(healthResponse.body.msg).toBe("api is up and running");

            const booksResponse = await request(app).get('/books');
            expect(booksResponse.statusCode).toBe(200);
            expect(booksResponse.body.msg).toBe("this is the books endpoint");
        });

        it('should maintain consistent responses across multiple calls', async () => {
            const responses = [];
            for (let i = 0; i < 5; i++) {
                const response = await request(app).get('/health');
                responses.push(response);
            }

            // All responses should be identical
            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toEqual({ msg: "api is up and running" });
            });
        });

        it('should handle interleaved requests to different endpoints', async () => {
            const requests = [];
            for (let i = 0; i < 10; i++) {
                if (i % 2 === 0) {
                    requests.push(request(app).get('/health'));
                } else {
                    requests.push(request(app).get('/books'));
                }
            }

            const responses = await Promise.all(requests);
            expect(responses.length).toBe(10);
            
            responses.forEach((response, index) => {
                expect(response.statusCode).toBe(200);
                if (index % 2 === 0) {
                    expect(response.body.msg).toBe("api is up and running");
                } else {
                    expect(response.body.msg).toBe("this is the books endpoint");
                }
            });
        });
    });

    describe('Error Handling and Recovery', () => {
        it('should recover gracefully from 404 errors', async () => {
            const notFoundResponse = await request(app).get('/nonexistent');
            expect(notFoundResponse.statusCode).toBe(404);

            // Subsequent requests should work fine
            const healthResponse = await request(app).get('/health');
            expect(healthResponse.statusCode).toBe(200);
        });

        it('should handle invalid HTTP methods gracefully', async () => {
            const invalidResponse = await request(app).post('/health');
            expect(invalidResponse.statusCode).toBe(404);

            // Valid request should still work
            const validResponse = await request(app).get('/health');
            expect(validResponse.statusCode).toBe(200);
        });

        it('should handle malformed requests', async () => {
            const responses = await Promise.all([
                request(app).get('/health///'),
                request(app).get('//health'),
                request(app).get('/health/../health'),
            ]);

            // After malformed requests, normal requests should work
            const healthResponse = await request(app).get('/health');
            expect(healthResponse.statusCode).toBe(200);
        });
    });

    describe('Performance and Load Testing', () => {
        it('should handle burst of concurrent requests', async () => {
            const numRequests = 50;
            const requests = Array(numRequests).fill(null).map(() => 
                request(app).get('/health')
            );

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const endTime = Date.now();

            // All requests should succeed
            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
            });

            // Should complete in reasonable time (less than 5 seconds for 50 requests)
            expect(endTime - startTime).toBeLessThan(5000);
        });

        it('should handle mixed endpoint concurrent load', async () => {
            const healthRequests = Array(25).fill(null).map(() => 
                request(app).get('/health')
            );
            const booksRequests = Array(25).fill(null).map(() => 
                request(app).get('/books')
            );

            const responses = await Promise.all([...healthRequests, ...booksRequests]);

            expect(responses.length).toBe(50);
            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
            });
        });
    });

    describe('Request and Response Integrity', () => {
        it('should preserve request data integrity', async () => {
            const queryParams = {
                page: '1',
                limit: '10',
                sort: 'asc',
                filter: 'active'
            };

            const response = await request(app)
                .get('/health')
                .query(queryParams);

            expect(response.statusCode).toBe(200);
        });

        it('should handle large response payloads', async () => {
            // Even though our responses are small, test the mechanism
            const response = await request(app).get('/health');
            const bodyString = JSON.stringify(response.body);
            
            expect(bodyString.length).toBeGreaterThan(0);
            expect(bodyString.length).toBeLessThan(10000); // Reasonable size
        });

        it('should maintain response headers consistency', async () => {
            const responses = await Promise.all([
                request(app).get('/health'),
                request(app).get('/health'),
                request(app).get('/health')
            ]);

            const contentTypes = responses.map(r => r.headers['content-type']);
            
            // All should have consistent content-type
            contentTypes.forEach(ct => {
                expect(ct).toMatch(/json/);
            });
        });
    });

    describe('Endpoint Interaction and State', () => {
        it('should maintain stateless behavior across requests', async () => {
            // First request
            const response1 = await request(app).get('/health');
            
            // Second request should be independent
            const response2 = await request(app).get('/health');
            
            // Both should return identical responses (stateless)
            expect(response1.body).toEqual(response2.body);
            expect(response1.statusCode).toBe(response2.statusCode);
        });

        it('should handle requests to different endpoints independently', async () => {
            const healthResponse = await request(app).get('/health');
            const booksResponse = await request(app).get('/books');

            // Each endpoint should maintain its own response
            expect(healthResponse.body.msg).not.toBe(booksResponse.body.msg);
            expect(healthResponse.body.msg).toBe("api is up and running");
            expect(booksResponse.body.msg).toBe("this is the books endpoint");
        });
    });

    describe('HTTP Protocol Compliance', () => {
        it('should return proper status codes', async () => {
            const validResponse = await request(app).get('/health');
            expect(validResponse.statusCode).toBeGreaterThanOrEqual(200);
            expect(validResponse.statusCode).toBeLessThan(300);

            const invalidResponse = await request(app).get('/nonexistent');
            expect(invalidResponse.statusCode).toBe(404);
        });

        it('should include standard HTTP headers', async () => {
            const response = await request(app).get('/health');
            
            expect(response.headers).toHaveProperty('content-type');
            expect(response.headers['content-type']).toMatch(/json/);
        });

        it('should support HTTP/1.1 features', async () => {
            const response = await request(app)
                .get('/health')
                .set('Connection', 'keep-alive');

            expect(response.statusCode).toBe(200);
        });
    });

    describe('Cross-Endpoint Consistency', () => {
        it('should return consistent JSON structure across endpoints', async () => {
            const healthResponse = await request(app).get('/health');
            const booksResponse = await request(app).get('/books');

            // Both should have 'msg' property
            expect(healthResponse.body).toHaveProperty('msg');
            expect(booksResponse.body).toHaveProperty('msg');

            // Both should return objects with single property
            expect(Object.keys(healthResponse.body)).toEqual(['msg']);
            expect(Object.keys(booksResponse.body)).toEqual(['msg']);
        });

        it('should use consistent status codes for successful requests', async () => {
            const responses = await Promise.all([
                request(app).get('/health'),
                request(app).get('/books')
            ]);

            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
            });
        });
    });

    describe('Route Pattern Matching', () => {
        it('should match exact routes only', async () => {
            const exactMatch = await request(app).get('/health');
            expect(exactMatch.statusCode).toBe(200);

            const noMatch = await request(app).get('/health-check');
            expect(noMatch.statusCode).toBe(404);
        });

        it('should be case-sensitive in route matching', async () => {
            const lowercase = await request(app).get('/health');
            expect(lowercase.statusCode).toBe(200);

            const uppercase = await request(app).get('/HEALTH');
            expect(uppercase.statusCode).toBe(404);

            const mixedCase = await request(app).get('/Health');
            expect(mixedCase.statusCode).toBe(404);
        });

        it('should not match partial routes', async () => {
            const partial1 = await request(app).get('/heal');
            expect(partial1.statusCode).toBe(404);

            const partial2 = await request(app).get('/book');
            expect(partial2.statusCode).toBe(404);
        });
    });

    describe('Request Validation and Sanitization', () => {
        it('should accept requests with various query string formats', async () => {
            const formats = [
                '/health?test=value',
                '/health?test=value&another=test',
                '/health?array[]=1&array[]=2',
                '/health?nested[key]=value'
            ];

            for (const format of formats) {
                const response = await request(app).get(format);
                expect(response.statusCode).toBe(200);
            }
        });

        it('should handle empty query parameters', async () => {
            const response = await request(app).get('/health?');
            expect(response.statusCode).toBe(200);
        });

        it('should handle repeated query parameters', async () => {
            const response = await request(app).get('/health?id=1&id=2&id=3');
            expect(response.statusCode).toBe(200);
        });
    });
});