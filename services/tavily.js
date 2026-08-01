require("dotenv").config();

async function searchInternet(query) {
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        max_results: 5
      })
    });

    const data = await response.json();

    if (!data.results) {
      return "";
    }

    return data.results
      .map(result => {
        return `${result.title}\n${result.content}`;
      })
      .join("\n\n");

  } catch (error) {
    console.error("Erro Tavily:", error);
    return "";
  }
}

module.exports = { searchInternet };
