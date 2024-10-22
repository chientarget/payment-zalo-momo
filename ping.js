// ping.js
const axios = require('axios');
require('dotenv').config();

const PORT = process.env.PORT || 8855;
const SERVER_URL = `https://payment-zalo-momo.onrender.com`; // Thay thế bằng URL của bạn

const pingServer = async () => {
    try {
        const response = await axios.get(`${SERVER_URL}/ping`);
        console.log(`[${new Date().toISOString()}] Server pinged successfully:`, response.data);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Ping failed:`, error.message);
    }
};

// Ping every 1 minute
const startPinging = () => {
    console.log('Auto-ping service started');
    setInterval(pingServer, 60000); // 60000ms = 1 minute
    pingServer(); // Initial ping
};

module.exports = { startPinging };

// server.js updates
const express = require('express');
const { startPinging } = require('./ping');
const app = express();

// Ping endpoint
app.get('/ping', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is alive',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startPinging(); // Start auto-ping service
});
