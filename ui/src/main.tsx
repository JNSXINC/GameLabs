import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { games as baseGames } from "./data/games";

import AppLayout from "./layout/AppLayout";
import BrowseView from "./views/browse/BrowseView";
import FavoritesView from "./views/favorites/FavoritesView";
import LibraryView from "./views/library/LibraryView";
import SettingsView from "./views/settings/SettingsView";
import UserView from "./views/user/UserView";

import { useFavorites } from "./hooks/useFavorites";
import { useGameValidation } from "./hooks/useGameValidation";
import { useGameLauncher } from "./hooks/useGameLauncher";
import { useGamePersistence } from "./hooks/useGamePersistence";
import { useGameExecutable } from "./hooks/useGameExecutable";
import { useEmulators } from "./hooks/useEmulators";
import { useGameFiles } from "./hooks/useGameFiles";
import { useGameImport } from "./hooks/useGameImport";

import { Screen } from "./types/screen";

import { Game } from "./types/game";
import { ScannedGame } from "./types/scanner";

const SCREEN_KEY = "gamelabs_screen";
const SEARCH_KEY = "gamelabs_search";

const assetUrl = (value: string) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${import.meta.env.BASE_URL}${value.replace(/^\/+/, "")}`;
};

function App() {
  const {
    games,
    setGames,
    favorites,
    toggleFavorite,
  } = useFavorites(
    (baseGames as Game[]).map((game) => ({
      ...game,
      path: game.path || "",
    }))
  );

  const { importGameFile } = useGameImport({ setGames });

  const {
    emulators,
    setEmulators,
    setEmulatorExecutable,
  } = useEmulators();

  const { gameStatus } = useGameValidation(games);

  useGamePersistence(games, setGames);

  const {
    handleOpenGameFolder,
    removeGameExecutable,
    handleRemoveGameFromSystem,
    setGameExecutable,
  } = useGameExecutable({ setGames });

  const { setGameFile } = useGameFiles({ setGames });


  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const saved = localStorage.getItem(SCREEN_KEY) as Screen | null;

      if (
        saved === "library" ||
        saved === "favorites" ||
        saved === "browse" ||
        saved === "settings" ||
        saved === "user"
      ) {
        return saved;
      }

      return "library";
    } catch {
      return "library";
    }
  });

  const [selected, setSelected] = useState(0);

  const [search, setSearch] = useState(() => {
    try {
      return localStorage.getItem(SEARCH_KEY) || "";
    } catch {
      return "";
    }
  });

  const [favoritesMenuId, setFavoritesMenuId] = useState<string | null>(null);
  const [browseMenuId, setBrowseMenuId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredBrowseGames = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return games;
    return games.filter((g) => g.name.toLowerCase().includes(term));
  }, [games, search]);

  const filteredLibraryGames = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return games;
    return games.filter((g) => g.name.toLowerCase().includes(term));
  }, [games, search]);

  const totalLibraryGames = filteredLibraryGames.length;

  const realIndex =
    totalLibraryGames > 0
      ? ((selected % totalLibraryGames) + totalLibraryGames) % totalLibraryGames
      : 0;

  const currentLibraryGame =
    filteredLibraryGames.length > 0 ? filteredLibraryGames[realIndex] : null;

  const infiniteLibraryGames =
    totalLibraryGames > 0
      ? [...filteredLibraryGames, ...filteredLibraryGames, ...filteredLibraryGames]
      : [];

  const infiniteCenterOffset = totalLibraryGames;

  useEffect(() => {
    try {
      localStorage.setItem(SCREEN_KEY, screen);
    } catch { }
  }, [screen]);

  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_KEY, search);
    } catch { }
  }, [search]);

  useEffect(() => {
    setSelected(0);
  }, [search, screen]);

  useEffect(() => {
    if (!totalLibraryGames) return;

    if (Math.abs(selected) > totalLibraryGames * 50) {
      setSelected(realIndex);
    }
  }, [selected, totalLibraryGames, realIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (screen !== "library") return;
      if (!totalLibraryGames) return;

      if (e.key === "ArrowRight") setSelected((prev) => prev + 1);
      if (e.key === "ArrowLeft") setSelected((prev) => prev - 1);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [screen, totalLibraryGames]);

  useEffect(() => {
    if (screen !== "library") return;

    const container = listRef.current;
    if (!container || !totalLibraryGames) return;

    const targetIndex = realIndex + infiniteCenterOffset;
    const selectedItem = container.children[targetIndex] as HTMLElement | undefined;

    if (!selectedItem) return;

    selectedItem.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [realIndex, screen, totalLibraryGames, infiniteCenterOffset]);

  useEffect(() => {
    setFavoritesMenuId(null);
    setBrowseMenuId(null);
  }, [screen]);

  const handleAddScannedGame = (scannedGame: ScannedGame) => {
    setGames((prev) => {
      const alreadyExists = prev.some(
        (game) => game.path === scannedGame.executablePath
      );

      if (alreadyExists) {
        alert("Jogo já está na biblioteca.");
        return prev;
      }

      const newGame: Game = {
        id: scannedGame.id,
        name: scannedGame.name,
        cover: "default.jpg",
        bg: "default-bg.jpg",
        description: "Jogo importado pelo scanner.",
        playtime: 0,
        installed: true,
        favorite: false,
        path: scannedGame.executablePath,

        launchType: "pc",
        platform: "windows",
      };

      return [...prev, newGame];
    });
  };

  const clearGames = () => {
    setGames((prev) => prev.filter((game) => !game.path));
  };

  const { handleLaunchGame } = useGameLauncher({
    gameStatus,
    filteredLibraryGames,
    emulators,
    setScreen,
    setSelected,
  });

  if (screen === "favorites") {
    return (
      <AppLayout
        screen={screen}
        setScreen={setScreen}
        search={search}
        setSearch={setSearch}
      >
        <FavoritesView
          favorites={favorites}
          gameStatus={gameStatus}
          toggleFavorite={toggleFavorite}
          handleLaunchGame={handleLaunchGame}
          favoritesMenuId={favoritesMenuId}
          setFavoritesMenuId={setFavoritesMenuId}
          assetUrl={assetUrl}
        />
      </AppLayout>
    );
  }

  if (screen === "browse") {
    return (
      <AppLayout
        screen={screen}
        setScreen={setScreen}
        search={search}
        setSearch={setSearch}
      >
        <BrowseView
          games={filteredBrowseGames}
          gameStatus={gameStatus}
          toggleFavorite={toggleFavorite}
          handleLaunchGame={(game) => handleLaunchGame(game)}
          setGameExecutable={setGameExecutable}
          setGameFile={setGameFile}
          removeGameExecutable={removeGameExecutable}
          handleOpenGameFolder={(game) => handleOpenGameFolder(game)}
          browseMenuId={browseMenuId}
          setBrowseMenuId={(id) => setBrowseMenuId(id)}
          assetUrl={assetUrl}
          onAddScannedGame={handleAddScannedGame}
          onClearGames={clearGames}
          onRemoveGameFromSystem={handleRemoveGameFromSystem}
          onImportGameFile={importGameFile}
        />
      </AppLayout>
    );
  }

  if (screen === "settings") {
    return (
      <AppLayout
        screen={screen}
        setScreen={setScreen}
        search={search}
        setSearch={setSearch}
      >
        <SettingsView
          emulators={emulators}
          setEmulators={setEmulators}
          setEmulatorExecutable={setEmulatorExecutable}
        />
      </AppLayout>
    );
  }

  if (screen === "user") {
    return (
      <AppLayout
        screen={screen}
        setScreen={setScreen}
        search={search}
        setSearch={setSearch}
      >
        <UserView favorites={favorites} games={games} />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      screen={screen}
      setScreen={setScreen}
      search={search}
      setSearch={setSearch}
    >
      <LibraryView
        currentLibraryGame={currentLibraryGame}
        infiniteLibraryGames={infiniteLibraryGames}
        realIndex={realIndex}
        infiniteCenterOffset={infiniteCenterOffset}
        totalLibraryGames={totalLibraryGames}
        listRef={listRef}
        setSelected={setSelected}
        assetUrl={assetUrl}
        toggleFavorite={toggleFavorite}
        handleLaunchGame={handleLaunchGame}
      />
    </AppLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);