export type LaunchType = "pc" | "emulator";

export type Platform =
  | "windows"
  | "ps1"
  | "ps2"
  | "psp"
  | "gamecube"
  | "wii"
  | "snes"
  | "gba"
  | "arcade";

export type Game = {
  id: string;
  name: string;

  cover: string;
  bg: string;
  description: string;

  playtime: number;
  installed: boolean;
  favorite?: boolean;

  /**
   * Caminho antigo/atual usado para jogos de PC.
   * Vamos manter para não quebrar o launcher agora.
   */
  path?: string;

  /**
   * Novo modelo preparado para PC + emuladores.
   */
  launchType?: LaunchType;
  platform?: Platform;

  /**
   * Futuro: usado quando o jogo abrir por emulador.
   */
  emulatorId?: string;
  gameFilePath?: string;
  launchArgs?: string[];
};