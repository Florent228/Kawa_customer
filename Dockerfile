# Version officielle de Node.js
FROM node:20-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copie du package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code de l'application
COPY . .

# Exposer le port sur lequel l'application écoute
EXPOSE 3000

# commande à exécuter pour démarrer l'application
CMD ["npm","start"]
#CMD ["node", "src/app.js"]

# FROM node:14-alpine

# RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# WORKDIR /home/node/app

# COPY package*.json ./

# USER node

# RUN npm install

# COPY --chown=node:node . .

# EXPOSE 3000

# CMD [ "node", "src/app.js" ]