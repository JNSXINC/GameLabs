type OnlineLicenseStatus =
  | "ACTIVE"
  | "REVOKED"
  | "EXPIRED"
  | "INACTIVE"
  | "UNAVAILABLE";

export async function checkOnlineLicense(
  licenseId: string,
  signature: string,
): Promise<OnlineLicenseStatus> {
  try {
    const response = await fetch(
      "https://bpwmjurvfijjreotxhgz.supabase.co/functions/v1/check-license",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ licenseId, signature }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      console.error("[GameLabs] Falha na consulta online:", response.status);
      return "UNAVAILABLE";
    }

    const data: unknown = await response.json();

    if (typeof data !== "object" || data === null || !("status" in data)) {
      return "UNAVAILABLE";
    }

    switch (data.status) {
      case "ACTIVE":
      case "REVOKED":
      case "EXPIRED":
      case "INACTIVE":
        return data.status;
      default:
        return "UNAVAILABLE";
    }
  } catch (error) {
    console.error("[GameLabs] Servidor indisponível:", error);
    return "UNAVAILABLE";
  }
}
