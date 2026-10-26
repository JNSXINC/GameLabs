import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "../services/auth/supabaseClient.mjs";

type License = {
  id: string;
  user_id: string;
  license_type: "monthly" | "lifetime";
  device_fingerprint: string | null;
  status: "pending" | "active" | "revoked";
  issued_at: string;
  activated_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

type SignedLicense = {
  payload: {
    schemaVersion: 1;
    licenseId: string;
    type: "monthly" | "lifetime";
    deviceFingerprint: string;
    issuedAt: string;
    expiresAt: string | null;
  };
  signature: string;
};

type LicenseDetails = {
  id: string;
  userId: string;
  licenseType: "monthly" | "lifetime";
  deviceFingerprint: string | null;
  status: "pending" | "active" | "revoked";
  issuedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
};

type LicenseEvent = {
  id: string;
  actor_id: string | null;
  event_type: string;
  details: Record<string, unknown>;
  created_at: string;
};

type LicenseDetailsResponse = {
  status: "LICENSE_DETAILS";
  license: LicenseDetails;
  signedLicense: SignedLicense | null;
  events: LicenseEvent[];
};

type AdminResponse = {
  licenseId?: string;
  signedLicense?: SignedLicense;
  status?: string;
  role?: string;
  licenses?: License[];
  license?: LicenseDetails;
  events?: LicenseEvent[];
  error?: string;
  message?: string;
};

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#111827",
  color: "#fff",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};

const cellStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #253044",
  textAlign: "left",
  whiteSpace: "nowrap",
};

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Data inválida";

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getLicenseType(type: License["license_type"]): string {
  return type === "monthly" ? "Mensal" : "Vitalícia";
}

function getLicenseStatus(status: License["status"]): string {
  switch (status) {
    case "pending":
      return "Pendente";
    case "active":
      return "Ativa";
    case "revoked":
      return "Revogada";
    default:
      return status;
  }
}

async function requestLicenses(): Promise<License[]> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("SESSION_EXPIRED");
  }

  const url = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${url}/functions/v1/admin-licenses`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (response.status === 403) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  if (!response.ok) {
    throw new Error("LICENSE_LIST_FAILED");
  }

  const result = (await response.json()) as AdminResponse;

  if (
    result.status !== "AUTHORIZED" ||
    result.role !== "admin" ||
    !Array.isArray(result.licenses)
  ) {
    throw new Error("INVALID_ADMIN_RESPONSE");
  }

  return result.licenses;
}

async function requestCreateLicense(input: {
  userId: string;
  licenseType: License["license_type"];
  deviceFingerprint: string;
}): Promise<SignedLicense> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("SESSION_EXPIRED");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-licenses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
    },
  );

  const result = (await response.json().catch(() => ({}))) as AdminResponse;

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (response.status === 403) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  if (
    response.status === 501 ||
    result.error === "LICENSE_ISSUANCE_NOT_READY"
  ) {
    throw new Error("LICENSE_ISSUANCE_NOT_READY");
  }

  if (!response.ok) {
    throw new Error(result.error ?? "LICENSE_CREATE_FAILED");
  }

  if (
    response.status !== 201 ||
    result.status !== "LICENSE_CREATED" ||
    !result.signedLicense ||
    typeof result.signedLicense.signature !== "string" ||
    !result.signedLicense.payload ||
    result.signedLicense.payload.licenseId !== result.licenseId ||
    result.signedLicense.payload.deviceFingerprint !==
      input.deviceFingerprint ||
    result.signedLicense.payload.type !== input.licenseType
  ) {
    throw new Error("INVALID_ISSUANCE_RESPONSE");
  }

  return result.signedLicense;
}

async function requestRevokeLicense(licenseId: string): Promise<void> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("SESSION_EXPIRED");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-licenses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "revoke-license",
        licenseId,
      }),
      cache: "no-store",
    },
  );

  const result = (await response.json().catch(() => ({}))) as AdminResponse;

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (response.status === 403) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  if (!response.ok || result.status !== "LICENSE_REVOKED") {
    throw new Error(result.error ?? "LICENSE_REVOCATION_FAILED");
  }
}

async function requestLicenseDetails(
  licenseId: string,
): Promise<LicenseDetailsResponse> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("SESSION_EXPIRED");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-licenses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "get-license-details",
        licenseId,
      }),
      cache: "no-store",
    },
  );

  const result = (await response.json().catch(() => ({}))) as AdminResponse;

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (response.status === 403) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  if (!response.ok) {
    throw new Error(result.error ?? "LICENSE_DETAILS_FAILED");
  }

  if (
    result.status !== "LICENSE_DETAILS" ||
    !result.license ||
    !Array.isArray(result.events)
  ) {
    throw new Error("INVALID_LICENSE_DETAILS_RESPONSE");
  }

  return {
    status: "LICENSE_DETAILS",
    license: result.license,
    signedLicense: result.signedLicense ?? null,
    events: result.events,
  };
}

async function requestReactivateLicense(licenseId: string): Promise<void> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("SESSION_EXPIRED");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-licenses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "reactivate-license",
        licenseId,
      }),
      cache: "no-store",
    },
  );

  const result = (await response.json().catch(() => ({}))) as AdminResponse;

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (response.status === 403) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  if (!response.ok || result.status !== "LICENSE_REACTIVATED") {
    throw new Error(result.error ?? "LICENSE_REACTIVATION_FAILED");
  }
}
function AdminApp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [issuedLicense, setIssuedLicense] = useState<SignedLicense | null>(
    null,
  );

  const [selectedLicense, setSelectedLicense] =
    useState<LicenseDetailsResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [newUserId, setNewUserId] = useState("");
  const [newLicenseType, setNewLicenseType] =
    useState<License["license_type"]>("monthly");
  const [newFingerprint, setNewFingerprint] = useState("");

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      switch (error.message) {
        case "LICENSE_ISSUANCE_NOT_READY":
          return "Emissão ainda bloqueada no servidor. Nenhuma licença foi criada.";

        case "INVALID_ISSUANCE_RESPONSE":
          return "O servidor respondeu, mas a licença não pôde ser confirmada. Confira o banco antes de tentar novamente.";

        case "LICENSE_FINALIZATION_REQUIRED":
          return "A licença pode ter sido criada, mas sua finalização não foi confirmada. Confira o banco antes de tentar novamente.";

        case "LICENSE_CREATE_FAILED":
          return "Não foi possível criar a licença.";

        case "INVALID_USER_ID":
          return "UUID de usuário inválido.";

        case "INVALID_DEVICE_FINGERPRINT":
          return "Fingerprint inválido.";

        case "SESSION_EXPIRED":
          return "Sessão expirada. Entre novamente.";

        case "ADMIN_FORBIDDEN":
          return "Esta conta não possui permissão administrativa.";

        case "LICENSE_LIST_FAILED":
          return "Não foi possível carregar as licenças.";

        case "INVALID_ADMIN_RESPONSE":
          return "Resposta inválida do servidor administrativo.";

        case "LICENSE_DETAILS_FAILED":
          return "Não foi possível carregar os detalhes da licença.";

        case "INVALID_LICENSE_DETAILS_RESPONSE":
          return "O servidor retornou detalhes em formato inválido.";

        default:
          return `Erro: ${error.message}`;
      }
    }

    return "Erro desconhecido de conexão.";
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setAuthorized(false);
    setLicenses([]);
    setIssuedLicense(null);
    setSelectedLicense(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        setMessage(
          error
            ? `Falha no login: ${error.message}`
            : "O Supabase não retornou uma sessão.",
        );
        return;
      }

      const loadedLicenses = await requestLicenses();

      setLicenses(loadedLicenses);
      setAuthorized(true);
      setPassword("");
      setMessage("Acesso administrativo autorizado!");
    } catch (error) {
      console.error("[GameLabs Admin] Falha de acesso:", error);

      await supabase.auth.signOut();
      setAuthorized(false);
      setLicenses([]);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setMessage("");

    try {
      const loadedLicenses = await requestLicenses();

      setLicenses(loadedLicenses);
      setMessage("Lista de licenças atualizada.");
    } catch (error) {
      console.error("[GameLabs Admin] Falha na atualização:", error);

      if (
        error instanceof Error &&
        ["SESSION_EXPIRED", "ADMIN_FORBIDDEN"].includes(error.message)
      ) {
        await supabase.auth.signOut();
        setAuthorized(false);
        setLicenses([]);
        setSelectedLicense(null);
      }

      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLicense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userId = newUserId.trim();
    const deviceFingerprint = newFingerprint.trim();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        userId,
      )
    ) {
      setMessage("Informe um UUID de usuário válido.");
      return;
    }

    if (!/^[A-F0-9]{64}$/.test(deviceFingerprint)) {
      setMessage(
        "O fingerprint deve conter exatamente 64 caracteres hexadecimais maiúsculos.",
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const signedLicense = await requestCreateLicense({
        userId,
        licenseType: newLicenseType,
        deviceFingerprint,
      });

      setIssuedLicense(signedLicense);
      setMessage(
        "Licença assinada emitida! Copie o JSON abaixo e guarde em local seguro.",
      );

      const loadedLicenses = await requestLicenses().catch(() => null);

      if (loadedLicenses) {
        setLicenses(loadedLicenses);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));

      if (
        error instanceof Error &&
        ["SESSION_EXPIRED", "ADMIN_FORBIDDEN"].includes(error.message)
      ) {
        await supabase.auth.signOut();
        setAuthorized(false);
        setLicenses([]);
        setSelectedLicense(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDetails(licenseId: string) {
    setDetailsLoading(true);
    setMessage("");
    setSelectedLicense(null);

    try {
      const details = await requestLicenseDetails(licenseId);

      setSelectedLicense(details);
      setMessage("Detalhes da licença carregados.");
    } catch (error) {
      console.error("[GameLabs Admin] Falha ao carregar detalhes:", error);

      setMessage(getErrorMessage(error));
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleRevokeLicense(licenseId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja revogar esta licença? O acesso ao GameLabs será bloqueado.",
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      await requestRevokeLicense(licenseId);

      const updatedLicenses = await requestLicenses();
      setLicenses(updatedLicenses);

      if (selectedLicense?.license.id === licenseId) {
        const details = await requestLicenseDetails(licenseId);
        setSelectedLicense(details);
      }

      setMessage("Licença revogada com sucesso.");
    } catch (error) {
      console.error("[GameLabs Admin] Falha na revogação:", error);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleReactivateLicense(license: License) {
    const confirmed = window.confirm(
      "Deseja reativar esta licença? O vencimento original será preservado.",
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      await requestReactivateLicense(license.id);

      const updatedLicenses = await requestLicenses();
      setLicenses(updatedLicenses);

      if (selectedLicense?.license.id === license.id) {
        const details = await requestLicenseDetails(license.id);
        setSelectedLicense(details);
      }

      setMessage("Licença reativada com sucesso.");
    } catch (error) {
      console.error("[GameLabs Admin] Falha na reativação:", error);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signOut({
        scope: "global",
      });

      if (error) {
        setMessage(`Erro ao sair: ${error.message}`);
        return;
      }

      setAuthorized(false);
      setLicenses([]);
      setIssuedLicense(null);
      setSelectedLicense(null);
      setEmail("");
      setPassword("");
      setMessage("Sessão encerrada.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080b14",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: "48px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: authorized ? 1200 : 380,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <header>
          <h1 style={{ marginBottom: 8 }}>GameLabs Admin</h1>
          <p style={{ color: "#9ca3af" }}>
            {authorized
              ? "Gerenciamento administrativo de licenças"
              : "Acesso exclusivo para administradores"}
          </p>
        </header>

        {!authorized ? (
          <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
            <input
              type="email"
              placeholder="E-mail"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Senha"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
            />

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Licenças</h2>
                <p style={{ color: "#9ca3af", marginBottom: 0 }}>
                  {licenses.length} registro(s) carregado(s)
                  {" · "}Até 100 licenças recentes
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  style={buttonStyle}
                >
                  {loading ? "Carregando..." : "Atualizar"}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  style={buttonStyle}
                >
                  Sair
                </button>
              </div>
            </div>

            <section
              style={{
                background: "#111827",
                border: "1px solid #253044",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h2 style={{ marginTop: 0 }}>Criar licença</h2>

              <p style={{ color: "#9ca3af", fontSize: 14 }}>
                Emissão administrativa de licenças assinadas. Guarde o JSON
                emitido em local seguro.
              </p>

              <form
                onSubmit={handleCreateLicense}
                style={{ display: "grid", gap: 14 }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  UUID do usuário (Supabase Auth)
                  <input
                    style={inputStyle}
                    required
                    value={newUserId}
                    onChange={(event) => setNewUserId(event.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  Tipo de licença
                  <select
                    style={inputStyle}
                    value={newLicenseType}
                    onChange={(event) =>
                      setNewLicenseType(
                        event.target.value as License["license_type"],
                      )
                    }
                  >
                    <option value="monthly">Mensal (30 dias)</option>
                    <option value="lifetime">Vitalícia</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  Fingerprint do dispositivo
                  <input
                    style={inputStyle}
                    required
                    maxLength={64}
                    value={newFingerprint}
                    onChange={(event) => setNewFingerprint(event.target.value)}
                    placeholder="64 caracteres A-F e 0-9"
                  />
                </label>

                <button type="submit" disabled={loading} style={buttonStyle}>
                  {loading ? "Verificando..." : "Solicitar emissão"}
                </button>
              </form>
            </section>

            {issuedLicense && (
              <section
                style={{
                  background: "#111827",
                  border: "1px solid #253044",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <h2 style={{ marginTop: 0 }}>Licença assinada</h2>

                <textarea
                  readOnly
                  aria-label="JSON da licença assinada"
                  value={JSON.stringify(issuedLicense, null, 2)}
                  rows={13}
                  style={{
                    ...inputStyle,
                    width: "100%",
                    boxSizing: "border-box",
                    fontFamily: "monospace",
                  }}
                />

                <button
                  type="button"
                  style={{ ...buttonStyle, marginTop: 12 }}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        JSON.stringify(issuedLicense, null, 2),
                      );
                      setMessage("JSON da licença copiado.");
                    } catch {
                      setMessage(
                        "Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.",
                      );
                    }
                  }}
                >
                  Copiar licença
                </button>
              </section>
            )}

            {selectedLicense && (
              <section
                style={{
                  background: "#111827",
                  border: "1px solid #2563eb",
                  borderRadius: 12,
                  padding: 24,
                  display: "grid",
                  gap: 16,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <h2 style={{ margin: 0 }}>Detalhes da licença</h2>

                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => setSelectedLicense(null)}
                  >
                    Fechar detalhes
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                  }}
                >
                  {[
                    ["ID", selectedLicense.license.id],
                    ["Usuário", selectedLicense.license.userId],
                    [
                      "Tipo",
                      selectedLicense.license.licenseType === "monthly"
                        ? "Mensal"
                        : "Vitalícia",
                    ],
                    [
                      "Status",
                      getLicenseStatus(selectedLicense.license.status),
                    ],
                    [
                      "Fingerprint",
                      selectedLicense.license.deviceFingerprint ?? "—",
                    ],
                    ["Emissão", formatDate(selectedLicense.license.issuedAt)],
                    [
                      "Primeira ativação",
                      formatDate(selectedLicense.license.activatedAt),
                    ],
                    [
                      "Vencimento",
                      formatDate(selectedLicense.license.expiresAt),
                    ],
                    [
                      "Revogação",
                      formatDate(selectedLicense.license.revokedAt),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: 12,
                        background: "#080b14",
                        borderRadius: 8,
                        minWidth: 0,
                      }}
                    >
                      <div style={{ color: "#9ca3af", fontSize: 12 }}>
                        {label}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          overflowWrap: "anywhere",
                          fontSize: 14,
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3>JSON assinado original</h3>

                  {selectedLicense.signedLicense ? (
                    <>
                      <textarea
                        readOnly
                        aria-label="JSON assinado original"
                        value={JSON.stringify(
                          selectedLicense.signedLicense,
                          null,
                          2,
                        )}
                        rows={14}
                        style={{
                          ...inputStyle,
                          width: "100%",
                          boxSizing: "border-box",
                          fontFamily: "monospace",
                          resize: "vertical",
                        }}
                      />

                      <button
                        type="button"
                        disabled={loading}
                        style={{ ...buttonStyle, marginTop: 10 }}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              JSON.stringify(
                                selectedLicense.signedLicense,
                                null,
                                2,
                              ),
                            );
                            setMessage("JSON assinado copiado.");
                          } catch {
                            setMessage(
                              "Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.",
                            );
                          }
                        }}
                      >
                        Copiar JSON assinado
                      </button>
                    </>
                  ) : (
                    <p style={{ color: "#fbbf24" }}>
                      Esta licença ainda não possui payload e assinatura
                      armazenados.
                    </p>
                  )}
                </div>

                <div>
                  <h3>Histórico de eventos</h3>

                  {selectedLicense.events.length === 0 ? (
                    <p style={{ color: "#9ca3af" }}>
                      Nenhum evento registrado.
                    </p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 14,
                        }}
                      >
                        <thead>
                          <tr style={{ color: "#9ca3af" }}>
                            <th style={cellStyle}>Evento</th>
                            <th style={cellStyle}>Data</th>
                            <th style={cellStyle}>Administrador</th>
                            <th style={cellStyle}>Detalhes</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedLicense.events.map((event) => (
                            <tr key={event.id}>
                              <td style={cellStyle}>{event.event_type}</td>
                              <td style={cellStyle}>
                                {formatDate(event.created_at)}
                              </td>
                              <td
                                style={{
                                  ...cellStyle,
                                  whiteSpace: "normal",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {event.actor_id ?? "Sistema"}
                              </td>
                              <td
                                style={{
                                  ...cellStyle,
                                  whiteSpace: "normal",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                <code>
                                  {JSON.stringify(event.details ?? {})}
                                </code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}

            {detailsLoading && (
              <p style={{ color: "#93c5fd" }}>
                Carregando detalhes da licença...
              </p>
            )}

            <section
              style={{
                background: "#111827",
                border: "1px solid #253044",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {licenses.length === 0 ? (
                <p
                  style={{
                    padding: 24,
                    color: "#9ca3af",
                    textAlign: "center",
                  }}
                >
                  Nenhuma licença cadastrada.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 14,
                    }}
                  >
                    <thead>
                      <tr style={{ color: "#9ca3af" }}>
                        <th style={cellStyle}>ID</th>
                        <th style={cellStyle}>Usuário</th>
                        <th style={cellStyle}>Tipo</th>
                        <th style={cellStyle}>Status</th>
                        <th style={cellStyle}>Emissão</th>
                        <th style={cellStyle}>Vencimento</th>
                        <th style={cellStyle}>Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {licenses.map((license) => {
                        const canReactivate =
                          license.license_type === "lifetime" ||
                          (license.license_type === "monthly" &&
                            license.activated_at !== null &&
                            license.expires_at !== null &&
                            new Date(license.expires_at).getTime() >
                              Date.now());

                        return (
                          <tr key={license.id}>
                            <td style={cellStyle} title={license.id}>
                              {license.id.slice(0, 8)}...
                            </td>

                            <td style={cellStyle} title={license.user_id}>
                              {license.user_id.slice(0, 8)}...
                            </td>

                            <td style={cellStyle}>
                              {getLicenseType(license.license_type)}
                            </td>

                            <td style={cellStyle}>
                              {getLicenseStatus(license.status)}
                            </td>

                            <td style={cellStyle}>
                              {formatDate(license.issued_at)}
                            </td>

                            <td style={cellStyle}>
                              {formatDate(license.expires_at)}
                            </td>

                            <td style={cellStyle}>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 8,
                                }}
                              >
                                <button
                                  type="button"
                                  disabled={loading || detailsLoading}
                                  onClick={() => handleViewDetails(license.id)}
                                  style={{
                                    ...buttonStyle,
                                    padding: "8px 12px",
                                  }}
                                >
                                  Detalhes
                                </button>

                                {license.status === "revoked" ? (
                                  <button
                                    type="button"
                                    disabled={loading || !canReactivate}
                                    onClick={() =>
                                      handleReactivateLicense(license)
                                    }
                                    style={{
                                      ...buttonStyle,
                                      padding: "8px 12px",
                                      background: canReactivate
                                        ? "#166534"
                                        : "#374151",
                                      cursor: canReactivate
                                        ? "pointer"
                                        : "not-allowed",
                                      opacity: !canReactivate ? 0.5 : 1,
                                    }}
                                  >
                                    {canReactivate ? "Reativar" : "Revogada"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() =>
                                      handleRevokeLicense(license.id)
                                    }
                                    style={{
                                      ...buttonStyle,
                                      padding: "8px 12px",
                                      background: "#991b1b",
                                    }}
                                  >
                                    Revogar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {message && (
          <p
            role="status"
            style={{
              color: "#cbd5e1",
              fontSize: 14,
              overflowWrap: "anywhere",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

createRoot(document.getElementById("admin-root")!).render(<AdminApp />);
