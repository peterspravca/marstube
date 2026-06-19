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
  const videoId = 'PcCD9n0ZYew';
  console.log("Initializing Innertube with proxy...");
  const yt = await Innertube.create({ 
    cache: new UniversalCache(false), 
    generate_session_locally: true,
    fetch: async (input, init) => {
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input && typeof input === 'object' && input.url) {
        url = input.url;
      }
      
      if (url && (url.includes('youtube.com') || url.includes('youtubei.googleapis.com'))) {
        const proxyUrl = `https://marso.sk/play/proxy.php?url=${encodeURIComponent(url)}`;
        if (typeof input === 'string') {
          input = proxyUrl;
        } else {
          input = new Request(proxyUrl, input);
        }
      }
      return Platform.shim.fetch(input, init);
    }
  });
  
  const clients = ['YTMUSIC', 'YTMUSIC_ANDROID'];
  for (const client of clients) {
    console.log("\nTesting client: " + client);
    try {
      const info = await yt.getInfo(videoId, { client });
      
      let videoUrl = null;
      let audioUrl = null;
      
      // Combined format
      try {
        const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
        if (format) {
          videoUrl = await format.decipher(yt.session.player);
        }
      } catch(e) {
        console.log("  Combined format error: " + e.message);
      }
      
      // Separate audio
      try {
        const audioFormat = info.chooseFormat({ type: 'audio', quality: 'best' });
        if (audioFormat) {
          audioUrl = await audioFormat.decipher(yt.session.player);
        }
      } catch(e) {
        console.log("  Audio format error: " + e.message);
      }
      
      console.log("[" + client + "] Video URL: " + (videoUrl ? 'YES' : 'NO'));
      console.log("[" + client + "] Audio URL: " + (audioUrl ? 'YES' : 'NO'));
      
      if (audioUrl) {
        const filename = `${videoId}_${client}_audio.m4a`;
        // Since YTMUSIC is a custom client, let's see what User-Agent YTMUSIC uses in Constants.js:
        // WEB_REMIX is YTMUSIC. It uses a desktop user agent.
        // Let's pass the default session UA or empty.
        const dlUrl = `https://marso.sk/play/download.php?action=download&filename=${filename}&url=${encodeURIComponent(audioUrl)}&client=WEB&ua=${encodeURIComponent(yt.session.user_agent || '')}`;
        console.log(`[${client}] Testing download via proxy...`);
        const res = await fetch(dlUrl);
        const data = await res.json();
        console.log(`[${client}] Download response:`, data);
      }
      
    } catch(e) {
      console.log("[" + client + "] Overall error: " + e.message);
    }
  }
}

test();
