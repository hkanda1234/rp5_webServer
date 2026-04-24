import process from 'process';
import express from 'express';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { GoogleGenAI } from '@google/genai';

const port = 3000;
const app = express();
const ai = new GoogleGenAI({});

app.get('/colorAnalyze', async(req, res) => {
    let color = "#ffffff";
    let prompt;

    const thingSchema = z.object({
        thing : z.string().describe(`ユーザが指定した色 ${color} から想起されるもの。`),
        description : z.string().describe(`その事物の概要。`),
        reason : z.string().describe(`その事物が色 ${color} から想起される理由。`)
    });

    const analyzeSchema = z.object({
        things : thingSchema.array().describe(`ユーザが指定した色 ${color} から想起されるものとその詳細、根拠の配列。`),
        bestMaching : thingSchema.describe(`ユーザが指定した色 ${color} から想起されるもののうち、最も関連性が高いもの。`)
    });

    prompt = 
    `ユーザが指定した色 ${color} から想起される事物について、下記のテキストに沿って述べてください。
    条件：
    -想起されるものを６つ挙げてください。
    -各項目には、その事物の名前、その色から想起される理由と詳細を含めてください。
    -最も関連性が高いものを一つ選んでください。
    -回答は日本語で行ってください。
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: zodToJsonSchema(analyzeSchema)
        },
    });

    const answer = JSON.parse(response.text);

    res.send(answer);

});

app.listen(port, () => {
    console.log("localhost running on port 3000");
});