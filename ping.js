// ping.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8855;
const SERVER_URL = process.env.SERVER_URL;

// Auto ping function
const pingServer = async () => {
    try {
        const response = await axios.get(`${SERVER_URL}/ping`);
        console.log(`[${new Date().toISOString()}] Server pinged successfully:`, response.data);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Ping failed:`, error.message);
    }
};

// Ping endpoint
app.get('/ping', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is alive',
        timestamp: new Date().toISOString()
    });
});

module.exports = { pingServer };
