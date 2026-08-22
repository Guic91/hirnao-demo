import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 24 }}>
      <div style={{ marginTop: "20vh" }}>
        <h1 className="logo" style={{ fontSize: 32, marginBottom: 8 }}>HIRNAO</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 300 }}>
          Intelligent real-world networking with personal AI agents
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
        <Link href="/e/ai-summit-paris-2026" className="btn btn-primary">
          Demo — AI Summit Paris 2026
        </Link>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Scan QR or open event link to start
        </p>
      </div>
    </div>
  );
}
