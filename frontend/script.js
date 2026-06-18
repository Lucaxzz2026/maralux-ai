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
function toggleMenu(){}
function closeAllMenus(){}
function newChat(){}
function openProfileEdit(){}
function closeProfileEdit(){}
function saveProfile(){}
function doLogout(){}
