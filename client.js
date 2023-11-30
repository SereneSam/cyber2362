const express = require("express");
const ldap = require("ldapjs");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const path = require("path");
const https = require("https");
const fs = require("fs");
const port = 13089;
const app = express();
const portHTTP = 3000;
const portHTTPS = 3443;

const logout = require("./logout");

app.use(fileUpload());
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

// Serve HTML file explorer page
app.get("/fileExplorer", (req, res) => {
  res.sendFile(path.join(__dirname + "/fileExplorer.html"));
});

// List of files for easy access
app.get("/fileList", (req, res) => {
  const directoryPath = path.join(__dirname, "uploaded_files");

  try {
    // Read the files in the directory synchronously
    const files = fs.readdirSync(directoryPath);
    res.json(files);
  } catch (err) {
    console.error("Error reading files:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Express route for handling LDAP authentication
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // LDAP connection setup
  const client = ldap.createClient({
    url: ["ldap://127.0.0.1:13089", "ldap://127.0.0.2:13089"],
  });

  // LDAP bind to authenticate the user
  client.bind(`cn=${username}`, password, (err) => {
    if (err) {
      console.error("Login Error:", err);
      res.send(`
        <script>
          alert("Login failed! Please check your username and password.");
          window.location.href = "/loginPage";
        </script>
      `);
    } else {
      res.redirect("/filesPage");
    }

    // Close the LDAP connection
    client.unbind();
  });
});

app.post("/filesPage", (req, res) => {
  const uploadedFile = req.files && req.files.file; // req.files && added

  if (!uploadedFile) {
    const missingMessage = `No file to commit :(`;
    return res.send(`
        <script>
            alert("${missingMessage}");
            window.location.href = "/filesPage";
        </script>
    `);
  }

  const uploadPath = path.join(__dirname, "uploaded_files", uploadedFile.name);

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

app.use(express.json());
app.post("/deleteFile/", (req, res) => {
  const filesToDelete = req.body.files;

  console.log("Entire request body:", req.body);
  console.log("Files to delete:", filesToDelete);

  if (!filesToDelete || !Array.isArray(filesToDelete)) {
    console.error("Invalid or missing files to delete.");
    return res.status(400).json({ error: "Bad Request" });
  }

  try {
    const directoryPath = path.join(__dirname, "uploaded_files");

    filesToDelete.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      fs.unlinkSync(filePath);
    });

    res.json({ message: "Files deleted successfully" });
  } catch (err) {
    console.error("Error deleting files:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Redirect to HTTPS if not secure
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(
      `https://${req.headers.host.replace(/:[0-9]+/, "")}:${portHTTPS}${
        req.url
      }`
    );
  }
  next();
});

// Redirect to HTTP
// app.use((req, res, next) => {
//   if (req.secure) {
//     return res.redirect(`http://${req.headers.host}${req.url}`);
//   }
//   next();
// });

// Create HTTPS server
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "cert", "server.key")),
  cert: fs.readFileSync(path.join(__dirname, "cert", "server.crt")),
};

const sslServer = https.createServer(sslOptions, app);

// Start both HTTP and HTTPS servers
app.listen(portHTTP, () => {
  console.log(`HTTP Server is running on http://127.0.0.1:${portHTTP}`);
});

sslServer.listen(portHTTPS, () => {
  console.log(`HTTPS Server is running on https://127.0.0.1:${portHTTPS}`);
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
