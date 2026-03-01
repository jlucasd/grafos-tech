import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use memory storage for multer
  const upload = multer({ storage: multer.memoryStorage() });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/validate-fiscal-note", upload.single("image"), async (req, res) => {
    try {
      const file = req.file;
      const nfNumber = req.body.nfNumber;

      if (!file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada. Use o campo 'image'." });
      }

      if (!nfNumber) {
        return res.status(400).json({ error: "O número da Nota Fiscal (nfNumber) é obrigatório." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chave de API não configurada no servidor." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const base64Image = file.buffer.toString("base64");
      const mimeType = file.mimetype;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            },
            {
              text: `Você é um especialista em logística. Analise esta imagem.
              O número de Nota Fiscal (NF) esperado é: "${nfNumber}".

              Regras:
              1. Classifique a imagem como "CANHOTO" (papel de comprovante, nota fiscal, recibo), "MERCADORIA" (caixas, produtos, caminhão) ou "OUTRO".
              2. Se for "CANHOTO", procure pelo número da NF "${nfNumber}" na imagem. Pode estar manuscrito ou impresso.
              3. Se for "CANHOTO", verifique RIGOROSAMENTE se há uma assinatura MANUSCRITA (tinta de caneta, rabisco) no campo de recebedor.
                 IMPORTANTE: Se o campo estiver em branco, vazio ou contiver apenas linhas/textos impressos do próprio formulário, retorne isSigned: FALSE. Só retorne TRUE se houver claramente uma escrita manual.

              Retorne o resultado em JSON seguindo exatamente o schema.`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: { 
                type: Type.STRING, 
                enum: ["CANHOTO", "MERCADORIA", "OUTRO"],
                description: "Classificação do tipo de imagem" 
              },
              nfNumberFound: { 
                type: Type.STRING, 
                description: "O número da NF encontrado na imagem (se houver)",
                nullable: true 
              },
              isNfMatch: { 
                type: Type.BOOLEAN, 
                description: "Verdadeiro se o número encontrado corresponde ao esperado" 
              },
              isSigned: { 
                type: Type.BOOLEAN, 
                description: "Verdadeiro APENAS se houver uma assinatura manuscrita visível. Falso se estiver em branco." 
              },
              confidence: { 
                type: Type.NUMBER, 
                description: "Nível de confiança da análise (0 a 1)" 
              }
            },
            required: ["classification", "isNfMatch", "isSigned", "confidence"]
          }
        }
      });

      let jsonText = response.text;
      if (!jsonText) {
        return res.status(500).json({ error: "Sem resposta da IA" });
      }

      // Clean Markdown code blocks if present (e.g. ```json ... ```)
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

      let aiData;
      try {
        aiData = JSON.parse(jsonText);
      } catch (e) {
        console.error("JSON Parse Error", jsonText);
        return res.status(500).json({ error: "Erro ao interpretar resposta da IA" });
      }

      // Determine final status based on rules
      let finalStatus = 'review';

      if (aiData.classification === 'CANHOTO') {
        if (aiData.isNfMatch && aiData.isSigned) {
          finalStatus = 'validated';
        } else if (!aiData.isNfMatch) {
          finalStatus = 'rejected'; // Canhoto but wrong NF
        } else {
          finalStatus = 'review'; // Canhoto, match NF, but maybe not signed or low confidence
        }
      } else if (aiData.classification === 'MERCADORIA') {
        finalStatus = 'review'; // Might be valid proof of condition, but not a receipt
      } else {
        finalStatus = 'rejected';
      }

      res.json({
        status: finalStatus,
        aiData: aiData
      });

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || 'Falha na análise da IA' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
