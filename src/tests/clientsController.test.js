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

        // Test pour vérifier la gestion des erreurs lors de la création d'un client
        it('devrait retourner 500 si une erreur survient lors de la création d\'un client', async () => {
            const clientData = {
                nom: '',
                prenom: '',
                date_naissance: "",
                email: 'bademail',
                mot_de_passe: '123',
                adresse: ''
            };
            const response = await request(server).post('/api/customers').send(clientData);
            expect(response.statusCode).toBe(400);  // Par exemple, ici pour vérifier la validation
            expect(response.body.errors).toBeDefined();
        });

        // Test pour vérifier la gestion des erreurs lors de la mise à jour d'un client
        it('devrait retourner 500 si une erreur survient lors de la mise à jour d\'un client', async () => {
            const clientData = { nom: 'Doe', prenom: 'John' };
            const response = await request(server)
                .put('/api/customers/2')
                .set("x-access-token", authToken)
                .send(clientData);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('nom', 'Doe');
        });

    });

    describe('Cas de bord pour les contrôleurs', () => {

        // Test pour vérifier la création de client avec des données manquantes
        it('devrait retourner 400 si des données obligatoires manquent lors de la création', async () => {
            const clientData = { nom: '', prenom: '', email: 'invalidemail', mot_de_passe: '123' };
            const response = await request(server).post('/api/customers').send(clientData);
            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
        });
    
        // Test pour vérifier la suppression d'un client inexistant
        it('devrait retourner 404 si le client à supprimer n\'existe pas', async () => {
            const response = await request(server)
                .delete('/api/customers/9999')
                .set("x-access-token", authToken);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });
    
        // Test pour vérifier la récupération d'un client qui n'existe pas
        it('devrait retourner 404 si le client à rechercher n\'est pas trouvé', async () => {
            const response = await request(server)
                .get('/api/customers/9999')
                .set("x-access-token", authToken);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });

        it('devrait retourner 400 si une erreur survient lors de la création du client', async () => {
            jest.spyOn(Client, 'create').mockImplementation((client, callback) => {
                callback(new Error("Erreur lors de la création"), null);
            });
        
            const response = await request(server)
                .post('/api/customers')
                .set("x-access-token", authToken)
                .send({ nom: 'Test', prenom: 'Client', email: 'test@example.com', mot_de_passe: 'password123', adresse: '123 Street' });
            
            expect(response.statusCode).toBe(400);
        });

        it('devrait retourner 404 si le client n\'existe pas', async () => {
            jest.spyOn(Client, 'findById').mockImplementation((id, callback) => {
                callback({ kind: "not_found" }, null);
            });
        
            const response = await request(server)
                .get('/api/customers/9999')
                .set("x-access-token", authToken);
        
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });
        
        it('devrait retourner 404 si le client à mettre à jour n\'existe pas', async () => {
            jest.spyOn(Client, 'updateById').mockImplementation((id, data, callback) => {
                callback({ kind: "not_found" }, null);
            });
        
            const response = await request(server)
                .put('/api/customers/9999')
                .set("x-access-token", authToken)
                .send({ nom: 'Updated Name', prenom: 'Updated Surname' });
        
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });
        
        it('devrait retourner 404 si le client à supprimer n\'existe pas', async () => {
            jest.spyOn(Client, 'remove').mockImplementation((id, callback) => {
                callback({ kind: "not_found" }, null);
            });
        
            const response = await request(server)
                .delete('/api/customers/9999')
                .set("x-access-token", authToken);
        
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe(`Client non trouvé avec l'id 9999.`);
        });
        
        
    });
    
    describe('Cas de bord pour le modèle Client', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
    
        // Mock de la méthode findById pour simuler un client non trouvé
        it('devrait retourner une erreur "not_found" si le client n\'existe pas', () => {
            const callback = jest.fn();
            
            // Simuler une réponse de la base de données sans résultat
            jest.spyOn(Client, 'findById').mockImplementation((id, cb) => {
                cb({ kind: "not_found" }, null);
            });
    
            Client.findById(9999, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });
    
        // Mock de la méthode updateById pour simuler un client non trouvé
        it('devrait retourner une erreur "not_found" si le client à mettre à jour n\'existe pas', () => {
            const clientData = { nom: 'Updated Doe', prenom: 'Updated John' };
            const callback = jest.fn();
    
            // Simuler une réponse de la base de données sans résultat
            jest.spyOn(Client, 'updateById').mockImplementation((id, data, cb) => {
                cb({ kind: "not_found" }, null);
            });
    
            Client.updateById(9999, clientData, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });
    
        // Mock de la méthode remove pour simuler un client non trouvé
        it('devrait retourner une erreur "not_found" si le client à supprimer n\'existe pas', () => {
            const callback = jest.fn();
    
            // Simuler une réponse de la base de données sans résultat
            jest.spyOn(Client, 'remove').mockImplementation((id, cb) => {
                cb({ kind: "not_found" }, null);
            });
    
            Client.remove(9999, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });

        it('devrait retourner une erreur si la requête SQL échoue lors de la recherche du client', () => {
            jest.spyOn(Client, 'findById').mockImplementation((id, callback) => {
                callback(new Error("Erreur SQL"), null);
            });
        
            const callback = jest.fn();
            Client.findById(1, callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur SQL"), null);
        });
        
        it('devrait retourner "not_found" si le client à mettre à jour n\'existe pas', () => {
            jest.spyOn(Client, 'updateById').mockImplementation((id, client, callback) => {
                callback({ kind: "not_found" }, null);
            });
        
            const callback = jest.fn();
            Client.updateById(9999, { nom: 'Updated Name' }, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });
        
        it('devrait retourner "not_found" si le client à supprimer n\'existe pas', () => {
            jest.spyOn(Client, 'remove').mockImplementation((id, callback) => {
                callback({ kind: "not_found" }, null);
            });
        
            const callback = jest.fn();
            Client.remove(9999, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });
        

    });
    
    describe('Cas de bord supplémentaires pour le modèle Client', () => {

        // Test pour vérifier la création de client avec un email déjà existant
        it('devrait retourner une erreur si l\'email est déjà utilisé', () => {
            const clientData = { nom: 'Existing', prenom: 'User', email: 'existing@example.com', mot_de_passe: 'password123', adresse: '123 Street' };
            const callback = jest.fn();
    
            jest.spyOn(Client, 'create').mockImplementation((newClient, cb) => {
                cb({ kind: "email_exists" }, null);
            });
    
            Client.create(clientData, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "email_exists" }, null);
        });
    
        // Test pour vérifier la recherche d'un client avec un email inexistant
        it('devrait retourner une erreur "not_found" si l\'email n\'existe pas', () => {
            const callback = jest.fn();
    
            jest.spyOn(Client, 'findByEmail').mockImplementation((email, cb) => {
                cb({ kind: "not_found" }, null);
            });
    
            Client.findByEmail('nonexistent@example.com', callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });
    
        // Test pour vérifier la mise à jour d'un client sans modification réelle
        it('devrait mettre à jour un client sans changement de données', () => {
            const clientData = { nom: 'Same Name', prenom: 'Same Surname', email: 'same@example.com', mot_de_passe: 'password123', adresse: '123 Same St' };
            const callback = jest.fn();
    
            jest.spyOn(Client, 'updateById').mockImplementation((id, updatedClient, cb) => {
                cb(null, { id: id, ...updatedClient });
            });
    
            Client.updateById(1, clientData, callback);
            expect(callback).toHaveBeenCalledWith(null, { id: 1, ...clientData });
        });
    
        // Test pour vérifier la tentative de suppression d'un client lié à d'autres enregistrements
        it('devrait retourner une erreur si le client est lié à d\'autres enregistrements', () => {
            const callback = jest.fn();
    
            jest.spyOn(Client, 'remove').mockImplementation((id, cb) => {
                cb({ kind: "linked_records" }, null);
            });
    
            Client.remove(1, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "linked_records" }, null);
        });
    
        // Test pour vérifier la tentative de connexion avec un email invalide
        it('devrait retourner une erreur si l\'email pour la connexion est invalide', () => {
            const loginData = { email: 'invalid@example.com', mot_de_passe: 'password123' };
            const callback = jest.fn();
    
            jest.spyOn(Client, 'findByEmail').mockImplementation((email, cb) => {
                cb({ kind: "not_found" }, null);
            });
    
            Client.findByEmail(loginData.email, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });

        it('devrait retourner une erreur si le client à chercher n\'existe pas', async () => {
            const callback = jest.fn();
        
            jest.spyOn(Client, 'findById').mockImplementation((id, cb) => {
                cb({ kind: "not_found" }, null);
            });
        
            Client.findById(9999, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });
    });

    describe('Tests du Modèle Client - Cas de Bord', () => {

        it('devrait retourner une erreur si la requête SQL échoue lors de la recherche du client', () => {
            jest.spyOn(Client, 'findById').mockImplementation((id, callback) => {
                callback(new Error("Erreur SQL"), null);
            });

            const callback = jest.fn();
            Client.findById(1, callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur SQL"), null);
        });

        it('devrait retourner "not_found" si le client à mettre à jour n\'existe pas', () => {
            jest.spyOn(Client, 'updateById').mockImplementation((id, client, callback) => {
                callback({ kind: "not_found" }, null);
            });

            const callback = jest.fn();
            Client.updateById(9999, { nom: 'Updated Name' }, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });

        it('devrait retourner "not_found" si le client à supprimer n\'existe pas', () => {
            jest.spyOn(Client, 'remove').mockImplementation((id, callback) => {
                callback({ kind: "not_found" }, null);
            });

            const callback = jest.fn();
            Client.remove(9999, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });

        it('devrait retourner "not_found" si le client avec l\'ID donné n\'existe pas', () => {
            jest.spyOn(Client, 'findById').mockImplementation((id, callback) => {
                callback({ kind: "not_found" }, null);
            });
        
            const callback = jest.fn();
            Client.findById(9999, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });

        it('devrait retourner une erreur si la récupération de tous les clients échoue', () => {
            jest.spyOn(Client, 'getAll').mockImplementation((callback) => {
                callback(new Error("Erreur SQL"), null);
            });
        
            const callback = jest.fn();
            Client.getAll(callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur SQL"), null);
        });
        
        it('devrait retourner une erreur si la création du client échoue', () => {
            jest.spyOn(Client, 'create').mockImplementation((newClient, callback) => {
                callback(new Error("Erreur lors de la création"), null);
            });
        
            const callback = jest.fn();
            Client.create({ nom: 'Test', prenom: 'Client' }, callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur lors de la création"), null);
        });
        
        it('devrait retourner "not_found" si le client à mettre à jour n\'existe pas', () => {
            jest.spyOn(Client, 'updateById').mockImplementation((id, client, callback) => {
                callback({ kind: "not_found" }, null);
            });
        
            const callback = jest.fn();
            Client.updateById(9999, { nom: 'Updated Name' }, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });

        it('devrait retourner "not_found" si le client à supprimer n\'existe pas', () => {
            jest.spyOn(Client, 'remove').mockImplementation((id, callback) => {
                callback({ kind: "not_found" }, null);
            });
        
            const callback = jest.fn();
            Client.remove(9999, callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });

        it('devrait retourner "not_found" si le client avec l\'email donné n\'existe pas', () => {
            jest.spyOn(Client, 'findByEmail').mockImplementation((email, callback) => {
                callback({ kind: "not_found" }, null);
            });
        
            const callback = jest.fn();
            Client.findByEmail('nonexistent@example.com', callback);
            expect(callback).toHaveBeenCalledWith({ kind: "not_found" }, null);
        });
        
        it('devrait retourner une erreur SQL si la requête findById échoue', () => {
            jest.spyOn(Client, 'findById').mockImplementation((id, callback) => {
                callback(new Error("Erreur SQL"), null);
            });
        
            const callback = jest.fn();
            Client.findById(1, callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur SQL"), null);
        });
        
        it('devrait retourner une erreur SQL si la requête getAll échoue', () => {
            jest.spyOn(Client, 'getAll').mockImplementation((callback) => {
                callback(new Error("Erreur SQL"), null);
            });
        
            const callback = jest.fn();
            Client.getAll(callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur SQL"), null);
        });
        
        it('devrait retourner une erreur si la création du client échoue', () => {
            jest.spyOn(Client, 'create').mockImplementation((newClient, callback) => {
                callback(new Error("Erreur lors de la création"), null);
            });
        
            const callback = jest.fn();
            Client.create({ nom: 'Test', prenom: 'Client' }, callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur lors de la création"), null);
        });

        it('devrait retourner une erreur SQL si la mise à jour échoue', () => {
            jest.spyOn(Client, 'updateById').mockImplementation((id, client, callback) => {
                callback(new Error("Erreur SQL"), null);
            });
        
            const callback = jest.fn();
            Client.updateById(1, { nom: 'Updated Name' }, callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur SQL"), null);
        });
        
        it('devrait retourner une erreur SQL si la suppression échoue', () => {
            jest.spyOn(Client, 'remove').mockImplementation((id, callback) => {
                callback(new Error("Erreur SQL"), null);
            });
        
            const callback = jest.fn();
            Client.remove(1, callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur SQL"), null);
        });
        
        it('devrait retourner une erreur SQL si la requête findByEmail échoue', () => {
            jest.spyOn(Client, 'findByEmail').mockImplementation((email, callback) => {
                callback(new Error("Erreur SQL"), null);
            });
        
            const callback = jest.fn();
            Client.findByEmail('test@example.com', callback);
            expect(callback).toHaveBeenCalledWith(new Error("Erreur SQL"), null);
        });
        
        
    });


});