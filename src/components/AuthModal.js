"use client";
import { useState } from "react";
import { authApi } from "../lib/auth";
import { useLanguage } from "./LanguageProvider";

export default function AuthModal({ onClose, onAuthSuccess }) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (showForgot) {
        const data = await authApi.forgotPassword(email);
        if (data.error) throw new Error(data.error);
        if (data.success) {
          setSuccess("Ak tento e-mail evidujeme, poslali sme naň odkaz na obnovu hesla.");
          // keep showForgot true so they can read the success message
        }
      } else if (showVerify) {
        const data = await authApi.verify(email, verifyCode);
        if (data.error) throw new Error(data.error);
        if (data.success) {
          onAuthSuccess({ email: data.email });
        }
      } else if (isLogin) {
        const data = await authApi.login(email, password);
        if (data.needsVerification) {
          setShowVerify(true);
          setSuccess("E-mail ešte nebol overený. Zadajte overovací kód, ktorý sme vám poslali pri registrácii.");
          return;
        }
        if (data.error) throw new Error(data.error);
        if (data.success) {
          onAuthSuccess({ email: data.email });
        }
      } else {
        const data = await authApi.register(email, password);
        if (data.error) throw new Error(data.error);
        if (data.success) {
          setShowVerify(true);
          setSuccess("Registrácia úspešná! Skontrolujte si e-mail a zadajte 6-miestny overovací kód.");
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
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: "6rem",
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
          {showForgot ? "Obnova hesla" : (showVerify ? "Overenie E-mailu" : (isLogin ? "Prihlásenie" : "Registrácia"))} do Mars<span className="text-gradient">Tube</span>
        </h2>

        {error && <div style={{ color: "#ff4d4d", background: "rgba(255,70,70,0.1)", padding: "0.8rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</div>}
        {success && <div style={{ color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "0.8rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem" }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {!showVerify && !showForgot ? (
            <>
              <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
              background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "1rem"
            }}
          />
          <div style={{ position: "relative" }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Heslo" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
                background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "1rem", paddingRight: "3rem"
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer",
                fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center"
              }}
              title={showPassword ? "Skryť heslo" : "Zobraziť heslo"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
              <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
                <button 
                  type="button"
                  onClick={() => { setShowForgot(true); setError(""); setSuccess(""); }}
                  style={{ background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer", fontSize: "0.9rem" }}
                >
                  Zabudli ste heslo?
                </button>
              </div>
            </>
          ) : showForgot ? (
            <input 
              type="email" 
              placeholder="Váš e-mail" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
                background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "1rem"
              }}
            />
          ) : (
            <input 
              type="text" 
              placeholder="Zadajte 6-miestny kód z e-mailu" 
              value={verifyCode} 
              onChange={e => setVerifyCode(e.target.value)}
              required
              style={{
                padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
                background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "1rem", textAlign: "center", letterSpacing: "2px"
              }}
            />
          )}
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
            {loading ? "Čakajte..." : (showForgot ? "Odoslať odkaz na obnovu" : (showVerify ? "Overiť a prihlásiť" : (isLogin ? "Prihlásiť sa" : "Zaregistrovať sa")))}
          </button>
        </form>

        {!showVerify && !showForgot && (
          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            {isLogin ? "Nemáte ešte účet?" : "Už máte účet?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}
              style={{ 
                background: "none", border: "none", color: "var(--accent-primary)", 
                fontWeight: "bold", cursor: "pointer", marginLeft: "0.5rem" 
              }}
            >
              {isLogin ? "Zaregistrujte sa" : "Prihláste sa"}
            </button>
          </div>
        )}

        {showForgot && (
          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            <button 
              onClick={() => { setShowForgot(false); setError(""); setSuccess(""); }}
              style={{ 
                background: "none", border: "none", color: "var(--text-primary)", 
                fontWeight: "bold", cursor: "pointer" 
              }}
            >
              Späť na prihlásenie
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
