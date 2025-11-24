const Datastore = require('nedb-promises');

const clientsDB = Datastore.create({
  filename: './database/clients.db',
  autoload: true
});

module.exports = clientsDB;
