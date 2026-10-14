import { app } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";

export function getGameLabsDataPath(): string {
  return path.join(app.getPath("userData"), "data");
}

export function getPreferencesPath(): string {
  return path.join(getGameLabsDataPath(), "preferences");
}

export function getPreferenceFilePath(filename: string): string {
  return path.join(getPreferencesPath(), filename);
}

export function getLibraryDataPath(): string {
  return path.join(getGameLabsDataPath(), "metadata");
}

export function getUserDataPath(): string {
  return path.join(getGameLabsDataPath(), "user");
}

export function getGameLabsInstallPath(): string {
  return path.join(app.getPath("appData"), "..", "Local", "GameLabs");
}

export function getEmulatorsInstallPath(): string {
  return path.join(getGameLabsInstallPath(), "Emulators");
}

export function getDownloadsTempPath(): string {
  return path.join(getGameLabsInstallPath(), "temp", "downloads");
}

export function ensureGameLabsDirectories(): void {
  const directories = [
    getGameLabsDataPath(),
    getPreferencesPath(),
    getLibraryDataPath(),
    getEmulatorsInstallPath(),
    getDownloadsTempPath(),
  ];

  for (const directory of directories) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

export function migrateLegacyGameLabsData(): void {
  const legacyDataPath = path.join(process.cwd(), "data");

  const newDataPath = getGameLabsDataPath();

  if (path.resolve(legacyDataPath) === path.resolve(newDataPath)) {
    return;
  }

  if (!fs.existsSync(legacyDataPath)) {
    return;
  }

  function copyMissingFiles(source: string, destination: string): void {
    fs.mkdirSync(destination, { recursive: true });

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
      const sourcePath = path.join(source, entry.name);
      const destinationPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        copyMissingFiles(sourcePath, destinationPath);
      } else if (entry.isFile() && !fs.existsSync(destinationPath)) {
        fs.copyFileSync(
          sourcePath,
          destinationPath,
          fs.constants.COPYFILE_EXCL,
        );
      }
    }
  }

  copyMissingFiles(legacyDataPath, newDataPath);

  console.log("[GameLabs] Migração de dados verificada.");
}
