const Pool = require('pg').Pool;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const store = require('./storage');
const { error, Console } = require('console');

const saltRounds = 10;

const showInternalError = (req, res) => {
    res.status(500).json({
        status: 500,
        message: 'Internal Server Error'
    });
}

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'AppDB',
    password: 'devpassword',
    port: 5433,
})

const ifExists = (mail) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM userdata WHERE email=$1', [mail], (err, result) => {
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

const getAccount = (userid) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM account WHERE user_id=$1', [userid], (err, result) => {
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
            if (userExists.rowCount === 0) {
                bcrypt.genSalt(saltRounds, (err, salt) => {
                    bcrypt.hash(passwd, salt, (err, passwdH) => {
                        if (err) throw err;
                        pool.query('INSERT INTO userdata(user_name, email, passwd) VALUES ($1, $2, $3) RETURNING userid', [name, email, passwdH], (err, result) => {
                            if (err) throw err;
                            if (result) {
                                pool.query('INSERT INTO account(user_id) VALUES ($1)', [result.rows[0].userid], (err, result) => {
                                    if (err)
                                        throw err;
                                    res.status(201).json({
                                        "status": 201,
                                        "message": "User added successfully"
                                    });
                                });
                            }
                        });
                    })
                })
            } else {
                res.status(409).json({
                    "status": 409,
                    "message": "User already exists"
                });
            }
        } catch (error) {
            // Handle error
            console.error(error)
            showInternalError(req, res);
        }
    },
    getUsers: (req, res) => {
        pool.query('SELECT userdata.user_name AS name, userdata.email AS email, account.amount AS amount\
                    FROM account\
                    INNER JOIN userdata\
                    ON account.user_id = userdata.userid', (err, results) => {
            if (err) {
                console.error(err);
                showInternalError(req, res);
            }
            res.status(200).json(results.rows)
        })
    },
    getUserById: (req, res) => {
        const id = parseInt(req.params.id)

        pool.query('SELECT userdata.user_name AS name, userdata.email AS email, account.amount AS amount\
                    FROM account\
                    INNER JOIN userdata\
                    ON account.user_id = userdata.userid\
                    WHERE account.user_id = $1', [id], (err, results) => {
            if (err) {
                console.error(err);
                showInternalError(req, res);
            }
            res.status(200).json(results.rows)
        })
    },
    login: async (req, res) => {
        if (store.getItem('token') == null) {
            try {
                const user = await getUser(req, res);
                let message;
                let token;
                if (user.rowCount === 1) {
                    const passCheck = await comparePasswords(req.params.passwd, user.rows[0].passwd);
                    if (passCheck) {
                        message = "Logged in";
                        token = jwt.sign(user.rows[0], process.env.JTW_TOKEN_SECRET, { expiresIn: '2d' })
                        store.setItem('token', token);
                        // localStorage.setItem('token', token); -- Browser side
                    }
                    else message = "Passwords do not match";
                } else message = "User not found"
                let statusCode = message === "Logged in" ? 200 : 401;
                res.status(statusCode).json({
                    "status": statusCode,
                    "message": message,
                    "token": token,
                    "user": user.rows
                })
            } catch (e) {
                console.error(e);
                showInternalError(req, res);
            }
        } else {
            res.status(400).json({
                "status": 400,
                "message": "Log out the connected account"
            })
        }
    },
    logout: (req, res) => {
        // localStorage.removeItem("token"); -- Browser side
        try {
            let message;
            const tok = store.getItem("token");
            if (tok == null) message = "Log in first"
            else {
                store.removeItem("token");
                message = "User logged out"
            }
            res.status(200).json({
                status: 200,
                message: message
            })
        } catch (err) {
            console.error(err);
            showInternalError(req, res);
        }
    },

    // Account handling
    createAccount: (req, res) => {
        const amount = req.params.amount ? req.params.amount : 0;
        const userID = req.user.userid;

        pool.query('INSERT INTO account (amount, userid) VALUES ($1, $2) RETURNING *', [amount, userID], (error, result) => {
            if (error) {
                console.error(error);
                showInternalError(req, res);
            }
            res.json({
                "status": 201,
                "result": `Account added with ID: ${result.rows[0].accountid}`
            });
        });
    },
    getAccounts: (req, res) => {
        pool.query('SELECT * FROM account ORDER BY accountid ASC', (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).json({
                    status: 500,
                    message: 'Internal Server Error'
                });
            }
            res.status(200).json(results.rows)
        })
    },
    getAccountById: (req, res) => {
        const id = parseInt(req.params.id)

        pool.query('SELECT * FROM account WHERE accountid = $1', [id], (err, results) => {
            if (err) {
                console.error(err);
                showInternalError(req, res);
            }
            res.status(200).json(results.rows)
        })
    },
    updateAmount: (req, res) => {
        try {
            const amountsData = [
                [req.user.userid, req.params.amount],
                [req.params.receiver, req.receiverAmount]
            ]

            amountsData.forEach((data) => {
                if (data[0]) {
                    pool.query('UPDATE account SET amount=$1 WHERE user_id=$2', [data[1], data[0]], (err, res) => {
                        if (err)
                            throw err;
                    })
                }
            })
            res.status(200).json({
                "status": 200,
                "message": "Amount successfully updated"
            })
        } catch (e) {
            console.error(e);
            showInternalError(req, res);
        }

    },

    // Transactions handling
    sendMoney: async (req, res, next) => {
        try {
            // Get sender account and amount
            const senderAccount = await getAccount(req.user.userid);
            let senderAmount = parseInt(senderAccount.rows[0].amount);
            if (senderAmount < parseInt(req.params.amount)) {
                res.status(401).json({
                    status: 401,
                    amount: senderAmount,
                    message: 'Not sufficient amount',
                    tip: 'Please recharge your account'
                })
            } else {
                // Get receiver account and amount
                const receiverAccount = await getAccount(req.params.receiver);
                if (receiverAccount.rowCount !== 0) {
                    let receiverAmount = parseInt(receiverAccount.rows[0].amount);

                    // Make transaction
                    senderAmount -= parseInt(req.params.amount);
                    receiverAmount += parseInt(req.params.amount);

                    // Update amounts
                    req.params.amount = senderAmount;
                    req.receiverAmount = receiverAmount;

                    next()
                } else {
                    res.status(404).json({
                        status: 404,
                        message: 'Receiver not found !'
                    })
                }
            }
        } catch (err) {
            console.error(err);
            showInternalError(req, res);
        }
    },
    getTransactions: (req, res) => {
        pool.query('SELECT * FROM transactions ORDER BY userid ASC', (err, results) => {
            if (err) {
                console.error(err);
                showInternalError(req, res);
            }
            res.status(200).json(results.rows)
        })
    },
    getTransactionById: (req, res) => {
        const id = parseInt(req.params.id)

        pool.query('SELECT * FROM transaction WHERE transactionid = $1', [id], (err, results) => {
            if (err) {
                console.error(err);
                showInternalError(req, res);
            }
            res.status(200).json(results.rows)
        })
    },
}