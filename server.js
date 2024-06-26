const express = require("express");
const cors = require("cors");
require('dotenv').config()
const bodyParser = require("body-parser");
const databaseConnection = require('./Utils/databaseInit.js');
const serverRoutes = require('./routes');
const app = express();
const port = 3000;
app.use(cors());

app.post('/test', async(req, res)=> {
    res.json({
        message: "Everything's good"
    });
})



app.use(bodyParser.json());
app.use("/api", serverRoutes);

app.use((_, res) =>{
    res.send({
        message: 'Not found!'
    })
});
app.use(cors());
app.use((req, res, next) => {
    res.status(404).json({ message: 'Not found!' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
});



databaseConnection()




app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});