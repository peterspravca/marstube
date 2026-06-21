import VideoPlayer from "@/components/VideoPlayer";
import SearchBar from "@/components/SearchBar";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";
import { getVideoStream } from "@/lib/api";

export default async function WatchPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const videoId = resolvedParams.v;
  const listId = resolvedParams.list;
  
  if (!videoId && listId) {
    const { getPlaylist } = await import("@/lib/api");
    const playlistResult = await getPlaylist(listId);
    const playlistItems = playlistResult.items || [];
    if (playlistItems.length > 0) {
      const { redirect } = await import("next/navigation");
      redirect(`/watch?v=${playlistItems[0].id}&list=${listId}`);
    }
  }
  
  let streamData = null;
  let nextVideoUrl = null;
  let prevVideoUrl = null;
  
  if (videoId) {
    streamData = await getVideoStream(videoId);
  }

  if (listId) {
    const { getPlaylist } = await import("@/lib/api");
    const playlistResult = await getPlaylist(listId);
    const playlistItems = playlistResult.items || [];
    const currentIndex = playlistItems.findIndex(item => item.id === videoId);
    
    if (playlistItems.length > 0 && currentIndex >= 0) {
      // Predchádzajúce video (slučka na koniec, ak sme na začiatku)
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlistItems.length - 1;
      prevVideoUrl = `/watch?v=${playlistItems[prevIndex].id}&list=${listId}`;
      
      // Nasledujúce video (slučka na začiatok, ak sme na konci)
      const nextIndex = currentIndex < playlistItems.length - 1 ? currentIndex + 1 : 0;
      nextVideoUrl = `/watch?v=${playlistItems[nextIndex].id}&list=${listId}`;
    }
  }

  return (
    <main className="container animate-fade-in">
      <header className="watch-header">
        <a href="/" className="watch-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Logo" style={{ height: "30px", width: "auto", objectFit: "contain", borderRadius: "8px", marginRight: "0px" }} />
          <img src="/marstube-light.png" alt="MarsTube" className="logo-light" style={{ height: "30px", width: "auto", objectFit: "contain" }} />
          <img src="/marstube-dark.png" alt="MarsTube" className="logo-dark" style={{ height: "30px", width: "auto", objectFit: "contain" }} />
        </a>
        <div className="watch-search-wrapper">
          <SearchBar />
        </div>
        <div className="watch-auth-wrapper">
          <ThemeToggle />
          <AuthButton />
        </div>
      </header>
      
      <section>
        {streamData ? (
          <VideoPlayer streamData={streamData} nextVideoUrl={nextVideoUrl} prevVideoUrl={prevVideoUrl} />
        ) : (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            Nepodarilo sa načítať video. Skontrolujte URL alebo skúste iné video.
          </div>
        )}
      </section>
    </main>
  );
}
