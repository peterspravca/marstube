import { Innertube } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ gl: 'SK', hl: 'sk' });
  const queries = [
      "david guetta official video",
      "hugel official video",
      "tiesto official video",
      "fisher official video",
      "meduza official video",
      "james hype official video",
      "dom dolla official video",
      "john summit official video",
      "calvin harris official video"
  ];
  
  for (const q of queries) {
    const res = await yt.search(q, { type: 'video' });
    const shortVideos = res.videos.filter(v => !v.is_live && v.duration?.seconds > 0 && v.duration?.seconds <= 360);
    console.log(`${q}: total ${res.videos.length}, short ${shortVideos.length}`);
  }
}

test();
