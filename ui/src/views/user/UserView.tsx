import React from "react";
import { Game } from "../../types/game";

type Props = {
  favorites: Game[];
  games: Game[];
};

export default function UserView({ favorites, games }: Props) {
  const glassPanel: React.CSSProperties = {
    background: "rgba(7, 13, 28, 0.62)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <div style={{ padding: "34px 42px" }}>
      <h1 style={{ marginTop: 0, fontSize: "42px" }}>User Area</h1>

      <div
        style={{
          ...glassPanel,
          borderRadius: "18px",
          padding: "24px",
          maxWidth: "560px",
          marginTop: "24px",
        }}
      >
        <p>👤 Perfil do jogador</p>
        <p>⭐ Favoritos: {favorites.length}</p>
        <p>🎮 Total de jogos: {games.length}</p>
      </div>
    </div>
  );
}