type GameStatus = "none" | "valid" | "invalid";

type Props = {
  status: GameStatus;
};

const statusMap: Record<
  GameStatus,
  {
    label: string;
    color: string;
    background: string;
    border: string;
  }
> = {
  none: {
    label: "Não configurado",
    color: "#ff6b6b",
    background: "rgba(120, 18, 28, 0.28)",
    border: "1px solid rgba(255, 90, 90, 0.35)"
  },
  valid: {
    label: "Executável válido",
    color: "#2ee59d",
    background: "rgba(16, 89, 58, 0.28)",
    border: "1px solid rgba(46, 229, 157, 0.35)"
  },
  invalid: {
    label: "Arquivo não encontrado",
    color: "#ffd166",
    background: "rgba(110, 78, 10, 0.28)",
    border: "1px solid rgba(255, 209, 102, 0.35)"
  }
};

export default function GameStatusBadge({ status }: Props) {
  const current = statusMap[status] ?? statusMap.none;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        color: current.color,
        background: current.background,
        border: current.border
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: current.color,
          display: "inline-block"
        }}
      />
      {current.label}
    </div>
  );
}