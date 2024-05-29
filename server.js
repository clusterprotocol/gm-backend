const express = require("express");
const cors = require("cors");
require('dotenv').config()
const bodyParser = require("body-parser");
// const stripe = require("stripe")(`${process.env.STRIPE_PRIVATE_KEY}`);
// const AvailableMachine = require('./models/AvailableMachine');
// const PreBookedMachine = require('./models/PreBookedMachine');
const {clusterContractInstance} = require('./Contract/contract.js')
const {provider} = clusterContractInstance()
const {clusterContract} = clusterContractInstance()

// const stripeSchema = require("./models/stripePayments.js")

// const orderTimeoutFunction = require('./Utils/orderTimeout.js')
const databaseConnection = require('./Utils/databaseInit.js');
// const eventLogs = require('./Utils/eventLogs.js')

const serverRoutes = require('./routes');
// const {queueRepopulation} = require('./Utils/orderScheduler.js')

const app = express();
const port = 3000;
app.use(cors());

app.post('/test', async(req, res)=> {
    res.json({
        message: "Everything's good"
    });
})

// app.post('/api/other/stripeWebhook', express.raw({ type: 'application/json' }), async(req, res) => {

//   const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
//   const sig = req.headers['stripe-signature'];
//   const payload = req.body

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
//   }catch (err) {
//     console.error('Webhook Error:', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   switch (event.type) {

//     case 'checkout.session.completed':
//       const session = event.data.object;
//       console.log('Payment successful. Session ID:', session.id);

//       const filter = {"id":session.id}
//       const update = {"completed":true}

//       const databaseInfo = await stripeSchema.findOne(filter)
//       const gasPrice = await provider.getFeeData()
      
//       const tx = await clusterContract.gPBuyWithStripe(
//         databaseInfo.id,
//         databaseInfo.gPAmount,
//         databaseInfo.UID,
//         {
//           gasPrice: gasPrice.maxFeePerGas,
//         }
//       );      
      
//       let receipt = await tx.wait()

//       await stripeSchema.findOneAndUpdate(filter,update)

//       break;

//   }

//   res.json({received: true});

// });

app.post('/registerMachine', async(req, res) => {
    try {
        const machineInfo = req.body;
        const register = await clusterContract.registerMachines(machineInfo);
        res.json({
            success: true,
            txHash: receipt.transactionHash
        })
    } catch {

    }
})

app.use(bodyParser.json());
app.use("/api", serverRoutes);

app.use((_, res) =>{
    res.send({
        message: 'Not found!'
    })
});
app.use(cors());



databaseConnection()
// eventLogs()
// setInterval(orderTimeoutFunction, 10 * 1000);



app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  // await queueRepopulation();
});