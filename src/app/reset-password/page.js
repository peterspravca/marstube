"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import TranslatedText from "@/components/TranslatedText";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            <img src="/logo.png" alt="MarsTube Logo" style={{ height: "45px", width: "auto", objectFit: "contain" }} />
          </a>
          <h2>{t("auth.resetPasswordTitle")} <span className="text-gradient">{t("auth.resetPasswordTitleBold")}</span></h2>
        </div>

        {error && <div style={{ color: "#ff4d4d", background: "rgba(255,70,70,0.1)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>{error}</div>}
        {success && <div style={{ color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>{success}</div>}

        {!success && token && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Nové heslo</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Zadajte nové heslo" 
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
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  title={showPassword ? "Skryť heslo" : "Zobraziť heslo"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Potvrdenie nového hesla</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Znovu zadajte nové heslo" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
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
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  title={showPassword ? "Skryť heslo" : "Zobraziť heslo"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
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
              {loading ? t("auth.loadingWait") : t("auth.resetPasswordBtn")}
            </button>
          </form>
        )}

        {!token && !error && (
          <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>{t("common.loading")}</div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "5rem" }}><TranslatedText id="common.loading" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
