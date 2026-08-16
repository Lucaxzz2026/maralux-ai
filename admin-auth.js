const crypto = require("crypto");

const adminSessions = new Map();

function createAdminSession(email) {
  const token = crypto.randomBytes(32).toString("hex");

  adminSessions.set(token, {
    email,
    createdAt: Date.now()
  });

  return token;
}

function getAdminSession(token) {
  if (!token) {
    return null;
  }

  return adminSessions.get(token) || null;
}

function deleteAdminSession(token) {
  if (token) {
    adminSessions.delete(token);
  }
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Não autorizado."
    });
  }

  const token = auth.slice(7);
  const session = getAdminSession(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: "Sessão administrativa inválida ou expirada."
    });
  }

  req.admin = session;

  next();
}

module.exports = {
  createAdminSession,
  getAdminSession,
  deleteAdminSession,
  requireAdmin
};
