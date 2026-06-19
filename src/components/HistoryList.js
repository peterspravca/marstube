"use client";

import { useEffect, useState } from "react";
import VideoCard from "./VideoCard";

export default function HistoryList() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("martubeHistory");
      if (saved) {
        let parsed = JSON.parse(saved);
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        // Filter out items without title or older than 30 days
        parsed = parsed.filter(item => {
          if (!item || !item.title) return false;
          if (item.timestamp && (now - item.timestamp > thirtyDaysMs)) return false;
          return true;
        });
        
        setHistory(parsed);
        // Clean up localStorage
        localStorage.setItem("martubeHistory", JSON.stringify(parsed));
      }
    } catch (e) {
      console.error("Nepodarilo sa načítať históriu", e);
    }
  }, []);

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
