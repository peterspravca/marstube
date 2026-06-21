import { Innertube } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ gl: 'SK', hl: 'sk' });
  try {
    const searchResult = await yt.search("techno music official video", { type: 'video', duration: 'short' });
    const filteredVideos = (searchResult.videos || []).filter(v => {
      if (v.is_live) return false;
      const durationSeconds = v.duration?.seconds || 0;
      return durationSeconds > 0 && durationSeconds <= 360;
    });
    console.log("Original length:", searchResult.videos?.length);
    console.log("Filtered length:", filteredVideos.length);
    console.log(searchResult.videos[0].duration);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
