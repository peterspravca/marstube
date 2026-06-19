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
  try {
    const yt = await Innertube.create({ 
      cache: new UniversalCache(false), 
      generate_session_locally: true
    });
    console.log("Fetching info for 36pXHRl0HjE...");
    const info = await yt.getInfo('36pXHRl0HjE');
    
    let finalUrl = null;
    try {
      const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
      if (format) {
        format.decipher(yt.session.player);
        finalUrl = format.url;
      }
    } catch(e) {
      console.log("Format error:", e.message);
    }
    
    console.log("Final URL:", finalUrl ? "OK" : "NULL");
    if (finalUrl) console.log(finalUrl.substring(0, 50) + "...");
  } catch(e) {
    console.error("Overall error:", e);
  }
}
test();
