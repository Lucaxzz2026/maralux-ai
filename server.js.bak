require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ======================
// 🔐 CHAVES (via .env)
// ======================

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
const YOUTUBE_KEY = process.env.YOUTUBE_KEY;

if (!GOOGLE_AI_KEY || !YOUTUBE_KEY) {
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

    // ======================
    // 📅 DATA
    // ======================

    if (msg.includes("data") || msg.includes("hoje")) {
      return res.json({ reply: `Hoje é ${getToday()}` });
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

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
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

    res.json({ reply });
  } catch (error) {
    console.error("Erro interno:", error);
    res.json({ reply: "Erro interno." });
  }
});

// ======================
// ▶️ START
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

