import VideoPlayer from "@/components/VideoPlayer";
import SearchBar from "@/components/SearchBar";
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
    
    // Predchádzajúce video
    if (currentIndex > 0) {
      const prevId = playlistItems[currentIndex - 1].id;
      prevVideoUrl = `/watch?v=${prevId}&list=${listId}`;
    }
    
    // Nasledujúce video
    if (currentIndex >= 0 && currentIndex < playlistItems.length - 1) {
      const nextId = playlistItems[currentIndex + 1].id;
      nextVideoUrl = `/watch?v=${nextId}&list=${listId}`;
    }
  }

  return (
    <main className="container animate-fade-in">
      <header className="watch-header">
        <a href="/" className="watch-logo">
          <img src="/logo.png" alt="Logo" style={{ width: "40px", height: "40px", borderRadius: "8px" }} />
          <span>Mars<span className="text-gradient">Tube</span></span>
        </a>
        <div className="watch-search-wrapper">
          <SearchBar />
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
