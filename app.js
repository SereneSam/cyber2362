const express = require('express');
const ldap = require('ldapjs');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();
const portHTTP = 3000;
const portHTTPS = 3443;
const fileManager = require('./fileManagementSystem');

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Serve HTML login page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/loginPage.html');
});

app.get('/filesPage', (req, res) => {
  res.sendFile(path.join(__dirname + '/filesPage.html'));
});

app.get('/loginPage', (req, res) => {
  res.sendFile(path.join(__dirname + '/loginPage.html'));
});

// Serve HTML file explorer page
app.get("/fileExplorer", (req, res) => {
  const uploadPath = path.join(__dirname, 'uploaded_files');
  const files = fs.readdirSync(uploadPath);

  res.render('fileExplorer', { files });
});

// Handle login form submission
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // LDAP authentication logic
  const client = ldap.createClient({
    url: 'ldap://localhost:10389',
  });

  client.bind(`cn=${username},ou=users,ou=system`, password, (err) => {
    if (err) {
      return res.send(`
            <script>
                alert("Login failed. Check your username and password.");
                window.location.href = "/loginPage";
            </script>
        `);
    }
    // If authentication is successful, continue with other logic or redirect
    res.redirect('/filesPage');
    client.unbind();
  });
});

app.post('/filesPage', (req, res) => {
  const uploadedFile = req.files.file;

  if (!uploadedFile) {
    return res.status(400).send('No file uploaded.');
  }

  const uploadPath = path.join(__dirname, 'uploaded_files', uploadedFile.name);

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    const successMessage = `${uploadedFile.name} uploaded successfully :)`;

    return res.send(`
        <script>
            alert("${successMessage}");
            window.location.href = "/filesPage";
        </script>
    `);
  });
});

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

// Redirect to HTTPS if not secure
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Redirect to HTTP
app.use((req, res, next) => {
  if (req.secure) {
    return res.redirect(`http://${req.headers.host}${req.url}`);
  }
  next();
});


// Create HTTPS server
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
};

const sslServer = https.createServer(sslOptions, app);

// Start both HTTP and HTTPS servers
app.listen(portHTTP, () => {
  console.log(`HTTP Server is running on http://localhost:${portHTTP}`);
});

sslServer.listen(portHTTPS, () => {
  console.log(`HTTPS Server is running on https://localhost:${portHTTPS}`);
});
