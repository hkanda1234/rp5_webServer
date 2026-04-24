import { prosess } from 'process';
import { express } from 'express';
import { z } from 'zod';
import { z2j } from 'zodToJsonSchema';

const port = 3000;
const app = express();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/colorAnalyze', (req, res) => {
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
    `;
    

});

app.listen(port, () => {
    console.log("localhost running on port 3000");
});