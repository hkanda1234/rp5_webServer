const process = require('process');
const express = require('express');
const port = 3000;
const app = express();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/colorAnalyze', (req, res) => {
    let color = req;
    
});

app.listen(port, () => {
    console.log("localhost running on port 3000");
});