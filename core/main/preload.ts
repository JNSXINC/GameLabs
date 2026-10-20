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

  getDeviceFingerprint: async (): Promise<string> => {
    return ipcRenderer.invoke("licensing:get-device-fingerprint");
  },

  getTrialStatus: () => ipcRenderer.invoke("licensing:get-trial-status"),

  startTrial: () => ipcRenderer.invoke("licensing:start-trial"),

  getLicenseStatus: () => ipcRenderer.invoke("licensing:get-status"),

  activateLicense: (license: unknown) =>
    ipcRenderer.invoke("licensing:activate", license),

  openGameFolder: async (gamePath: string) => {
    return ipcRenderer.invoke("open-game-folder", gamePath);
  },

  scanGamesFromFolder: async () => {
    return ipcRenderer.invoke("games:scan-folder");
  },

  searchSteamGridGame: async (gameName: string) => {
    return ipcRenderer.invoke("metadata:search-steamgriddb", gameName);
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
    return ipcRenderer.invoke("downloads:emulator", emulatorId);
  },

  migrateEmulators: async (sourcePath: string) => {
    return ipcRenderer.invoke("emulators:migrate", sourcePath);
  },

  onDownloadProgress: (
    callback: (data: { emulatorId: string; progress: number }) => void,
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: {
        emulatorId: string;
        progress: number;
      },
    ) => {
      callback(data);
    };

    ipcRenderer.on("downloads:progress", listener);

    return () => {
      ipcRenderer.removeListener("downloads:progress", listener);
    };
  },

  onDownloadStatus: (
    callback: (data: {
      emulatorId: string;
      status: "downloading" | "extracting" | "installed";
    }) => void,
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: {
        emulatorId: string;
        status: "downloading" | "extracting" | "installed";
      },
    ) => {
      callback(data);
    };

    ipcRenderer.on("downloads:status", listener);

    return () => {
      ipcRenderer.removeListener("downloads:status", listener);
    };
  },

  loadSettings: async () => {
    return ipcRenderer.invoke("settings:load");
  },

  saveSettings: async (settings: unknown) => {
    return ipcRenderer.invoke("settings:save", settings);
  },

  loadUserProfile: async () => {
    return ipcRenderer.invoke("user-profile:load");
  },

  saveUserProfile: async (changes: { displayName: string }) => {
    return ipcRenderer.invoke("user-profile:save", changes);
  },

  selectUserAvatar: async () => {
    return ipcRenderer.invoke("user-profile:select-avatar");
  },

  readUserAvatar: async (): Promise<string | null> => {
    return ipcRenderer.invoke("user-profile:read-avatar");
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

  checkDS4Dependencies: async () => {
    return ipcRenderer.invoke("controllers:check-ds4-dependencies");
  },

  ensureDS4Dependencies: async () => {
    return ipcRenderer.invoke("controllers:ensure-ds4-dependencies");
  },

  setupDS4Windows: async () => {
    return ipcRenderer.invoke("controllers:setup-ds4");
  },

  onDS4DownloadProgress: (callback: (progress: number) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: number) => {
      callback(progress);
    };

    ipcRenderer.on("controllers:ds4-download-progress", listener);

    return () => {
      ipcRenderer.removeListener("controllers:ds4-download-progress", listener);
    };
  },

  onGameClosed: (callback: () => void) => {
    const listener = () => callback();

    ipcRenderer.on("game-closed", listener);

    return () => {
      ipcRenderer.removeListener("game-closed", listener);
    };
  },
});
