import { Innertube } from 'youtubei.js';

async function testAllClients() {
  const yt = await Innertube.create();
  const videoId = 'dQw4w9WgXcQ';
  
  const clients = ['WEB', 'WEB_KIDS', 'ANDROID', 'IOS', 'TV', 'TV_EMBEDDED', 'WEB_EMBEDDED', 'WEB_CREATOR'];
  for (const client of clients) {
    try {
      const info = await yt.getInfo(videoId, { client });
      if (info.streaming_data) {
        console.log(`\n--- Client: ${client} ---`);
        try {
          const bestAudio = info.chooseFormat({ type: 'audio', quality: 'best' });
          const url = await bestAudio.decipher(yt.session.player);
          console.log(`Found audio: ${bestAudio.mime_type} - ${bestAudio.itag}`);
          
          const res = await fetch(url, { method: 'HEAD', headers: {
            'User-Agent': client === 'IOS' ? 'com.google.ios.youtube/1.0' : 'Mozilla/5.0'
          }});
          console.log(`Status: ${res.status}`);
        } catch (e) {
          console.log(`Error:`, e.message);
        }
      }
    } catch (e) {
      console.log(`\n--- Client: ${client} (FAILED) ---`, e.message);
    }
  }
}

testAllClients();
