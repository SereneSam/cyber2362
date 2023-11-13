const express = require("express");
const ldap = require("ldapjs");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Serve HTML login page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/loginPage.html");
});

app.get("/filesPage", (req, res) => {
  res.sendFile(path.join(__dirname + "/filesPage.html"));
});

app.get("/loginPage", (req, res) => {
  res.sendFile(path.join(__dirname + "/loginPage.html"));
});

// Handle login form submission
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // LDAP authentication logic
  const client = ldap.createClient({
    url: "ldap://localhost:10389",
  });

  client.bind(`cn=${username},ou=users,ou=system`, password, (err) => {
    if (err) {
      res.send("Login failed. Check your username and password.");
    } else {
      res.redirect("/filesPage");
    }

    client.unbind();
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
