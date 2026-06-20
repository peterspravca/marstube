export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid rgba(255,255,255,0.1)',
        borderLeftColor: 'var(--accent-primary, #a855f7)',
        borderRadius: '50%',
        animation: 'globalSpinner 1s linear infinite',
        marginBottom: '1.5rem'
      }}></div>
      <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>Načítavam...</h2>
      <p style={{ color: 'var(--text-secondary, #a0a0a5)', marginTop: '0.8rem', fontSize: '1.1rem' }}>Spracovávam údaje, prosím počkajte.</p>
      <style>{`
        @keyframes globalSpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
