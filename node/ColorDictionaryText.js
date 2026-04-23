const process = require('process');
const express = require('express');
const port = 3000;
const app = express();
const API_KEY = process.env.GEMINI_API_KEY;

app.get('/colorAnalyze', (req, res) => {
    res.send(GEMINI_API_KEY);
});

app.listen(port, () => {
    console.log("hello.");
});