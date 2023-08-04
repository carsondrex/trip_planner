// Imports/Requires
const express = require("express");

// Create express app with static handler
const app = express();
app.use(express.static("public"));

// Host configuration (currently local)
const hostname = "localhost";
const port = 3000;

// Start server
app.listen(port, hostname, (req, res) => {
    console.log(`http://${hostname}:${port}`);
});