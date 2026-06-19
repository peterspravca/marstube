"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./VideoPlayer.module.css";

import { useRouter } from "next/navigation";

const STORAGE_KEY_FAVORITES = "martubeFavorites";

export default function VideoPlayer({ streamData, nextVideoUrl, prevVideoUrl }) {
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [mode, setMode] = useState("audio"); // Default to audio mode as preferred
  const [loadingState, setLoadingState] = useState("idle"); // "idle", "checking", "downloading", "ready", "error"
  const [downloadProgress, setDownloadProgress] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();

  // Check if video is in favorites
  useEffect(() => {
    if (!streamData?.id) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (saved) {
        const favs = JSON.parse(saved);
        setIsFavorite(favs.some(f => f.id === streamData.id));
      }
    } catch (e) {
      console.error(e);
    }
  }, [streamData?.id]);

  const toggleFavorite = () => {
    if (!streamData?.id) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      let favs = saved ? JSON.parse(saved) : [];

      if (isFavorite) {
        favs = favs.filter(f => f.id !== streamData.id);
      } else {
        favs.unshift({
          id: streamData.id,
          url: `/watch?v=${streamData.id}`,
          title: streamData.title,
          thumbnail: streamData.thumbnailUrl,
          uploaderName: streamData.uploader,
          addedAt: Date.now(),
        });
      }

      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favs));
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.error(e);
    }
  };

  // Load last play mode from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("martubePlayMode");
      if (saved === "video" || saved === "audio") {
        setMode(saved);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const changeMode = (newMode) => {
    setMode(newMode);
    try {
      sessionStorage.setItem("martubePlayMode", newMode);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!streamData) return;
    
    // Uloženie do histórie
    if (!streamData.title) return;
    
    try {
      const historyData = {
        url: `/watch?v=${streamData.id || new URL(window.location.href).searchParams.get("v")}`,
        title: streamData.title,
        thumbnail: streamData.thumbnailUrl,
        uploaderName: streamData.uploader,
        timestamp: Date.now()
      };
      
      const saved = localStorage.getItem("martubeHistory");
      let historyArray = saved ? JSON.parse(saved) : [];
      
      // Odstráni prípadný duplikát
      historyArray = historyArray.filter(v => v.url !== historyData.url);
      
      // Pridá video na začiatok (max 10 záznamov)
      historyArray.unshift(historyData);
      if (historyArray.length > 10) historyArray.pop();
      
      localStorage.setItem("martubeHistory", JSON.stringify(historyArray));
    } catch(e) {
      console.error("Chyba ukladania histórie", e);
    }
  }, [streamData]);

  // Sťahovanie/Kontrola stavu na FTP pri zmene videa alebo prepnutí režimu
  useEffect(() => {
    if (!streamData || !streamData.id || !mode) return;

    let active = true;
    const filename = mode === "video" 
      ? `${streamData.id}_video.mp4` 
      : `${streamData.id}_audio.m4a`;

    const sourceUrl = mode === "video" ? streamData.videoUrl : streamData.audioUrl;
    const sourceClient = mode === "video" ? (streamData.videoClient || "WEB") : (streamData.audioClient || "WEB");
    const sourceUA = mode === "video" ? streamData.videoUserAgent : streamData.audioUserAgent;

    const checkAndDownload = async () => {
      setLoadingState("checking");
      setDownloadProgress("Kontrolujem stav súboru na serveri...");
      setDownloadError("");
      setStreamUrl("");

      try {
        // 1. Skontrolujeme, či už súbor existuje na FTP
        const checkRes = await fetch(`https://marso.sk/play/download.php?action=status&filename=${filename}`);
        const checkData = await checkRes.json();

        if (!active) return;

        if (checkData.status === "ready") {
          setLoadingState("ready");
          setStreamUrl(checkData.url);
          return;
        }

        // 2. Ak neexistuje na FTP, musíme mať platný zdrojový stream (sourceUrl) na jeho stiahnutie
        if (!sourceUrl) {
          setLoadingState("error");
          setDownloadError("Pre toto video sa nenašiel požadovaný stream.");
          setStreamUrl("");
          return;
        }

        // 3. Spustíme sťahovanie zo servera marso.sk na FTP s príslušným klientskym UA
        setLoadingState("downloading");
        setDownloadProgress("Pripravujem prehrávanie (sťahujem súbor na server, zvyčajne to trvá 2-5 sekúnd)...");

        const dlRes = await fetch(`https://marso.sk/play/download.php?action=download&filename=${filename}&url=${encodeURIComponent(sourceUrl)}&client=${sourceClient}&ua=${encodeURIComponent(sourceUA || '')}`);
        const dlData = await dlRes.json();

        if (!active) return;

        if (dlData.status === "ready") {
          setLoadingState("ready");
          setStreamUrl(dlData.url);
        } else {
          throw new Error(dlData.error || "Nepodarilo sa stiahnuť súbor.");
        }
      } catch (err) {
        if (!active) return;
        console.error("Chyba synchronizácie s FTP:", err);
        setLoadingState("error");
        setDownloadError(err.message || "Chyba pri príprave streamu.");
        setStreamUrl("");
      }
    };

    checkAndDownload();

    return () => {
      active = false;
    };
  }, [streamData?.id, mode]);

  useEffect(() => {
    if (streamUrl && videoRef.current) {
      const el = videoRef.current;
      // Start muted to guarantee autoplay works (browser policy)
      el.muted = true;
      el.play().then(() => {
        // Unmute shortly after playback starts
        setTimeout(() => {
          el.muted = false;
        }, 300);
      }).catch(e => {
        console.warn("Autoplay zablokovaný:", e);
      });
    }
  }, [streamUrl]);

  const handleVideoEnded = () => {
    if (nextVideoUrl) {
      router.push(nextVideoUrl);
    }
  };

  if (!streamData) return <div className={styles.loading}>Načítavam dáta...</div>;

  return (
    <div className={styles.playerContainer}>
      {/* Tlačidlá prepínania Video / Hudba */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '0.5rem' }}>
        <button 
          onClick={() => changeMode("video")}
          style={{
            padding: '0.7rem 1.4rem',
            borderRadius: '24px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            background: mode === 'video' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.08)',
            color: 'white',
            boxShadow: mode === 'video' ? 'var(--shadow-glass)' : 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          🎥 Video
        </button>
        <button 
          onClick={() => changeMode("audio")}
          style={{
            padding: '0.7rem 1.4rem',
            borderRadius: '24px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            background: mode === 'audio' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.08)',
            color: 'white',
            boxShadow: mode === 'audio' ? 'var(--shadow-glass)' : 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          🎵 Hudba
        </button>
      </div>

      {loadingState === "checking" || loadingState === "downloading" ? (
        <div className={styles.loadingMedia}>
          <div className={styles.spinner}></div>
          <div style={{ marginTop: '1.5rem', fontWeight: '500', textAlign: 'center', maxWidth: '80%' }}>
            {downloadProgress}
          </div>
        </div>
      ) : streamUrl ? (
        mode === "audio" ? (
          <div className={styles.audioPlayerWrapper}>
            <div className={styles.audioPosterWrapper}>
              <img src="/logo.png" alt="MarsoTube Logo" className={styles.audioPoster} />
              <div className={styles.musicWave}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <audio
              ref={videoRef}
              src={streamUrl}
              controls
              autoPlay
              muted
              onEnded={handleVideoEnded}
              className={styles.audio}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={streamUrl}
            controls
            autoPlay
            muted
            onEnded={handleVideoEnded}
            className={styles.video}
            poster={streamData.thumbnailUrl}
          />
        )
      ) : (
        mode === "audio" ? (
          <div className={styles.audioPlayerWrapper} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
            <div className={styles.audioPosterWrapper}>
              <img src="/logo.png" alt="MarsoTube Logo" className={styles.audioPoster} style={{ filter: 'grayscale(1) opacity(0.3)' }} />
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem', padding: '0 2rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff4d4d', marginBottom: '0.5rem' }}>❌ Nepodarilo sa prehrať audio priamo</div>
                <div style={{ fontSize: '0.9rem' }}>{downloadError || streamData.error || "Chyba prípravy audio streamu."}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube-nocookie.com/embed/${streamData.id}?autoplay=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0 }}
              ></iframe>
            </div>
            <div className={styles.error} style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", marginTop: "1rem" }}>
              Upozornenie: Nepodarilo sa prehrať súbor priamo (Chyba: {downloadError || streamData.error || "Neznáma chyba"}). 
              Preto bol načítaný oficiálny YouTube prehrávač.
            </div>
          </div>
        )
      )}
      
      {/* Ovládacie prvky pre Playlist */}
      {(prevVideoUrl || nextVideoUrl) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0 0 12px 12px' }}>
          {prevVideoUrl ? (
            <button 
              onClick={() => router.push(prevVideoUrl)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ⏮ Predchádzajúca
            </button>
          ) : <div></div>}
          
          {nextVideoUrl ? (
            <button 
              onClick={() => router.push(nextVideoUrl)}
              style={{ background: 'var(--accent-gradient)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Nasledujúca ⏭
            </button>
          ) : <div></div>}
        </div>
      )}
      
      <div className={styles.infoBox}>
        <h1 className={styles.title}>{streamData.title}</h1>
        <div className={styles.meta} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span className={styles.uploader}>{streamData.uploader}</span>
            <span className={styles.views}>
              {streamData.views?.toLocaleString()} zobrazení
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={toggleFavorite}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 1rem',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                background: isFavorite ? 'rgba(255, 77, 109, 0.15)' : 'rgba(255,255,255,0.06)',
                color: isFavorite ? '#ff4d6d' : 'white',
                border: isFavorite ? '1px solid rgba(255, 77, 109, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'scale(1)',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              title={isFavorite ? 'Odstrániť z obľúbených' : 'Pridať do obľúbených'}
            >
              {isFavorite ? '❤️ Obľúbené' : '🤍 Obľúbiť'}
            </button>
            <a 
              href={`https://marso.sk/play/download.php?action=save&filename=${streamData.id}_video.mp4&url=${encodeURIComponent(streamData.videoUrl || '')}&client=${streamData.videoClient || 'WEB'}&ua=${encodeURIComponent(streamData.videoUserAgent || '')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 1rem',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.06)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s'
              }}
              title="Stiahnuť video (MP4)"
            >
              🎥 Stiahnuť Video (MP4)
            </a>
          </div>
        </div>
        <div className={styles.description}>
          {streamData.description}
        </div>
      </div>
    </div>
  );
}
