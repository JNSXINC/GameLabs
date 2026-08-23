import type { Platform, ControllerProfileId } from "./platform";

export type LaunchType = "pc" | "emulator";

export type Game = {
  id: string;
  name: string;

  cover: string;
  bg: string;
  description: string;

  playtime: number;
  lastPlayed?: number;
  installed: boolean;
  favorite?: boolean;

  path?: string;
  executablePath?: string;

  launchType?: LaunchType;
  platform?: Platform;

  emulatorId?: string;
  gameFilePath?: string;
  launchArgs?: string[];

  controllerProfileId?: ControllerProfileId;
};