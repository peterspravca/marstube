async function testPiped() {
  const videoId = 'dQw4w9WgXcQ';
  try {
    const res = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
    const data = await res.json();
    console.log("Audio streams:", data.audioStreams.length);
    if (data.audioStreams.length > 0) {
      console.log("Best audio:", data.audioStreams[0].url.substring(0, 50) + "...");
      const headRes = await fetch(data.audioStreams[0].url, { method: 'HEAD' });
      console.log("HEAD status:", headRes.status);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
testPiped();
