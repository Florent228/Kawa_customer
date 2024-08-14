const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const Client = require('../models/client');
const dbConn = require('../config/db.config');

jest.setTimeout(50000); // Augmenter le timeout global pour Jest

describe('Application Tests', () => {
    let server;
    let authToken;

    beforeEach(async () => {
        server = app.listen(0);  // Utiliser un port dynamique
        const loginResponse = await request(server)
            .post('/api/login')
            .send({ email: 'florent@gmail.com', mot_de_passe: 'Florent228' });
        authToken = loginResponse.body.accessToken;
    }, 10000);

    afterEach(async () => {
        await new Promise(resolve => server.close(resolve));
    });

    describe('App Tests', () => {
        it('should return a welcome message on GET /', async () => {
            const response = await request(server).get('/');
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message', 'Bienvenue dans notre application API.');
        });

        it('should handle 404 for unknown routes', async () => {
            const response = await request(server).get('/unknownroute');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('authJwt Middleware Tests', () => {
        it('should return 403 if no token is provided', async () => {
            const response = await request(server).get('/api/customers');
            expect(response.statusCode).toBe(403);
            expect(response.body.message).toBe("Aucun token fourni!");
        });

        it('should return 401 if token is invalid', async () => {
            const response = await request(server).get('/api/customers').set('x-access-token', 'invalidtoken');
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe("Non autorisé!");
        });

        it('should pass if token is valid', async () => {
            const token = jwt.sign({ id: 1 }, process.env.SECRET, { expiresIn: 86400 });
            const response = await request(server).get('/api/customers').set('x-access-token', token);
            expect(response.statusCode).toBe(200);
        });
    });

    describe('Client Controller Tests', () => {
        it('should create a new client', async () => {
            const clientData = {
                nom: 'Doe',
                prenom: 'John',
                date_naissance: "1989-12-31",
                email: 'florent2@gmail.com',
                mot_de_passe: 'securepassword',
                adresse: '123 Main St'
            };
            const response = await request(server).post('/api/customers').send(clientData);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('id');
        });

        it('should authenticate and create a token', async () => {
            const loginData = {
                email: 'florent@gmail.com',
                mot_de_passe: 'Florent228'
            };
            const response = await request(server).post('/api/login').send(loginData);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
        });

        it('should return 401 when the password is invalid', async () => {
            const loginData = {
                email: 'florent@gmail.com',
                mot_de_passe: 'wrongpassword'
            };
            const response = await request(server).post('/api/login').send(loginData);
            expect(response.statusCode).toBe(401);
        });

        it('should retrieve clients with the provided token', async () => {
            const response = await request(server)
                .get('/api/customers')
                .set("x-access-token", authToken);
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return 403 if no token is provided', async () => {
            const response = await request(server).get('/api/customers');
            expect(response.statusCode).toBe(403);
        });

        it('should update a client', async () => {
            const clientData = { nom: 'Updated Doe', prenom: 'Updated John' };
            const response = await request(server)
                .put('/api/customers/2')
                .set("x-access-token", authToken)
                .send(clientData);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('nom', 'Updated Doe');
        });

        it('should delete a client', async () => {
            const newClient = {
                nom: 'ToBeDeleted',
                prenom: 'Client',
                date_naissance: "1990-01-01",
                email: 'delete@example.com',
                mot_de_passe: 'securepassword',
                adresse: '123 Delete St'
            };
            const createResponse = await request(server).post('/api/customers').send(newClient);
            const clientId = createResponse.body.id;

            const response = await request(server)
                .delete(`/api/customers/${clientId}`)
                .set("x-access-token", authToken);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toMatch(/supprimé avec succès/);
        });

        it('should return 404 if client to update is not found', async () => {
            const clientData = { nom: 'Updated Doe', prenom: 'Updated John' };
            const response = await request(server)
                .put('/api/customers/9999')
                .set("x-access-token", authToken)
                .send(clientData);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });

        it('should return 404 if client to delete is not found', async () => {
            const response = await request(server)
                .delete('/api/customers/9999')
                .set("x-access-token", authToken);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });

        it('should return 404 if client to find is not found', async () => {
            const response = await request(server)
                .get('/api/customers/9999')
                .set("x-access-token", authToken);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });
    });

    describe('Client Model Tests', () => {
        // Mock de la base de données
        beforeAll(() => {
            dbConn.query = jest.fn();
        });

    });
});