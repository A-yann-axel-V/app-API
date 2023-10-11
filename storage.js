const LocalStorage     = require('node-localstorage').LocalStorage;

const storage = new LocalStorage('./.user-data');

module.exports = storage;