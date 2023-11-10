/* in terminal:
npm install express
npm install ldapjs */
var express = require('express');
var app = express();
var ldap = require('ldapjs');

app.listen(3000, function () {
    console.log("server started")
})

/*update the url according to your ldap address*/

/*use this to create connection*/
function authenticateDN(username, password) {
    var client = ldap.createClient({
        url: 'ldap://127.0.0.1:10389'
    });
    
    /*bind use for authentication*/
    client.bind(username, password, function (err) {
        if (err) {
            console.log("Error in new connetion " + err)
        } else {
            /*if connection is success then go for any operation*/
            console.log("Success");
        }
    });
}
    authenticateDN("uid=admin,ou=system", "secret")
        