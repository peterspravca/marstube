import SearchBar from "@/components/SearchBar";
import VideoCard from "@/components/VideoCard";
import HistoryList from "@/components/HistoryList";
import PlaylistSection from "@/components/PlaylistSection";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";
import { getTrending } from "@/lib/api";

export const revalidate = 0;

export default async function Home() {
  const trendingVideos = await getTrending();

  return (
    <main className="container animate-fade-in">
      <header className="home-header">
        <div className="home-logo-title">
          <img src="/logo.png" alt="MarsTube Logo" className="floating-logo" style={{ height: "60px", width: "auto", objectFit: "contain", marginRight: "0px" }} />
          <h1 className="home-title" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/marstube-light.png" alt="MarsTube" className="logo-light" style={{ height: "60px", width: "auto" }} />
            <img src="/marstube-dark.png" alt="MarsTube" className="logo-dark" style={{ height: "60px", width: "auto" }} />
          </h1>
        </div>
        <div className="home-auth-wrapper">
          <ThemeToggle />
          <AuthButton />
        </div>
        <p className="home-subtitle">
          Bez reklám, bez prerušení. Váš osobný, prémiový zážitok.
        </p>
        
        <div className="home-search-wrapper">
          <SearchBar />
        </div>
      </header>
      
      {/* Sekcia: Vlastný Playlist používateľa */}
      <section style={{ marginTop: "4rem" }}>
        <PlaylistSection />
      </section>

      {/* Sekcia: História */}
      <section style={{ marginTop: "4rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          História sledovania
        </h2>
        <HistoryList />
      </section>
      
      {/* Sekcia: Trendy */}
      <section style={{ marginTop: "4rem", marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c-2.2-4.5-6-5.5-6-5.5s4 1 6.5 5.5c1.5-3.5-1-6.5-1-6.5s3.5 1.5 4.5 5.5c.5-1.5-.5-3.5-.5-3.5s2 1.5 2 4.5a5.5 5.5 0 1 1-8 0z"></path></svg>
          Trendy
        </h2>
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
