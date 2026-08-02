require("dotenv").config();
const { searchYoutube } = require("./services/youtube");

async function testar() {
  const videos = await searchYoutube("curso HTML");

  console.log(videos);
}

testar();
