const express = require("express");
const cors = require("cors");
require('dotenv').config();
const bodyParser = require("body-parser");
const databaseConnection = require('./Utils/databaseInit.js');
const serverRoutes = require('./routes');
const computeRoutes = require('./routes/speheronCLIRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes'); // Import the API key routes
const userRouter = require("./routes/userRoutes.js");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Root URL response (optional)
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Cluster Protocol API" });
});

// Test route
app.post('/test', async (req, res) => {
    res.json({
        message: "Everything's good"
    });
});

// Integrate the API key routes
app.use('/api/keys', apiKeyRoutes);
app.use("/compute", computeRoutes);

// Integrate other routes
app.use("/api/user", userRouter);


app.use("/api", serverRoutes);

// Handle not found routes
app.use((_, res) => {
    res.status(404).json({
        message: 'Not found!'
    });
});

// Handle errors
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Connect to the database
databaseConnection();

// Start the server
app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});
