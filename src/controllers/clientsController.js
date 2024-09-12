const Client = require("../models/client");
const bcrypt = require("bcryptjs");
const { publishToQueue } = require('../config/rabbitmq');

exports.create = (req, res) => {
    // Valider la requête
    if (!req.body) {
        res.status(400).send({
            message: "Le contenu ne peut pas être vide !"
        });
    }

    // Hacher le mot de passe
    const hashedPassword = bcrypt.hashSync(req.body.mot_de_passe, 8);

    // Créer un client
    const client = new Client({
        nom: req.body.nom,
        prenom: req.body.prenom,
        date_naissance: req.body.date_naissance,
        adresse: req.body.adresse,
        email: req.body.email,
        mot_de_passe: bcrypt.hashSync(req.body.mot_de_passe, 8)
    });

    // Sauvegarder le client dans la base de données
    Client.create(client, (err, data) => {
        if (err)
            res.status(500).send({
                message: err.message || "Une erreur est survenue lors de la création du client."
            });
        else
            publishToQueue('client_creation_queue', JSON.stringify(data));  // Publier l'événement de création
            res.send(data);
    });
};

exports.findAll = (req, res) => {
    Client.getAll((err, data) => {
        if (err)
            res.status(500).send({
                message: err.message || "Une erreur est survenue lors de la récupération du client."
            });
        else res.send(data);
    });
};

exports.findOne = (req, res) => {
    Client.findById(req.params.clientId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Client non trouvé avec l'id ${req.params.clientId}.`
                });
            } else {
                res.status(500).send({
                    message: "Erreur de récupération du client avec l'id " + req.params.clientId
                });
            }
        } else res.send(data);
    });
};

exports.update = (req, res) => {
    const clientId = req.params.clientId;
    const clientData = req.body;

    // Logique de mise à jour
    Client.updateById(clientId, clientData, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Client non trouvé avec l'id ${clientId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Erreur lors de la mise à jour du client avec l'id " + clientId
                });
            }
        }

        // Publier l'événement de mise à jour sur RabbitMQ uniquement si la mise à jour réussit
        publishToQueue('client_update_queue', JSON.stringify(data));
        res.send(data);
    });
};

exports.delete = (req, res) => {
    const clientId = req.params.clientId;

    // Logique de suppression
    Client.remove(clientId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Client non trouvé avec l'id ${clientId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Impossible de supprimer le client avec l'id " + clientId
                });
            }
        }

        // Publier l'événement de suppression sur RabbitMQ uniquement si la suppression réussit
        publishToQueue('client_deletion_queue', JSON.stringify({ clientId }));
        res.send({ message: "Le client a été supprimé avec succès !" });
    });
};



const jwt = require('jsonwebtoken');

// Authentification d'un client
exports.login = (req, res) => {
    const email = req.body.email;
    const mot_de_passe = req.body.mot_de_passe;

    Client.findByEmail(email, (err, client) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({ message: "Client non trouvé." });
            } else {
                return res.status(500).send({ message: "Erreur lors de la recherche du client." });
            }
        }

        const passwordIsValid = bcrypt.compareSync(mot_de_passe, client.mot_de_passe);

        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Mot de passe invalide!"
            });
        }

        // durrée du tocken 24 heures
        const token = jwt.sign({ id: client.id }, process.env.SECRET, {
            // expiresIn: 86400  //24 H
            expiresIn: 432000 //5jours //

        });

        res.status(200).send({
            id: client.id,
            email: client.email,
            accessToken: token
        });
    });
};
