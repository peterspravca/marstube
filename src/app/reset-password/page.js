"use client";
import { useState, useEffect } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/auth";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Chýba token pre obnovu hesla. Neplatný alebo expirovaný odkaz.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError("Heslá sa nezhodujú.");
      return;
    }
    
    if (password.length < 6) {
      setError("Heslo musí mať aspoň 6 znakov.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await authApi.resetPassword(token, password);
      if (data.error) throw new Error(data.error);
      
      if (data.success) {
        setSuccess("Vaše heslo bolo úspešne zmenené. Teraz sa môžete prihlásiť s novým heslom.");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container animate-fade-in" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border-glass)",
        borderRadius: "24px", padding: "3rem", width: "100%", maxWidth: "500px",
        boxShadow: "var(--shadow-glow)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem" }}>
            <img src="/logo.png" alt="MarsTube Logo" style={{ width: "60px", height: "60px" }} />
          </a>
          <h2>Obnova <span className="text-gradient">hesla</span></h2>
        </div>

        {error && <div style={{ color: "#ff4d4d", background: "rgba(255,70,70,0.1)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>{error}</div>}
        {success && <div style={{ color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>{success}</div>}

        {!success && token && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Nové heslo</label>
              <input 
                type="password" 
                placeholder="Zadajte nové heslo" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
                  background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "1rem"
                }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Potvrdenie nového hesla</label>
              <input 
                type="password" 
                placeholder="Znovu zadajte nové heslo" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)",
                  background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "1rem"
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: "1rem", borderRadius: "12px", border: "none",
                background: "var(--accent-gradient)", color: "white", fontWeight: "bold",
                fontSize: "1.1rem", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, marginTop: "0.5rem"
              }}
            >
              {loading ? "Čakajte..." : "Zmeniť heslo"}
            </button>
          </form>
        )}

        {!token && !error && (
          <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>Načítavam...</div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "5rem" }}>Načítavam...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
