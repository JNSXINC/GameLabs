import React, { useState } from "react";
import ActionButton from "../../components/ActionButton";
import ExecutableName from "../../components/ExecutableName";
import GameCard from "../../components/game/GameCard";
import GameActions from "../../components/game/GameActions";
import GameStatusBadge from "../../components/GameStatusBadge";
import { Game } from "../../types/game";
import { ScannedGame } from "../../types/scanner";

type GameStatus = "none" | "valid" | "invalid";

type Props = {
  games: Game[];
  gameStatus: Record<string, GameStatus>;
  toggleFavorite: (id: string) => void;
  handleLaunchGame: (game: Game | null) => void | Promise<void>;
  setGameExecutable: (id: string) => void | Promise<void>;
  setGameFile: (id: string) => void | Promise<void>;
  removeGameExecutable: (id: string) => void;
  handleOpenGameFolder: (game: Game | null) => void | Promise<void>;
  browseMenuId: string | null;
  setBrowseMenuId: (id: string | null) => void;
  assetUrl: (value: string) => string;
  onAddScannedGame: (scannedGame: ScannedGame) => void;
  onClearGames: () => void;
  onRemoveGameFromSystem: (gameId: string) => void;
  onImportGameFile: () => void | Promise<void>;
  onUpdateGame: (gameId: string, patch: Partial<Game>) => void | Promise<void>;
  gamepadFocusId: string | null;
};

export default function BrowseView({
  games,
  gameStatus,
  toggleFavorite,
  handleLaunchGame,
  setGameExecutable,
  removeGameExecutable,
  setGameFile,
  handleOpenGameFolder,
  browseMenuId,
  setBrowseMenuId,
  assetUrl,
  onAddScannedGame,
  onClearGames,
  onRemoveGameFromSystem,
  onImportGameFile,
  onUpdateGame,
  gamepadFocusId,
}: Props) {
  const [scannedGames, setScannedGames] = useState<ScannedGame[]>([]);
  const [showScannedPanel, setShowScannedPanel] = useState(true);

  const glassPanel: React.CSSProperties = {
    background: "rgba(7, 13, 28, 0.62)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  async function handleScanFolder() {
    try {
      const results = await window.electronAPI.scanGamesFromFolder();
      setScannedGames(results);
      setShowScannedPanel(true);
    } catch (error) {
      console.error("Erro ao escanear pasta:", error);
      alert("Erro ao escanear pasta de jogos.");
    }
  }

  function handleAddScannedGame(scannedGame: ScannedGame) {
    onAddScannedGame(scannedGame);

    setScannedGames((prev) => {
      const updated = prev.filter((g) => g.id !== scannedGame.id);

      if (updated.length === 0) {
        setShowScannedPanel(false);
      }

      return updated;
    });
  }

  function handleAddAllScannedGames() {
    scannedGames.forEach((game) => onAddScannedGame(game));
    setScannedGames([]);
    setShowScannedPanel(false);
  }

  function handleClearScannedGames() {
    const confirmed = window.confirm(
      "Tem certeza que deseja limpar apenas os resultados visuais do scanner?",
    );

    if (!confirmed) return;

    setScannedGames([]);
    setShowScannedPanel(false);
  }

  function handleClearTests() {
    const confirmed = window.confirm(
      "Tem certeza que deseja limpar os testes?\n\nIsso vai remover os jogos de teste do sistema e também limpar a lista visual do scanner.",
    );

    if (!confirmed) return;

    onClearGames();
    setScannedGames([]);
    setShowScannedPanel(false);
  }

  function handleRemoveScannedSlot(scannedGame: ScannedGame) {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o slot de "${scannedGame.name}"?\n\nEssa ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    setScannedGames((prev) =>
      prev.filter((game) => game.id !== scannedGame.id),
    );
  }

  function handleRemoveFromLibrary(game: Game) {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover "${game.name}" da biblioteca?\n\nEssa ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    onRemoveGameFromSystem(game.id);
    setBrowseMenuId(null);
  }

  return (
    <div style={{ padding: "34px 42px" }}>
      <h1 style={{ marginTop: 0, fontSize: "42px" }}>Browse</h1>

      <div
        style={{
          marginTop: "16px",
          marginBottom: "20px",
          maxWidth: "280px",
        }}
      >
        <ActionButton onClick={handleScanFolder}>
          Escanear pasta de jogos
        </ActionButton>

        <ActionButton onClick={onImportGameFile}>Importar jogo</ActionButton>
      </div>

      {showScannedPanel && scannedGames.length > 0 && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
          }}
        >
          <button
            onClick={() => setShowScannedPanel(false)}
            style={{
              position: "absolute",
              top: "10px",
              right: "12px",
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "18px",
              cursor: "pointer",
              opacity: 0.7,
            }}
          >
            ✕
          </button>

          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>
            Jogos encontrados
          </h3>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <ActionButton variant="primary" onClick={handleAddAllScannedGames}>
              Adicionar todos
            </ActionButton>

            <ActionButton onClick={handleScanFolder}>
              Escanear novamente
            </ActionButton>

            <ActionButton onClick={onImportGameFile}>
              Importar jogo
            </ActionButton>

            <ActionButton variant="warning" onClick={handleClearScannedGames}>
              Limpar resultados
            </ActionButton>

            <ActionButton variant="danger" onClick={handleClearTests}>
              Limpar testes
            </ActionButton>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {scannedGames.map((scannedGame) => (
              <div
                key={scannedGame.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  fontSize: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <strong>{scannedGame.name}</strong>

                <div style={{ opacity: 0.7 }}>{scannedGame.executablePath}</div>

                <div
                  style={{
                    opacity: 0.55,
                    fontSize: "12px",
                  }}
                >
                  Plataforma: {scannedGame.platform}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <ActionButton
                    variant="primary"
                    onClick={() => handleAddScannedGame(scannedGame)}
                  >
                    Adicionar à biblioteca
                  </ActionButton>

                  <ActionButton
                    variant="danger"
                    onClick={() => handleRemoveScannedSlot(scannedGame)}
                  >
                    Remover slot
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        data-gamepad-grid="browse"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: "24px",
          marginTop: "24px",
        }}
      >
        {games.map((game) => {
          const active = browseMenuId === game.id;
          const gamepadActive = gamepadFocusId === game.id;
          const status = gameStatus[game.id] ?? "none";

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
                  setBrowseMenuId(browseMenuId === game.id ? null : game.id)
                }
                assetUrl={assetUrl}
                variant="grid"
                showFavoriteBadge={!!game.favorite}
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

              <div style={{ marginTop: "8px" }}>
                <GameStatusBadge status={status} />
              </div>

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
                  <ExecutableName
                    path={game.path}
                    launchType={game.launchType}
                    gameFilePath={game.gameFilePath}
                  />

                  <GameActions
                    game={game}
                    status={status}
                    onLaunch={handleLaunchGame}
                    onToggleFavorite={toggleFavorite}
                    onSetExecutable={setGameExecutable}
                    onRemoveExecutable={removeGameExecutable}
                    onOpenFolder={handleOpenGameFolder}
                    onUpdateGame={onUpdateGame}
                    showExecutableActions
                    showOpenFolder
                    favoriteLabel={{
                      active: "Remover dos favoritos",
                      inactive: "Favoritar",
                    }}
                  />

                  {game.launchType === "emulator" && (
                    <ActionButton onClick={() => setGameFile(game.id)}>
                      Selecionar ISO/ROM
                    </ActionButton>
                  )}

                  {status === "invalid" && (
                    <ActionButton onClick={() => setGameExecutable(game.id)}>
                      Reconfigurar executável
                    </ActionButton>
                  )}

                  <ActionButton
                    variant="danger"
                    onClick={() => handleRemoveFromLibrary(game)}
                  >
                    Remover da biblioteca
                  </ActionButton>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
