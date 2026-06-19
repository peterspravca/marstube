import { getYT } from "./youtube";

export async function getTrending() {
  try {
    const yt = await getYT();
    const trending = await yt.search('trending', { type: 'video' });
    // Vrátime pole videí so štruktúrou prispôsobenou nášmu VideoCard
    return (trending.videos || []).map(v => ({
      id: v.id,
      url: `/watch?v=${v.id}`,
      title: v.title?.text || v.title || "Neznámy názov",
      thumbnail: v.thumbnails?.[0]?.url || "",
      uploaderName: v.author?.name || "Neznámy autor",
      views: v.view_count?.text || "",
      uploadedDate: v.published?.text || ""
    }));
  } catch (e) {
    console.error("getTrending Error:", e);
    return [];
  }
}

export async function searchVideos(query) {
  try {
    const yt = await getYT();
    const search = await yt.search(query, { type: 'video' });
    return (search.videos || []).map(v => ({
      id: v.id,
      url: `/watch?v=${v.id}`,
      title: v.title?.text || v.title || "Neznámy názov",
      thumbnail: v.thumbnails?.[0]?.url || "",
      uploaderName: v.author?.name || "Neznámy autor",
      views: v.view_count?.text || "",
      uploadedDate: v.published?.text || ""
    }));
  } catch (e) {
    console.error("searchVideos Error:", e);
    return [];
  }
}

export async function getPlaylist(playlistId) {
  try {
    const yt = await getYT();
    const playlist = await yt.getPlaylist(playlistId);
    return (playlist.items || []).map(v => ({
      id: v.id,
      url: `/watch?v=${v.id}&list=${playlistId}`,
      title: v.title?.text || v.title || "Neznámy názov",
      thumbnail: v.thumbnails?.[0]?.url || "",
      uploaderName: v.author?.name || "Neznámy autor"
    }));
  } catch (e) {
    console.error("getPlaylist Error:", e);
    return [];
  }
}

export async function getVideoStream(videoId) {
  try {
    const yt = await getYT();
    const info = await yt.getInfo(videoId, { client: 'ANDROID' });
    
    let finalUrl = null;
    
    // Pokúsime sa získať spojený video+audio formát
    try {
      const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
      if (format) {
        format.decipher(yt.session.player);
        finalUrl = format.url;
      }
    } catch (e) {
      console.warn("Could not choose combined format:", e.message);
    }

    // Fallback na HLS ak nie je MP4
    if (!finalUrl && info.streaming_data?.hls_manifest_url) {
      finalUrl = info.streaming_data.hls_manifest_url;
    }

    return {
      id: videoId,
      title: info.basic_info.title,
      uploader: info.basic_info.author,
      views: info.basic_info.view_count,
      thumbnailUrl: info.basic_info.thumbnail?.[0]?.url,
      description: info.basic_info.short_description,
      streamUrl: finalUrl
    };
  } catch (e) {
    console.error("getVideoStream Error:", e);
    return null;
  }
}
