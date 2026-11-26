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
const model = "gemini-3.1-flash-image";
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

    try {
        const response = await ai.models.generateContent({
            model : model,
            contents : prompt,
            config : {
                responseModalities : ['IMAGE'],
                imageConfig : {
                    aspectRatio : '1:1',
                    outputMimeType : 'image/jpeg',
                },
            },
        });

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        const imagePart = parts.find(part => part.inlineData?.data);

        if(!imagePart){
            throw new Error(`no image returned (finishReason: ${response.candidates?.[0]?.finishReason})`);
        }

        const buffer = Buffer.from(imagePart.inlineData.data, "base64");
        await fs.promises.writeFile(filePath, buffer);
        console.log(`image saved as ${filePath}`);

        res.json({
            imageURL : `https://hkanda.xyz/generatedImage/${fileName}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'image generation failed' });
    }

});

app.listen(port, () => {
    console.log('imageGenerate work on port 3001');
});