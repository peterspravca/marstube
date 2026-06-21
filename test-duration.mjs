import { Innertube } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ gl: 'SK', hl: 'sk' });
  const q = "top radio hits 2026 song";
  try {
    const searchResult = await yt.search(q, { type: 'video' });
    console.log(`Found ${searchResult.videos?.length} videos.`);
    for (let i = 0; i < Math.min(5, searchResult.videos.length); i++) {
      const v = searchResult.videos[i];
      console.log(`Title: ${v.title?.text || v.title}`);
      console.log(`Duration:`, v.duration);
      console.log(`Is Live:`, v.is_live);
    }
  } catch (e) {
    console.error(`Error:`, e.message);
  }
}

test();
