const Express       = require("express");
const bodyParser    = require("body-parser");
const pgQueries     = require('./db');
const middlewares   = require('./middlewares');

process.env.JTW_TOKEN_SECRET = require('crypto').randomBytes(32).toString('hex')
const port = 8000;

const app = Express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
        extended: true
    })
);

app.get('/', (req, res) => {
    res.json({info: 'Transaction App api'})
})

// GET routes
// -- Account --
app.get('/api/accounts', pgQueries.getAccounts);
app.get('/api/account/:id', pgQueries.getAccountById);

// -- User --
app.get('/api/users', pgQueries.getUsers);
app.get('/api/user/:id', pgQueries.getUserById);
app.get('/api/logout/', pgQueries.logout);

// -- Transaction --
app.get('/api/transactions', pgQueries.getUsers);
app.get('/api/transaction/:id', pgQueries.getUserById);


// POST routes
// -- Account --
app.post('/api/new-account/', pgQueries.createAccount);

// --  User --
app.post('/api/create-user/:name/:email/:passwd/', pgQueries.createUser);
app.post('/api/login/:mail/:passwd', pgQueries.login);

// -- Transaction
app.post('/api/transaction/send-money/:amount/:receiver/', middlewares.authenticateToken, pgQueries.sendMoney, pgQueries.updateAmount);


// PUT routes
// -- Account --
app.put('/api/update-amount/:amount', middlewares.authenticateToken, pgQueries.updateAmount);



app.listen(port, () => {
    console.log("listening on http://localhost:" + port);
});
