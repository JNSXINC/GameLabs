import { registerSecureHandler } from "./secureIpc";

import {
  readUserProfile,
  saveUserProfile,
  selectAndSaveUserAvatar,
  readUserAvatar,
} from "../services/user/userProfile";

export function registerUserProfileIpc(): void {
  registerSecureHandler("user-profile:load", async () => {
    return readUserProfile();
  });

  registerSecureHandler(
    "user-profile:save",
    async (_event, changes: unknown) => {
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
    },
  );

  registerSecureHandler("user-profile:select-avatar", async () => {
    return selectAndSaveUserAvatar();
  });

  registerSecureHandler("user-profile:read-avatar", async () => {
    return readUserAvatar();
  });
}
