"use client";

import { useEffect, useState } from "react";
import VideoCard from "./VideoCard";

export default function HistoryList() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("martubeHistory");
      if (saved) {
        setHistory(JSON.parse(saved));
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
