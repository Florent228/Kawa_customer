const db = require('../config/db.config');

const Client = function(client) {
    this.nom = client.nom;
    this.prenom = client.prenom;
    this.date_naissance = client.date_naissance;
    this.adresse = client.adresse;
    this.email = client.email;
    this.mot_de_passe = client.mot_de_passe;
};

Client.create = (newClient, result) => {
    db.query("INSERT INTO clients SET ?", newClient, (err, res) => {
        if(err) {
            console.log("erreur: ", err);
            result(err, null);
            return;
        }
        console.log("client créé : ", { id: res.insertId, ...newClient });
        result(null, { id: res.insertId, ...newClient });
    });
};

Client.findById = (clientId, result) => {
    db.query(`SELECT * FROM clients WHERE id = ${clientId}`, (err, res) => {
        if(err) {
            console.log("erreur: ", err);
            result(err, null);
            return;
        }
        if(res.length) {
            console.log("client trouvé : ", res[0]);
            result(null, res[0]);
            return;
        }
        result({ kind: "not_found" }, null);
    });
};

Client.getAll = result => {
    db.query("SELECT * FROM clients", (err, res) => {
        if(err) {
            console.log("erreur: ", err);
            result(null, err);
            return;
        }
        console.log("clients: ", res);
        result(null, res);
    });
};

Client.updateById = (id, client, result) => {
    db.query(
        "UPDATE clients SET nom = ?, prenom = ?, date_naissance = ?, adresse = ?, email = ?, mot_de_passe = ? WHERE id = ?",
        [client.nom, client.prenom, client.date_naissance, client.adresse, client.email, client.mot_de_passe, id],
        (err, res) => {
            if(err) {
                console.log("erreur: ", err);
                result(null, err);
                return;
            }
            if(res.affectedRows == 0) {
                // Utilisateur avec cet id n'a pas été trouvé
                result({ kind: "not_found" }, null);
                return;
            }
            console.log("client mis à jour : ", { id: id, ...client });
            result(null, { id: id, ...client });
        }
    );
};

Client.findByEmail = (email, result) => {
    db.query(`SELECT * FROM clients WHERE email = '${email}'`, (err, res) => {
        if (err) {
            console.log("erreur: ", err);
            result(err, null);
            return;
        }
        if (res.length) {
            console.log("client trouvé : ", res[0]);
            result(null, res[0]);
            return;
        }
        result({ kind: "not_found" }, null);
    });
};


Client.remove = (id, result) => {
    db.query("DELETE FROM clients WHERE id = ?", id, (err, res) => {
        if(err) {
            console.log("erreur: ", err);
            result(null, err);
            return;
        }
        if(res.affectedRows == 0) {
            // Utilisateur avec cet id n'a pas été trouvé
            result({ kind: "not_found" }, null);
            return;
        }
        console.log("client supprimé avec l'id : ", id);
        result(null, res);
    });
};

module.exports = Client;
