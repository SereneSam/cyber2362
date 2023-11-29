const ldap = require('ldapjs');

console.log('LDAP Client is being made');
const client = ldap.createClient({
  url: ['ldap://127.0.0.1:13089', 'ldap://127.0.0.2:13089']
});
console.log('LDAP Client had been made');
client.on('connectError', (err) => {
  // handle connection error
})
console.log('LDAP Client.on has no error');