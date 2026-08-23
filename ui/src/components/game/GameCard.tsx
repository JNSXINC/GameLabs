import React from "react";
import { Game } from "../../types/game";

type GameCardProps = {
  game: Game;
  isActive?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  assetUrl: (value: string) => string;
  marginLeft?: string;
  variant?: "library" | "grid";
  showFavoriteBadge?: boolean;
};

export default function GameCard({
  game,
  isActive = false,
  onClick,
  onHover,
  assetUrl,
  marginLeft = "0px",
  variant = "grid",
  showFavoriteBadge = false,
}: GameCardProps) {
  const isLibrary = variant === "library";

  const coverSrc = game.cover?.startsWith("data:image")
    ? game.cover
    : assetUrl(game.cover);

  return (
    <div
      onMouseEnter={onHover}
      onClick={onClick}
      style={{
        width: isLibrary ? (isActive ? "440px" : "160px") : "100%",
        height: isLibrary ? (isActive ? "245px" : "200px") : "270px",
        flexShrink: 0,
        cursor: "pointer",
        transition: "transform 0.22s ease, box-shadow 0.22s ease, border 0.22s ease, opacity 0.22s ease",
        position: "relative",
        borderRadius: "14px",
        overflow: "hidden",
        border: isLibrary
          ? "none"
          : isActive
            ? "2px solid rgba(140,170,255,0.95)"
            : "2px solid rgba(255,255,255,0.08)",
        boxShadow: isLibrary
          ? isActive
            ? "0 0 40px rgba(125,160,255,0.22)"
            : "none"
          : isActive
            ? "0 16px 36px rgba(80,120,255,0.18)"
            : "0 10px 24px rgba(0,0,0,0.28)",
        background: "#000",
        marginLeft: isLibrary ? marginLeft : "0px",
        transform: isLibrary
          ? isActive
            ? "scale(1.01)"
            : "scale(1)"
          : isActive
            ? "translateY(-4px) scale(1.015)"
            : "translateY(0) scale(1)",
      }}
    >
      <img
        src={coverSrc}
        alt={game.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          background: "#000",
          display: "block",
        }}
      />

      {isLibrary && isActive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.42))",
          }}
        />
      )}

      {showFavoriteBadge && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 215, 0, 0.2)",
            border: "1px solid rgba(255, 215, 0, 0.8)",
            fontSize: "16px",
            zIndex: 2,
          }}
        >
          ★
        </div>
      )}
    </div>
  );
}