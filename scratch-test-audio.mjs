import { Innertube, UniversalCache, Platform } from 'youtubei.js';
import vm from 'vm';

Platform.shim.eval = (script, env) => {
  const codeStr = `(function() {
    ${script.code}
    ${script.output || ""}
  })()`;
  return vm.runInNewContext(codeStr, env || {});
};

async function test() {
  console.log("Initializing Innertube...");
  const yt = await Innertube.create({ 
    cache: new UniversalCache(false), 
    generate_session_locally: true
  });
  
  const videoId = 'K2iC1aCPbKA';
  const clients = ['YTMUSIC'];
  
  for (const client of clients) {
    console.log(`\n================ ${client} ================`);
    try {
      const info = await yt.getInfo(videoId, { client });
      const audioFormat = info.chooseFormat({ type: 'audio', quality: 'best' });
      if (audioFormat) {
        console.log(`Mime: ${audioFormat.mime_type}, has_url: ${audioFormat.url ? 'YES' : 'NO'}, has_cipher: ${audioFormat.signature_cipher ? 'YES' : 'NO'}`);
        try {
          await audioFormat.decipher(yt.session.player);
          console.log(`Deciphered URL: ${audioFormat.url ? audioFormat.url.substring(0, 100) : 'none'}...`);
          
          if (audioFormat.url) {
            const testRes = await fetch(audioFormat.url, {
              headers: {
                'Range': 'bytes=0-100',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://music.youtube.com/'
              }
            });
            console.log(`Fetch HTTP Status: ${testRes.status}`);
          }
        } catch(err) {
          console.log(`Decipher error: ${err.message}`);
        }
      } else {
        console.log("No audio format found.");
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

test();
