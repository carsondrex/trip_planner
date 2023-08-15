// Imports/Requires
const express = require("express");
//let axios = require("axios");

// Create express app with static handler
const app = express();
app.use(express.static("public"));

// Host configuration (currently local)
const hostname = "localhost";
const port = 3000;

//functionality for date selection to calendar page
let monthChart = {1: 0, 2: 3, 3: 3, 4: 6, 5: 1, 6: 4, 7: 6, 8: 2, 9: 5, 10: 0, 11: 3, 12: 5}

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

    try {
        startMonth = parseInt(startMonth);
        startDay = parseInt(startDay);
        startYear = parseInt(startYear);
        endMonth = parseInt(endMonth);
        endDay = parseInt(endDay);
        endYear = parseInt(endYear);
        startDecade = parseInt(startDecade);

        if (startYear !== endYear) {
            throw new Error("Invalid Date. Year must be the same.");
        }
        else {
            if (startMonth !== endMonth) {
                throw new Error("Invalid Date. Month must be the same.");
            }
            else {
                if (startDay > endDay) {
                    throw new Error("Invalid Date. End date should come after start date.");
                }
            }
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
    }

    let startDayOfTheWeek = (startDay + monthChart[startMonth] + startYearCode + startDecade + Math.floor(startDecade / 4)) % 7
    let firstWeekDayOfMonth = (1 + monthChart[startMonth] + startYearCode + startDecade + Math.floor(startDecade / 4)) % 7

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
    "leapYear": leapYear});
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