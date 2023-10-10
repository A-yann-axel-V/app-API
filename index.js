const Express       = require("express");
const bodyParser    = require("body-parser");
const pgQueries     = require('./db')

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
app.get('/api/login/:mail/:passwd', pgQueries.login)
app.get('/api/logout/')

// POST routes
// -- Account --
app.post('/api/new-account/', pgQueries.createAccount);
app.post('/api/update-amount/:id/:amount', pgQueries.updateAmount);
// --  User --
app.post('/api/create-user/:name/:email/:passwd/', pgQueries.createUser);

app.listen(port, () => {
    console.log("listening on http://localhost:" + port);
});
