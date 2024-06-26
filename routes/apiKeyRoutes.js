// routes/apiKeyRoutes.js
const express = require('express');
const apiRouter = express.Router();
const crypto = require('crypto');
const ApiKey = require('../models/apiKey');

apiRouter.post('/generate', async (req, res) => {
    try {
        const { userAddress } = req.body;

        if (!userAddress) {
            return res.status(400).json({ message: 'User address is required' });
        }

        const apiKey = crypto.randomBytes(32).toString('hex');
        const newApiKey = new ApiKey({ key: apiKey, userAddress });

        await newApiKey.save();

        res.json({ apiKey });
    } catch (error) {
        console.error('Error generating API key:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

apiRouter.post('/revoke', async (req, res) => {
    try {
        const { apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({ message: 'API key is required' });
        }

        await ApiKey.deleteOne({ key: apiKey });

        res.json({ message: 'API key revoked' });
    } catch (error) {
        console.error('Error revoking API key:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = apiRouter;
