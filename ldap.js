const ldap = require("ldapjs");
const session = require("express-session");
const express = require("express");
const app = express();

app.use(
  session({
    secret: "12345",
    resave: true,
    saveUninitialized: true,
  })
);

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

const adminPassword = xorCipher("cyberguy2362", "123");
const userPassword = xorCipher("cyberguy12345", "123");

///--- Shared handlers

function authorize(req, res, next) {
  /* Any user may search after bind, only cn=root has full power */
  const isSearch = req instanceof ldap.SearchRequest;
  if (!req.connection.ldap.bindDN.equals("cn=root") && !isSearch)
    return next(new ldap.InsufficientAccessRightsError());

  return next();
}

///--- Globals

const SUFFIX = "o=joyent";
const db = {};
const server = ldap.createServer();

server.bind("cn=admin", (req, res, next) => {
  if (req.dn.toString() !== "cn=admin" || req.credentials !== adminPassword)
    return next(new ldap.InvalidCredentialsError());

  res.end();
  return next();
});

server.bind("cn=chris", (req, res, next) => {
  if (req.dn.toString() !== "cn=chris" || req.credentials !== userPassword)
    return next(new ldap.InvalidCredentialsError());

  res.end();
  return next();
});

server.add(SUFFIX, authorize, (req, res, next) => {
  const dn = req.dn.toString();

  if (db[dn]) return next(new ldap.EntryAlreadyExistsError(dn));

  db[dn] = req.toObject().attributes;
  res.end();
  return next();
});

server.bind(SUFFIX, (req, res, next) => {
  const dn = req.dn.toString();
  if (!db[dn]) return next(new ldap.NoSuchObjectError(dn));

  if (!db[dn].userpassword)
    return next(new ldap.NoSuchAttributeError("userPassword"));

  if (db[dn].userpassword.indexOf(req.credentials) === -1)
    return next(new ldap.InvalidCredentialsError());

  res.end();
  return next();
});

server.compare(SUFFIX, authorize, (req, res, next) => {
  const dn = req.dn.toString();
  if (!db[dn]) return next(new ldap.NoSuchObjectError(dn));

  if (!db[dn][req.attribute])
    return next(new ldap.NoSuchAttributeError(req.attribute));

  const matches = false;
  const vals = db[dn][req.attribute];
  for (const value of vals) {
    if (value === req.value) {
      matches = true;
      break;
    }
  }

  res.end(matches);
  return next();
});

server.del(SUFFIX, authorize, (req, res, next) => {
  const dn = req.dn.toString();
  if (!db[dn]) return next(new ldap.NoSuchObjectError(dn));

  delete db[dn];

  res.end();
  return next();
});

server.modify(SUFFIX, authorize, (req, res, next) => {
  const dn = req.dn.toString();
  if (!req.changes.length)
    return next(new ldap.ProtocolError("changes required"));
  if (!db[dn]) return next(new ldap.NoSuchObjectError(dn));

  const entry = db[dn];

  for (const change of req.changes) {
    mod = change.modification;
    switch (change.operation) {
      case "replace":
        if (!entry[mod.type])
          return next(new ldap.NoSuchAttributeError(mod.type));

        if (!mod.vals || !mod.vals.length) {
          delete entry[mod.type];
        } else {
          entry[mod.type] = mod.vals;
        }

        break;

      case "add":
        if (!entry[mod.type]) {
          entry[mod.type] = mod.vals;
        } else {
          for (const v of mod.vals) {
            if (entry[mod.type].indexOf(v) === -1) entry[mod.type].push(v);
          }
        }

        break;

      case "delete":
        if (!entry[mod.type])
          return next(new ldap.NoSuchAttributeError(mod.type));

        delete entry[mod.type];

        break;
    }
  }

  res.end();
  return next();
});

server.search(SUFFIX, authorize, (req, res, next) => {
  const dn = req.dn.toString();
  if (!db[dn]) return next(new ldap.NoSuchObjectError(dn));

  let scopeCheck;

  switch (req.scope) {
    case "base":
      if (req.filter.matches(db[dn])) {
        res.send({
          dn: dn,
          attributes: db[dn],
        });
      }

      res.end();
      return next();

    case "one":
      scopeCheck = (k) => {
        if (req.dn.equals(k)) return true;

        const parent = ldap.parseDN(k).parent();
        return parent ? parent.equals(req.dn) : false;
      };
      break;

    case "sub":
      scopeCheck = (k) => {
        return req.dn.equals(k) || req.dn.parentOf(k);
      };

      break;
  }

  const keys = Object.keys(db);
  for (const key of keys) {
    if (!scopeCheck(key)) return;

    if (req.filter.matches(db[key])) {
      res.send({
        dn: key,
        attributes: db[key],
      });
    }
  }

  res.end();
  return next();
});

///--- Fire it up

server.listen(13089, "127.0.0.1", function () {
  console.log("LDAP server listening at: " + server.url);
});
