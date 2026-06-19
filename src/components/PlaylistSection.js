"use client";

import { useState, useEffect } from "react";
import VideoCard from "./VideoCard";

export default function PlaylistSection() {
  const [playlistId, setPlaylistId] = useState("");
  const [videos, setVideos] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("martubeCustomPlaylist"); // Ukladáme u neho
    if (saved) {
      setPlaylistId(saved);
      fetchPlaylist(saved);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchPlaylist = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/playlist?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      setVideos(data || []);
    } catch (e) {
      console.error("Chyba nacitania playlistu", e);
    }
    setLoading(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    
    // Extrahovanie ID z URL (ak vložil url) alebo len ID
    let finalId = inputVal;
    if (inputVal.includes("list=")) {
      finalId = inputVal.split("list=")[1].split("&")[0];
    }
    
    localStorage.setItem("martubeCustomPlaylist", finalId);
    setPlaylistId(finalId);
    fetchPlaylist(finalId);
  };

  const handleReset = () => {
    localStorage.removeItem("martubeCustomPlaylist");
    setPlaylistId("");
    setVideos([]);
    setInputVal("");
  };

  if (!playlistId) {
    return (
      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
          Pridajte odkaz na váš YouTube playlist a majte ho vždy po ruke. Ukladá sa bezpečne u vás v prehliadači!
        </p>
        <form onSubmit={handleSave} style={{ display: "flex", gap: "1rem", maxWidth: "600px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="Napr. https://music.youtube.com/playlist?list=..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            style={{ flex: 1, padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.2)", color: "white" }}
          />
          <button type="submit" style={{ padding: "0 2rem", borderRadius: "12px", background: "var(--accent-gradient)", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}>
            Pridať Playlist
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "2rem" }}>🎵 Môj Playlist</h2>
          {videos.length > 0 && (
            <a 
              href={videos[0].url} 
              style={{ background: "var(--accent-gradient)", color: "white", padding: "0.5rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", display: "inline-block" }}
            >
              ▶ Prehrať celý playlist
            </a>
          )}
        </div>
        <button onClick={handleReset} style={{ background: "transparent", border: "1px solid var(--border-glass)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer" }}>
          Zmeniť playlist
        </button>
      </div>
      
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>Načítavam playlist...</div>
      ) : videos.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "2rem"
        }}>
          {videos.slice(0, 12).map((video, idx) => (
            <VideoCard key={idx} video={video} />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
          Playlist sa nenašiel alebo je prázdny/súkromný.
        </div>
      )}
    </div>
  );
}
