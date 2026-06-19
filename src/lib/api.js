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
    
    const clients = ['ANDROID', 'IOS', 'WEB'];
    let basicInfo = null;
    let videoUrl = null;
    let audioUrl = null;
    let chosenVideoClient = null;
    let chosenAudioClient = null;
    let clientErrorMessage = null;

    for (const client of clients) {
      try {
        const tempInfo = await yt.getInfo(videoId, { client });
        if (tempInfo.streaming_data) {
          if (!basicInfo) {
            basicInfo = tempInfo.basic_info;
          }
          
          // 1. Získanie kombinovaného video+audio formátu
          if (!videoUrl) {
            try {
              const format = tempInfo.chooseFormat({ type: 'video+audio', quality: 'best' });
              if (format) {
                videoUrl = await format.decipher(yt.session.player);
                chosenVideoClient = client;
              }
            } catch (e) {
              console.warn(`Could not choose combined format for client ${client}:`, e.message);
            }
            if (!videoUrl && tempInfo.streaming_data?.hls_manifest_url) {
              videoUrl = tempInfo.streaming_data.hls_manifest_url;
              chosenVideoClient = client;
            }
          }
          
          // 2. Získanie samostatného audio formátu
          if (!audioUrl) {
            try {
              const audioFormat = tempInfo.chooseFormat({ type: 'audio', quality: 'best' });
              if (audioFormat) {
                audioUrl = await audioFormat.decipher(yt.session.player);
                chosenAudioClient = client;
              }
            } catch (e) {
              console.warn(`Could not choose audio format for client ${client}:`, e.message);
            }
          }
          
          // Ak už máme obe adresy, môžeme ukončiť hľadanie
          if (videoUrl && audioUrl) {
            break;
          }
        }
      } catch (e) {
        clientErrorMessage = e.message;
        console.warn(`Client ${client} failed to get info:`, e.message);
      }
    }

    if (!videoUrl && !audioUrl) {
      throw new Error(clientErrorMessage || "Streaming data not available across all clients.");
    }

    return {
      id: videoId,
      title: basicInfo?.title || "Neznámy názov",
      description: basicInfo?.short_description || "",
      thumbnailUrl: basicInfo?.thumbnail?.[0]?.url || "",
      videoUrl: videoUrl,
      audioUrl: audioUrl,
      videoClient: chosenVideoClient || 'WEB',
      audioClient: chosenAudioClient || 'WEB',
      uploader: basicInfo?.channel?.name || basicInfo?.author || "",
      error: !videoUrl && !audioUrl ? (clientErrorMessage || "Nepodarilo sa získať žiadny stream.") : null
    };
  } catch (error) {
    console.error("Error fetching video stream:", error);
    return {
      id: videoId,
      error: "Zlyhalo pripojenie k YouTube: " + error.message
    };
  }
}
