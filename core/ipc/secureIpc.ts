import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { getLicenseAccessStatus } from "../services/licensing/getLicenseAccessStatus";
import { checkTrialAccess } from "../services/licensing/checkTrialAccess";

type InvokeHandler = (
  event: IpcMainInvokeEvent,
  ...args: any[]
) => unknown | Promise<unknown>;

const PUBLIC_CHANNELS = new Set([
  "licensing:get-device-fingerprint",
  "licensing:get-trial-status",
  "licensing:start-trial",
  "licensing:get-status",
  "licensing:activate",
]);

const CACHE_DURATION_MS = 30_000;

let authorizedUntil = 0;
let pendingVerification: Promise<number> | null = null;
let cacheGeneration = 0;

async function verifyAccess(): Promise<number> {
  const license = await getLicenseAccessStatus();

  if (license.valid) {
    return Date.now() + CACHE_DURATION_MS;
  }

  if (!license.valid && license.reason === "LICENSE_REVOKED") {
    return 0;
  }

  const trial = await checkTrialAccess();

  if (
    "error" in trial ||
    trial.status !== "ACTIVE" ||
    trial.remainingSeconds <= 0
  ) {
    return 0;
  }

  const serverTime = Date.parse(trial.serverTime);
  const expiresAt = Date.parse(trial.expiresAt);

  if (!Number.isFinite(serverTime) || !Number.isFinite(expiresAt)) {
    return 0;
  }

  const remainingByServer = expiresAt - serverTime;
  const remainingByResponse = Math.floor(trial.remainingSeconds * 1000);

  const remainingMs = Math.min(remainingByServer, remainingByResponse);

  if (remainingMs <= 0) {
    return 0;
  }

  return Date.now() + Math.min(CACHE_DURATION_MS, remainingMs);
}

async function hasAccess(): Promise<boolean> {
  if (Date.now() < authorizedUntil) {
    return true;
  }

  if (!pendingVerification) {
    const generation = cacheGeneration;

    const verification = verifyAccess().then(
      (validUntil) => {
        if (generation !== cacheGeneration) {
          return 0;
        }

        authorizedUntil = validUntil;
        return validUntil;
      },
      (error) => {
        if (generation === cacheGeneration) {
          authorizedUntil = 0;
        }

        console.error("[GameLabs] Falha na autorização:", error);
        return 0;
      },
    );

    pendingVerification = verification;

    void verification.then(() => {
      if (pendingVerification === verification) {
        pendingVerification = null;
      }
    });
  }

  const validUntil = await pendingVerification;

  return Date.now() < validUntil;
}

export function invalidateLicenseAccessCache(): void {
  cacheGeneration++;
  authorizedUntil = 0;
  pendingVerification = null;
}

export function registerSecureHandler(
  channel: string,
  handler: InvokeHandler,
): void {
  ipcMain.removeHandler(channel);

  ipcMain.handle(channel, async (event, ...args) => {
    if (!PUBLIC_CHANNELS.has(channel)) {
      const authorized = await hasAccess();

      if (!authorized) {
        throw new Error("GAMELABS_LICENSE_REQUIRED");
      }
    }

    return handler(event, ...args);
  });
}
