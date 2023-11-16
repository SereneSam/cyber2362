const express = require("express");
const ldap = require("ldapjs");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const port = 3000;
const fileManager = require('./fileManagementSystem');


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
})

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
      // Send the error message in the URL query parameters
      return res.redirect("/loginPage?error=Login%20failed.%20Check%20your%20username%20and%20password.");
    }
    // If authentication is successful, continue with other logic or redirect
    res.redirect("/filesPage");
    client.unbind();
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// 
app.post('/fileAction', (req, res) => {
  const action = req.body.action;
  const fileName = req.body.fileName;
  const content = req.body.content;

  switch (action.toLowerCase()) {
    case 'add':
      fileManager.addFile(fileName, content || '');
      break;
    case 'delete':
      fileManager.deleteFile(fileName);
      break;
    case 'list':
      fileManager.listFiles();
      break;
    default:
      console.log('Invalid action. Use "add", "delete", or "list".');
  }

  res.redirect('/filesPage');
});