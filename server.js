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

//functionality for date selection to calendar page
let monthChart = {1: 0, 2: 3, 3: 3, 4: 6, 5: 1, 6: 4, 7: 6, 8: 2, 9: 5, 10: 0, 11: 3, 12: 5}
let daysInMonth = { 1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 }

app.get("/calendar", (req, res) => {
    let startDate = req.query.start;
    let endDate = req.query.end;

    let startMonth = startDate.substring(0, 2);
    let startDay = startDate.substring(3, 5);
    let startYear = startDate.substring(6);
    let endMonth = endDate.substring(0, 2);
    let endDay = endDate.substring(3, 5);
    let endYear = endDate.substring(6);
    let startDecade = startDate.substring(8);
    let startYearCode;

    //validation
    try {
        startMonth = parseInt(startMonth);
        startDay = parseInt(startDay);
        startYear = parseInt(startYear);
        endMonth = parseInt(endMonth);
        endDay = parseInt(endDay);
        endYear = parseInt(endYear);
        startDecade = parseInt(startDecade);

        if (!startDate || !endDate) {
            throw new Error("Invalid Date(s).");
        }
        else if (startYear !== endYear) {
            throw new Error("Invalid Date. Year must be the same.");
        }
        else if (startMonth > endMonth || (endMonth === startMonth && startDay > endDay)){
            throw new Error("Invalid Date. End date should come after start date.");
        }
        else if (startDay > daysInMonth[startMonth] || endDay > daysInMonth[endMonth]) {
            throw new Error("Invalid Date.");
        }
        if (startMonth > 12 || startMonth < 1 || endMonth > 12 || endMonth < 1 || startDay > 31 || startDay < 1 || endDay > 31 || endDay < 1 || startYear > 2399 ||
            startYear < 1400 || endYear > 2399 || endYear < 1400) {
            throw new Error("Invalid Date");
        }
        if (isNaN(startMonth) || isNaN(startDay) || isNaN(startYear) || isNaN(endMonth) || isNaN(endDay) || isNaN(endYear)) {
            throw new Error("Invalid Date");
        }
        startYearCode = getYearCode(startYear);
        if (startYearCode == NaN) {
            throw new Error("Invalid Date. Year must be between 1400 and 2399.");
        }
    } catch (error) {
        res.statusCode = 400;
        res.json({"error": error.message});
        return
    }
    //calculates the day of the week of the start of the vacation and the first day of the month so that the calendar is accurate
    let startDayOfTheWeek = (startDay + monthChart[startMonth] + startYearCode + startDecade + Math.floor(startDecade / 4)) % 7
    let firstDayStarter = (1 + startYearCode + startDecade + Math.floor(startDecade / 4));// + monthChart[month] in client
    let firstWeekDayOfMonth = (1 + monthChart[startMonth] + startYearCode + startDecade + Math.floor(startDecade / 4)) % 7

    //leap years have an extra day in february, so we'll send a json key if it is a leap year
    let leapYear = false;
    if (startYear % 4 === 0) {
        startDayOfTheWeek = startDayOfTheWeek - 1
        firstWeekDayOfMonth = firstWeekDayOfMonth - 1
        leapYear = true
    }

    res.statusCode = 200;
    res.json({"weekDay": startDayOfTheWeek,
    "firstWeekDayOfMonth": firstWeekDayOfMonth,
    "start": {
        "month": startMonth,
        "day": startDay,
    },
    "end": {
        "month": endMonth,
        "day": endDay,
    },
    "year": startYear,
    "leapYear": leapYear,
    "firstDayStarter": firstDayStarter});
});

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

//for /calendar functionality to calculate day of the week
function getYearCode(startYear) {
    let yearCode;
    if (2300 <= startYear && startYear <= 2399) {
        yearCode = 0
    }
    else if (2200 <= startYear && startYear <= 2299) {
        yearCode = 2
    }
    else if (2100 <= startYear && startYear <= 2199) {
        yearCode = 4
    }
    else if (2000 <= startYear && startYear <= 2099) {
        yearCode = 6
    }
    else if (1900 <= startYear && startYear <= 1999) {
        yearCode = 0
    }
    else if (1800 <= startYear && startYear <= 1899) {
        yearCode = 2
    }
    else if (1700 <= startYear && startYear <= 1799) {
        yearCode = 4
    }
    else if (1600 <= startYear && startYear <= 1699) {
        yearCode = 6
    }
    else if (1500 <= startYear && startYear <= 1599) {
        yearCode = 0
    }
    else if (1400 <= startYear && startYear <= 1499) {
        yearCode = 2
    }
    else {
        yearCode = NaN
    }
    return yearCode;
}