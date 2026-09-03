require("dotenv").config();

const pool = require("./db");

async function createUsersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        role TEXT DEFAULT 'user',
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Tabela users criada/verificada com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao criar tabela:", error.message);
  } finally {
    await pool.end();
  }
}

createUsersTable();
