import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  try {
    const yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
    
    console.log("--- SEARCH ---");
    const search = await yt.search('trending', { type: 'video' });
    if (search.videos && search.videos.length > 0) {
      const v = search.videos[0];
      console.log("Search v.title:", JSON.stringify(v.title));
      console.log("Search v.author:", JSON.stringify(v.author));
      console.log("Search v.thumbnails:", JSON.stringify(v.thumbnails));
    }

    console.log("--- PLAYLIST ---");
    const playlist = await yt.getPlaylist("PLCwBFVz_wO-Vk84Ez9jFq4R2scZkQpzmq");
    if (playlist.items && playlist.items.length > 0) {
      const v = playlist.items[0];
      console.log("Playlist v.title:", JSON.stringify(v.title));
      console.log("Playlist v.author:", JSON.stringify(v.author));
      console.log("Playlist v.thumbnails:", JSON.stringify(v.thumbnails));
    }
  } catch(e) {
    console.error(e);
  }
}
test();
