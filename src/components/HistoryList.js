"use client";

import { useEffect, useState } from "react";
import VideoCard from "./VideoCard";
import { authApi } from "../lib/auth";
import AuthModal from "./AuthModal";

export default function HistoryList() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // 1. Skúsime získať prihláseného používateľa
        const user = authApi.getUser();
        setIsLoggedIn(!!user);
        
        if (user) {
          // Prihlásený používateľ: Načítaj z nášho API
          let res = await authApi.getHistory();
          
          if (res.success && res.data) {
            let historyData = res.data;
            // Migrácia z localStorage ak je databáza prázdna
            if (historyData.length === 0) {
              const saved = localStorage.getItem("martubeHistory");
              if (saved) {
                const localHistory = JSON.parse(saved);
                // Vložíme do DB odzadu, aby najnovšie zostali najnovšie
                for (let i = localHistory.length - 1; i >= 0; i--) {
                  const item = localHistory[i];
                  if (item && item.id) {
                    await authApi.saveHistory(item.id, item.title || "Video", item.thumbnail || "");
                  }
                }
                const newRes = await authApi.getHistory();
                if (newRes.success && newRes.data) historyData = newRes.data;
              }
            }

            if (historyData.length > 0) {
              // Unikátne IDčka zachovávajúce poradie z databázy
              const uniqueIds = [...new Set(historyData.map(item => item.video_id))];
              
              const historyItems = uniqueIds.map(id => {
                const dbItem = historyData.find(v => v.video_id === id);
                return {
                  id: dbItem.video_id,
                  url: `/watch?v=${dbItem.video_id}`,
                  title: dbItem.title,
                  thumbnail: dbItem.thumbnail_url || "",
                  uploaderName: "MarsTube", // Môžeme pridať do DB ak treba
                };
              });
              setHistory(historyItems);
              localStorage.setItem("martubeHistory", JSON.stringify(historyItems));
              setLoading(false);
              return;
            }
          }
          
          setHistory([]);
        } else {
          // Neprihlásený používateľ: Načítaj z Local Storage
          const saved = localStorage.getItem("martubeHistory");
          if (saved) {
            let parsed = JSON.parse(saved);
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            
            let filtered = parsed.filter(item => {
              if (!item || !item.title) return false;
              if (item.timestamp && (now - item.timestamp > thirtyDaysMs)) return false;
              return true;
            });
            
            const uniqueParsed = [];
            const seenIds = new Set();
            for (const item of filtered) {
              const id = item.id || item.video_id;
              if (!seenIds.has(id)) {
                seenIds.add(id);
                uniqueParsed.push(item);
              }
            }
            
            setHistory(uniqueParsed);
            localStorage.setItem("martubeHistory", JSON.stringify(uniqueParsed));
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
    <>
      {!isLoggedIn && (
        <div style={{
          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(124, 58, 237, 0.05))",
          border: "1px solid rgba(168, 85, 247, 0.2)",
          borderRadius: "16px",
          padding: "1rem 1.5rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 300px" }}>
            <div style={{ color: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"></path>
                <path d="M9 18h6"></path>
                <path d="M10 22h4"></path>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              <strong style={{ color: "var(--accent-primary)" }}>Viete, že...?</strong> Uložte si históriu natrvalo bezplatnou registráciou.
            </p>
          </div>
          <button 
            onClick={() => setShowAuthModal(true)}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "12px",
              border: "none",
              background: "var(--accent-gradient)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "var(--shadow-glow)",
              whiteSpace: "nowrap"
            }}
          >
            Zaregistrovať sa
          </button>
        </div>
      )}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onAuthSuccess={() => window.location.reload()} 
        />
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "2rem"
      }}>
        {history.map((video, idx) => {
          const cleanUrl = video.url ? video.url.split('&list=')[0] : `/watch?v=${video.id || video.video_id}`;
          const finalUrl = `${cleanUrl}&list=history`;
          return <VideoCard key={idx} video={{ ...video, url: finalUrl }} />;
        })}
      </div>
    </>
  );
}
