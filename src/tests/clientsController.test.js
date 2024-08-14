const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const Client = require('../models/client');
const dbConn = require('../config/db.config');

// Augmenter le timeout global pour Jest
jest.setTimeout(50000);

describe('Tests de l\'Application', () => {
    let server;
    let authToken;

    // Avant chaque test, démarrer le serveur et obtenir un token d'authentification
    beforeEach(async () => {
        server = app.listen(0);  // Utiliser un port dynamique pour éviter les conflits
        const loginResponse = await request(server)
            .post('/api/login')
            .send({ email: 'florent@gmail.com', mot_de_passe: 'Florent228' });
        authToken = loginResponse.body.accessToken;  // Stocker le token pour les tests suivants
    }, 10000);

    // Après chaque test, arrêter le serveur
    afterEach(async () => {
        await new Promise(resolve => server.close(resolve));
    });

    describe('Tests de l\'Application', () => {
        // Test de l'endpoint GET / qui doit retourner un message de bienvenue
        it('devrait retourner un message de bienvenue sur GET /', async () => {
            const response = await request(server).get('/');
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message', 'Bienvenue dans notre application API.');
        });

        // Test pour gérer les routes inconnues avec un code 404
        it('devrait gérer les routes inconnues avec un code 404', async () => {
            const response = await request(server).get('/unknownroute');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('Tests du Middleware authJwt', () => {
        // Test pour vérifier si une requête sans token retourne un code 403
        it('devrait retourner 403 si aucun token n\'est fourni', async () => {
            const response = await request(server).get('/api/customers');
            expect(response.statusCode).toBe(403);
            expect(response.body.message).toBe("Aucun token fourni!");
        });

        // Test pour vérifier si une requête avec un token invalide retourne un code 401
        it('devrait retourner 401 si le token est invalide', async () => {
            const response = await request(server).get('/api/customers').set('x-access-token', 'invalidtoken');
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe("Non autorisé!");
        });

        // Test pour vérifier si une requête avec un token valide passe avec succès
        it('devrait passer si le token est valide', async () => {
            const token = jwt.sign({ id: 1 }, process.env.SECRET, { expiresIn: 86400 });
            const response = await request(server).get('/api/customers').set('x-access-token', token);
            expect(response.statusCode).toBe(200);
        });
    });

    describe('Tests du Contrôleur Client', () => {
        // Test pour créer un nouveau client
        it('devrait créer un nouveau client', async () => {
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

        // Test pour authentifier un utilisateur et créer un token
        it('devrait authentifier et créer un token', async () => {
            const loginData = {
                email: 'florent@gmail.com',
                mot_de_passe: 'Florent228'
            };
            const response = await request(server).post('/api/login').send(loginData);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
        });

        // Test pour vérifier si une authentification avec un mot de passe invalide retourne un code 401
        it('devrait retourner 401 lorsque le mot de passe est invalide', async () => {
            const loginData = {
                email: 'florent@gmail.com',
                mot_de_passe: 'wrongpassword'
            };
            const response = await request(server).post('/api/login').send(loginData);
            expect(response.statusCode).toBe(401);
        });

        // Test pour récupérer les clients avec un token valide
        it('devrait récupérer les clients avec le token fourni', async () => {
            const response = await request(server)
                .get('/api/customers')
                .set("x-access-token", authToken);
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        // Test pour vérifier si une requête sans token retourne un code 403
        it('devrait retourner 403 si aucun token n\'est fourni', async () => {
            const response = await request(server).get('/api/customers');
            expect(response.statusCode).toBe(403);
        });

        // Test pour mettre à jour un client existant
        it('devrait mettre à jour un client', async () => {
            const clientData = { nom: 'Updated Doe', prenom: 'Updated John' };
            const response = await request(server)
                .put('/api/customers/2')
                .set("x-access-token", authToken)
                .send(clientData);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('nom', 'Updated Doe');
        });

        // Test pour supprimer un client existant
        it('devrait supprimer un client', async () => {
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

        // Test pour vérifier si une tentative de mise à jour d'un client non existant retourne un code 404
        it('devrait retourner 404 si le client à mettre à jour n\'est pas trouvé', async () => {
            const clientData = { nom: 'Updated Doe', prenom: 'Updated John' };
            const response = await request(server)
                .put('/api/customers/9999')
                .set("x-access-token", authToken)
                .send(clientData);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });

        // Test pour vérifier si une tentative de suppression d'un client non existant retourne un code 404
        it('devrait retourner 404 si le client à supprimer n\'est pas trouvé', async () => {
            const response = await request(server)
                .delete('/api/customers/9999')
                .set("x-access-token", authToken);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });

        // Test pour vérifier si une tentative de récupération d'un client non existant retourne un code 404
        it('devrait retourner 404 si le client à rechercher n\'est pas trouvé', async () => {
            const response = await request(server)
                .get('/api/customers/9999')
                .set("x-access-token", authToken);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });
    });

    describe('Tests du Modèle Client', () => {
        // Mock de la base de données
        beforeAll(() => {
            dbConn.query = jest.fn();
        });

    });
});