const amqp = require('amqplib/callback_api');

const RABBITMQ_URL = 'amqp://localhost';  // ou l'adresse de ton serveur RabbitMQ

// Fonction pour envoyer un message à RabbitMQ
function publishToQueue(queueName, message) {
    amqp.connect(RABBITMQ_URL, (err, connection) => {
        if (err) {
            throw err;
        }
        connection.createChannel((err, channel) => {
            if (err) {
                throw err;
            }
            channel.assertQueue(queueName, { durable: true });
            channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
            console.log(`Message envoyé à la queue ${queueName}: ${message}`);

            // Fermer la connexion après avoir envoyé le message
            setTimeout(() => {
                connection.close();
            }, 500);
        });
    });
}

module.exports = { publishToQueue };
