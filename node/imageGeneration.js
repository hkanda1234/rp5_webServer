import process from 'process';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '/etc/colorDictionary/.env'});

const port = 3001;
const app = express();
const ai = new GoogleGenAI({});
const imagesPath = '/var/www/html/color-dictionary/images';

app.use(cors());
app.use(express.json());

app.post('/imageGenerate', async(req, res) => {
    const { prompt } = req.body;
    
});

app.listen(port, () => {
    console.log('imageGenerate work on port 3000');
});