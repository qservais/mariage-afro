export default function ComingSoon() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff4e4",
        fontFamily: "'Montserrat', sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <img
        src="/logo.svg"
        alt="Mariage Afro"
        style={{ width: "clamp(140px, 30vw, 220px)", marginBottom: "2.5rem" }}
      />

      <p
        style={{
          fontFamily: "'Cormorant Garamond', 'Cormorant', serif",
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 600,
          color: "#68191e",
          lineHeight: 1.15,
          marginBottom: "1rem",
          letterSpacing: "0.01em",
        }}
      >
        Bientôt disponible
      </p>

      <p
        style={{
          fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
          color: "#7a5c42",
          maxWidth: "400px",
          lineHeight: 1.7,
          marginBottom: "2.5rem",
        }}
      >
        Notre plateforme dédiée aux mariages afro &amp; métissés arrive très prochainement.
      </p>

      <div
        style={{
          width: "48px",
          height: "2px",
          background: "#68191e",
          opacity: 0.35,
          borderRadius: "2px",
          marginBottom: "2rem",
        }}
      />

      <a
        href="mailto:contact@mariage-afro.com"
        style={{
          fontSize: "0.85rem",
          color: "#68191e",
          textDecoration: "none",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          borderBottom: "1px solid #68191e44",
          paddingBottom: "2px",
        }}
      >
        contact@mariage-afro.com
      </a>
    </div>
  );
}
