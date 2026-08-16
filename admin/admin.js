const API = "";

let adminToken = localStorage.getItem("maralux_admin_token");
let adminUser = JSON.parse(
  localStorage.getItem("maralux_admin_user") || "null"
);

let allUsers = [];
let currentFilter = "all";


const loginScreen =
  document.getElementById("loginScreen");

const dashboardScreen =
  document.getElementById("dashboardScreen");


function showDashboard() {

  loginScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");

  if (adminUser) {
    document.getElementById("adminName").textContent =
      adminUser.name || adminUser.email;
  }

  loadUsers();
}


function showLogin() {

  dashboardScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}


async function adminLogin(email, password) {

  const response = await fetch(
    API + "/admin/login",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Falha no login."
    );
  }

  adminToken = data.token;
  adminUser = data.admin;

  localStorage.setItem(
    "maralux_admin_token",
    adminToken
  );

  localStorage.setItem(
    "maralux_admin_user",
    JSON.stringify(adminUser)
  );

  showDashboard();
}


async function loadUsers() {

  const container =
    document.getElementById("usersContainer");

  container.innerHTML =
    '<div class="loading">Carregando usuários...</div>';

  try {

    const response = await fetch(
      API + "/admin/users",
      {
        headers: {
          "Authorization":
            "Bearer " + adminToken
        }
      }
    );

    const data = await response.json();

    if (response.status === 401) {

      logout();

      return;
    }

    if (!data.success) {
      throw new Error(
        data.message || "Erro ao carregar usuários."
      );
    }

    allUsers = data.users || [];

    updateStats();

    renderUsers();

  } catch (error) {

    container.innerHTML =
      '<div class="empty">Erro ao carregar usuários.</div>';

    console.error(error);
  }
}


function updateStats() {

  document.getElementById("totalUsers").textContent =
    allUsers.length;

  document.getElementById("pendingUsers").textContent =
    allUsers.filter(
      u => u.status === "pending"
    ).length;

  document.getElementById("approvedUsers").textContent =
    allUsers.filter(
      u => u.status === "approved"
    ).length;

  document.getElementById("blockedUsers").textContent =
    allUsers.filter(
      u => u.status === "blocked"
    ).length;
}


function renderUsers() {

  const container =
    document.getElementById("usersContainer");

  let users = allUsers;

  if (currentFilter !== "all") {

    users = allUsers.filter(
      user => user.status === currentFilter
    );

  }

  if (!users.length) {

    container.innerHTML =
      '<div class="empty">Nenhum usuário encontrado.</div>';

    return;
  }


  container.innerHTML =
    users.map(renderUserCard).join("");
}


function renderUserCard(user) {

  const safeName =
    escapeHtml(user.name || "Sem nome");

  const safeEmail =
    escapeHtml(user.email || "");

  const status =
    user.status || "approved";

  const createdAt =
    user.createdAt
      ? new Date(user.createdAt).toLocaleString("pt-BR")
      : "Não informado";

  let actions = "";

  if (user.role === "admin") {

    actions =
      '<div class="user-info">Administrador do sistema</div>';

  } else {

    if (status === "pending") {

      actions += `
        <button
          class="approve-btn"
          onclick="changeStatus('${encodeURIComponent(user.email)}','approved')">
          APROVAR
        </button>

        <button
          class="reject-btn"
          onclick="changeStatus('${encodeURIComponent(user.email)}','rejected')">
          REJEITAR
        </button>
      `;

    }

    if (status === "approved") {

      actions += `
        <button
          class="block-btn"
          onclick="changeStatus('${encodeURIComponent(user.email)}','blocked')">
          BLOQUEAR
        </button>
      `;

    }

    if (status === "blocked") {

      actions += `
        <button
          class="unblock-btn"
          onclick="changeStatus('${encodeURIComponent(user.email)}','approved')">
          DESBLOQUEAR
        </button>
      `;

    }

    if (status === "rejected") {

      actions += `
        <button
          class="approve-btn"
          onclick="changeStatus('${encodeURIComponent(user.email)}','approved')">
          APROVAR
        </button>
      `;

    }

  }


  return `
    <div class="user-card">

      <div class="user-top">

        <div>

          <div class="user-name">
            ${safeName}
          </div>

          <div class="user-email">
            ${safeEmail}
          </div>

        </div>

        <span class="status ${status}">
          ${status.toUpperCase()}
        </span>

      </div>

      <div class="user-info">
        Cadastro: ${createdAt}
      </div>

      ${
        user.reason
          ? `<div class="user-info">
               Motivo: ${escapeHtml(user.reason)}
             </div>`
          : ""
      }

      <div class="actions">
        ${actions}
      </div>

    </div>
  `;
}


async function changeStatus(email, status) {

  const labels = {
    approved: "aprovar",
    rejected: "rejeitar",
    blocked: "bloquear"
  };

  const action =
    labels[status] || "alterar";

  if (!confirm(
    `Tem certeza que deseja ${action} este usuário?`
  )) {
    return;
  }


  try {

    const response = await fetch(
      API +
      "/admin/users/" +
      email +
      "/status",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            "Bearer " + adminToken
        },

        body: JSON.stringify({
          status
        })
      }
    );

    const data = await response.json();

    if (response.status === 401) {

      logout();

      return;
    }

    if (!data.success) {

      alert(
        data.message ||
        "Não foi possível alterar o usuário."
      );

      return;
    }

    await loadUsers();

  } catch (error) {

    console.error(error);

    alert(
      "Erro de conexão com o servidor."
    );
  }
}


async function logout() {

  try {

    if (adminToken) {

      await fetch(
        API + "/admin/logout",
        {
          method: "POST",

          headers: {
            "Authorization":
              "Bearer " + adminToken
          }
        }
      );

    }

  } catch (error) {
    console.error(error);
  }


  localStorage.removeItem(
    "maralux_admin_token"
  );

  localStorage.removeItem(
    "maralux_admin_user"
  );

  adminToken = null;
  adminUser = null;

  showLogin();
}


function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* LOGIN */

document
  .getElementById("loginForm")
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      const email =
        document
          .getElementById("adminEmail")
          .value
          .trim();

      const password =
        document
          .getElementById("adminPassword")
          .value;

      const message =
        document.getElementById(
          "loginMessage"
        );

      message.textContent =
        "Entrando...";

      try {

        await adminLogin(
          email,
          password
        );

      } catch (error) {

        message.textContent =
          error.message;

      }

    }
  );


/* LOGOUT */

document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    logout
  );


/* ATUALIZAR */

document
  .getElementById("refreshBtn")
  .addEventListener(
    "click",
    loadUsers
  );


/* FILTROS */

document
  .querySelectorAll(".filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      function() {

        document
          .querySelectorAll(".filter")
          .forEach(
            b => b.classList.remove("active")
          );

        this.classList.add("active");

        currentFilter =
          this.dataset.filter;

        renderUsers();

      }
    );

  });


/* INIT */

if (adminToken) {

  showDashboard();

} else {

  showLogin();

}
