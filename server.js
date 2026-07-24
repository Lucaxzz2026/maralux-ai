require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
const fs = require("fs");
const pool = require("./db");
const { needsInternet } = require("./services/intentDetector");

function getUsers() {
  return JSON.parse(fs.readFileSync("users.json", "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(
    "users.json",
    JSON.stringify(users, null, 2)
  );
}

function getConversations(){

  try{

    return JSON.parse(
      fs.readFileSync(
        "conversations.json",
        "utf8"
      )
    );

  }catch{

    return {};

  }

}

function saveConversations(conversations){

  fs.writeFileSync(
    "conversations.json",
    JSON.stringify(
      conversations,
      null,
      2
    )
  );

}
  
// ======================
// 🔐 CHAVES (via .env)
// ======================

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
const YOUTUBE_KEY = process.env.YOUTUBE_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
if (!GOOGLE_AI_KEY || !YOUTUBE_KEY || !TAVILY_API_KEY) {
  console.error("❌ Variáveis de ambiente ausentes. Verifique o arquivo .env");
  process.exit(1);
}

// ======================
// 📊 CONTROLE DE USO
// ======================

const users = {};

function resetUser(userId) {
  const today = new Date().toISOString().split("T")[0];

  if (!users[userId]) {
    users[userId] = { count: 0, date: today };
  }

  if (users[userId].date !== today) {
    users[userId].count = 0;
    users[userId].date = today;
  }
}

// ======================
// 📅 DATA
// ======================

function getToday() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ======================
// 🚀 CHAT
// ======================

app.post("/chat", async (req, res) => {
  try {
    const { message, userId = "default" } = req.body;

    if (!message) {
      return res.json({ reply: "Mensagem vazia." });
    }

    resetUser(userId);

    // 🔒 LIMITE DIÁRIO
    if (users[userId].count >= 35) {
      return res.json({
        reply: "Você atingiu o limite diário de 35 mensagens.",
      });
    }

    const msg = message.toLowerCase();
    console.log("Precisa de internet?", needsInternet(message));

    // ======================
    // 📅 DATA
    // ======================

    if (
  msg === "que dia é hoje" ||
  msg === "qual é a data de hoje" ||
  msg === "data de hoje" ||
  msg === "hoje é que dia"
) {
  return res.json({
    reply: `Hoje é ${getToday()}`
  });
}

    // ======================
    // 🎥 YOUTUBE
    // ======================

    if (msg.includes("youtube")) {
      const query = message.replace(/youtube/gi, "").trim();

      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_KEY}`
      );

      const ytData = await ytRes.json();

      if (!ytData.items || ytData.items.length === 0) {
        return res.json({ reply: "Não encontrei vídeos." });
      }

      const video = ytData.items[0];
      const link = `https://www.youtube.com/watch?v=${video.id.videoId}`;

      users[userId].count++;

      return res.json({ reply: `Aqui está um vídeo:\n${link}` });
    }

    // ======================
    // 🤖 GEMINI AI
    // ======================
    const chatHistory = getConversations();

const history =
  (chatHistory[userId] || [])
    .slice(-10)
    .map(c =>
      `Usuário: ${c.user}\nMaralux: ${c.ai}`
    )
    .join("\n\n");
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
  parts: [{
    text: `
Você é a Maralux AI.

Seu criador é Rachide Lucas.

Você é a assistente virtual oficial da plataforma Maralux AI.

Quando alguém perguntar quem criou você, responda que foi criada por Rachide Lucas.

Quando alguém perguntar o que é a Maralux AI, explique que é uma inteligência artificial desenvolvida por Rachide Lucas para ajudar usuários com estudos, produtividade, negócios, tecnologia e informações gerais.

Responda sempre de forma educada, clara e útil.

IMPORTANTE:

Use SEMPRE o histórico da conversa para entender o contexto.

Se a pergunta atual depender da pergunta anterior, responda considerando o histórico.

Nunca ignore o histórico da conversa.

Se o usuário fizer uma continuação como "e o Japão?", "quando?", "onde?", "ele?", "isso?", você deve entender que é uma continuação da conversa anterior.

Histórico da conversa:

${history}

Pergunta atual:

${message}
`
  }]
}],
        }),
      }
    );

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      console.error("Erro Gemini:", aiData);
      return res.json({ reply: "Erro na IA." });
    }

    const reply =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Não consegui responder.";

    users[userId].count++;
   const conversations =
  getConversations();

if(!conversations[userId]){
  conversations[userId] = [];
}

conversations[userId].push({
  user: message,
  ai: reply,
  date: new Date().toISOString()
});

saveConversations(conversations);
console.log("CONVERSA SALVA:", conversations);
    res.json({ reply });
  } catch (error) {
    console.error("Erro interno:", error);
    console.error(error.stack);
    res.json({ reply: "Erro interno." });
  }
});

// ======================
// ▶️ START
// ======================
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const users = getUsers();

  const existingUser = users.find(
    user => user.email === email
  );

  if (existingUser) {
    return res.json({
      success: false,
      message: "Email já cadastrado."
    });
  }

  users.push({
    name,
    email,
    password
  });

  saveUsers(users);

  res.json({
    success: true,
    message: "Cadastro realizado com sucesso."
  });
});
app.post("/login", (req, res) => {

  const { email, password } = req.body;

  const users = getUsers();

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.json({
      success: false,
      message: "Email ou senha inválidos."
    });
  }

  res.json({
    success: true,
    message: "Login realizado com sucesso.",
    user: {
      name: user.name,
      email: user.email
    }
  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
