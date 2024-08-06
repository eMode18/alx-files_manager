
const request = require('supertest');
const app = require('../app');

describe('Endpoints', () => {
    let token;

    beforeAll(async () => {
        const res = await request(app)
            .get('/connect')
            .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=');
        token = res.body.token;
    });

    it('GET /status should return status', async () => {
        const res = await request(app).get('/status');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('redis');
        expect(res.body).toHaveProperty('db');
    });

    it('GET /stats should return stats', async () => {
        const res = await request(app).get('/stats');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('users');
        expect(res.body).toHaveProperty('files');
    });

    it('POST /users should create a user', async () => {
        const res = await request(app)
            .post('/users')
            .send({ email: 'test@example.com', password: 'password' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email');
    });

    it('GET /connect should authenticate user', async () => {
        const res = await request(app)
            .get('/connect')
            .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('GET /disconnect should log out user', async () => {
        const res = await request(app)
            .get('/disconnect')
            .set('X-Token', token);
        expect(res.statusCode).toBe(204);
    });

    it('GET /users/me should return user info', async () => {
        const res = await request(app)
            .get('/users/me')
            .set('X-Token', token);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email');
    });

    it('POST /files should upload a file', async () => {
        const res = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64'),
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('name');
    });

    it('GET /files/:id should retrieve a file', async () => {
        const fileRes = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64'),
            });
        const fileId = fileRes.body.id;

        const res = await request(app)
            .get(`/files/${fileId}`)
            .set('X-Token', token);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('name');
    });

    it('GET /files should list files with pagination', async () => {
        const res = await request(app)
            .get('/files')
            .set('X-Token', token)
            .query({ page: 0 });
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('PUT /files/:id/publish should publish a file', async () => {
        const fileRes = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64'),
            });
        const fileId = fileRes.body.id;

        const res = await request(app)
            .put(`/files/${fileId}/publish`)
            .set('X-Token', token);
        expect(res.statusCode).toBe(200);
        expect(res.body.isPublic).toBe(true);
    });

    it('PUT /files/:id/unpublish should unpublish a file', async () => {
        const fileRes = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64'),
            });
        const fileId = fileRes.body.id;

        await request(app)
            .put(`/files/${fileId}/publish`)
            .set('X-Token', token);

        const res = await request(app)
            .put(`/files/${fileId}/unpublish`)
            .set('X-Token', token);
        expect(res.statusCode).toBe(200);
        expect(res.body.isPublic).toBe(false);
    });

    it('GET /files/:id/data should retrieve file data', async () => {
        const fileRes = await request(app)
            .post('/files')
            .set('X-Token', token)
            .send({
                name: 'test.txt',
                type: 'file',
                data: Buffer.from('Hello World').toString('base64'),
            });
        const fileId = fileRes.body.id;

        const res = await request(app)
            .get(`/files/${fileId}/data`)
            .set('X-Token', token);
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('Hello World');
    });
});

