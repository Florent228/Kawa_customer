const mysql = require('mysql');

// Charge les variables d'environnement
require('dotenv').config();

const dbConn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

dbConn.connect(function(error) {
  if (error) throw error;
  console.log("Connecté à la base de données MySQL!");
});

module.exports = dbConn;
