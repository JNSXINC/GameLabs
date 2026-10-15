import React, { useEffect, useState } from "react";
import type { Game } from "../../types/game";
import type { UserProfile } from "../../types/electron";

type Props = {
  favorites: Game[];
  games: Game[];
};

export default function UserView({ favorites, games }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const result = await window.electronAPI.loadUserProfile();

        if (!active) return;

        setProfile(result);
        setDisplayName(result.displayName);

        try {
          const avatar = await window.electronAPI.readUserAvatar();

          if (active) {
            setAvatarUrl(avatar);
          }
        } catch (avatarError) {
          console.error("[GameLabs] Erro ao carregar avatar:", avatarError);

          if (active) {
            setError("Não foi possível carregar o avatar.");
          }
        }
      } catch (err) {
        if (active) {
          setError("Não foi possível carregar o perfil.");
          console.error("[GameLabs] Erro ao carregar perfil:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    const name = displayName.trim();

    if (!name || name.length > 40) {
      setError("O nome deve conter entre 1 e 40 caracteres.");
      return;
    }

    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await window.electronAPI.saveUserProfile({
        displayName: name,
      });

      setProfile(updated);
      setDisplayName(updated.displayName);
      setEditing(false);
      setSuccess("Perfil atualizado com sucesso.");
    } catch (err) {
      setError("Não foi possível salvar o perfil.");
      console.error("[GameLabs] Erro ao salvar perfil:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAvatar() {
    if (uploadingAvatar) return;

    setUploadingAvatar(true);
    setError("");
    setSuccess("");

    try {
      const updated = await window.electronAPI.selectUserAvatar();

      if (!updated) return;

      setProfile(updated);

      try {
        const avatar = await window.electronAPI.readUserAvatar();
        setAvatarUrl(avatar);

        if (avatar) {
          setSuccess("Avatar atualizado com sucesso.");
        } else {
          setError("Avatar salvo, mas não foi possível exibi-lo.");
        }
      } catch (avatarError) {
        console.error("[GameLabs] Erro ao atualizar imagem:", avatarError);
        setError("Avatar salvo, mas não foi possível carregar a imagem.");
      }
    } catch (err) {
      setError("Não foi possível importar a imagem.");
      console.error("[GameLabs] Erro ao importar avatar:", err);
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleCancel() {
    setDisplayName(profile?.displayName ?? "");
    setEditing(false);
    setError("");
  }

  const glassPanel: React.CSSProperties = {
    background: "rgba(7, 13, 28, 0.72)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "20px",
    padding: "28px",
  };

  const buttonStyle: React.CSSProperties = {
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "10px",
    padding: "11px 18px",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        padding: "34px 42px",
        color: "#fff",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginTop: 0, fontSize: "38px" }}>Perfil do jogador</h1>

      <p style={{ color: "#a9b4c8", marginBottom: "28px" }}>
        Personalize sua experiência no GameLabs.
      </p>

      <div style={glassPanel}>
        {loading ? (
          <p>Carregando perfil...</p>
        ) : profile ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #233b68, #101a32)",
                    border: "2px solid rgba(255,255,255,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "46px",
                    overflow: "hidden",
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar do jogador"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span>👤</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleSelectAvatar()}
                  disabled={uploadingAvatar || saving}
                  style={{
                    ...buttonStyle,
                    fontSize: "12px",
                    padding: "9px 12px",
                    opacity: uploadingAvatar ? 0.6 : 1,
                  }}
                >
                  {uploadingAvatar
                    ? "Importando..."
                    : avatarUrl
                      ? "Alterar avatar"
                      : "Adicionar avatar"}
                </button>
              </div>

              <div style={{ flex: 1, minWidth: "220px" }}>
                {editing ? (
                  <>
                    <label
                      htmlFor="player-name"
                      style={{
                        display: "block",
                        color: "#a9b4c8",
                        marginBottom: "8px",
                      }}
                    >
                      Nome do jogador
                    </label>

                    <input
                      id="player-name"
                      value={displayName}
                      maxLength={40}
                      onChange={(event) => setDisplayName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          void handleSave();
                        }
                        if (event.key === "Escape") {
                          handleCancel();
                        }
                      }}
                      style={{
                        width: "100%",
                        maxWidth: "340px",
                        boxSizing: "border-box",
                        padding: "12px",
                        background: "rgba(0,0,0,0.35)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "10px",
                        fontSize: "17px",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "14px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={saving}
                        style={{
                          ...buttonStyle,
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        {saving ? "Salvando..." : "Salvar"}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        style={buttonStyle}
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2
                      style={{
                        fontSize: "28px",
                        margin: "0 0 8px",
                      }}
                    >
                      {profile.displayName}
                    </h2>

                    <p
                      style={{
                        color: "#a9b4c8",
                        margin: "0 0 16px",
                      }}
                    >
                      Jogador GameLabs
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setEditing(true);
                      }}
                      style={buttonStyle}
                    >
                      Editar perfil
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <p role="alert" style={{ color: "#ff8585" }}>
                {error}
              </p>
            )}

            {success && (
              <p role="status" style={{ color: "#7ee0a2" }}>
                {success}
              </p>
            )}
          </>
        ) : (
          <p role="alert" style={{ color: "#ff8585" }}>
            {error || "Perfil indisponível."}
          </p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginTop: "22px",
        }}
      >
        <div style={glassPanel}>
          <div style={{ fontSize: "30px" }}>🎮</div>
          <p style={{ color: "#a9b4c8" }}>Jogos na biblioteca</p>
          <strong style={{ fontSize: "32px" }}>{games.length}</strong>
        </div>

        <div style={glassPanel}>
          <div style={{ fontSize: "30px" }}>⭐</div>
          <p style={{ color: "#a9b4c8" }}>Jogos favoritos</p>
          <strong style={{ fontSize: "32px" }}>{favorites.length}</strong>
        </div>
      </div>
    </div>
  );
}
