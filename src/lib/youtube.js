import { Innertube, UniversalCache, Platform } from 'youtubei.js';
import vm from 'vm';

Platform.shim.eval = (script, env) => {
  const codeStr = `(function() {
    ${script.code}
    ${script.output || ""}
  })()`;
  return vm.runInNewContext(codeStr, env || {});
};

let ytInstance = null;

export async function getYT() {
  if (!ytInstance) {
    ytInstance = await Innertube.create({
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
  }
  return ytInstance;
}
