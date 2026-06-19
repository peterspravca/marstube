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
  console.log("Initializing Innertube with custom proxy fetch...");
  
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
  
  const videoId = 'nPo7sJcCdJw'; // lofi track or typical video
  console.log("Fetching video info for ID:", videoId);
  try {
    const info = await yt.getInfo(videoId);
    console.log("Successfully fetched video info!");
    console.log("Title:", info.basic_info.title);
    
    // Získame format
    const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    if (format) {
      format.decipher(yt.session.player);
      console.log("Deciphered stream URL (first 100 chars):", format.url.substring(0, 100));
    } else {
      console.log("No combined format found.");
    }
  } catch (e) {
    console.error("Error during test:", e);
  }
}

test();
