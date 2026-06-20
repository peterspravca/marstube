import { getYT } from "./youtube";

const CLIENT_USER_AGENTS = {
  ANDROID: 'com.google.android.youtube/21.03.36(Linux; U; Android 16; en_US; SM-S908E Build/TP1A.220624.014) gzip',
  IOS: 'com.google.ios.youtube/20.11.6 (iPhone10,4; U; CPU iOS 16_7_7 like Mac OS X)',
  WEB: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

export async function getTrending() {
  try {
    const yt = await getYT();
    
    // Zoznam hudobných kľúčových slov pre náhodný výber, aby sme mali vždy len hudbu
    const musicQueries = [
      "top radio hits 2026",
      "best electronic dance music edm",
      "techno music club mix",
      "david guetta top hits mix",
      "hugel club house mix",
      "melodic techno house mix",
      "popular radio hits",
      "trending dance songs tiesto",
      "tech house bass mix",
      "deep house vocal mix",
      "trending dance songs",
      "new pop songs playlist",
      "top chart songs official"
    ];
    
    // Náhodne vyberieme jedno hudobné kľúčové slovo
    const randomQuery = musicQueries[Math.floor(Math.random() * musicQueries.length)];
    
    // Vyhľadáme videá
    const searchResult = await yt.search(randomQuery, { type: 'video' });
    
    // Zoberieme maximálne 20 výsledkov, aby toho nebolo zbytočne veľa
    const videos = (searchResult.videos || []).slice(0, 20);
    
    // Vrátime pole videí so štruktúrou prispôsobenou nášmu VideoCard
    return videos.map(v => ({
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
    // Fallback: iOS audio formats get blocked (403 Forbidden) on the server,
    // so we fall back to the working ANDROID/WEB combined format stream which downloads successfully.
    if (!audioUrl || chosenAudioClient === 'IOS') {
      audioUrl = videoUrl;
      chosenAudioClient = chosenVideoClient;
    }

    const webUA = yt.session?.user_agent || CLIENT_USER_AGENTS.WEB;
    const videoUA = chosenVideoClient === 'WEB' ? webUA : CLIENT_USER_AGENTS[chosenVideoClient || 'WEB'];
    const audioUA = chosenAudioClient === 'WEB' ? webUA : CLIENT_USER_AGENTS[chosenAudioClient || 'WEB'];

    return {
      id: videoId,
      title: basicInfo?.title || "Neznámy názov",
      description: basicInfo?.short_description || "",
      thumbnailUrl: basicInfo?.thumbnail?.[0]?.url || "",
      videoUrl: videoUrl,
      audioUrl: audioUrl,
      videoClient: chosenVideoClient || 'WEB',
      audioClient: chosenAudioClient || 'WEB',
      videoUserAgent: videoUA,
      audioUserAgent: audioUA,
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
