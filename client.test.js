const db = require('../config/db.config');
const Client = require('../models/client');

describe('Client Model Tests', () => {
    // Mock de la base de données
    beforeAll(() => {
        db.query = jest.fn();
    });

    it('should create a client successfully', (done) => {
        const newClient = new Client({
            nom: 'Doe',
            prenom: 'John',
            date_naissance: '1989-12-31',
            adresse: '123 Main St',
            email: 'john.doe@example.com',
            mot_de_passe: 'hashedpassword'
        });

        db.query.mockImplementation((query, values, callback) => {
            callback(null, { insertId: 1 });
        });

        Client.create(newClient, (err, data) => {
            expect(err).toBeNull();
            expect(data).toEqual({ id: 1, ...newClient });
            done();
        });
    });

    it('should find a client by id successfully', (done) => {
        db.query.mockImplementation((query, values, callback) => {
            callback(null, [{ id: 1, nom: 'Doe', prenom: 'John', date_naissance: '1989-12-31', adresse: '123 Main St', email: 'john.doe@example.com', mot_de_passe: 'hashedpassword' }]);
        });

        Client.findById(1, (err, data) => {
            expect(err).toBeNull();
            expect(data).toEqual({ id: 1, nom: 'Doe', prenom: 'John', date_naissance: '1989-12-31', adresse: '123 Main St', email: 'john.doe@example.com', mot_de_passe: 'hashedpassword' });
            done();
        });
    });

    it('should return error if client not found by id', (done) => {
        db.query.mockImplementation((query, values, callback) => {
            callback(null, []);
        });

        Client.findById(9999, (err, data) => {
            expect(err).toEqual({ kind: 'not_found' });
            expect(data).toBeNull();
            done();
        });
    });

    // Ajoutez plus de tests pour les autres méthodes (getAll, updateById, findByEmail, remove) de manière similaire.
});
