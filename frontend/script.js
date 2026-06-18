alert("Script carregado!");
const BACKEND_URL = "https://maralux-ai.onrender.com/chat";

async function sendMessage() {
  const input = document.getElementById("userInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

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

    console.log(data);
    alert(data.reply || "Resposta recebida");

  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com o servidor");
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
