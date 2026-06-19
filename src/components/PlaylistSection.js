"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlaylistSection() {
  const [playlistId, setPlaylistId] = useState("");
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInputMode, setIsInputMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("martubeSavedPlaylist");
    if (saved) {
      setPlaylistId(saved);
      setIsInputMode(false);
      fetchPlaylist(saved);
    }
  }, []);

  const fetchPlaylist = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/playlist?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.items) {
        setPlaylistInfo(data.info);
        setVideos(data.items);
      } else {
        setVideos(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (!playlistId.trim()) return;
    
    // Extract ID if user pasted full URL
    let cleanId = playlistId;
    if (playlistId.includes("list=")) {
      const urlParams = new URLSearchParams(playlistId.split("?")[1]);
      cleanId = urlParams.get("list") || playlistId;
    }
    
    setPlaylistId(cleanId);
    localStorage.setItem("martubeSavedPlaylist", cleanId);
    setIsInputMode(false);
    fetchPlaylist(cleanId);
  };

  const handleReset = () => {
    localStorage.removeItem("martubeSavedPlaylist");
    setPlaylistId("");
    setPlaylistInfo(null);
    setVideos([]);
    setIsInputMode(true);
  };

  if (isInputMode) {
    return (
      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h2>🎧 Pridajte si vlastný playlist</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Vložte ID playlistu z YouTube alebo celý odkaz a počúvajte hudbu bez reklám.
        </p>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Napr. PL4cUxeGkcC9..."
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            style={{
              flex: 1,
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-glass)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "white"
            }}
          />
          <button 
            onClick={handleSave}
            style={{
              background: "var(--accent-gradient)",
              border: "none",
              color: "white",
              padding: "0 2rem",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Uložiť
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
      
      {/* Ľavý panel: Informácie o playliste */}
      <div style={{ flex: "1 1 300px", position: "sticky", top: "100px", display: "flex", flexDirection: "column" }}>
        {playlistInfo ? (
          <>
            <img 
              src={playlistInfo.thumbnail || "/logo.png"} 
              alt={playlistInfo.title} 
              style={{ width: "100%", borderRadius: "16px", aspectRatio: "1/1", objectFit: "cover", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} 
            />
            <h2 style={{ fontSize: "2rem", margin: "1.5rem 0 0.5rem", lineHeight: "1.2" }}>{playlistInfo.title}</h2>
            
            <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontWeight: "bold", color: "white" }}>{playlistInfo.author}</span>
              <span>Zoznam • Verejný • {playlistInfo.totalItems} skladieb</span>
            </div>
            
            {videos.length > 0 && (
              <a 
                href={videos[0].url} 
                style={{ background: "white", color: "black", padding: "1rem", borderRadius: "30px", textAlign: "center", fontWeight: "bold", textDecoration: "none", fontSize: "1.1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ fontSize: "1.3rem" }}>▶</span> Prehrať všetko
              </a>
            )}
            
            <button onClick={handleReset} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", padding: "1rem", borderRadius: "30px", cursor: "pointer", marginTop: "1rem", fontWeight: "bold" }}>
              Zmeniť playlist
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>Načítavam informácie...</div>
        )}
      </div>

      {/* Pravý panel: Zoznam skladieb */}
      <div style={{ flex: "3 1 500px", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {loading && <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>Sťahujem položky playlistu...</div>}
        
        {!loading && videos.map((video, idx) => (
           <a 
             key={idx} 
             href={video.url} 
             style={{ 
               display: "flex", 
               gap: "1rem", 
               padding: "0.7rem 1rem", 
               borderRadius: "12px", 
               textDecoration: "none", 
               color: "inherit", 
               alignItems: "center",
               transition: "background 0.2s ease" 
             }} 
             onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} 
             onMouseOut={e => e.currentTarget.style.background = 'transparent'}
           >
             <div style={{ color: "var(--text-secondary)", width: "20px", textAlign: "right", fontSize: "0.9rem" }}>
               {idx + 1}
             </div>
             <img src={video.thumbnail} alt={video.title} style={{ width: "80px", height: "45px", borderRadius: "6px", objectFit: "cover" }} />
             <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
               <h4 style={{ margin: 0, fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{video.title}</h4>
               <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                 {video.uploaderName} {video.duration ? `• ${video.duration}` : ""}
               </p>
             </div>
             <div style={{ color: "var(--text-secondary)", opacity: 0.6 }}>⋮</div>
           </a>
        ))}
      </div>
    </div>
  );
}
