import SearchBar from "@/components/SearchBar";
import VideoCard from "@/components/VideoCard";
import HistoryList from "@/components/HistoryList";
import PlaylistSection from "@/components/PlaylistSection";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";
import { getTrending } from "@/lib/api";

export const revalidate = 3600;

export default async function Home() {
  const trendingVideos = await getTrending();

  return (
    <main className="container animate-fade-in">
      <header className="home-header">
        <div className="home-logo-title">
          <img src="/logo.svg" alt="MarsTube Logo" className="floating-logo" style={{ width: "80px", height: "80px" }} />
          <h1 className="home-title">
            <span>Mars<span className="text-gradient">Tube</span></span>
          </h1>
        </div>
        <div style={{ position: "fixed", top: "1.5rem", right: "2rem", zIndex: 1000, display: "flex", gap: "1rem", alignItems: "center" }}>
          <ThemeToggle />
          <AuthButton />
        </div>
        <p className="home-subtitle">
          Bez reklám, bez prerušení. Váš osobný, prémiový zážitok.
        </p>
        
        <SearchBar />
      </header>
      
      {/* Sekcia: Vlastný Playlist používateľa */}
      <section style={{ marginTop: "4rem" }}>
        <PlaylistSection />
      </section>

      {/* Sekcia: História */}
      <section style={{ marginTop: "4rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "2rem" }}>🕒 História sledovania</h2>
        <HistoryList />
      </section>
      
      {/* Sekcia: Trendy */}
      <section style={{ marginTop: "4rem", marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "2rem" }}>🔥 Trendy</h2>
        {trendingVideos && trendingVideos.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "2rem"
          }}>
            {trendingVideos.map((video, idx) => (
              <VideoCard key={idx} video={video} />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
            Momentálne nie sú dostupné žiadne trendy.
          </div>
        )}
      </section>
    </main>
  );
}
