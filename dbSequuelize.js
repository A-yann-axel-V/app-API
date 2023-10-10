import {Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize('AppDB', 'postgres', 'devpassword', {
    host: 'localhost',
    port: 5433,
    dialect: 'postgresql'
});

try {
    sequelize.authenticate();
    console.log("Connection established");
} catch (e) {
    console.error("Error " + e.message + " found");
}

const Accounts = sequelize.define('account', {
    id: {
        field: 'accountID',
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    amount: {
        field: 'user amount',
        type: DataTypes.INTEGER,
    },
    timestamps: false,
});

sequelize.sync({ force: true });

module.exports = Accounts;
