const Pool      = require('pg').Pool;
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken')

const saltRounds = 10;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'AppDB',
    password: 'devpassword',
    port: 5433,
})

const ifExists = (mail) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM userdata WHERE email=$2', [mail], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

const getUser = (req, res) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM userdata WHERE email=$1', [req.params.mail], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

const comparePasswords = (passwd, hashedPasswd) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(passwd, hashedPasswd, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

module.exports = {
    // Users handling
    createUser: async (req, res) => {
        const name = req.params.name;
        const email = req.params.email;
        const passwd = req.params.passwd;

        try {
            const userExists = await ifExists(email);
            if (!(userExists.rowCount !== 0)) {
                bcrypt.genSalt(saltRounds, (err, salt) => {
                    bcrypt.hash(passwd, salt, (err, passwdH) => {
                        if (err) throw err;
                        pool.query('INSERT INTO userdata(user_name, email, passwd) VALUES ($1, $2, $3)', [name, email, passwdH], (err, result) => {
                            if (err)
                                throw err;
                            res.status(200).json({
                                "status": 200,
                                "message": "User added successfully"
                            });
                        });
                    })
                })
            } else {
                res.status(500).json({
                    "status": 500,
                    "message": "User already exists"
                });
            }
        } catch (error) {
            // Handle error
            console.error(error);
            res.status(500).json({
                "status": 500,
                "message": "Internal Server Error"
            });
        }
    },
    getUsers: (req, res) => {
        pool.query('SELECT * FROM userdata ORDER BY userid ASC', (err, results) => {
            if (err)
                throw err
            res.status(200).json(results.rows)
        })
    },
    login: async (req, res) => {
        try {
            const user = await getUser(req, res);
            let message;
            if (user.rowCount === 1) {
                const passCheck = await comparePasswords(req.params.passwd, user.rows[0].passwd);
                if (passCheck) message = "Logged in";
                else message = "Passwords do not match";
            } else message = "User not found"
            let statusCode = message === "Logged in" ? 200 : 500;
            res.status(200).json({
                "status": statusCode,
                "message": message,
                "token": "myjsonwebtoken"
            })
        } catch (error) {
            console.error(error);
        }
    },

    // Account handling
    createAccount: (req, res) => {
        const amount = 0;

        pool.query('INSERT INTO account (amount) VALUES ($1) RETURNING *', [amount], (error, result) => {
            if (error)
                throw error;
            res.json({
                "status": 200,
                "result": `Account added with ID: ${result.rows[0].accountid}`
            });
        });
    },
    getAccounts: (req, res) => {
        pool.query('SELECT * FROM account ORDER BY accountid ASC', (err, results) => {
            if (err)
                throw err
            res.status(200).json(results.rows)
        })
    },
    getAccountById: (req, res) => {
        const id = parseInt(request.params.id)

        pool.query('SELECT * FROM account WHERE accountid = $1', [id], (err, results) => {
            if (err)
                throw err
            res.status(200).json(results.rows)
        })
    },
    updateAmount: (req, res) => {
        const id = req.params.id
        const amount = req.params.amount

        pool.query('UPDATE account SET amount=$1 WHERE accountid=$2', [amount, id], (err, result) => {
            if (err)
                throw err;
            res.json({
                "status": 200,
                "message": "Amount successfully updated"
            })
        })
    }
}