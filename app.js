var express = require('express');
var app = express();
const ldap = require('ldapjs');

app.listen(3000, function () {
    console.log("Server started")
})

function authenticationDN(username, password) {

}