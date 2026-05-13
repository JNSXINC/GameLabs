import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import * as path from "path";
import { spawn } from "child_process";
import * as fs from "fs";
import { registerGameScannerIpc } from "../ipc/gameScanner";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#050b18",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.ELECTRON_START_URL;

  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/ui/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ipcMain.handle("launch-game", async (_, gamePath: string, args: string[] = []) => {
    try {
      if (!gamePath) {
        return { success: false, error: "Caminho do jogo não informado." };
      }

      if (!fs.existsSync(gamePath)) {
        return { success: false, error: "Arquivo não encontrado." };
      }

      if (mainWindow) {
        mainWindow.hide();
      }

      const child = spawn(gamePath, args, {
        detached: false,
        stdio: "ignore",
        windowsHide: false,
        cwd: path.dirname(gamePath),
      });

      child.on("error", (error) => {
        console.error("Erro ao abrir jogo:", error);

        if (mainWindow) {
          mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      });

      child.on("exit", () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send("game-closed");
        }
      });

      child.unref();

      return { success: true };
    } catch (error) {
      console.error("Erro ao iniciar jogo:", error);

      if (mainWindow) {
        mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido.",
      };
    }
  });

  ipcMain.handle("open-game-folder", async (_, gamePath: string) => {
    try {
      if (!gamePath) {
        return { success: false, error: "Caminho não informado." };
      }

      if (!fs.existsSync(gamePath)) {
        return { success: false, error: "Arquivo não encontrado." };
      }

      shell.showItemInFolder(gamePath);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido."
      };
    }
  });

  ipcMain.handle("check-game-path", async (_, gamePath: string) => {
    try {
      if (!gamePath) return { exists: false };

      const exists = fs.existsSync(gamePath);
      return { exists };
    } catch {
      return { exists: false };
    }
  });

  ipcMain.handle("select-game-executable", async () => {
    const result = await dialog.showOpenDialog({
      title: "Selecione o executável do jogo",
      properties: ["openFile"],
      filters: [{ name: "Executáveis", extensions: ["exe"] }]
    });

    if (result.canceled || !result.filePaths.length) {
      return { canceled: true, path: null };
    }

    return { canceled: false, path: result.filePaths[0] };
  });

  ipcMain.handle("select-game-file", async () => {
    const result = await dialog.showOpenDialog({
      title: "Selecione o arquivo do jogo",
      properties: ["openFile"],
      filters: [
        {
          name: "Arquivos de jogo",
          extensions: ["iso", "bin", "cue", "chd", "rom", "gba", "sfc", "smc", "nes"],
        },
        {
          name: "Todos os arquivos",
          extensions: ["*"],
        },
      ],
    });

    if (result.canceled || !result.filePaths.length) {
      return { canceled: true, path: null };
    }

    return { canceled: false, path: result.filePaths[0] };
  });

  ipcMain.handle("select-bios-file", async () => {
    const result = await dialog.showOpenDialog({
      title: "Selecione o arquivo BIOS",
      properties: ["openFile"],
      filters: [
        {
          name: "Arquivos BIOS",
          extensions: ["bin", "rom", "bios", "dat", "img"],
        },
        {
          name: "Todos os arquivos",
          extensions: ["*"],
        },
      ],
    });

    if (result.canceled || !result.filePaths.length) {
      return { canceled: true, path: null };
    }

    return { canceled: false, path: result.filePaths[0] };
  });

  registerGameScannerIpc();

  createWindow();

  console.log("MAIN __dirname:", __dirname);
  console.log("PRELOAD PATH REAL:", path.join(__dirname, "preload.js"));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});