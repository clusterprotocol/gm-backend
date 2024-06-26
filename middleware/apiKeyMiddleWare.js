// middleware/apiKeyMiddleware.js
const ApiKey = require('../models/apiKey');

const apiKeyMiddleware = async (req, res, next) => {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
        return res.status(401).json({ message: 'API key is missing' });
    }

    try {
        const keyRecord = await ApiKey.findOne({ key: apiKey });

        if (!keyRecord) {
            return res.status(401).json({ message: 'Invalid API key' });
        }

        req.userAddress = keyRecord.userAddress; // Attach the user address to the request object
        next();
    } catch (error) {
        console.error('Error in API key middleware:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = apiKeyMiddleware;
