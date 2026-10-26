import fs from "fs";
import path from "path";
import { getLibraryDataPath } from "../storage/appPaths";

function getLibraryFilePath(): string {
  return path.join(getLibraryDataPath(), "games.json");
}

function ensureLibraryFile(): string {
  const dataDir = getLibraryDataPath();
  const libraryFile = getLibraryFilePath();

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(libraryFile)) {
    fs.writeFileSync(libraryFile, "[]", "utf-8");
  }

  return libraryFile;
}

function getControllerProfileId(game: any) {
  if (game.platform === "windows") return "pc";

  if (
    game.platform === "ps1" ||
    game.platform === "ps2" ||
    game.platform === "psp" ||
    game.platform === "gamecube" ||
    game.platform === "wii" ||
    game.platform === "snes" ||
    game.platform === "gba" ||
    game.platform === "nes"
  ) {
    return game.platform;
  }

  return "default";
}

function normalizeGame(game: any) {
  return {
    ...game,
    controllerProfileId: getControllerProfileId(game),
  };
}

function normalizeGames(games: any[]) {
  return games.map(normalizeGame);
}

export function loadLibrary() {
  const libraryFile = ensureLibraryFile();

  const raw = fs.readFileSync(libraryFile, "utf-8");

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = normalizeGames(parsed);

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      saveLibrary(normalized);
    }

    return normalized;
  } catch {
    return [];
  }
}

export function saveLibrary(games: unknown[]) {
  const libraryFile = ensureLibraryFile();

  const normalized = Array.isArray(games) ? normalizeGames(games as any[]) : [];

  fs.writeFileSync(libraryFile, JSON.stringify(normalized, null, 2), "utf-8");

  return { success: true };
}

export function addGameToLibrary(game: any) {
  const games = loadLibrary();

  const now = Date.now();

  const newGame = normalizeGame({
    ...game,
    createdAt: game.createdAt ?? now,
    updatedAt: now,
  });

  const exists = games.some((item: any) => item.id === newGame.id);

  const updatedGames = exists
    ? games.map((item: any) =>
        item.id === newGame.id
          ? normalizeGame({ ...item, ...newGame, updatedAt: now })
          : item,
      )
    : [...games, newGame];

  saveLibrary(updatedGames);

  return newGame;
}

export function updateGameInLibrary(gameId: string, patch: any) {
  const games = loadLibrary();

  const updatedGames = games.map((game: any) =>
    game.id === gameId
      ? normalizeGame({
          ...game,
          ...patch,
          updatedAt: Date.now(),
        })
      : game,
  );

  saveLibrary(updatedGames);

  return { success: true };
}

export function removeGameFromLibrary(gameId: string) {
  const games = loadLibrary();

  const updatedGames = games.filter((game: any) => game.id !== gameId);

  saveLibrary(updatedGames);

  return { success: true };
}
