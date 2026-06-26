"use client";

import { useState, useEffect } from "react";
import { authApi } from "../lib/auth";
import AuthModal from "./AuthModal";
import { useLanguage } from "./LanguageProvider";

export default function AuthButton() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Polling or simple check on mount
    const checkUser = () => {
      setUser(authApi.getUser());
    };
    checkUser();
    
    // Listen for storage changes in case login happens in another tab
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    window.location.reload();
  };

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {user.email}
        </span>
        <button 
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
            background: "var(--button-bg)", color: "var(--text-primary)", cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.background = "rgba(255,70,70,0.2)"}
          onMouseOut={e => e.currentTarget.style.background = "var(--button-bg)"}
        >
          {t("auth.logoutBtn")}
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
        {t("auth.login")}
      </button>
      
      {showModal && (
        <AuthModal 
          onClose={() => setShowModal(false)} 
          onAuthSuccess={(userData) => {
            setShowModal(false);
            setUser(userData);
            window.location.reload();
          }} 
        />
      )}
    </>
  );
}
