const jwt = require('jsonwebtoken');

module.exports = function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated() || req.cookies.jwt) {
        if (req.cookies.jwt) {
            jwt.verify(req.cookies.jwt, 'jwt_secret_key', (err, decoded) => {
                if (err) {
                    return res.redirect('/login');
                }
                req.user = decoded;
                return next();
            });
        } else {
            return next();
        }
    } else {
        res.redirect('/login');
    }
};
