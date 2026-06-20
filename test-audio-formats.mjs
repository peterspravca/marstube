import { Innertube } from 'youtubei.js';

async function testAudioFormats() {
  const yt = await Innertube.create();
  const videoId = 'dQw4w9WgXcQ';
  console.log(`Testing info for video ${videoId}...`);
  
  const clients = ['WEB', 'ANDROID', 'IOS'];
  for (const client of clients) {
    try {
      const info = await yt.getInfo(videoId, { client });
      if (info.streaming_data) {
        console.log(`\n--- Client: ${client} ---`);
        const audioFormats = info.streaming_data.formats.filter(f => f.has_audio && !f.has_video);
        const adaptiveAudioFormats = info.streaming_data.adaptive_formats.filter(f => f.has_audio && !f.has_video);
        
        console.log(`Formats (audio-only):`, audioFormats.length);
        console.log(`Adaptive (audio-only):`, adaptiveAudioFormats.map(f => `${f.mime_type} - ${f.itag}`));
        
        try {
          const bestAudio = info.chooseFormat({ type: 'audio', quality: 'best' });
          console.log(`Best audio chosen: ${bestAudio.mime_type} - ${bestAudio.itag}`);
          const url = await bestAudio.decipher(yt.session.player);
          
          // Test the URL headers to see if it gives 403
          const res = await fetch(url, { method: 'HEAD', headers: {
            'User-Agent': client === 'WEB' ? 'Mozilla/5.0' : `com.google.${client.toLowerCase()}.youtube/1.0`
          }});
          console.log(`URL Status: ${res.status}`);
        } catch (e) {
          console.log(`Error choosing format or fetching:`, e.message);
        }
      }
    } catch (e) {
      console.log(`\n--- Client: ${client} (FAILED) ---`, e.message);
    }
  }
}

testAudioFormats();
