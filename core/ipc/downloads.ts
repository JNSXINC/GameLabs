import { ipcMain } from "electron";
import { downloadEmulator } from "../services/download/downloadEmulator";

export function registerDownloadsIpc() {
  ipcMain.handle("downloads:emulator", async (event, emulatorId: string) => {
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
  });
}
