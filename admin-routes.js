const fs = require("fs");
const bcrypt = require("bcryptjs");

const {
  createAdminSession,
  deleteAdminSession,
  requireAdmin
} = require("./admin-auth");

const USERS_FILE = "users.json";

function getUsers() {
  return JSON.parse(
    fs.readFileSync(USERS_FILE, "utf8")
  );
}

function saveUsers(users) {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify(users, null, 2)
  );
}

function registerAdminRoutes(app) {

  // =========================
  // ADMIN LOGIN
  // =========================

  app.post("/admin/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "E-mail e senha são obrigatórios."
      });
    }

    const users = getUsers();

    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas."
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso administrativo negado."
      });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas."
      });
    }

    const token = createAdminSession(user.email);

    return res.json({
      success: true,
      message: "Login administrativo realizado.",
      token,
      admin: {
        name: user.name,
        email: user.email
      }
    });
  });


  // =========================
  // ADMIN LOGOUT
  // =========================

  app.post("/admin/logout", requireAdmin, (req, res) => {

    const auth = req.headers.authorization || "";
    const token = auth.slice(7);

    deleteAdminSession(token);

    res.json({
      success: true,
      message: "Sessão administrativa encerrada."
    });
  });


  // =========================
  // LISTAR USUÁRIOS
  // =========================

  app.get("/admin/users", requireAdmin, (req, res) => {

    const users = getUsers();

    const safeUsers = users.map(user => ({
      name: user.name,
      email: user.email,
      status: user.status || "approved",
      role: user.role || "user",
      createdAt: user.createdAt || null,
      reason: user.reason || ""
    }));

    res.json({
      success: true,
      total: safeUsers.length,
      users: safeUsers
    });
  });


  // =========================
  // ALTERAR STATUS
  // =========================

  app.post(
    "/admin/users/:email/status",
    requireAdmin,
    (req, res) => {

      const email = decodeURIComponent(req.params.email);
      const { status } = req.body;

      const allowedStatuses = [
        "approved",
        "rejected",
        "blocked",
        "pending"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status inválido."
        });
      }

      const users = getUsers();

      const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado."
        });
      }

      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Não é permitido alterar o status de um administrador."
        });
      }

      user.status = status;

      saveUsers(users);

      res.json({
        success: true,
        message: `Usuário ${status}.`,
        user: {
          name: user.name,
          email: user.email,
          status: user.status
        }
      });
    }
  );
}

module.exports = registerAdminRoutes;
