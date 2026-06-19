import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  try {
    const yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
    const search = await yt.search('trending', { type: 'video' });
    console.log("Search videos count:", search.videos?.length);
    if (search.videos && search.videos.length > 0) {
      console.log("First video title:", search.videos[0].title.text);
    }
  } catch(e) {
    console.error(e);
  }
}
test();
