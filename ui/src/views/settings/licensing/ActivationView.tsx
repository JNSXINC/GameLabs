import { useState } from "react";

type ActivationViewProps = {
  onActivate: (license: string) => Promise<void>;
  onStartTrial: () => Promise<void>;
  error?: string | null;
  activating?: boolean;
  startingTrial?: boolean;
};

export default function ActivationView({
  onActivate,
  onStartTrial,
  error = null,
  activating = false,
  startingTrial = false,
}: ActivationViewProps) {
  const [license, setLicense] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!license.trim() || activating) return;

    await onActivate(license.trim());
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top, #14223e 0%, #080d19 55%, #030509 100%)",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 460,
          padding: "40px 32px",
          borderRadius: 20,
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 38, marginBottom: 16 }}>🔐</div>

        <h1 style={{ margin: 0, fontSize: 30 }}>GameLabs</h1>

        <p style={{ color: "#94a3b8", marginTop: 10 }}>Ativação de licença</p>

        <p
          style={{
            color: "#cbd5e1",
            fontSize: 14,
            lineHeight: 1.7,
            margin: "28px 0",
          }}
        >
          Insira sua licença para ativar o GameLabs neste computador.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={license}
            onChange={(event) => setLicense(event.target.value)}
            placeholder="Cole sua licença aqui..."
            disabled={activating}
            spellCheck={false}
            rows={5}
            style={{
              width: "100%",
              padding: 14,
              boxSizing: "border-box",
              borderRadius: 10,
              border: "1px solid #334155",
              background: "#080f1e",
              color: "#fff",
              resize: "vertical",
              fontSize: 13,
              outline: "none",
            }}
          />

          {error && (
            <p
              role="alert"
              style={{
                color: "#f87171",
                fontSize: 13,
                marginTop: 14,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={activating || !license.trim()}
            style={{
              width: "100%",
              padding: 14,
              marginTop: 18,
              border: "none",
              borderRadius: 10,
              background: "#2563eb",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: activating ? "wait" : "pointer",
              opacity: activating || !license.trim() ? 0.5 : 1,
            }}
          >
            {activating ? "Validando..." : "Ativar GameLabs"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <p
            style={{
              color: "#94a3b8",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            Ainda não possui uma licença?
          </p>

          <button
            type="button"
            onClick={onStartTrial}
            disabled={startingTrial || activating}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: startingTrial ? "wait" : "pointer",
              opacity: startingTrial || activating ? 0.5 : 1,
            }}
          >
            {startingTrial
              ? "Verificando período gratuito..."
              : "Experimentar grátis por 1 hora"}
          </button>
        </div>

        <p
          style={{
            marginTop: 26,
            color: "#64748b",
            fontSize: 12,
          }}
        >
          GameLabs Beta 1.0 — Licenciamento por dispositivo
        </p>
      </section>
    </main>
  );
}
