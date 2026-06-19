import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  const search = await yt.search("lofi hip hop playlist", { type: 'playlist' });
  const playlistId = search.playlists[0].id;
  
  let playlist = await yt.getPlaylist(playlistId);
  console.log("Initial items:", playlist.items.length);
  
  if (playlist.has_continuation) {
    playlist = await playlist.getContinuation();
    console.log("After continuation:", playlist.items.length);
  }
}

test().catch(console.error);
