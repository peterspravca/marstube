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
    generate_session_locally: true
  });
  
  const videoId = 'nPo7sJcCdJw';
  const info = await yt.getInfo(videoId, { client: 'ANDROID' });
  const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
  if (format) {
    format.decipher(yt.session.player);
    console.log("Fetching ANDROID URL...", format.url.substring(0, 50));
    const res = await fetch(format.url, { method: "HEAD" });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
  } else {
    console.log("No video+audio format found for ANDROID");
  }
}
test();
