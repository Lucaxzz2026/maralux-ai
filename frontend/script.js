
const BACKEND_URL = "https://maralux-ai.onrender.com/chat";
let sessionCount = 1;
let currentSession = 1;
let sessions = {
  1: []
};
function getSessionKey(){

  const user =
    JSON.parse(localStorage.getItem("loggedUser"));

  if(!user) return "maralux_sessions_guest";

  return "maralux_sessions_" + user.email;

}
async function sendMessage() {
  const input = document.getElementById("userInput");
  const messagesArea = document.getElementById("messagesArea");

  if (!input || !messagesArea) return;

  const text = input.value.trim();
if(!sessions[currentSession]){
  sessions[currentSession] = [];
}

sessions[currentSession].push({
  sender: "user",
  text: text
});
localStorage.setItem(
  getSessionKey(),
  JSON.stringify(sessions)
);
  if (!text) return;

  messagesArea.innerHTML += `
    <div style="text-align:right;margin:10px;">
      <div style="display:inline-block;background:#b400ff;color:white;padding:10px 14px;border-radius:12px;max-width:80%;">
        ${text}
      </div>
    </div>
  `;

  input.value = "";

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        userId: "guest"
      })
    });

    const data = await response.json();
sessions[currentSession].push({
  sender: "ai",
  text: data.reply || "Sem resposta"
});
localStorage.setItem(
  getSessionKey(),
  JSON.stringify(sessions)
);
  messagesArea.innerHTML += `
      <div style="text-align:left;margin:10px;">
        <div style="display:inline-block;background:#111827;color:white;padding:10px 14px;border-radius:12px;max-width:80%;">
          ${data.reply || "Sem resposta"}
        </div>
      </div>
    `;

    messagesArea.scrollTop = messagesArea.scrollHeight;

  } catch (err) {
    console.error(err);

    messagesArea.innerHTML += `
      <div style="color:red;margin:10px;">
        Erro ao conectar com a IA.
      </div>
    `;
  }
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  const target = document.getElementById(id);

  if(target){
    target.classList.remove("hidden");
  }

  if(id === "appScreen"){
    setTimeout(() => {
      loadSavedConversation();
    }, 100);
  }
}
async function doLogin(){

  const email =
    document.getElementById("loginEmail").value;

  const password =
    document.getElementById("loginPassword").value;

  try {

    const response = await fetch(
      "http://localhost:3000/login",
      {
        method: "POST",
        headers: {
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await response.json();

    if(data.success){

  localStorage.setItem(
  "loggedUser",
  JSON.stringify(data.user)
);

localStorage.setItem(
  "maralux_name",
  data.user.name
);
const profileMenuName =
  document.getElementById("profileMenuName");

const headerAvatarIni =
  document.getElementById("headerAvatarIni");

const profileMenuIni =
  document.getElementById("profileMenuIni");

if(profileMenuName){
  profileMenuName.textContent = data.user.name;
}

const initial =
  data.user.name.charAt(0).toUpperCase();

if(headerAvatarIni){
  headerAvatarIni.textContent = initial;
}

if(profileMenuIni){
  profileMenuIni.textContent = initial;
}
alert("Login realizado com sucesso!");

showScreen("appScreen");

} else {

      alert(data.message);

    }

  } catch(err){

    console.error(err);

    alert("Erro ao conectar ao servidor.");

  }

}

async function doRegister(){

  const name =
   document.getElementById("regName").value;

  const email =
    document.getElementById("regEmail").value;

  const password =
    document.getElementById("regPassword").value;

  try {

    const response = await fetch(
      "http://localhost:3000/register",
      {
        method: "POST",
        headers: {
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      }
    );

    const data = await response.json();

    if(data.success){

      alert("Cadastro realizado com sucesso!");

      showScreen("loginScreen");

    } else {

      alert(data.message);

    }

  } catch(err){

    console.error(err);

    alert("Erro ao conectar ao servidor.");

  }

}
function doVerify(){}
function resendOtp(){}
function otpMove(){}
function otpBack(){}
function handleKey(event){
  if(event.key === "Enter" && !event.shiftKey){
    event.preventDefault();
    sendMessage();
  }
}

function autoResize(el){
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}
function handleAvatarUpload(){}
function toggleMenu(id, event){
  if(event){
    event.stopPropagation();
  }

  const overlay = document.getElementById(id);

  if(overlay){
    overlay.style.display = "flex";
  }
}
function closeAllMenus(){
  const menuOverlay = document.getElementById("menuOverlay");
  const profileOverlay = document.getElementById("profileOverlay");

  if(menuOverlay){
    menuOverlay.style.display = "none";
  }

  if(profileOverlay){
    profileOverlay.style.display = "none";
  }
}
function newChat(){

  sessionCount++;
sessions[sessionCount] = [];
  const messagesArea = document.getElementById("messagesArea");
  const sessionsList = document.getElementById("sessionsList");

  if(messagesArea){
    messagesArea.innerHTML = `
      <div style="text-align:center;padding:30px;color:#888;">
        Nova conversa iniciada.
      </div>
    `;
  }

  if(sessionsList){

    const item = document.createElement("div");

    item.className = "session-entry";

    item.innerHTML = `
      <span class="session-dot"></span>
      <span>Sessão ${sessionCount}</span>
    `;
   item.onclick = function(){

  document.querySelectorAll(".session-entry").forEach(el=>{
    el.classList.remove("active");
  });

  item.classList.add("active");
currentSession = parseInt(
  item.textContent.replace("Sessão","").trim()
);
const messagesArea = document.getElementById("messagesArea");

if(messagesArea){

  messagesArea.innerHTML = "";

  if(sessions[currentSession]){

    sessions[currentSession].forEach(msg => {

  if(msg.sender === "user"){

    messagesArea.innerHTML += `
      <div style="text-align:right;margin:10px;">
        <div style="display:inline-block;background:#b400ff;color:white;padding:10px 14px;border-radius:12px;max-width:80%;">
          ${msg.text}
        </div>
      </div>
    `;

  } else {

    messagesArea.innerHTML += `
      <div style="text-align:left;margin:10px;">
        <div style="display:inline-block;background:#111827;color:white;padding:10px 14px;border-radius:12px;max-width:80%;">
          ${msg.text}
        </div>
      </div>
    `;

  }

});

  }

}
};
    sessionsList.appendChild(item);
  }
}
function openProfileEdit(){
  const modal = document.getElementById("profileModal");

  if(modal){
    modal.style.display = "flex";
  }
}
function closeProfileEdit(){
  const modal = document.getElementById("profileModal");

  if(modal){
    modal.style.display = "none";
  }
}
function saveProfile(){
  const nameInput = document.getElementById("editName");

  if(!nameInput) return;

  const name = nameInput.value.trim();

  if(name){
    localStorage.setItem("maralux_name", name);

    const profileMenuName = document.getElementById("profileMenuName");
    const headerAvatarIni = document.getElementById("headerAvatarIni");
    const profileMenuIni = document.getElementById("profileMenuIni");

    if(profileMenuName){
      profileMenuName.textContent = name;
    }

    const initial = name.charAt(0).toUpperCase();

    if(headerAvatarIni){
      headerAvatarIni.textContent = initial;
    }

    if(profileMenuIni){
      profileMenuIni.textContent = initial;
    }
  }

  closeProfileEdit();
}
function doLogout(){

  localStorage.removeItem("maralux_name");
  localStorage.removeItem("loggedUser");
  localStorage.removeItem("maralux_sessions");
 
  const profileMenuName = document.getElementById("profileMenuName");
  const headerAvatarIni = document.getElementById("headerAvatarIni");
  const profileMenuIni = document.getElementById("profileMenuIni");
  const messagesArea = document.getElementById("messagesArea");

  if(profileMenuName){
    profileMenuName.textContent = "–";
  }

  if(headerAvatarIni){
    headerAvatarIni.textContent = "?";
  }

  if(profileMenuIni){
    profileMenuIni.textContent = "?";
  }

  if(messagesArea){
    messagesArea.innerHTML = "";
  }

  closeAllMenus();
  showScreen("landingScreen");
}
function loadSavedConversation(){
console.log("SESSIONS:", sessions);
  const messagesArea =
    document.getElementById("messagesArea");

  if(!messagesArea) return;

  messagesArea.innerHTML = "";

  if(!sessions[currentSession]) return;

  sessions[currentSession].forEach(msg => {

    if(msg.sender === "user"){

      messagesArea.innerHTML += `
        <div style="text-align:right;margin:10px;">
          <div style="display:inline-block;background:#b400ff;color:white;padding:10px 14px;border-radius:12px;max-width:80%;">
            ${msg.text}
          </div>
        </div>
      `;

    } else {

      messagesArea.innerHTML += `
        <div style="text-align:left;margin:10px;">
          <div style="display:inline-block;background:#111827;color:white;padding:10px 14px;border-radius:12px;max-width:80%;">
            ${msg.text}
          </div>
        </div>
      `;

    }

  });

}
window.onload = function(){

  const name = localStorage.getItem("maralux_name");

  if(name){

    const profileMenuName = document.getElementById("profileMenuName");
    const headerAvatarIni = document.getElementById("headerAvatarIni");
    const profileMenuIni = document.getElementById("profileMenuIni");

    if(profileMenuName){
      profileMenuName.textContent = name;
    }

    const initial = name.charAt(0).toUpperCase();

    if(headerAvatarIni){
      headerAvatarIni.textContent = initial;
    }

    if(profileMenuIni){
      profileMenuIni.textContent = initial;
    }
  }

};
const savedSessions =
  localStorage.getItem(
    getSessionKey()
  );
if(savedSessions){

  sessions = JSON.parse(savedSessions);
  const keys = Object.keys(sessions);

  if(keys.length > 0){

    sessionCount = Math.max(...keys.map(Number));

    currentSession = 1;

  }

}
const savedUser = localStorage.getItem("loggedUser");

if(savedUser){

  showScreen("appScreen");

  loadSavedConversation();

}
