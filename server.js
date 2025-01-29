const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const databaseConnection = require("./config/db.js");
const allRoutes = require("./routes");

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

// Root URL response (optional)
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Cluster Protocol API" });
});

// Integrate the API key routes
app.use("/api", allRoutes);

// Handle not found routes
app.use((_, res) => {
  res.status(404).json({
    message: "Not found!",
  });
});

// Handle errors
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Connect to the database
databaseConnection();

// Start the server
app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});
