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
  
  const videoId = 'nPo7sJcCdJw'; // bežné lofi video
  console.log("Fetching video info for ID:", videoId);
  try {
    const info = await yt.getInfo(videoId, { client: 'TV_EMBEDDED' });
    console.log("Success! Title:", info.basic_info.title);
    
    // Video+audio format
    const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    if (!format) {
      console.log("No combined format found.");
      return;
    }
    format.decipher(yt.session.player);
    const videoUrl = format.url;
    console.log("Deciphered videoUrl:", videoUrl);
    
    // Let's test calling download.php
    const filename = `${videoId}_video.mp4`;
    console.log("Calling download.php on marso.sk for filename:", filename);
    const dlUrl = `https://marso.sk/play/download.php?action=download&filename=${filename}&url=${encodeURIComponent(videoUrl)}`;
    
    const res = await fetch(dlUrl);
    const data = await res.json();
    console.log("Download result:", data);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
