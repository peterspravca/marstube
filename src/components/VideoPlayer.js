"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./VideoPlayer.module.css";

import { useRouter } from "next/navigation";

export default function VideoPlayer({ streamData, nextVideoUrl, prevVideoUrl }) {
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [mode, setMode] = useState("video"); // "video" alebo "audio"
  const [loadingState, setLoadingState] = useState("idle"); // "idle", "checking", "downloading", "ready", "error"
  const [downloadProgress, setDownloadProgress] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const router = useRouter();

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

  // Sťahovanie/Kontrola stavu na FTP pri zmene videa alebo prepnutí režimu (Video/Hudba)
  useEffect(() => {
    if (!streamData || !streamData.id) return;

    // Automatický fallback na režim hudby (audio), ak nie je dostupný video stream
    if (mode === "video" && !streamData.videoUrl && streamData.audioUrl) {
      setMode("audio");
      return;
    }

    let active = true;
    const filename = mode === "video" 
      ? `${streamData.id}_video.mp4` 
      : `${streamData.id}_audio.m4a`;

    const sourceUrl = mode === "video" ? streamData.videoUrl : streamData.audioUrl;
    const sourceClient = mode === "video" ? (streamData.videoClient || "WEB") : (streamData.audioClient || "WEB");

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

        const dlRes = await fetch(`https://marso.sk/play/download.php?action=download&filename=${filename}&url=${encodeURIComponent(sourceUrl)}&client=${sourceClient}`);
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
      videoRef.current.play().catch(e => {
        console.warn("Autoplay bol zablokovaný:", e);
      });
    }
  }, [streamUrl]);

  const handleVideoEnded = () => {
    if (nextVideoUrl) {
      router.push(nextVideoUrl);
    }
  };

  if (!streamData) return <div className={styles.loading}>Načítavam dáta o videu...</div>;

  return (
    <div className={styles.playerContainer}>
      {/* Tlačidlá prepínania Video / Hudba */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '0.5rem' }}>
        <button 
          onClick={() => setMode("video")}
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
          onClick={() => setMode("audio")}
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
          🎵 Hudba (Audio)
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
        <video
          ref={videoRef}
          src={streamUrl}
          controls
          autoPlay
          onEnded={handleVideoEnded}
          className={styles.video}
          poster={streamData.thumbnailUrl}
        />
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
        <div className={styles.meta}>
          <span className={styles.uploader}>{streamData.uploader}</span>
          <span className={styles.views}>
            {streamData.views?.toLocaleString()} zobrazení
          </span>
        </div>
        <div className={styles.description}>
          {streamData.description}
        </div>
      </div>
    </div>
  );
}
