import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  const playlist = await yt.getPlaylist("PLCw8FVz_wO-Vk84Ez9jFq4R2scZkQpzmq");
  
  console.log("Playlist info keys:", Object.keys(playlist.info));
  console.log("Playlist info:", JSON.stringify({
    title: playlist.info.title,
    author: playlist.info.author,
    thumbnails: playlist.info.thumbnails,
    total_items: playlist.info.total_items
  }, null, 2));
}

test().catch(console.error);
