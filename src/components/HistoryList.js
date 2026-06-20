"use client";

import { useEffect, useState } from "react";
import VideoCard from "./VideoCard";
import { authApi } from "../lib/auth";

export default function HistoryList() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // 1. Skúsime získať prihláseného používateľa
        const user = authApi.getUser();
        
        if (user) {
          // Prihlásený používateľ: Načítaj z nášho API
          const res = await authApi.getHistory();
            
          if (res.success && res.data && res.data.length > 0) {
            // Unikátne IDčka zachovávajúce poradie z databázy
            const uniqueIds = [...new Set(res.data.map(item => item.video_id))];
            
            // Dopyt na naše nové API pre získanie detailov (pre dĺžku videa a iné detaily, alebo môžeme použiť title z DB)
            // Zatiaľ použijeme priamo dáta z histórie pre rýchlosť:
            const historyItems = uniqueIds.map(id => {
              const dbItem = res.data.find(v => v.video_id === id);
              return {
                id: dbItem.video_id,
                url: `/watch?v=${dbItem.video_id}`,
                title: dbItem.title,
                thumbnail: dbItem.thumbnail_url || "",
                uploaderName: "MarsTube", // Môžeme pridať do DB ak treba
              };
            });
            setHistory(historyItems);
            setLoading(false);
            return;
          }
          
          setHistory([]);
        } else {
          // Neprihlásený používateľ: Načítaj z Local Storage
          const saved = localStorage.getItem("martubeHistory");
          if (saved) {
            let parsed = JSON.parse(saved);
            const twentyFourHoursMs = 24 * 60 * 60 * 1000;
            const now = Date.now();
            
            parsed = parsed.filter(item => {
              if (!item || !item.title) return false;
              if (item.timestamp && (now - item.timestamp > twentyFourHoursMs)) return false;
              return true;
            });
            
            setHistory(parsed);
            localStorage.setItem("martubeHistory", JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.error("Nepodarilo sa načítať históriu", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
        Načítavam históriu...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
        Zatiaľ ste si nepozreli žiadne videá.
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "2rem"
    }}>
      {history.map((video, idx) => (
        <VideoCard key={idx} video={video} />
      ))}
    </div>
  );
}
