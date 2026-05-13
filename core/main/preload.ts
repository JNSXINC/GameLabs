import { contextBridge, ipcRenderer } from "electron";

console.log("PRELOAD MAIN CARREGADO");

contextBridge.exposeInMainWorld("electronAPI", {
  launchGame: async (gamePath: string, args: string[] = []) => {
    return ipcRenderer.invoke("launch-game", gamePath, args);
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

  openGameFolder: async (gamePath: string) => {
    return ipcRenderer.invoke("open-game-folder", gamePath);
  },

  scanGamesFromFolder: async () => {
    return ipcRenderer.invoke("games:scan-folder");
  },

  selectBiosFile: async () => {
    return ipcRenderer.invoke("select-bios-file");
  },

  onGameClosed: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("game-closed", listener);

    return () => {
      ipcRenderer.removeListener("game-closed", listener);
    };
  },
});