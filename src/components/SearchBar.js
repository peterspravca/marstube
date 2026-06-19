"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const val = query.trim();
    if (!val) return;

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
    <form className={styles.searchForm} onSubmit={handleSearch}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Vyhľadať video..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className={styles.searchButton}>
        Hľadať
      </button>
    </form>
  );
}

