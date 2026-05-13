import React from "react";
import { Game } from "../../types/game";
import ActionButton from "../ActionButton";

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

      {showExecutableActions && onSetExecutable && (
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
    </>
  );
}