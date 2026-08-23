import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import * as path from "path";
import * as fs from "node:fs";
import * as os from "node:os";
import { execFile } from "node:child_process";

import { registerGameScannerIpc } from "../ipc/gameScanner";
import { registerMetadataIpc } from "../ipc/metadata";
import { registerLibraryIpc } from "../ipc/library";
import { registerControllersIpc } from "../ipc/controllers";
import { registerSettingsIpc } from "../ipc/settings";
import { launchGame } from "../services/launcher/launchGame";
import { registerDownloadsIpc } from "../ipc/downloads";
import { registerBiosIpc } from "../ipc/bios";

import {
  launchDS4,
  startDS4Watchdog,
  stopDS4Watchdog,
  killDS4,
} from "../services/controls/ds4";

let mainWindow: BrowserWindow | null = null;

function getControllerSettings() {
  try {
    const controllersPath = path.join(
      process.cwd(),
      "data",
      "preferences",
      "controllers.json"
    );

    if (!fs.existsSync(controllersPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(controllersPath, "utf8"));
  } catch {
    return null;
  }
}

function setupDS4Integration() {
  const settings = getControllerSettings();

  if (!settings || !settings.ds4Path) {
    return;
  }

  if (settings.autoStartDS4) {
    launchDS4(settings.ds4Path);
    console.log("DS4Windows iniciado.");
  }

  if (settings.watchdogDS4) {
    startDS4Watchdog(settings.ds4Path);
    console.log("DS4 Watchdog iniciado.");
  }
}

function cleanupDS4Integration() {
  stopDS4Watchdog();

  const settings = getControllerSettings();

  if (settings?.closeWithGameLabs) {
    killDS4();
    console.log("DS4Windows encerrado junto com GameLabs.");
  }
}

function getGpuName(): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      "wmic",
      ["path", "win32_VideoController", "get", "name"],
      { windowsHide: true },
      (error, stdout) => {
        if (error) {
          resolve("GPU não detectada");
          return;
        }

        const lines = stdout
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .filter((line) => line.toLowerCase() !== "name");

        const dedicatedGpu =
          lines.find((gpu) => /rtx|gtx|radeon|rx|nvidia|amd/i.test(gpu)) ||
          lines[0];

        resolve(dedicatedGpu || "GPU não detectada");
      }
    );
  });
}

function recommendPerformancePreset(ramGb: number, gpuName: string) {
  const gpu = gpuName.toLowerCase();

  if (
    ramGb >= 24 &&
    (gpu.includes("rtx 4070") ||
      gpu.includes("rtx 4080") ||
      gpu.includes("rtx 4090") ||
      gpu.includes("rtx 5070") ||
      gpu.includes("rtx 5080") ||
      gpu.includes("rtx 5090") ||
      gpu.includes("rx 7800") ||
      gpu.includes("rx 7900"))
  ) {
    return "ultra";
  }

  if (
    ramGb >= 16 &&
    (gpu.includes("gtx 1650") ||
      gpu.includes("gtx 1660") ||
      gpu.includes("rtx 2060") ||
      gpu.includes("rtx 3050") ||
      gpu.includes("rtx 3060") ||
      gpu.includes("rtx 4060") ||
      gpu.includes("rx 6600") ||
      gpu.includes("rx 7600"))
  ) {
    return "alto";
  }

  if (ramGb >= 8) {
    return "equilibrado";
  }

  return "baixo";
}

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
      nodeIntegration: false,
    },
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
  setupDS4Integration();

  ipcMain.handle("system:get-info", async () => {
    const cpu = os.cpus()[0]?.model || "CPU não detectada";
    const ramGb = Math.round(os.totalmem() / 1024 / 1024 / 1024);
    const gpu = await getGpuName();

    const recommendedPreset = recommendPerformancePreset(ramGb, gpu);

    return {
      cpu,
      gpu,
      ramGb,
      recommendedPreset,
    };
  });

  ipcMain.handle("launch-game", async (_, game) => {
    try {
      const child = await launchGame(game);

      if (child) {
        child.on("exit", () => {
          console.log("Jogo fechado.");

          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send("game-closed");
          }
        });
      }

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
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
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
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
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
      filters: [{ name: "Executáveis", extensions: ["exe"] }],
    });

    if (result.canceled || !result.filePaths.length) {
      return { canceled: true, path: null };
    }

    return {
      canceled: false,
      path: result.filePaths[0],
    };
  });

  ipcMain.handle("select-game-file", async () => {
    const result = await dialog.showOpenDialog({
      title: "Selecione o arquivo do jogo",
      properties: ["openFile"],
      filters: [
        {
          name: "Arquivos de jogo",
          extensions: [
            "iso",
            "bin",
            "cue",
            "chd",
            "cso",
            "pbp",
            "gcm",
            "wbfs",
            "rvz",
            "rom",
            "gba",
            "sfc",
            "smc",
            "nes",
          ],
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

    return {
      canceled: false,
      path: result.filePaths[0],
    };
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

    return {
      canceled: false,
      path: result.filePaths[0],
    };
  });

  registerGameScannerIpc();
  registerMetadataIpc();
  registerLibraryIpc();
  registerControllersIpc();
  registerSettingsIpc();
  registerDownloadsIpc();
  registerBiosIpc();

  createWindow();

  console.log("MAIN __dirname:", __dirname);
  console.log("PRELOAD PATH REAL:", path.join(__dirname, "preload.js"));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  cleanupDS4Integration();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});