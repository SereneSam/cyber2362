const express = require("express");
const ldap = require("ldapjs");
const winston = require("winston");
const session = require("express-session");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const path = require("path");
const https = require("https");
const fs = require("fs");
const port = 13089;
const app = express();
const portHTTP = 3000;
const portHTTPS = 3443;
const archiver = require("archiver");
const { log } = require("console");

const logger = winston.createLogger({
  transports: [new winston.transports.File({ filename: "log.txt" })],
});

const authenticate = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next(); // User is authenticated, continue to the next middleware
  } else {
    res.redirect("/loginPage"); // Redirect to the login page if not authenticated
  }
};

function xorCipher(password, key) {
  // Ensure the key is repeated to match the length of the message
  key =
    key.repeat(Math.floor(password.length / key.length)) +
    key.slice(0, password.length % key.length);

  // Use Array.from and String.fromCharCode to perform XOR on corresponding elements of message and key
  const encrypted = Array.from(password, (char, index) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index))
  ).join("");

  return encrypted;
}

app.use(
  session({
    secret: "12345",
    resave: true,
    saveUninitialized: true,
  })
);

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
app.get("/fileExplorer", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname + "/fileExplorer.html"));
});

app.get("/fileExplorerUser", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname + "/fileExplorerUser.html"));
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
  const password1 = xorCipher(password, "123");
  console.log(password1);

  //LDAP connection setup
  const client = ldap.createClient({
    url: ["ldap://127.0.0.1:13089", "ldap://127.0.0.2:13089"],
  });

  // LDAP bind to authenticate the user
  client.bind(`cn=${username}`, password1, (err) => {
    if (err) {
      const errorMessage = `Authentication failed for user ${username}: ${err.message}`;
      logger.error(errorMessage);
      res.send(`
        <script>
          alert("Login failed! Please check your username and password.");
          window.location.href = "/loginPage";
        </script>
      `);
    } else if (username == "admin") {
      console.log(`${username} authenticated successfully`);
      logger.info(`${username} authenticated successfully`);
      req.session.isAuthenticated = true;
      req.session.username = username;
      res.redirect("/filesPage");
    } else {
      console.log(`${username} authenticated successfully`);
      logger.info(`${username} authenticated successfully`);
      req.session.isAuthenticated = true;
      req.session.username = username;
      res.redirect("/fileExplorerUser");
    }

    // Close the LDAP connection
    client.unbind();
  });
});

app.post("/filesPage", authenticate, (req, res) => {
  const uploadedFile = req.files && req.files.file; // req.files && added

  if (!uploadedFile) {
    console.log(`No files were committed.`);
    logger.info(`No files were committed.`);
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
      console.log(`${uploadedFile.name} upload failed.`);
      logger.info(`${uploadedFile.name} upload failed.`);

      return res.send(`
        <script>
            alert("${failureMessage}");
            window.location.href = "/filesPage";
        </script>
    `);
    }

    const successMessage = `${uploadedFile.name} uploaded successfully :)`;
    console.log(`${uploadedFile.name} uploaded successfully.`);

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
  logger.info("Entire request body:", req.body);
  logger.info("Files to delete:", filesToDelete);

  if (!filesToDelete || !Array.isArray(filesToDelete)) {
    console.error("Invalid or missing files to delete.");
    logger.error(`${filesToDelete} is/are invalid or missing file(s).`);
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
    logger.error("Error deleting files:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// downloadFiles here
app.post("/downloadFiles", (req, res) => {
  const filesToDownload = req.body.files;

  console.log("Files to download:", filesToDownload);
  logger.info("Files to download:", filesToDownload);

  if (!filesToDownload || filesToDownload.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid or missing files to download." });
  }

  // Create a zip archive
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level
  });

  // Set the response headers
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=downloaded_files.zip"
  );

  // Pipe the archive to the response stream
  archive.pipe(res);

  // Add files to the archive
  filesToDownload.forEach((file) => {
    const filePath = path.join(__dirname, "uploaded_files", file);

    // Check if the file exists before adding it to the archive
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
    }
  });

  // Finalize the archive and send it to the response stream
  archive.finalize();
});

app.post("/logout", (req, res) => {
  const username = req.session.username;

  if (username) {
    console.log(`${username} has logged out.`);
    logger.info(`${username} has logged out.`);
    req.session.isAuthenticated = false;
    req.session.username = null;
    res.redirect("/loginPage");
  } else {
    res.send("User not logged in");
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
