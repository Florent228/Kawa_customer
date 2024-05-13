const Client = require("../models/client");
const bcrypt = require("bcryptjs");

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
        else res.send(data);
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
    // Valider la requête
    if (!req.body) {
        res.status(400).send({
            message: "Le contenu ne peut pas être vide !"
        });
    }

    Client.updateById(
        req.params.clientId,
        new Client(req.body),
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({
                        message: `Client non trouvé avec l'id ${req.params.clientId}.`
                    });
                } else {
                    res.status(500).send({
                        message: "Erreur mise à jour des informations du client avec l'id " + req.params.clientId
                    });
                }
            } else res.send(data);
        }
    );
};

exports.delete = (req, res) => {
    Client.remove(req.params.clientId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Client non trouvé avec l'id ${req.params.clientId}.`
                });
            } else {
                res.status(500).send({
                    message: "Impossible de supprimer le client dont l' id est : " + req.params.clientId
                });
            }
        } else res.send({ message: `Le client  a été supprimé avec succès !` });
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
            expiresIn: 86400 
        });

        res.status(200).send({
            id: client.id,
            email: client.email,
            accessToken: token
        });
    });
};
