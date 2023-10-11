const jwt       = require('jsonwebtoken')
const store     = require('./storage')

const storeInLocalStorage = (token) => {
    localStorage.setItem('token', token);
}

module.exports = {
    authenticateToken: (req, res, next) => {
        // const token = req.headers['authorization'].split(' ')[1];
        // const token = localStorage.getItem('token'); -- Browser side
        const token = store.getItem('token')
        if (token == null) {
            res.status(401).json({
                statusCode: 401,
                message: 'Invalid token provided',
                tip: 'Log in first ;)'
            })
        } else {
            jwt.verify(token, process.env.JTW_TOKEN_SECRET, (err, result) => {
                if (err) {
                    res.status(401).json({
                        statusCode: 401,
                        message: 'Invalid or expired token',
                        tip: 'Log in again -_-'
                    })
                } else {
                    req.user = result;
                    next();
                }
            })
        }
    }
}