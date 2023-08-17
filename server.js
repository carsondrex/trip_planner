// Imports/Requires
const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const argon2 = require("argon2");

// Create express app with static handler
const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// Host configuration (currently local)
const hostname = "localhost";
const port = 3000;

let tokenStorage = {};

const { Pool } = require("pg");
const env = require("./env.json");
const pool = new Pool(env);

pool.connect().then(() => {
    console.log("Connected to database");
});

function makeToken() {
    return crypto.randomBytes(32).toString("hex");
}

function validateLogin(body) {
    const { username, password } = body;
    return username && password && username.length >= 3 && password.length >= 6;
}

app.post("/create", async (req, res) => {
    const { body } = req;
    if (!validateLogin(body)) {
        return res.status(400).send("Invalid username or password\n");
    }
    const { username, password } = body;

    let hash;
    try {
        hash = await argon2.hash(password);
    } catch (error) {
        console.log("HASH FAILED", error);
        return res.status(500).send("Error hashing password\n");
    }

    try {
        await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hash]);
        return res.status(200).send("Account created successfully\n");
    } catch (error) {
        console.log("INSERT FAILED", error);
        return res.status(500).send("Error inserting user information\n")
    }
});

app.post("/login", async (req, res) => {
    const { body } = req;
    if (!validateLogin(body)) {
        return res.status(400).send("Invalid username or password\n");
    }
    const { username, password } = body;

    let result;
    try {
        result = await pool.query("SELECT password FROM users WHERE username = $1", [username]);
    } catch (error) {
        console.log("SELECT FAILED", error);
        return res.status(500).send("Error querying database\n");
    }

    if (result.rows.length === 0) {
        return res.status(400).send("Username not found\n");
    }

    const hash = result .rows[0].password;

    let verifyResult;
    try {
        verifyResult = await argon2.verify(hash, password);
    } catch (error) {
        console.log("VERIFY FAILED", error);
        return res.status(500).send("Error verifying password\n");
    }

    if (!verifyResult) {
        console.log("Credentials didn't match");
        return res.status(400).send("Invalid credentials\n");
    }

    const token = makeToken();
    tokenStorage[token] = username;

    return res
        .cookie("token", token, { httpOnly: true, secure: true, sameSite: "strict" })
        .send("Login successful\n");
});

let authorize = (req, res, next) => {
    const { token } = req.cookies;
    if (!token || !tokenStorage.hasOwnProperty(token)) {
        return res.status(403).send("Unauthorized\n");
    }
    next();
};

app.post("/logout", (req, res) => {
    const { token } = req.cookies;
    if (token && tokenStorage.hasOwnProperty(token)) {
        delete tokenStorage[token];
        return res
            .clearCookie("token", { httpOnly: true, secure: true, sameSite: "strict" })
            .status(200)
            .send("Logged out\n");
    }
    return res.status(400).send("Not logged in\n");
});

const checkAuth = (req, res, next) => {
    const { token } = req.cookies;
    if (token && tokenStorage.hasOwnProperty(token)) {
        next();
    } else {
        res.redirect("/login");
    }
};

app.get("/", checkAuth, (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// Start server
app.listen(port, hostname, (req, res) => {
    console.log(`http://${hostname}:${port}`);
});