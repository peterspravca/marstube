"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./VideoPlayer.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "../lib/auth";

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
  const searchParams = useSearchParams();
  const listId = searchParams.get("list");

  // Check if video is in favorites
  useEffect(() => {
    if (!streamData?.id) return;
    const checkFavorite = async () => {
      try {
        const user = authApi.getUser();
        if (user) {
          const dbFavs = await authApi.getFavorites();
          if (Array.isArray(dbFavs)) {
            setIsFavorite(dbFavs.some(f => f.video_id === streamData.id));
            return;
          }
        }
        
        // Fallback to local storage
        const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
        if (saved) {
          const favs = JSON.parse(saved);
          setIsFavorite(favs.some(f => f.id === streamData.id || f.video_id === streamData.id));
        }
      } catch (e) {
        console.error("Error checking favorite:", e);
      }
    };
    checkFavorite();
  }, [streamData?.id]);

  const toggleFavorite = async () => {
    if (!streamData?.id) return;
    try {
      const user = authApi.getUser();
      const isCurrentlyFavorite = isFavorite;
      setIsFavorite(!isCurrentlyFavorite); // Optimistic UI update

      if (user) {
        if (isCurrentlyFavorite) {
          await authApi.removeFavorite(streamData.id);
        } else {
          await authApi.addFavorite(streamData.id, streamData.title, streamData.thumbnailUrl, streamData.uploader);
        }
      }

      // Vždy uložíme aj lokálne pre konzistenciu alebo neprihlásených
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      let favs = saved ? JSON.parse(saved) : [];

      if (isCurrentlyFavorite) {
        favs = favs.filter(f => f.id !== streamData.id && f.video_id !== streamData.id);
      } else {
        favs.unshift({
          id: streamData.id,
          video_id: streamData.id,
          url: `/watch?v=${streamData.id}`,
          title: streamData.title,
          thumbnail: streamData.thumbnailUrl,
          uploaderName: streamData.uploader,
          addedAt: Date.now(),
        });
      }

      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favs));
    } catch (e) {
      console.error("Error toggling favorite:", e);
      setIsFavorite(isFavorite); // Revert on error
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
    
    const saveHistory = async () => {
      try {
        const historyData = {
          url: `/watch?v=${streamData.id}${listId ? `&list=${listId}` : ''}`,
          title: streamData.title,
          thumbnail: streamData.thumbnailUrl,
          uploaderName: streamData.uploader,
          timestamp: Date.now(),
          id: streamData.id // ukladáme id aj do lokálu pre lepšie spracovanie
        };
        
        // 1. Lokálne uloženie (pre neprihlásených)
        const saved = localStorage.getItem("martubeHistory");
        let historyArray = saved ? JSON.parse(saved) : [];
        historyArray = historyArray.filter(v => v.url !== historyData.url);
        historyArray.unshift(historyData);
        if (historyArray.length > 50) historyArray.pop(); // zvýšime limit pre neprihlásených
        localStorage.setItem("martubeHistory", JSON.stringify(historyArray));

        // 2. API uloženie (pre prihlásených)
        const user = authApi.getUser();
        if (user) {
          // Uložíme záznam cez API
          await authApi.saveHistory(streamData.id, streamData.title, streamData.thumbnailUrl);
        }
      } catch(e) {
        console.error("Chyba ukladania histórie", e);
      }
    };
    
    saveHistory();
  }, [streamData, listId]);

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

  // React handles muted prop correctly now, and we manually manage it in useEffect for autoplay
  // so we don't need the inline callback ref anymore.

  // Force playback when URL is ready
  useEffect(() => {
    if (streamUrl && videoRef.current) {
      const el = videoRef.current;
      el.muted = true;
      // Some browsers need explicit load() when src changes dynamically
      el.load();
      
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Unmute shortly after playback starts
          setTimeout(() => {
            if (videoRef.current) videoRef.current.muted = false;
          }, 500);
        }).catch(e => {
          console.warn("Autoplay úplne zablokovaný:", e);
        });
      }
    }
  }, [streamUrl]);

  // Fallback if browser waits for canplay
  const handleCanPlay = () => {
    const el = videoRef.current;
    if (!el || !el.paused) return; // already playing
    el.muted = true;
    el.play().then(() => {
      setTimeout(() => {
        if (videoRef.current) videoRef.current.muted = false;
      }, 500);
    }).catch(e => {
      console.warn("Autoplay zablokovaný na canplay:", e);
    });
  };

  const handleVideoEnded = () => {
    if (nextVideoUrl) {
      router.push(nextVideoUrl);
    }
  };

  if (!streamData) return <div className={styles.loading}>Načítavam dáta...</div>;

  return (
    <div className={styles.playerContainer}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button 
          onClick={() => changeMode("video")}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.7rem 1.4rem',
            borderRadius: '24px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            background: mode === 'video' ? 'var(--accent-gradient)' : 'var(--button-bg)',
            color: mode === 'video' ? '#ffffff' : 'var(--text-primary)',
            boxShadow: mode === 'video' ? 'var(--shadow-glass)' : 'none',
            border: '1px solid var(--border-glass-solid)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
          Video
        </button>
        <button 
          onClick={() => changeMode("audio")}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.7rem 1.4rem',
            borderRadius: '24px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            background: mode === 'audio' ? 'var(--accent-gradient)' : 'var(--button-bg)',
            color: mode === 'audio' ? '#ffffff' : 'var(--text-primary)',
            boxShadow: mode === 'audio' ? 'var(--shadow-glass)' : 'none',
            border: '1px solid var(--border-glass-solid)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          Hudba
        </button>
      </div>

      {loadingState === "checking" || loadingState === "downloading" ? (
        <div className={styles.loadingMedia} style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Animated Background Glow */}
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.15), transparent 60%)', animation: 'spin 15s linear infinite' }}></div>
          
          <img src="/logo.svg" alt="MarsTube Logo" className="floating-logo" style={{ width: "90px", height: "90px", marginBottom: "1.5rem", zIndex: 1 }} />
          
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", zIndex: 1, margin: 0, marginBottom: "0.5rem" }}>
            <span>Pripravujem <span className="text-gradient">MarsTube</span> zážitok</span>
          </h2>
          
          <div style={{ marginTop: '1rem', fontWeight: '500', textAlign: 'center', maxWidth: '80%', zIndex: 1, color: 'var(--text-secondary)', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
            {downloadProgress}
          </div>
          
          <div className={styles.spinner} style={{ marginTop: '2.5rem', width: '40px', height: '40px', borderWidth: '3px', zIndex: 1, borderLeftColor: 'var(--accent-primary)' }}></div>
        </div>
      ) : streamUrl ? (
        mode === "audio" ? (
          <div className={styles.audioPlayerWrapper}>
            <div className={styles.audioPosterWrapper}>
              <img src="/logo.svg" alt="MarsTube Logo" className={styles.audioPoster} />
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
              playsInline
              onCanPlay={handleCanPlay}
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
            playsInline
            onCanPlay={handleCanPlay}
            onEnded={handleVideoEnded}
            className={styles.video}
            poster={streamData.thumbnailUrl}
          />
        )
      ) : (
        mode === "audio" ? (
          <div className={styles.audioPlayerWrapper} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
            <div className={styles.audioPosterWrapper}>
              <img src="/logo.svg" alt="MarsTube Logo" className={styles.audioPoster} style={{ filter: 'grayscale(1) opacity(0.3)' }} />
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem', padding: '0 2rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff4d4d', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  Nepodarilo sa prehrať audio priamo
                </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-glass)', borderRadius: '0 0 12px 12px' }}>
          {prevVideoUrl ? (
            <button 
              onClick={() => router.push(prevVideoUrl)}
              style={{ background: 'var(--button-bg)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                Predchádzajúca
              </div>
            </button>
          ) : <div></div>}
          
          {nextVideoUrl ? (
            <button 
              onClick={() => router.push(nextVideoUrl)}
              style={{ background: 'var(--accent-gradient)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Nasledujúca
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
              </div>
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
                background: isFavorite ? 'rgba(255, 77, 109, 0.15)' : 'var(--button-bg)',
                color: isFavorite ? '#ff4d6d' : 'var(--text-primary)',
                border: isFavorite ? '1px solid rgba(255, 77, 109, 0.4)' : '1px solid var(--border-glass-solid)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'scale(1)',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              title={isFavorite ? 'Odstrániť z obľúbených' : 'Pridať do obľúbených'}
            >
              {isFavorite ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> Obľúbené</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> Obľúbiť</>
              )}
            </button>
            <a 
              href={`https://marso.sk/play/download.php?action=save&filename=${streamData.id}_video.mp4&title=${encodeURIComponent(streamData.title || '')}&url=${encodeURIComponent(streamData.videoUrl || '')}&client=${streamData.videoClient || 'WEB'}&ua=${encodeURIComponent(streamData.videoUserAgent || '')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 1rem',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                background: 'var(--button-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-glass-solid)',
                transition: 'all 0.2s'
              }}
              title="Stiahnuť video (MP4)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Stiahnuť Video (MP4)
            </a>
            {streamData.audioUrl && (
              <a 
                href={`https://marso.sk/play/download.php?action=save&filename=${streamData.id}_audio.mp3&title=${encodeURIComponent(streamData.title || '')}&url=${encodeURIComponent(streamData.audioUrl || '')}&client=${streamData.audioClient || 'WEB'}&ua=${encodeURIComponent(streamData.audioUserAgent || '')}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.5rem 1rem',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  background: 'var(--button-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-glass-solid)',
                  transition: 'all 0.2s'
                }}
                title="Stiahnuť hudbu (MP3)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                Stiahnuť Hudbu (MP3)
              </a>
            )}
          </div>
        </div>
        <div className={styles.description}>
          {streamData.description}
        </div>
      </div>
    </div>
  );
}
