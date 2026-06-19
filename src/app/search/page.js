import SearchBar from "@/components/SearchBar";
import VideoCard from "@/components/VideoCard";
import { searchVideos } from "@/lib/api";

export default async function SearchPage({ searchParams }) {
  // Prístup k searchParams.q musí byť asynchrónny v novších verziách Next.js (od v15), 
  // ale pre spätnú kompatibilitu alebo bez použitia await to závisí od verzie.
  // Tu predpokladáme Next.js 14 alebo sľub pre 15+. 
  // Pre istotu môžeme použiť await na searchParams ak by to bol Promise.
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  
  let results = [];
  if (query) {
    results = await searchVideos(query);
  }

  return (
    <main className="container animate-fade-in">
      <header style={{ marginBottom: "3rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h1 style={{ fontSize: "2.5rem" }}>
          Výsledky pre: <span className="text-gradient">{query}</span>
        </h1>
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
