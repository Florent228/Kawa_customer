const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send({ message: "Aucun token fourni!" });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Non autorisé!" });
        }
        req.userId = decoded.id;
        next();
    });
};

module.exports = verifyToken;
