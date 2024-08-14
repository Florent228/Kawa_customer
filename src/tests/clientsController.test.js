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

        // it('should return 400 if create client request body is empty', async () => {
        //     const response = await request(server).post('/api/customers').send({});
        //     expect(response.statusCode).toBe(400);
        //     expect(response.body.message).toBe("Le contenu ne peut pas être vide !");
        // });

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

        // it('should create a client successfully', (done) => {
        //     const newClient = new Client({
        //         nom: 'Doe',
        //         prenom: 'John',
        //         date_naissance: '1989-12-31',
        //         adresse: '123 Main St',
        //         email: 'john.doe@example.com',
        //         mot_de_passe: 'hashedpassword'
        //     });

        //     dbConn.query.mockImplementation((query, values, callback) => {
        //         callback(null, { insertId: 1 });
        //     });

        //     Client.create(newClient, (err, data) => {
        //         expect(err).toBeNull();
        //         expect(data).toEqual({ id: 1, ...newClient });
        //         done();
        //     });
        // });

        // it('should find a client by id successfully', (done) => {
        //     dbConn.query.mockImplementation((query, values, callback) => {
        //         callback(null, [{ id: 1, nom: 'Doe', prenom: 'John', date_naissance: '1989-12-31', adresse: '123 Main St', email: 'john.doe@example.com', mot_de_passe: 'hashedpassword' }]);
        //     });

        //     Client.findById(1, (err, data) => {
        //         expect(err).toBeNull();
        //         expect(data).toEqual({ id: 1, nom: 'Doe', prenom: 'John', date_naissance: '1989-12-31', adresse: '123 Main St', email: 'john.doe@example.com', mot_de_passe: 'hashedpassword' });
        //         done();
        //     });
        // });

        // it('should return error if client not found by id', (done) => {
        //     dbConn.query.mockImplementation((query, values, callback) => {
        //         callback(null, []);
        //     });

        //     Client.findById(9999, (err, data) => {
        //         expect(err).toEqual({ kind: 'not_found' });
        //         expect(data).toBeNull();
        //         done();
        //     });
        // });

        // it('should get all clients successfully', (done) => {
        //     dbConn.query.mockImplementation((query, callback) => {
        //         callback(null, [{ id: 1, nom: 'Doe', prenom: 'John', date_naissance: '1989-12-31', adresse: '123 Main St', email: 'john.doe@example.com', mot_de_passe: 'hashedpassword' }]);
        //     });

        //     Client.getAll((err, data) => {
        //         expect(err).toBeNull();
        //         expect(Array.isArray(data)).toBe(true);
        //         expect(data.length).toBeGreaterThan(0);
        //         done();
        //     });
        // });

        // it('should update a client by id successfully', (done) => {
        //     const updatedClient = new Client({
        //         nom: 'Doe',
        //         prenom: 'John',
        //         date_naissance: '1989-12-31',
        //         adresse: '123 Main St',
        //         email: 'john.doe@example.com',
        //         mot_de_passe: 'newhashedpassword'
        //     });

        //     dbConn.query.mockImplementation((query, values, callback) => {
        //         callback(null, { affectedRows: 1 });
        //     });

        //     Client.updateById(1, updatedClient, (err, data) => {
        //         expect(err).toBeNull();
        //         expect(data).toEqual({ id: 1, ...updatedClient });
        //         done();
        //     });
        // });

        // it('should return error if client to update is not found by id', (done) => {
        //     const updatedClient = new Client({
        //         nom: 'Doe',
        //         prenom: 'John',
        //         date_naissance: '1989-12-31',
        //         adresse: '123 Main St',
        //         email: 'john.doe@example.com',
        //         mot_de_passe: 'newhashedpassword'
        //     });

        //     dbConn.query.mockImplementation((query, values, callback) => {
        //         callback(null, { affectedRows: 0 });
        //     });

        //     Client.updateById(9999, updatedClient, (err, data) => {
        //         expect(err).toEqual({ kind: 'not_found' });
        //         expect(data).toBeNull();
        //         done();
        //     });
        // });

        // it('should find a client by email successfully', (done) => {
        //     dbConn.query.mockImplementation((query, callback) => {
        //         callback(null, [{ id: 1, nom: 'Doe', prenom: 'John', date_naissance: '1989-12-31', adresse: '123 Main St', email: 'john.doe@example.com', mot_de_passe: 'hashedpassword' }]);
        //     });

        //     Client.findByEmail('john.doe@example.com', (err, data) => {
        //         expect(err).toBeNull();
        //         expect(data).toEqual({ id: 1, nom: 'Doe', prenom: 'John', date_naissance: '1989-12-31', adresse: '123 Main St', email: 'john.doe@example.com', mot_de_passe: 'hashedpassword' });
        //         done();
        //     });
        // });

        // it('should return error if client not found by email', (done) => {
        //     dbConn.query.mockImplementation((query, callback) => {
        //         callback(null, []);
        //     });

        //     Client.findByEmail('unknown@example.com', (err, data) => {
        //         expect(err).toEqual({ kind: 'not_found' });
        //         expect(data).toBeNull();
        //         done();
        //     });
        // });

        // it('should remove a client by id successfully', (done) => {
        //     dbConn.query.mockImplementation((query, values, callback) => {
        //         callback(null, { affectedRows: 1 });
        //     });

        //     Client.remove(1, (err, data) => {
        //         expect(err).toBeNull();
        //         expect(data.affectedRows).toBe(1);
        //         done();
        //     });
        // });


    });
});