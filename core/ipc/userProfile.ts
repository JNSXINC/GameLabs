import { ipcMain } from "electron";
import {
  readUserProfile,
  saveUserProfile,
  selectAndSaveUserAvatar,
  readUserAvatar,
} from "../services/user/userProfile";

export function registerUserProfileIpc(): void {
  ipcMain.handle("user-profile:load", async () => {
    return readUserProfile();
  });

  ipcMain.handle("user-profile:save", async (_event, changes: unknown) => {
    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes) ||
      typeof (changes as Record<string, unknown>).displayName !== "string"
    ) {
      throw new Error("Dados de perfil inválidos.");
    }

    return saveUserProfile({
      displayName: (changes as { displayName: string }).displayName,
    });
  });

  ipcMain.handle("user-profile:select-avatar", async () => {
    return selectAndSaveUserAvatar();
  });

  ipcMain.handle("user-profile:read-avatar", async () => {
    return readUserAvatar();
  });
}
