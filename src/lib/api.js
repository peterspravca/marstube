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
    let playlist = await yt.getPlaylist(playlistId);
    let allItems = playlist.items || [];
    
    // Načítaj všetky stránky playlistu, až do 1500 videí (limit pre extrémne veľké playlisty)
    let safetyCounter = 0;
    while (playlist.has_continuation && allItems.length < 1500 && safetyCounter < 20) {
      safetyCounter++;
      playlist = await playlist.getContinuation();
      if (playlist.items) {
        allItems = allItems.concat(playlist.items);
      }
    }

    return {
      info: {
        title: playlist.info?.title || "Môj Playlist",
        author: playlist.info?.author?.name || "MarsTube",
        thumbnail: playlist.info?.thumbnails?.[0]?.url || "",
        totalItems: playlist.info?.total_items || allItems.length || 0,
        id: playlistId
      },
      items: allItems.map(v => ({
        id: v.id,
        url: `/watch?v=${v.id}&list=${playlistId}`,
        title: v.title?.text || v.title || "Neznámy názov",
        thumbnail: v.thumbnails?.[0]?.url || "",
        uploaderName: v.author?.name || "Neznámy autor",
        duration: v.duration?.text || ""
      }))
    };
  } catch (e) {
    console.error("getPlaylist Error:", e);
    return { info: null, items: [] };
  }
}

export async function getVideoStream(videoId) {
  try {
    const yt = await getYT();
    
    const clients = ['IOS', 'ANDROID', 'TV_EMBEDDED', 'WEB'];
    let info = null;
    let clientErrorMessage = null;

    for (const client of clients) {
      try {
        const tempInfo = await yt.getInfo(videoId, { client });
        if (tempInfo.streaming_data) {
          info = tempInfo;
          break;
        }
      } catch (e) {
        clientErrorMessage = e.message;
      }
    }

    if (!info) {
      throw new Error(clientErrorMessage || "Streaming data not available across all clients.");
    }
    
    let finalUrl = null;
    let errorMessage = null;
    
    try {
      const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
      if (format) {
        format.decipher(yt.session.player);
        finalUrl = format.url;
      }
    } catch (e) {
      errorMessage = e.message;
      console.warn("Could not choose combined format:", e.message);
    }

    if (!finalUrl && info.streaming_data?.hls_manifest_url) {
      finalUrl = info.streaming_data.hls_manifest_url;
    }

    return {
      id: info.basic_info.id,
      title: info.basic_info.title,
      description: info.basic_info.short_description,
      thumbnailUrl: info.basic_info.thumbnail?.[0]?.url || "",
      streamUrl: finalUrl,
      uploader: info.basic_info.channel?.name || info.basic_info.author || "",
      error: errorMessage || null
    };
  } catch (error) {
    console.error("Error fetching video stream:", error);
    return {
      id: videoId,
      error: "Zlyhalo pripojenie k YouTube: " + error.message
    };
  }
}
