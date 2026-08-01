require("dotenv").config();

async function testar() {
  const resposta = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: "Quais são as notícias de hoje?",
      max_results: 3
    })
  });

  const dados = await resposta.json();
  console.log(JSON.stringify(dados, null, 2));
}

testar();
