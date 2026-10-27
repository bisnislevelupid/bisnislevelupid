export function Wordmark({ size = "1.4rem" }: { size?: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: size,
        fontWeight: 800,
        color: "#0f172a",
        letterSpacing: "-0.02em",
      }}
    >
      Bisnis<span style={{ color: "#059669" }}>LevelUp</span>
      <span style={{ color: "#64748b", fontWeight: 700 }}>.id</span>
    </span>
  );
}
