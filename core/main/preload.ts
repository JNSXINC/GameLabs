import { contextBridge, ipcRenderer } from "electron";

console.log("PRELOAD MAIN CARREGADO");

contextBridge.exposeInMainWorld("electronAPI", {
  launchGame: async (game: unknown) => {
    return ipcRenderer.invoke("launch-game", game);
  },

  selectGameExecutable: async () => {
    return ipcRenderer.invoke("select-game-executable");
  },

  selectGameFile: async () => {
    return ipcRenderer.invoke("select-game-file");
  },

  checkGamePath: async (path: string) => {
    return ipcRenderer.invoke("check-game-path", path);
  },

  getSystemInfo: async () => {
    return ipcRenderer.invoke("system:get-info");
  },

  openGameFolder: async (gamePath: string) => {
    return ipcRenderer.invoke("open-game-folder", gamePath);
  },

  scanGamesFromFolder: async () => {
    return ipcRenderer.invoke("games:scan-folder");
  },

  searchSteamGridGame: async (gameName: string) => {
    return ipcRenderer.invoke(
      "metadata:search-steamgriddb",
      gameName
    );
  },

  loadLibrary: async () => {
    return ipcRenderer.invoke("library:load");
  },

  saveLibrary: async (games: unknown[]) => {
    return ipcRenderer.invoke("library:save", games);
  },

  addGameToLibrary: async (game: unknown) => {
    return ipcRenderer.invoke("library:add", game);
  },

  updateGameInLibrary: async (gameId: string, patch: unknown) => {
    return ipcRenderer.invoke("library:update", gameId, patch);
  },

  removeGameFromLibrary: async (gameId: string) => {
    return ipcRenderer.invoke("library:remove", gameId);
  },

  selectBiosFile: async () => {
    return ipcRenderer.invoke("select-bios-file");
  },

  listBios: async () => {
    return ipcRenderer.invoke("bios:list");
  },

  selectBios: async (platform: string, region?: string) => {
    return ipcRenderer.invoke("bios:select", platform, region);
  },

  openBiosFolder: async (biosPath?: string) => {
    return ipcRenderer.invoke("bios:open-folder", biosPath);
  },

  downloadEmulator: async (emulatorId: string) => {
    return ipcRenderer.invoke(
      "downloads:emulator",
      emulatorId
    );
  },

  loadSettings: async () => {
    return ipcRenderer.invoke("settings:load");
  },

  saveSettings: async (settings: unknown) => {
    return ipcRenderer.invoke("settings:save", settings);
  },

  loadControllerSettings: async () => {
    return ipcRenderer.invoke("controllers:load");
  },

  saveControllerSettings: async (settings: unknown) => {
    return ipcRenderer.invoke("controllers:save", settings);
  },

  selectDS4Executable: async () => {
    return ipcRenderer.invoke("controllers:select-ds4");
  },

  onGameClosed: (callback: () => void) => {
    const listener = () => callback();

    ipcRenderer.on("game-closed", listener);

    return () => {
      ipcRenderer.removeListener("game-closed", listener);
    };
  },
});