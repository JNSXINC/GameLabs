import fs from "fs";
import path from "path";

import { registerSecureHandler } from "./secureIpc";

import { downloadEmulator } from "../services/download/downloadEmulator";
import { emulatorDownloads } from "../services/download/emulatorDownloads";
import { findExecutable } from "../services/download/downloadPackage";
import { getEmulatorsInstallPath } from "../services/storage/appPaths";

export function registerDownloadsIpc() {
  registerSecureHandler(
    "downloads:emulator",
    async (event, emulatorId: string) => {
      return downloadEmulator(
        emulatorId,

        (progress) => {
          event.sender.send("downloads:progress", {
            emulatorId,
            progress,
          });
        },

        (status) => {
          event.sender.send("downloads:status", {
            emulatorId,
            status,
          });
        },
      );
    },
  );

  registerSecureHandler("emulators:detect-installed", async () => {
    const installRoot = getEmulatorsInstallPath();

    return emulatorDownloads.map((emulator) => {
      const folderName = emulator.installFolder.slice("Emulators/".length);
      const installDir = path.join(installRoot, folderName);

      if (!fs.existsSync(installDir)) {
        return {
          id: emulator.id,
          executablePath: "",
        };
      }

      try {
        return {
          id: emulator.id,
          executablePath:
            findExecutable(installDir, emulator.executableCandidates) ?? "",
        };
      } catch {
        return {
          id: emulator.id,
          executablePath: "",
        };
      }
    });
  });
}
