import { Innertube } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ gl: 'SK', hl: 'sk' });
  const musicQueries = [
      "top radio hits 2026 song",
      "best electronic dance music edm track",
      "techno music official video",
      "david guetta new song",
      "hugel new track",
      "melodic techno single",
      "popular radio hits",
      "trending dance songs tiesto",
      "tech house track",
      "deep house official music video",
      "trending dance songs",
      "new pop songs playlist",
      "top chart songs official"
  ];
  
  for (const q of musicQueries) {
    try {
      const searchResult = await yt.search(q, { type: 'video', duration: 'short' });
      const filteredVideos = (searchResult.videos || []).filter(v => !v.is_live);
      console.log(`Query: ${q} -> Original: ${searchResult.videos?.length}, No Live: ${filteredVideos.length}`);
    } catch (e) {
      console.error(`Error on ${q}:`, e.message);
    }
  }
}

test();
