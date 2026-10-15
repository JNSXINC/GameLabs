import * as fs from "node:fs";
import * as path from "node:path";
import { getUserDataPath } from "../storage/appPaths";
import { dialog } from "electron";

export type UserProfile = {
  schemaVersion: 1;
  displayName: string;
  avatarFile: string | null;
  createdAt: string;
  updatedAt: string;
};

const PROFILE_VERSION = 1;
const MAX_NAME_LENGTH = 40;

export function getUserProfilePath(): string {
  return path.join(getUserDataPath(), "profile.json");
}

function createDefaultProfile(): UserProfile {
  const now = new Date().toISOString();

  return {
    schemaVersion: PROFILE_VERSION,
    displayName: "Jogador",
    avatarFile: null,
    createdAt: now,
    updatedAt: now,
  };
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function normalizeProfile(value: unknown): UserProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Formato de perfil inválido.");
  }

  const data = value as Record<string, unknown>;

  if (
    data.schemaVersion !== undefined &&
    data.schemaVersion !== PROFILE_VERSION
  ) {
    throw new Error("Versão de perfil não suportada.");
  }

  const name =
    typeof data.displayName === "string" ? data.displayName.trim() : "Jogador";

  if (!name || name.length > MAX_NAME_LENGTH) {
    throw new Error("Nome do jogador inválido.");
  }

  const now = new Date().toISOString();

  return {
    schemaVersion: PROFILE_VERSION,
    displayName: name,
    avatarFile: typeof data.avatarFile === "string" ? data.avatarFile : null,
    createdAt: isValidDate(data.createdAt) ? data.createdAt : now,
    updatedAt: isValidDate(data.updatedAt) ? data.updatedAt : now,
  };
}

export function readUserProfile(): UserProfile {
  const profilePath = getUserProfilePath();

  if (!fs.existsSync(profilePath)) {
    const profile = createDefaultProfile();
    writeUserProfile(profile);
    return profile;
  }

  const content = fs.readFileSync(profilePath, "utf8");
  return normalizeProfile(JSON.parse(content));
}

function writeUserProfile(profile: UserProfile): void {
  const profilePath = getUserProfilePath();
  const directory = path.dirname(profilePath);

  fs.mkdirSync(directory, { recursive: true });

  const temporaryPath = path.join(
    directory,
    `profile.${process.pid}.${Date.now()}.tmp`,
  );

  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(profile, null, 2), {
      encoding: "utf8",
      flag: "wx",
    });

    fs.renameSync(temporaryPath, profilePath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }
}

export function saveUserProfile(
  changes: Pick<UserProfile, "displayName">,
): UserProfile {
  const current = readUserProfile();

  const updated = normalizeProfile({
    ...current,
    displayName: changes.displayName,
    updatedAt: new Date().toISOString(),
  });

  writeUserProfile(updated);

  return updated;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function detectAvatarExtension(buffer: Buffer): string | null {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return ".png";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return ".jpg";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return ".webp";
  }

  return null;
}

export async function selectAndSaveUserAvatar(): Promise<UserProfile | null> {
  const result = await dialog.showOpenDialog({
    title: "Selecionar avatar do GameLabs",
    properties: ["openFile"],
    filters: [
      {
        name: "Imagens",
        extensions: ["png", "jpg", "jpeg", "webp"],
      },
    ],
  });

  if (result.canceled || !result.filePaths[0]) {
    return null;
  }

  const sourcePath = result.filePaths[0];
  const stats = fs.statSync(sourcePath);

  if (!stats.isFile() || stats.size > MAX_AVATAR_SIZE || stats.size === 0) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const buffer = fs.readFileSync(sourcePath);

  const extension = detectAvatarExtension(buffer);

  if (!extension) {
    throw new Error("Formato de imagem inválido.");
  }

  const current = readUserProfile();
  const avatarDirectory = path.join(getUserDataPath(), "avatars");

  fs.mkdirSync(avatarDirectory, { recursive: true });

  const avatarName = `avatar-${Date.now()}-${process.pid}${extension}`;
  const avatarPath = path.join(avatarDirectory, avatarName);

  fs.writeFileSync(avatarPath, buffer, { flag: "wx" });

  try {
    const updated = normalizeProfile({
      ...current,
      avatarFile: avatarName,
      updatedAt: new Date().toISOString(),
    });

    writeUserProfile(updated);

    return updated;
  } catch (error) {
    fs.unlinkSync(avatarPath);
    throw error;
  }
}

export function readUserAvatar(): string | null {
  const profile = readUserProfile();

  if (!profile.avatarFile) {
    return null;
  }

  const avatarName = profile.avatarFile;

  if (!/^avatar-\d+-\d+\.(png|jpg|webp)$/.test(avatarName)) {
    throw new Error("Nome de avatar inválido.");
  }

  const avatarPath = path.join(getUserDataPath(), "avatars", avatarName);

  if (!fs.existsSync(avatarPath)) {
    return null;
  }

  const stats = fs.statSync(avatarPath);

  if (!stats.isFile() || stats.size === 0 || stats.size > MAX_AVATAR_SIZE) {
    throw new Error("Arquivo de avatar inválido.");
  }

  const buffer = fs.readFileSync(avatarPath);
  const extension = detectAvatarExtension(buffer);

  if (!extension || extension !== path.extname(avatarName)) {
    throw new Error("Formato de avatar inválido.");
  }

  const mimeType =
    extension === ".png"
      ? "image/png"
      : extension === ".jpg"
        ? "image/jpeg"
        : "image/webp";

  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
