const request = require('supertest');
const app = require('../app');

describe('Client Controller', () => {
    let server;
    let authToken;

    beforeEach(async () => {
        server = app.listen(3001);
        const loginResponse = await request(server)
            .post('/api/login')
            .send({ email: 'florent@gmail.com', mot_de_passe: 'Florent228' });
        authToken = loginResponse.body.accessToken;
    }, 10000);

    afterEach(async () => {
        await new Promise(resolve => server.close(resolve));
    });
    

    //Test pour la creation d'un client
    describe('POST /api/customers', () => {
        it('Tester la création d un nouveau client', async () => {
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
        it('Tester l authentification et la création du token', async () => {
            const loginData = {
                email: 'florent@gmail.com',
                mot_de_passe: 'Florent228'
            };
            const response = await request(server).post('/api/login').send(loginData);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
        });

        it('Tester le retour du code  401 quand le mot de passe est invalid', async () => {
            const loginData = {
                email: 'florent@gmail.com',
                mot_de_passe: 'wrongpassword'
            };
            const response = await request(server).post('/api/login').send(loginData);
            expect(response.statusCode).toBe(401);
        });
    });

    //Test de récupération de la liste des clients
    describe('GET /api/customers', () => {
        it('Tester la recuperation des client avec le token fourni', async () => {
            const response = await request(server)
            .get('/api/customers')
            .set("x-access-token", authToken);
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        
        it('tester le retour de l erreur 403 en cas d absence de token', async () => {
            const response = await request(server).get('/api/customers');
            expect(response.statusCode).toBe(403);
        });

    });

});
