import process from 'process';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '/etc/colorDictionary/.env'});

const port = 3000;
const app = express();
const ai = new GoogleGenAI({});

app.get('/imageGenerate', async(req, res) => {
    res.send('Hello World!');
});