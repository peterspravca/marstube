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

  const videoId = '-_3dc6X-Iwo';
  console.log("Testing TV client...");
  try {
    const info = await yt.getInfo(videoId, { client: 'TV' });
    console.log("Success! Title:", info.basic_info.title);
    const audio_formats = info.streaming_data?.adaptive_formats?.filter(f => f.mime_type.startsWith('audio/')) || [];
    console.log("Total audio formats:", audio_formats.length);
    
    for (let i = 0; i < audio_formats.length; i++) {
      const format = audio_formats[i];
      console.log(`\nFormat #${i}: MIME: ${format.mime_type}, Bitrate: ${format.bitrate}`);
      try {
        format.decipher(yt.session.player);
        console.log(`  Deciphered URL: ${format.url ? format.url.substring(0, 80) + '...' : 'NULL'}`);
      } catch(de) {
        console.log(`  Decipher error: ${de.message}`);
      }
    }
  } catch(e) {
    console.error("Error:", e);
  }
}

test();
