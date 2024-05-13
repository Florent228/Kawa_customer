# Kawa_customer


CREATE TABLE Client(
   id BYTE,
   nom VARCHAR(50),
   prenom VARCHAR(150),
   date_naissance DATE,
   adresse VARCHAR(150) NOT NULL,
   email VARCHAR(50),
   mot_de_passe VARCHAR(150),
   PRIMARY KEY(id)
);