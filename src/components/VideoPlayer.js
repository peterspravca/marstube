"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./VideoPlayer.module.css";

import { useRouter } from "next/navigation";

export default function VideoPlayer({ streamData, nextVideoUrl, prevVideoUrl }) {
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState("");
  const mode = "audio";
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

  // Sťahovanie/Kontrola stavu na FTP pri zmene videa
  useEffect(() => {
    if (!streamData || !streamData.id) return;

    let active = true;
    const filename = `${streamData.id}_audio.m4a`;
    const sourceUrl = streamData.audioUrl;
    const sourceClient = streamData.audioClient || "WEB";
    const sourceUA = streamData.audioUserAgent;

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
  }, [streamData?.id]);

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

  if (!streamData) return <div className={styles.loading}>Načítavam dáta...</div>;

  return (
    <div className={styles.playerContainer}>
      {loadingState === "checking" || loadingState === "downloading" ? (
        <div className={styles.loadingMedia}>
          <div className={styles.spinner}></div>
          <div style={{ marginTop: '1.5rem', fontWeight: '500', textAlign: 'center', maxWidth: '80%' }}>
            {downloadProgress}
          </div>
        </div>
      ) : streamUrl ? (
        <div className={styles.audioPlayerWrapper}>
          <div className={styles.audioPosterWrapper}>
            <img src="/logo.png" alt="MarsTube Logo" className={styles.audioPoster} />
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
            onEnded={handleVideoEnded}
            className={styles.audio}
          />
        </div>
      ) : (
        <div className={styles.audioPlayerWrapper} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
          <div className={styles.audioPosterWrapper}>
            <img src="/logo.png" alt="MarsTube Logo" className={styles.audioPoster} style={{ filter: 'grayscale(1) opacity(0.3)' }} />
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem', padding: '0 2rem' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff4d4d', marginBottom: '0.5rem' }}>❌ Nepodarilo sa prehrať audio priamo</div>
              <div style={{ fontSize: '0.9rem' }}>{downloadError || streamData.error || "Chyba prípravy audio streamu."}</div>
            </div>
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
        <div className={styles.meta} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span className={styles.uploader}>{streamData.uploader}</span>
            <span className={styles.views}>
              {streamData.views?.toLocaleString()} zobrazení
            </span>
          </div>
        </div>
        <div className={styles.description}>
          {streamData.description}
        </div>
      </div>
    </div>
  );
}
