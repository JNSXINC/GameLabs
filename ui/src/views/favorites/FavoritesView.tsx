import React from "react";
import { Game } from "../../types/game";
import GameCard from "../../components/game/GameCard";
import GameActions from "../../components/game/GameActions";

type GameStatus = "none" | "valid" | "invalid";

type Props = {
  favorites: Game[];
  gameStatus: Record<string, GameStatus>;
  toggleFavorite: (id: string) => void;
  handleLaunchGame: (game: Game | null) => void | Promise<void>;
  favoritesMenuId: string | null;
  setFavoritesMenuId: (id: string | null) => void;
  assetUrl: (value: string) => string;
  gamepadFocusId: string | null;
};

export default function FavoritesView({
  favorites,
  gameStatus,
  favoritesMenuId,
  setFavoritesMenuId,
  toggleFavorite,
  handleLaunchGame,
  assetUrl,
  gamepadFocusId,
}: Props) {
  const glassPanel: React.CSSProperties = {
    background: "rgba(7, 13, 28, 0.62)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <div
      style={{
        padding: "34px 42px",
      }}
    >
      <h1 style={{ marginTop: 0, fontSize: "42px" }}>Favorites</h1>

      <div
        data-gamepad-grid="favorites"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: "24px",
          marginTop: "24px",
        }}
      >
        {favorites.map((game) => {
          const active = favoritesMenuId === game.id;
          const gamepadActive = gamepadFocusId === game.id;

          return (
            <div
              key={game.id}
              data-gamepad-card
              style={{
                position: "relative",
                borderRadius: "14px",
                outline: gamepadActive
                  ? "2px solid rgba(255,255,255,0.85)"
                  : "2px solid transparent",
                outlineOffset: "5px",
                transition: "outline-color 0.15s ease",
              }}
            >
              <GameCard
                game={game}
                isActive={active || gamepadActive}
                onClick={() =>
                  setFavoritesMenuId(
                    favoritesMenuId === game.id ? null : game.id,
                  )
                }
                assetUrl={assetUrl}
                variant="grid"
                showFavoriteBadge
              />

              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                {game.name}
              </p>

              {active && (
                <div
                  style={{
                    ...glassPanel,
                    position: "absolute",
                    top: "calc(100% - 6px)",
                    left: 0,
                    right: 0,
                    borderRadius: "12px",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    zIndex: 3,
                  }}
                >
                  <GameActions
                    game={game}
                    status={gameStatus[game.id] ?? "none"}
                    onLaunch={handleLaunchGame}
                    onToggleFavorite={toggleFavorite}
                    favoriteLabel={{
                      active: "Remover dos favoritos",
                      inactive: "Favoritar",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
