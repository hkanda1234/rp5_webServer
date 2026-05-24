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
        description : z.string().describe(`ユーザが指定した色の説明`),
        things : thingSchema.array().describe(`ユーザが指定した色から想起されるものとその詳細、根拠の配列。`),
        bestMatching : thingSchema.describe(`ユーザが指定した色から想起されるもののうち、最も関連性が高いもの。`),
        imagePrompt: z.string().describe(`bestMatching項目のイメージを生成するための英語プロンプト`)
    });

    const prompt = 
    `ユーザが指定した色 HEXコード${hex} および RGB値 ${rgb} から想起される事物について、下記のテキストに沿って述べてください。
    条件：
    //生成する文章について
    ・回答は日本語で行なってください。
    ・ですます調を避けてください。だである調が望ましいです。

    //選択した色を返す(color, description)
    ・ユーザが選択した色を返してください。
    ・ユーザが選択した色について、どんな色であるかを説明してください。

    //事物の提示(things)
    ・想起されるものを５つ挙げてください。
    ・項目はその特定の色に強く結びつくものである必要があります。他の色でも当てはまるようなものは避けてください。
    ・各項目には、その事物の名前、その色から想起される理由と詳細を含めてください。
    ・事物は具体的に、日常で観察できるものに限ってください。
    ・事物の名称は簡潔に。１０文字以内が好ましいです。
    ・選考理由は特にその色とその事物との関係を主に、80文字以内が好ましいです。

    //最もふさわしいものの選定(bestMatching)
    ・６つの中で最も関連性が高いものを一つ選んでください。
    ・色と事物の関連性の高さを主な判断基準としてください。
    ・その選定理由を120文字ほどにまとめてください。

    //画像生成プロンプトの生成(imagePrompt)
    ・最もふさわしいものとして選定した事物について画像生成を行うためのプロンプトを生成してください。
    ・精度を高めるため、プロンプトは英語が好ましいです。
    ・事物を漠然と描くのではなく、一部をクローズアップする、対象を中心からずらす、背景を抑えるなどして抽象化してください。
    

    //構造化出力について
    ・指定スキーマに厳密に従ってください。
    
    `;

    console.log(prompt);
    const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
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