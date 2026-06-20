"use client";

import { useEffect, useState } from "react";
import VideoCard from "./VideoCard";
import { supabase } from "../lib/supabase";

export default function HistoryList() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // 1. Skúsime získať prihláseného používateľa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Prihlásený používateľ: Načítaj zo Supabase
          const { data, error } = await supabase
            .from("watch_history")
            .select("video_id")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(20);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            // Unikátne IDčka zachovávajúce poradie z databázy
            const uniqueIds = [...new Set(data.map(item => item.video_id))];
            
            // Dopyt na naše nové API pre získanie detailov
            const res = await fetch(`/api/videos?ids=${uniqueIds.join(',')}`);
            if (res.ok) {
              const videoDetails = await res.json();
              // Zachovanie poradia z histórie
              const orderedHistory = uniqueIds.map(id => videoDetails.find(v => v.id === id)).filter(Boolean);
              setHistory(orderedHistory);
              setLoading(false);
              return;
            }
          }
          
          setHistory([]);
        } else {
          // Neprihlásený používateľ: Načítaj z Local Storage
          const saved = localStorage.getItem("martubeHistory");
          if (saved) {
            let parsed = JSON.parse(saved);
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            
            parsed = parsed.filter(item => {
              if (!item || !item.title) return false;
              if (item.timestamp && (now - item.timestamp > thirtyDaysMs)) return false;
              return true;
            });
            
            setHistory(parsed);
            localStorage.setItem("martubeHistory", JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.error("Nepodarilo sa načítať históriu", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    
    // Pridáme poslucháč na zmenu prihlásenia, aby sa história obnovila pri login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchHistory();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
        Načítavam históriu...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
        Zatiaľ ste si nepozreli žiadne videá.
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "2rem"
    }}>
      {history.map((video, idx) => (
        <VideoCard key={idx} video={video} />
      ))}
    </div>
  );
}
