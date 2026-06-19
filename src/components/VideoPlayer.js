"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./VideoPlayer.module.css";

import { useRouter } from "next/navigation";

export default function VideoPlayer({ streamData, nextVideoUrl, prevVideoUrl }) {
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!streamData) return;
    
    if (streamData.streamUrl) {
      setStreamUrl(streamData.streamUrl);
    }
    
    // Uloženie do histórie
    try {
      const historyData = {
        url: `/watch?v=${streamData.id || new URL(window.location.href).searchParams.get("v")}`,
        title: streamData.title,
        thumbnail: streamData.thumbnailUrl,
        uploaderName: streamData.uploader,
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

  useEffect(() => {
    if (streamUrl && videoRef.current) {
      videoRef.current.play().catch(e => {
        console.warn("Autoplay was prevented:", e);
      });
    }
  }, [streamUrl]);

  const handleVideoEnded = () => {
    if (nextVideoUrl) {
      router.push(nextVideoUrl);
    }
  };

  if (!streamData) return <div className={styles.loading}>Načítavam video...</div>;

  return (
    <div className={styles.playerContainer}>
      {streamUrl ? (
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
        <div className={styles.error}>
          Ľutujeme, pre toto video nebol nájdený vhodný formát (MP4 s audiom).
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
