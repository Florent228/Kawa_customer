const amqp = require('amqplib/callback_api');

// Adresse RabbitMQ, modifiable selon vos besoins
const RABBITMQ_URL = 'amqp://host.docker.internal:5672'; 

// Fonction pour envoyer un message à RabbitMQ
function publishToQueue(queueName, message) {
    amqp.connect(RABBITMQ_URL, (err, connection) => {
        if (err) {
            console.error(`Erreur de connexion à RabbitMQ : ${err.message}`);
            return;
        }
        connection.createChannel((err, channel) => {
            if (err) {
                console.error(`Erreur lors de la création du canal : ${err.message}`);
                connection.close();
                return;
            }
            channel.assertQueue(queueName, { durable: true }, (err, ok) => {
                if (err) {
                    console.error(`Erreur lors de la déclaration de la queue : ${err.message}`);
                    return;
                }
                channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
                console.log(`Message envoyé à la queue ${queueName}: ${message}`);
            });

            // Fermer la connexion après avoir envoyé le message
            setTimeout(() => {
                connection.close();
                console.log('Connexion fermée après envoi du message');
            }, 500);
        });
    });
}

module.exports = { publishToQueue };
