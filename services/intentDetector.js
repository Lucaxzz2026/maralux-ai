function needsInternet(message) {
  const msg = message.toLowerCase();

  const keywords = [
    "hoje",
    "notícia",
    "notícias",
    "últimas",
    "agora",
    "atual",
    "placar",
    "resultado",
    "jogo",
    "partida",
    "copa",
    "clima",
    "tempo",
    "cotação",
    "preço",
    "bitcoin",
    "dólar"
  ];

  return keywords.some(word => msg.includes(word));
}

module.exports = { needsInternet };
