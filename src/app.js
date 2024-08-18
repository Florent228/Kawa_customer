const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");


dotenv.config();

const app = express();

// Parse les requêtes de type - application/json
app.use(bodyParser.json());

// Parse les requêtes de type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Route simple
app.get("/", (req, res) => {
    res.json({ message: "Bienvenue dans notre application API." });
});

// Import des routes pour les clients
const clientRoutes = require("./routes/clientsRoutes");

const authRoutes = require("./routes/authRoutes");

// Utilisation des routes pour les utilisateurs
app.use("/api", clientRoutes);

// Utiliser les routes
app.use("/api/auth", authRoutes);

module.exports = app;