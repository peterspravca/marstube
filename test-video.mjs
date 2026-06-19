import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  try {
    const info = await yt.getInfo('36pXHRi0HJE', { client: 'ANDROID' });
    console.log("Success! Found streaming data:", !!info.streaming_data);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
