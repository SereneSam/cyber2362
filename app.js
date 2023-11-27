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

const logout = require('./logout');

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
  const files = fileManager.listFiles();
  res.json(files);
});

// Handle login form submission
app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // LDAP authentication logic
  const client = ldap.createClient({
    url: 'ldap://localhost:10389',
  });

  try {
    // Admin login
    await bindClient(client, `uid=${username},ou=system`, password);

    // Admin login successful
    res.redirect('/filesPage');
    client.unbind(); // Ensure unbind is called
  } catch (adminErr) {
    try {
      // Regular user login if admin login fails
      await bindClient(client, `cn=${username},ou=users,ou=system`, password);

      // Regular user login successful
      res.redirect('/filesPage');
      client.unbind(); // Ensure unbind is called
    } catch (userErr) {
      // Both admin and regular user logins failed
      console.error('Login Error:', userErr.message);
      res.send(`
        <script>
          alert("Login failed! Please check your username and password.");
          window.location.href = "/loginPage";
        </script>
      `);
    }
  }
});

function bindClient(client, dn, password) {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

app.post('/filesPage', (req, res) => {
  const uploadedFile = req.files.file;

  if (!uploadedFile) {
    const missingMessage = `No file to commit :(`;
    return res.send(`
        <script>
            alert("${missingMessage}");
            window.location.href = "/filesPage";
        </script>
    `);
  }

  const uploadPath = path.join(__dirname, 'uploaded_files', uploadedFile.name);

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      const failureMessage = `${uploadedFile.name} upload failed :(`;

      return res.send(`
        <script>
            alert("${failureMessage}");
            window.location.href = "/filesPage";
        </script>
    `);
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
