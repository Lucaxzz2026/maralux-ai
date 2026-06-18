alert("Script carregado!");
const BACKEND_URL = "https://maralux-ai.onrender.com/chat";

async function sendMessage() {
  const input = document.getElementById("userInput");
  const messagesArea = document.getElementById("messagesArea");

  if (!input || !messagesArea) return;

  const text = input.value.trim();
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
}
function doLogin(){
  showScreen("appScreen");
}

function doRegister(){
  showScreen("appScreen");
}
function doVerify(){}
function resendOtp(){}
function otpMove(){}
function otpBack(){}
function handleKey(){}
function autoResize(){}
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
  const messagesArea = document.getElementById("messagesArea");

  if(messagesArea){
    messagesArea.innerHTML = `
      <div style="text-align:center;padding:30px;color:#888;">
        Nova conversa iniciada.
      </div>
    `;
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
