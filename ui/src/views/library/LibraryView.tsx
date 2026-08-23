import React from "react";
import { Game } from "../../types/game";
import GameCard from "../../components/game/GameCard";
import { formatPlaytime } from "../../utils/formatPlaytime";

type LibraryViewProps = {
  currentLibraryGame: Game | null;
  recentGames: Game[];
  infiniteLibraryGames: Game[];
  realIndex: number;
  infiniteCenterOffset: number;
  totalLibraryGames: number;
  listRef: React.RefObject<HTMLDivElement | null>;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  assetUrl: (value: string) => string;
  toggleFavorite: (id: string) => void;
  handleLaunchGame: (game: Game | null) => void | Promise<void>;
};

export default function LibraryView({
  currentLibraryGame,
  recentGames,
  infiniteLibraryGames,
  realIndex,
  infiniteCenterOffset,
  totalLibraryGames,
  listRef,
  setSelected,
  assetUrl,
  toggleFavorite,
  handleLaunchGame,
}: LibraryViewProps) {
  const actionButtonStyle: React.CSSProperties = {
    padding: "12px 20px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "15px",
  };

  if (!currentLibraryGame) {
    return (
      <div style={{ padding: "40px", color: "white" }}>
        Nenhum jogo encontrado.
      </div>
    );
  }

  const bgSrc = currentLibraryGame.bg?.startsWith("data:image")
    ? currentLibraryGame.bg
    : assetUrl(currentLibraryGame.bg);

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        backgroundImage: `linear-gradient(rgba(5,10,20,0.45), rgba(5,10,20,0.88)), url("${bgSrc}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ padding: "24px 50px 40px" }}>
        <div
          style={{
            display: "flex",
            gap: "0px",
            overflowX: "auto",
            scrollBehavior: "smooth",
            paddingBottom: "18px",
            alignItems: "center",
          }}
          ref={listRef}
        >
          {infiniteLibraryGames.map((game, index) => {
            const active = index === realIndex + infiniteCenterOffset;

            return (
              <GameCard
                key={`${game.id}-${index}`}
                game={game}
                isActive={active}
                onHover={() => {
                  const normalizedIndex = index % totalLibraryGames;
                  setSelected(normalizedIndex);
                }}
                onClick={() => {
                  const normalizedIndex = index % totalLibraryGames;
                  setSelected(normalizedIndex);
                }}
                assetUrl={assetUrl}
                marginLeft={index === 0 ? "0px" : "-6px"}
                variant="library"
              />
            );
          })}
        </div>

        <div style={{ marginTop: "40px", maxWidth: "860px" }}>
          <h1 style={{ fontSize: "56px", margin: 0 }}>
            {currentLibraryGame.name}
          </h1>

          <p
            style={{
              marginTop: "18px",
              fontSize: "18px",
              opacity: 0.84,
              lineHeight: 1.6,
              maxWidth: "760px",
            }}
          >
            {currentLibraryGame.description}
          </p>

          <p
            style={{
              marginTop: "16px",
              fontSize: "17px",
              opacity: 0.72,
            }}
          >
            ⏱ Played {formatPlaytime(currentLibraryGame.playtime)}
          </p>

          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "center",
              marginTop: "24px",
            }}
          >
            <button
              style={{
                ...actionButtonStyle,
                background: "#1f5fff",
                color: "white",
              }}
              onClick={() => handleLaunchGame(currentLibraryGame)}
            >
              Iniciar
            </button>

            <button
              style={{
                ...actionButtonStyle,
                background: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onClick={() => toggleFavorite(currentLibraryGame.id)}
            >
              {currentLibraryGame.favorite ? "★ Favorite" : "☆ Favorite"}
            </button>

            <button
              style={{
                ...actionButtonStyle,
                background: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onClick={() =>
                alert(`Abrindo opções de ${currentLibraryGame.name}...`)
              }
            >
              Options
            </button>
          </div>

          {recentGames.length > 0 && (
            <div style={{ marginTop: "34px" }}>
              <h2
                style={{
                  fontSize: "20px",
                  margin: "0 0 14px",
                  opacity: 0.92,
                }}
              >
                Continue jogando
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  overflowX: "auto",
                  paddingBottom: "10px",
                  maxWidth: "760px",
                }}
              >
                {recentGames.map((game) => {
                  const coverSrc = game.cover?.startsWith("data:image")
                    ? game.cover
                    : assetUrl(game.cover);

                  return (
                    <div
                      key={game.id}
                      onClick={() => handleLaunchGame(game)}
                      style={{
                        width: "110px",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          height: "150px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          background: "#000",
                          border: "1px solid rgba(255,255,255,0.12)",
                          boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                        }}
                      >
                        <img
                          src={coverSrc}
                          alt={game.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "8px",
                          opacity: 0.85,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={game.name}
                      >
                        {game.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}