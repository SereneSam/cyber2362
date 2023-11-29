const ldap = require('ldapjs');

const client = ldap.createClient({
  url: ['ldap://127.0.0.1:13089', 'ldap://127.0.0.2:13089']
});

client.on('connectError', (err) => {
  // handle connection error
})