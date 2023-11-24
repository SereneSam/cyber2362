const express = require("express");
const ldap = require("ldapjs");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const path = require("path");
const app = express();
const port = 3000;
const fileManager = require('./fileManagementSystem');
const https = require('https');
const fs = require('fs');

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use('/', (req, res, next) => {
  res.send('Hello from SSL server')
})

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
      // return res.redirect("/loginPage?error=Login%20failed.%20Check%20your%20username%20and%20password.");
      return res.send(`
            <script>
                alert("Login failed. Check your username and password.");
                window.location.href = "/loginPage";
            </script>
        `);
    }
    // If authentication is successful, continue with other logic or redirect
    res.redirect("/filesPage");
    client.unbind();
  });
});

app.post('/uploadFile', (req, res) => {
  const uploadedFile = req.files.file;

  if (!uploadedFile) {
    return res.status(400).send('No file uploaded.');
  }

  const uploadPath = path.join(__dirname, 'uploaded_files', uploadedFile.name);

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    res.send('File uploaded successfully!');
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

// for https protocol
const sslServer = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
  },
  app
)

sslServer.listen(3443, () => console.log("Secure server on port 3443"))