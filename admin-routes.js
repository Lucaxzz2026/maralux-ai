const bcrypt = require("bcryptjs");
const pool = require("./db");

const {
  createAdminSession,
  deleteAdminSession,
  requireAdmin
} = require("./admin-auth");

function registerAdminRoutes(app) {

  // =========================
  // ADMIN LOGIN
  // =========================

  app.post("/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "E-mail e senha são obrigatórios."
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const result = await pool.query(
        `
        SELECT id, name, email, password, status, role
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [normalizedEmail]
      );

      const user = result.rows[0];

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

    } catch (error) {
      console.error("❌ Erro no login Admin:", error.message);

      return res.status(500).json({
        success: false,
        message: "Erro interno no login administrativo."
      });
    }
  });


  // =========================
  // ADMIN LOGOUT
  // =========================

  app.post("/admin/logout", requireAdmin, (req, res) => {

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ")
      ? auth.slice(7)
      : "";

    deleteAdminSession(token);

    res.json({
      success: true,
      message: "Sessão administrativa encerrada."
    });
  });


  // =========================
  // LISTAR USUÁRIOS
  // =========================

  app.get("/admin/users", requireAdmin, async (req, res) => {
    try {

      const result = await pool.query(
        `
        SELECT
          id,
          name,
          email,
          status,
          role,
          reason,
          created_at
        FROM users
        ORDER BY id DESC
        `
      );

      const safeUsers = result.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status || "pending",
        role: user.role || "user",
        createdAt: user.created_at || null,
        reason: user.reason || ""
      }));

      return res.json({
        success: true,
        total: safeUsers.length,
        users: safeUsers
      });

    } catch (error) {
      console.error("❌ Erro ao listar usuários:", error.message);

      return res.status(500).json({
        success: false,
        message: "Erro ao carregar usuários."
      });
    }
  });


  // =========================
  // ALTERAR STATUS
  // =========================

  app.post(
    "/admin/users/:email/status",
    requireAdmin,
    async (req, res) => {

      try {
        const email = decodeURIComponent(req.params.email);
        const { status, reason } = req.body;

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

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
          `
          SELECT id, name, email, status, role
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
          `,
          [normalizedEmail]
        );

        const user = result.rows[0];

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

        const updateResult = await pool.query(
          `
          UPDATE users
          SET
            status = $1,
            reason = $2
          WHERE id = $3
          RETURNING id, name, email, status, role, reason
          `,
          [
            status,
            reason || null,
            user.id
          ]
        );

        const updatedUser = updateResult.rows[0];

        return res.json({
          success: true,
          message: `Usuário ${status}.`,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            status: updatedUser.status,
            role: updatedUser.role,
            reason: updatedUser.reason || ""
          }
        });

      } catch (error) {
        console.error("❌ Erro ao alterar status:", error.message);

        return res.status(500).json({
          success: false,
          message: "Erro ao alterar status do usuário."
        });
      }
    }
  );
}

module.exports = registerAdminRoutes;
