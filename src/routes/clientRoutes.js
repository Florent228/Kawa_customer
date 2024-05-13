const express = require("express");
const router = express.Router();
const clientsController = require("../controllers/clientsController");
const verifyToken  = require('../middleware/authJwt');


// Route pour créer un nouveau client
router.post("/customers", clientsController.create);

// Route pour récupérer la liste de tous les clients
router.get("/customers", clientsController.findAll);

// Route pour récupérer un client par son ID 
router.get("/customers/:clientId", clientsController.findOne);

// Route pour mettre à jour un client par son ID
router.put("/customers/:clientId", clientsController.update);

// Route pour supprimer un client par son ID
router.delete("/customers/:clientId", clientsController.delete);

//Route pour  l'authentication
router.post('/login', clientsController.login);


module.exports = router;
