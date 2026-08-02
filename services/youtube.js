require("dotenv").config();

async function searchYoutube(query) {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&maxResults=3` +
      `&type=video` +
      `&q=${encodeURIComponent(query)}` +
      `&key=${process.env.YOUTUBE_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return "";
    }

    return data.items.map(video => {
      return {
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`
      };
    });

  } catch (err) {
    console.error("Erro YouTube:", err);
    return "";
  }
}

module.exports = { searchYoutube };
