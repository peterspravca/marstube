"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import styles from "./SearchBar.module.css";

function parseYoutubeUrl(urlStr) {
  try {
    // Add protocol if missing to allow URL constructor to parse it
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

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loading state when navigation finishes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const val = query.trim();
    if (!val) return;
    setIsLoading(true);

    if (val.includes("youtube.com") || val.includes("youtu.be")) {
      const parsed = parseYoutubeUrl(val);
      if (parsed) {
        if (parsed.videoId && parsed.listId) {
          router.push(`/watch?v=${parsed.videoId}&list=${parsed.listId}`);
          return;
        } else if (parsed.videoId) {
          router.push(`/watch?v=${parsed.videoId}`);
          return;
        } else if (parsed.listId) {
          router.push(`/watch?list=${parsed.listId}`);
          return;
        }
      }
    }

    router.push(`/search?q=${encodeURIComponent(val)}`);
  };

  return (
    <>
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Vyhľadať video..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className={styles.searchButton} aria-label="Vyhľadať" title="Vyhľadať">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </form>

      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--border-glass-solid)',
            borderLeftColor: 'var(--accent-primary, #a855f7)',
            borderRadius: '50%',
            animation: 'searchSpinner 1s linear infinite',
            marginBottom: '1.5rem'
          }}></div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>Vyhľadávam...</h2>
          <p style={{ color: 'var(--text-secondary, #a0a0a5)', marginTop: '0.8rem', fontSize: '1.1rem' }}>Spracovávam požiadavku, prosím počkajte.</p>
          <style>{`
            @keyframes searchSpinner {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

