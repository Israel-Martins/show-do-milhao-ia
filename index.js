import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static('public'));


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


async function pedirDicaAosUniversitarios(pergunta, alternativas) {
    const prompt = `
        Você é um universitário no programa Show do Milhão.
        O jogador está com dúvida nesta pergunta: "${pergunta}".
        As alternativas são: ${JSON.stringify(alternativas)}.
 
        Sua tarefa: Dê uma dica útil ou uma breve explicação sobre o tema para ajudar o jogador a escolher a resposta certa, mas NÃO diga diretamente qual é a letra correta. Seja um pouco informal e incentivador.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();

}


app.post('/ajuda', async (req, res) => {
    const { enunciado, alternativas } = req.body;
    try {
        const dica = await pedirDicaAosUniversitarios(enunciado, alternativas);
        res.json({ dica });
    } catch (error) {

        res.status(500).json({ erro: "Os universitários estão discutindo e não conseguiram ajudar." });

    }

});

async function gerarPerguntaNoEstiloSilvio() {
    const prompt = `
        Gere uma pergunta de conhecimentos gerais para o jogo Show do Milhão.
        Retorne EXCLUSIVAMENTE um objeto JSON no seguinte formato:
        {
            "enunciado": "texto da pergunta",
            "alternativas": {
                "a": "resposta 1",
                "b": "resposta 2",
                "c": "resposta 3",
                "d": "resposta 4"
            },
            "correta": "a",
            "dica_do_universitario": "uma dica curta e sarcástica"
        }

        Importante: Não use blocos de código markdown. Retorne apenas o JSON puro.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
      
        text = text.replace(/```json/ig, '')
            .replace(/```/g, '')
            .trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("Erro detalhado na chamada da IA:", error);
        throw error;
    }
}

app.get('/pergunta', async (req, res) => {
    try {
        const pergunta = await gerarPerguntaNoEstiloSilvio();
        res.json(pergunta);
    } catch (error) {
        res.status(500).json({
            erro: "Erro ao gerar pergunta",
            detalhes: error.message
        });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});