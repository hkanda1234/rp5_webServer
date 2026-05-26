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
const model = "gemini-2.5-flash-image";
const imagesPath = '/var/www/html/generatedImages/';
const extention = '.jpg';
app.use(cors());
app.use(express.json());

app.use('/generatedImage', express.static(imagesPath));

app.post('/imageGenerate', async(req, res) => {
    const { prompt } = req.body;
    const time = Date.now();
    const fileName = `generated-${time}${extention}`;
    const filePath = `${imagesPath}${fileName}`;

    console.log(req.body);

    const response = await ai.models.generateContent({
        model : model,
        contents : prompt,
    });

    const parts = response.candidates[0].content.parts;

    
    for(const part of parts){
        if(part.text){
            console.log(part.text);
        } else if(part.inlineData){
            const imageData = part.inlineData.data;
            const buffer = Buffer.from(imageData, "base64");
            fs.writeFileSync(filePath, buffer);
            console.log(`image saved as ${filePath}`);
        }
    }
    
    const json = {
        imageURL : `https://hkanda.xyz/generatedImage/${fileName}`
    }

    res.json(json);

});

app.listen(port, () => {
    console.log('imageGenerate work on port 3001');
});