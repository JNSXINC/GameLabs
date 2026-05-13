import { Platform } from "./game";

export type Emulator = {
    id: string;
    name: string;

    executablePath: string;

    platforms: Platform[];

    biosPath?: string;

    biosRequired?: boolean;
    biosConfigured?: boolean;

    defaultArgs?: string[];

    installed?: boolean;
};