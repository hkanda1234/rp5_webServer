import process from 'process';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '/etc/colorDictionary/.env'});

const port = 3000;
const app = express();
const ai = new GoogleGenAI({});

app.use(cors());

app.get('/colorAnalyze', async(req, res) => {
    

    const hex = req.query.hex;
    const rgb = req.query.rgb;
    console.log(hex, rgb);

    const thingSchema = z.object({
        thing : z.string().describe(`ユーザが指定した色から想起されるもの。`),
        reason : z.string().describe(`その事物がその色から想起される理由。`)
    });

    const analyzeSchema = z.object({
        color : z.string().describe(`ユーザが指定した色`),
        things : thingSchema.array().describe(`ユーザが指定した色から想起されるものとその詳細、根拠の配列。`),
        bestMatching : thingSchema.describe(`ユーザが指定した色から想起されるもののうち、最も関連性が高いもの。`)
    });

    const prompt = 
    `ユーザが指定した色 HEXコード${hex} および RGB値 ${rgb} から想起される事物について、下記のテキストに沿って述べてください。
    条件：
    ・回答は日本語で行なってください。
    ・想起されるものを６つ挙げてください。
    ・各項目には、その事物の名前、その色から想起される理由と詳細を含めてください。
    ・事物は具体的に、日常で観察できるものに限ってください。
    ・事物の名称は簡潔に。１０文字以内が好ましいです。
    ・選考理由は特にその色とその事物との関係を主に、80文字以内が好ましいです。
    ・６つの中で最も関連性が高いものを一つ選んでください。
    ・descriptionやreasonを出力する際、ですます調を避けてください。
    ・指定スキーマに厳密に従ってください。
    
    `;

    console.log(prompt);
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: z.toJSONSchema(analyzeSchema)
        },
    });

    const raw = response.text ?? response.candidates?.[0]?.content?.parts?.[0];
    if(!raw) {
        throw new Error("response text is empty");
    }

    const parsed = JSON.parse(raw);
    const answer = analyzeSchema.parse(parsed);

    
    res.json(answer);

});

app.listen(port, () => {
    console.log("ColorAnalyze.js working on port 3000");
});