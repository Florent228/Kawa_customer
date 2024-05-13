const request = require('supertest');
const app = require('../app');

describe('Client Controller', () => {
    let server;

    beforeEach((done) => {
        server = app.listen(3000, done);
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
                email: 'john.doe@example.com',
                mot_de_passe: 'securepassword',
                adresse: '123 Main St'
            };
            const response = await request(server).post('/api/customers').send(clientData);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('id');
        });
    });

});
