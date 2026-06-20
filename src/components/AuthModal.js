"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) onAuthSuccess(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          // Sometimes Supabase requires email confirmation
          onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.8)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(8px)"
    }}>
      <div style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border-glass)",
        borderRadius: "24px", padding: "2rem", width: "90%", maxWidth: "400px",
        boxShadow: "var(--shadow-glow)", position: "relative"
      }}>
        <button 
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1rem",
            background: "transparent", border: "none", color: "var(--text-secondary)",
            fontSize: "1.5rem", cursor: "pointer"
          }}
        >✕</button>
        
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          {isLogin ? "Prihlásenie" : "Registrácia"} do Mars<span className="text-gradient">Tube</span>
        </h2>

        {error && <div style={{ color: "#ff4d4d", background: "rgba(255,70,70,0.1)", padding: "0.8rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
              background: "rgba(255,255,255,0.05)", color: "white", fontSize: "1rem"
            }}
          />
          <input 
            type="password" 
            placeholder="Heslo" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
              background: "rgba(255,255,255,0.05)", color: "white", fontSize: "1rem"
            }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: "1rem", borderRadius: "12px", border: "none",
              background: "var(--accent-gradient)", color: "white", fontWeight: "bold",
              fontSize: "1.1rem", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Čakajte..." : (isLogin ? "Prihlásiť sa" : "Zaregistrovať sa")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {isLogin ? "Nemáte ešte účet?" : "Už máte účet?"}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={{ 
              background: "none", border: "none", color: "var(--accent-primary)", 
              fontWeight: "bold", cursor: "pointer", marginLeft: "0.5rem" 
            }}
          >
            {isLogin ? "Zaregistrujte sa" : "Prihláste sa"}
          </button>
        </div>
      </div>
    </div>
  );
}
