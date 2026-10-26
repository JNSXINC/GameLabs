import { generateFingerprint } from "./generateFingerprint";

export type TrialAccessResult =
  | {
      status: "ACTIVE" | "EXPIRED";
      startedAt: string;
      expiresAt: string;
      serverTime: string;
      remainingSeconds: number;
    }
  | {
      error: "TRIAL_VERIFICATION_FAILED" | "TRIAL_SERVER_UNAVAILABLE";
    };

export async function checkTrialAccess(): Promise<TrialAccessResult> {
  try {
    const response = await fetch(
      "https://ohwmbgbkwstdybhrjmdy.supabase.co/functions/v1/trial-license",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceFingerprint: generateFingerprint(),
          action: "check",
        }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      return { error: "TRIAL_VERIFICATION_FAILED" };
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      !("status" in data) ||
      (data.status !== "ACTIVE" && data.status !== "EXPIRED") ||
      !("startedAt" in data) ||
      typeof data.startedAt !== "string" ||
      !("expiresAt" in data) ||
      typeof data.expiresAt !== "string" ||
      !("serverTime" in data) ||
      typeof data.serverTime !== "string" ||
      !("remainingSeconds" in data) ||
      typeof data.remainingSeconds !== "number" ||
      !Number.isFinite(data.remainingSeconds)
    ) {
      return { error: "TRIAL_VERIFICATION_FAILED" };
    }

    return {
      status: data.status,
      startedAt: data.startedAt,
      expiresAt: data.expiresAt,
      serverTime: data.serverTime,
      remainingSeconds: data.remainingSeconds,
    };
  } catch (error) {
    console.error("[GameLabs] Erro ao verificar Trial:", error);

    return { error: "TRIAL_SERVER_UNAVAILABLE" };
  }
}
