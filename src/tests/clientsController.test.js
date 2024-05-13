const request = require('supertest');
const app = require('../app');

describe('Client Controller', () => {
    let server;

    beforeEach((done) => {
        server = app.listen(3001, done);
    });

    afterEach((done) => {
        server.close(done);
    });

    //Test pour la creation d'un client
    describe('POST /api/customers', () => {
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
    });

    // Test de connexion ou login
    describe('POST /api/login', () => {
        it('should authenticate a client and return a token', async () => {
            const loginData = {
                email: 'florent@gmail.com',
                mot_de_passe: 'Florent228'
            };
            const response = await request(server).post('/api/login').send(loginData);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
        });

        it('should return 401 if password is invalid', async () => {
            const loginData = {
                email: 'florent@gmail.com',
                mot_de_passe: 'wrongpassword'
            };
            const response = await request(server).post('/api/login').send(loginData);
            expect(response.statusCode).toBe(401);
        });
    });

});
