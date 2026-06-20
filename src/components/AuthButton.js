"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {user.email}
        </span>
        <button 
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
            background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.background = "rgba(255,70,70,0.2)"}
          onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
          Odhlásiť sa
        </button>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        style={{
          padding: "0.5rem 1.2rem", borderRadius: "16px", border: "none",
          background: "var(--accent-gradient)", color: "white", fontWeight: "bold",
          cursor: "pointer", boxShadow: "var(--shadow-glass)"
        }}
      >
        Prihlásiť sa
      </button>
      
      {showModal && (
        <AuthModal 
          onClose={() => setShowModal(false)} 
          onAuthSuccess={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
