"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_PLAYLISTS = "martubeSavedPlaylists"; // Array of { id, name? }
const STORAGE_KEY_FAVORITES = "martubeFavorites"; // Array of { id, url, title, thumbnail, uploaderName, addedAt }

export default function PlaylistSection() {
  // --- State ---
  const [playlists, setPlaylists] = useState([]); // [{ id: "PLxxx", name: "..." }, ...]
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState("favorites"); // "favorites" | playlist id
  const [addInput, setAddInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Currently loaded playlist data
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Load from localStorage on mount ---
  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
      if (savedPlaylists) {
        const parsed = JSON.parse(savedPlaylists);
        setPlaylists(parsed);
      }
      // Migrate old single playlist format
      const oldPlaylist = localStorage.getItem("martubeSavedPlaylist");
      if (oldPlaylist && !savedPlaylists) {
        const migrated = [{ id: oldPlaylist }];
        setPlaylists(migrated);
        localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(migrated));
        localStorage.removeItem("martubeSavedPlaylist");
      }

      const savedFavorites = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (e) {
      console.error("Error loading saved data:", e);
    }
  }, []);

  // --- Fetch playlist when activeTab changes ---
  useEffect(() => {
    if (activeTab === "favorites" || !activeTab) {
      setPlaylistInfo(null);
      setPlaylistVideos([]);
      return;
    }
    fetchPlaylist(activeTab);
  }, [activeTab]);

  const fetchPlaylist = async (id) => {
    setLoading(true);
    setPlaylistInfo(null);
    setPlaylistVideos([]);
    try {
      const res = await fetch(`/api/playlist?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.items) {
        setPlaylistInfo(data.info);
        setPlaylistVideos(data.items);
      } else {
        setPlaylistVideos(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching playlist:", e);
    }
    setLoading(false);
  };

  // --- Add new playlist ---
  const handleAddPlaylist = () => {
    if (!addInput.trim()) return;

    let cleanId = addInput.trim();
    if (cleanId.includes("list=")) {
      try {
        const urlParams = new URLSearchParams(cleanId.split("?")[1]);
        cleanId = urlParams.get("list") || cleanId;
      } catch (e) { /* keep as-is */ }
    }

    // Check duplicate
    if (playlists.some(p => p.id === cleanId)) {
      setActiveTab(cleanId);
      setAddInput("");
      setShowAddForm(false);
      return;
    }

    const updated = [...playlists, { id: cleanId }];
    setPlaylists(updated);
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(updated));
    setActiveTab(cleanId);
    setAddInput("");
    setShowAddForm(false);
  };

  // --- Remove playlist ---
  const handleRemovePlaylist = (playlistId) => {
    const updated = playlists.filter(p => p.id !== playlistId);
    setPlaylists(updated);
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(updated));
    if (activeTab === playlistId) {
      setActiveTab("favorites");
    }
  };

  // --- Remove favorite ---
  const handleRemoveFavorite = (videoId) => {
    const updated = favorites.filter(f => f.id !== videoId);
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
  };

  // --- Playlist name from info ---
  const getPlaylistName = useCallback((pl) => {
    if (activeTab === pl.id && playlistInfo?.title) {
      return playlistInfo.title;
    }
    return pl.name || `Playlist`;
  }, [activeTab, playlistInfo]);

  // Update playlist name from fetched info
  useEffect(() => {
    if (playlistInfo?.title && activeTab !== "favorites") {
      setPlaylists(prev => {
        const updated = prev.map(p =>
          p.id === activeTab ? { ...p, name: playlistInfo.title } : p
        );
        localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [playlistInfo, activeTab]);

  // --- Render ---
  const tabStyle = (isActive) => ({
    padding: "0.6rem 1.2rem",
    borderRadius: "20px",
    border: "1px solid " + (isActive ? "rgba(124, 58, 237, 0.5)" : "rgba(255,255,255,0.1)"),
    background: isActive ? "var(--accent-gradient)" : "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
    fontWeight: isActive ? "bold" : "500",
    fontSize: "0.9rem",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    boxShadow: isActive ? "0 4px 15px rgba(124, 58, 237, 0.3)" : "none",
  });

  const removeButtonStyle = {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    cursor: "pointer",
    fontSize: "0.75rem",
    padding: "2px 4px",
    borderRadius: "50%",
    transition: "all 0.2s",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div>
      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "2rem", margin: 0 }}>🎶 Moja hudba</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: showAddForm ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            padding: "0.6rem 1.2rem",
            borderRadius: "20px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "0.9rem",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          {showAddForm ? "✕ Zavrieť" : "＋ Pridať playlist"}
        </button>
      </div>

      {/* Add Playlist Form */}
      {showAddForm && (
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            marginBottom: "1.5rem",
            animation: "fadeIn 0.3s ease forwards",
          }}
        >
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.95rem" }}>
            Vložte ID alebo odkaz na YouTube playlist:
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Napr. PLxxx... alebo celý YouTube odkaz"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPlaylist()}
              style={{
                flex: "1 1 200px",
                padding: "0.8rem 1rem",
                borderRadius: "10px",
                border: "1px solid var(--border-glass)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "white",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
            <button
              onClick={handleAddPlaylist}
              style={{
                background: "var(--accent-gradient)",
                border: "none",
                color: "white",
                padding: "0.8rem 1.8rem",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.95rem",
                transition: "transform 0.2s",
              }}
            >
              Pridať
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.15) transparent",
        }}
      >
        {/* Favorites Tab */}
        <button
          onClick={() => setActiveTab("favorites")}
          style={tabStyle(activeTab === "favorites")}
        >
          ❤️ Obľúbené
          {favorites.length > 0 && (
            <span style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: "10px",
              padding: "0.1rem 0.5rem",
              fontSize: "0.75rem",
            }}>
              {favorites.length}
            </span>
          )}
        </button>

        {/* Playlist Tabs */}
        {playlists.map((pl) => (
          <div key={pl.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setActiveTab(pl.id)}
              style={tabStyle(activeTab === pl.id)}
            >
              🎵 {pl.name || "Playlist"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemovePlaylist(pl.id);
              }}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                fontSize: "0.9rem",
                padding: "0.4rem 0.55rem",
                borderRadius: "50%",
                transition: "all 0.2s",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "28px",
                minHeight: "28px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,70,70,0.2)";
                e.currentTarget.style.color = "#ff4d4d";
                e.currentTarget.style.borderColor = "rgba(255,70,70,0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
              title="Odstrániť playlist"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Content */}
      {activeTab === "favorites" ? (
        /* ===== FAVORITES VIEW ===== */
        <div>
          {favorites.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❤️</div>
              <h3 style={{ marginBottom: "0.5rem", color: "white" }}>Zatiaľ žiadne obľúbené</h3>
              <p style={{ maxWidth: "400px", margin: "0 auto" }}>
                Kliknite na ❤️ pri videu na stránke prehrávania a uložte si ho sem.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1rem",
              }}
            >
              {favorites.map((fav) => (
                <a
                  key={fav.id}
                  href={fav.url}
                  className="glass-panel"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(124, 58, 237, 0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-glass)";
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={fav.thumbnail}
                      alt={fav.title}
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                        objectFit: "cover",
                        borderRadius: "16px 16px 0 0",
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFavorite(fav.id);
                      }}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.6)",
                        border: "none",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        transition: "all 0.2s",
                        color: "#ff4d6d",
                      }}
                      title="Odstrániť z obľúbených"
                    >
                      ❤️
                    </button>
                  </div>
                  <div style={{ padding: "0.8rem 1rem" }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: "1.3",
                      }}
                    >
                      {fav.title}
                    </h4>
                    <p
                      style={{
                        margin: "0.3rem 0 0",
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {fav.uploaderName}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ===== PLAYLIST VIEW ===== */
        <div className="playlist-container">
          {/* Left Panel: Playlist Info */}
          <div className="playlist-left">
            {loading ? (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid rgba(255,255,255,0.1)",
                  borderTop: "3px solid var(--accent-primary)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 1rem",
                }} />
                Načítavam playlist...
              </div>
            ) : playlistInfo ? (
              <>
                <img
                  src={playlistInfo.thumbnail || "/logo.png"}
                  alt={playlistInfo.title}
                  style={{
                    width: "100%",
                    borderRadius: "16px",
                    aspectRatio: "1/1",
                    objectFit: "cover",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  }}
                />
                <h2 style={{ fontSize: "1.8rem", margin: "1.5rem 0 0.5rem", lineHeight: "1.2" }}>
                  {playlistInfo.title}
                </h2>

                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.95rem",
                    marginBottom: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "white" }}>{playlistInfo.author}</span>
                  <span>Zoznam • {playlistInfo.totalItems} skladieb</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {playlistVideos.length > 0 && (
                    <a
                      href={playlistVideos[0].url}
                      style={{
                        background: "white",
                        color: "black",
                        padding: "0.8rem 1.5rem",
                        borderRadius: "30px",
                        textAlign: "center",
                        fontWeight: "bold",
                        textDecoration: "none",
                        fontSize: "1.1rem",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <span style={{ fontSize: "1.3rem" }}>▶</span> Prehrať všetko
                    </a>
                  )}
                  <button
                    onClick={() => handleRemovePlaylist(activeTab)}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      padding: "0.8rem 1.5rem",
                      borderRadius: "30px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(255,70,70,0.15)";
                      e.currentTarget.style.borderColor = "rgba(255,70,70,0.4)";
                      e.currentTarget.style.color = "#ff4d4d";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.color = "white";
                    }}
                  >
                    ❌ Odstrániť playlist
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
                Žiadne informácie o playliste.
              </div>
            )}
          </div>

          {/* Right Panel: Video List */}
          <div className="playlist-right">
            {loading && (
              <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
                Sťahujem položky playlistu...
              </div>
            )}

            {!loading &&
              playlistVideos.map((video, idx) => (
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
                    transition: "background 0.2s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ color: "var(--text-secondary)", width: "20px", textAlign: "right", fontSize: "0.9rem" }}>
                    {idx + 1}
                  </div>
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={{
                      width: "80px",
                      height: "45px",
                      borderRadius: "6px",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "1rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {video.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {video.uploaderName} {video.duration ? `• ${video.duration}` : ""}
                    </p>
                  </div>
                  <div style={{ color: "var(--text-secondary)", opacity: 0.6 }}>⋮</div>
                </a>
              ))}
          </div>
        </div>
      )}

      {/* CSS for spinner */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
