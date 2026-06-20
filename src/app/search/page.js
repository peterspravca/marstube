import { redirect } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import VideoCard from "@/components/VideoCard";
import { searchVideos } from "@/lib/api";

function parseYoutubeUrl(urlStr) {
  try {
    let cleanUrl = urlStr.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }
    const url = new URL(cleanUrl);
    let videoId = "";
    let listId = "";
    
    if (url.hostname.includes("youtu.be")) {
      videoId = url.pathname.slice(1);
      listId = url.searchParams.get("list") || "";
    } else if (url.pathname.includes("/watch")) {
      videoId = url.searchParams.get("v") || "";
      listId = url.searchParams.get("list") || "";
    } else if (url.pathname.includes("/playlist")) {
      listId = url.searchParams.get("list") || "";
    } else if (url.pathname.includes("/shorts/")) {
      videoId = url.pathname.split("/shorts/")[1]?.split("?")[0] || "";
      listId = url.searchParams.get("list") || "";
    } else if (url.pathname.includes("/live/")) {
      videoId = url.pathname.split("/live/")[1]?.split("?")[0] || "";
      listId = url.searchParams.get("list") || "";
    }
    
    return { videoId, listId };
  } catch (e) {
    return null;
  }
}

export default async function SearchPage({ searchParams }) {
  // Prístup k searchParams.q musí byť asynchrónny v novších verziách Next.js (od v15), 
  // ale pre spätnú kompatibilitu alebo bez použitia await to závisí od verzie.
  // Tu predpokladáme Next.js 14 alebo sľub pre 15+. 
  // Pre istotu môžeme použiť await na searchParams ak by to bol Promise.
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  if (query && (query.includes("youtube.com") || query.includes("youtu.be"))) {
    const parsed = parseYoutubeUrl(query);
    if (parsed) {
      if (parsed.videoId && parsed.listId) {
        redirect(`/watch?v=${parsed.videoId}&list=${parsed.listId}`);
      } else if (parsed.videoId) {
        redirect(`/watch?v=${parsed.videoId}`);
      } else if (parsed.listId) {
        redirect(`/watch?list=${parsed.listId}`);
      }
    }
  }
  
  let results = [];
  if (query) {
    results = await searchVideos(query);
  }

  return (
    <main className="container animate-fade-in">
      <header style={{ marginBottom: "3rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <h1 style={{ fontSize: "2.5rem", margin: 0 }}>
            Výsledky pre: <span className="text-gradient">{query}</span>
          </h1>
          <a href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.6rem 1.5rem',
            borderRadius: '50px',
            background: 'var(--accent-gradient)',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 'bold',
            border: 'none',
            boxShadow: 'var(--shadow-glow)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Domov
          </a>
        </div>
        <SearchBar />
      </header>
      
      <section>
        {results.length === 0 ? (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            Nenašli sa žiadne výsledky. Skúste iný výraz.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "2rem"
          }}>
            {results.map((video, idx) => (
              <VideoCard key={idx} video={video} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
