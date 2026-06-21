import { Innertube } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ gl: 'SK', hl: 'sk' });
  const q = "tech house track";
  
  console.log("Without filters:");
  const res1 = await yt.search(q, { type: 'video' });
  console.log(res1.videos?.slice(0,2).map(v => v.duration?.text));

  console.log("With duration short:");
  const res2 = await yt.search(q, { type: 'video', duration: 'short' });
  console.log(res2.videos?.slice(0,2).map(v => v.duration?.text));
  
  console.log("With sort_by and duration inside filters:");
  const res3 = await yt.search(q, { filters: { type: 'Video', duration: 'Under 4 minutes' } });
  console.log(res3.videos?.slice(0,2).map(v => v.duration?.text));
}

test();
