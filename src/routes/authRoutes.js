const express = require("express");
const router = express.Router();
const verifyToken = require('../middleware/authJwt');

// Route pour vérifier la validité d'un accessToken
router.get("/verify-token", verifyToken, (req, res) => {
    res.status(200).send({ message: "Token valide", userId: req.userId });
});

module.exports = router;
