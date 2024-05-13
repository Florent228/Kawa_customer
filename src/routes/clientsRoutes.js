const express = require("express");
const router = express.Router();
const { body, validationResult } = require('express-validator');
const clientsController = require("../controllers/clientsController");
const verifyToken  = require('../middleware/authJwt');


// Route pour créer un nouveau client
router.post("/customers", [
    body('nom').not().isEmpty().trim().escape().withMessage('Le nom est obligatoire.'),
    body('prenom').not().isEmpty().trim().escape().withMessage('Le prénom est obligatoire.'),
    body('date_naissance').not().isEmpty().trim().escape().withMessage('La date de naissance est obligatoire.'),
    body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
    body('mot_de_passe').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
    body('adresse').not().isEmpty().trim().escape().withMessage('L\'adresse est obligatoire.')
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}, clientsController.create);

// Route pour récupérer la liste de tous les clients
router.get("/customers", verifyToken, clientsController.findAll);

// Route pour récupérer un client par son ID 
router.get("/customers/:clientId", clientsController.findOne);

// Route pour mettre à jour un client par son ID
router.put("/customers/:clientId", verifyToken, clientsController.update);

// Route pour supprimer un client par son ID
router.delete("/customers/:clientId", verifyToken, clientsController.delete);

//Route pour  l'authentication
router.post('/login', clientsController.login);


module.exports = router;
