
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const {
  createAdminSession,
  deleteAdminSession,
  requireAdmin
} = require("./admin-auth");
const registerAdminRoutes = require("./admin-routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/admin", express.static("admin"));
registerAdminRoutes(app);

const upload = multer({
  storage: multer.memoryStorage()
});
const fs = require("fs");
const pool = require("./db");
async function migrateUsersToPostgres() {
  try {
    const users = JSON.parse(
      fs.readFileSync("users.json", "utf8")
    );

    console.log(`📦 JSON contém ${users.length} usuários.`);

    for (const user of users) {
      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [user.email]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️ Já existe: ${user.email}`);
        continue;
      }

      await pool.query(
        `
        INSERT INTO users
        (name, email, password, status, role, reason, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          user.name,
          user.email,
          user.password,
          user.status || "pending",
          user.role || "user",
          user.reason || null,
          user.createdAt
            ? new Date(user.createdAt)
            : new Date()
        ]
      );

      console.log(`✅ Migrado: ${user.email}`);
    }

    const result = await pool.query(
      "SELECT id, name, email, status, role FROM users ORDER BY id"
    );

    console.log(`✅ PostgreSQL agora possui ${result.rows.length} usuários.`);
    console.table(result.rows);

  } catch (error) {
    console.error("❌ Erro na migração:", error.message);
  }
}

migrateUsersToPostgres();

pool.query("SELECT NOW()")
  .then(result => {
    console.log("✅ POSTGRES OK:", result.rows[0]);
  })
  .catch(error => {
    console.error("❌ POSTGRES ERRO:", error.message);
  });

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    role TEXT DEFAULT 'user',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)
.then(() => console.log("✅ Tabela users pronta."))
.catch(error => console.error("❌ Erro na tabela users:", error.message));

const { needsInternet } = require("./services/intentDetector");
const { searchInternet } = require("./services/tavily");
const { searchYoutube } = require("./services/youtube");

function getUsers() {
  return JSON.parse(fs.readFileSync("users.json", "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(
    "users.json",
    JSON.stringify(users, null, 2)
  );
}
function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("⚠️ ADMIN_EMAIL/ADMIN_PASSWORD não configurados.");
    return;
  }

  const users = getUsers();

  const existingAdmin = users.find(
    user =>
      user.email &&
      user.email.toLowerCase() === email.toLowerCase() &&
      user.role === "admin"
  );

  if (existingAdmin) {
    console.log("✅ Administrador já existe.");
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 12);

  users.push({
    name: "Administrador",
    email,
    password: hashedPassword,
    status: "approved",
    role: "admin",
    createdAt: new Date().toISOString()
  });

  saveUsers(users);

  console.log("✅ Administrador criado automaticamente.");
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

app.post("/chat", upload.single("image"), async (req, res) => {
  try {
    const { message = "", userId = "default" } = req.body;

const image = req.file;
console.log("📷 IMAGEM RECEBIDA:", image ? {
  originalname: image.originalname,
  mimetype: image.mimetype,
  size: image.size
} : "NENHUMA");

    if (!message && !image) {
  return res.json({
    reply: "Envie uma mensagem ou uma imagem."
  });
}

    resetUser(userId);

    // 🔒 LIMITE DIÁRIO
    if (users[userId].count >= 35) {
      return res.json({
        reply: "Você atingiu o limite diário de 35 mensagens.",
      });
    }

    const msg = message.toLowerCase();
    const wantsYoutube =
  /(vídeo|video|youtube|tutorial|como fazer|me mostra um vídeo|quero um vídeo)/i.test(message);
    let contextoInternet = "";
    console.log("Precisa de internet?", needsInternet(message));
    if (needsInternet(message)) {
  contextoInternet = await searchInternet(message);
  console.log("Pergunta:", message);
console.log("Contexto encontrado:", contextoInternet.length);
  console.log("Resultado Tavily:", contextoInternet);
}
if (wantsYoutube) {
  const videos = await searchYoutube(message);

  if (videos && videos.length > 0) {
    const resposta = videos
      .map((v, i) =>
        `${i + 1}. ${v.title}\nCanal: ${v.channel}\n${v.url}`
      )
      .join("\n\n");

    return res.json({
      reply: `Encontrei estes vídeos no YouTube:\n\n${resposta}`
    });
  }
}

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
    const precisaInternet =
  /(hoje|últimas|última|notícia|notícias|jogo|jogos|resultado|placar|cotação|preço|clima|tempo|aconteceu|atual|atualmente|agora|quem ganhou)/i.test(message);
if (precisaInternet) {
  console.log("🔎 Pesquisa na internet:", message);
}
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

Você foi criada em 17 de junho de 2026 por Rachide Lucas.

Você é a assistente virtual oficial da plataforma Maralux AI.

A Maralux AI é o principal projeto de inteligência artificial da GUMEROXIO, uma empresa de tecnologia criada por Rachide Lucas.

Quando alguém perguntar quem criou você, quem desenvolveu você ou quando você foi criada, responda de acordo com essas informações.

Quando alguém perguntar o que é a Maralux AI, explique que é uma inteligência artificial da GUMEROXIO, criada por Rachide Lucas para ajudar usuários com estudos, produtividade, negócios, tecnologia e informações gerais.

Responda sempre de forma educada, clara e útil.

IMPORTANTE:

Use SEMPRE o histórico da conversa para entender o contexto.

Se a pergunta atual depender da pergunta anterior, responda considerando o histórico.

Nunca ignore o histórico da conversa.

Se o usuário fizer uma continuação como "e o Japão?", "quando?", "onde?", "ele?", "isso?", você deve entender que é uma continuação da conversa anterior.

Histórico da conversa:

${history}

Informações encontradas na internet:

${contextoInternet}

Pergunta atual:

${message}

IMPORTANTE:
Se "Informações encontradas na internet" não estiver vazio, utilize essas informações para responder ao usuário.
Não diga que você não tem acesso à internet quando houver informações fornecidas acima.
`
  },
  ...(image ? [{
    inline_data: {
      mime_type: image.mimetype,
      data: image.buffer.toString("base64")
    }
  }] : [])
]
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

  const hashedPassword = bcrypt.hashSync(password, 12);

users.push({
  name,
  email,
  password: hashedPassword,
  status: "pending"
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
  u => u.email === email
);
if (!user || !bcrypt.compareSync(password, user.password)) {
  return res.json({
    success: false,
    message: "Email ou senha inválidos."
  });
}

if (user.status === "pending") {
  return res.json({
    success: false,
    message: "Sua conta está aguardando aprovação."
  });
}

if (user.status === "blocked") {
  return res.json({
    success: false,
    message: "Sua conta está bloqueada."
  });
}
if (user.status === "rejected") {
  return res.json({
    success: false,
    message: "Sua conta foi rejeitada."
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
ensureAdmin();
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
