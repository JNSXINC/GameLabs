import React from "react";
import { Game } from "../../types/game";
import ActionButton from "../ActionButton";

import {
  controllerProfiles,
  ControllerProfileId,
} from "../../types/controller";

type Props = {
  game: Game;
  status: "none" | "valid" | "invalid";
  onLaunch: (game: Game) => void | Promise<void>;
  onToggleFavorite: (id: string) => void;
  onSetExecutable?: (id: string) => void | Promise<void>;
  onRemoveExecutable?: (id: string) => void;
  onOpenFolder?: (game: Game) => void | Promise<void>;
  showFavoriteToggle?: boolean;
  showExecutableActions?: boolean;
  showOpenFolder?: boolean;
  favoriteLabel?: {
    active: string;
    inactive: string;
  };
  onUpdateGame?: (gameId: string, patch: Partial<Game>) => void | Promise<void>;
};

export default function GameActions({
  game,
  status,
  onLaunch,
  onToggleFavorite,
  onSetExecutable,
  onRemoveExecutable,
  onOpenFolder,
  showFavoriteToggle = true,
  showExecutableActions = false,
  showOpenFolder = false,
  favoriteLabel = {
    active: "Remover dos favoritos",
    inactive: "Favoritar",
  },
  onUpdateGame,
}: Props) {
  const canLaunch = status === "valid";

  return (
    <>
      <ActionButton
        onClick={() => canLaunch && onLaunch(game)}
        disabled={!canLaunch}
        style={{
          opacity: canLaunch ? 1 : 0.5,
          cursor: canLaunch ? "pointer" : "not-allowed",
        }}
      >
        Iniciar
      </ActionButton>

      {showFavoriteToggle && (
        <ActionButton onClick={() => onToggleFavorite(game.id)}>
          {game.favorite ? favoriteLabel.active : favoriteLabel.inactive}
        </ActionButton>
      )}

      {showExecutableActions &&
        onSetExecutable &&
        game.launchType === "pc" && (
          <ActionButton onClick={() => onSetExecutable(game.id)}>
            Definir executável
          </ActionButton>
        )}

      {showExecutableActions && onRemoveExecutable && game.path && (
        <ActionButton onClick={() => onRemoveExecutable(game.id)}>
          Remover executável
        </ActionButton>
      )}

      {showOpenFolder && onOpenFolder && game.path && (
        <ActionButton onClick={() => onOpenFolder(game)}>
          Abrir pasta
        </ActionButton>
      )}
      {onUpdateGame && (
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <label
            style={{
              fontSize: "12px",
              opacity: 0.7,
            }}
          >
            Perfil do Controle
          </label>

          <select
            value={game.controllerProfileId ?? "default"}
            onChange={(e) =>
              onUpdateGame(game.id, {
                controllerProfileId: e.target.value as ControllerProfileId,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "#111827",
              color: "white",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {controllerProfiles.map((profile) => (
              <option
                key={profile.id}
                value={profile.id}
              >
                {profile.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}