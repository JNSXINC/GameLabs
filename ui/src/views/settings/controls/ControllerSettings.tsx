import { useEffect, useState } from "react";

type ControllerSettingsData = {
  autoStartDS4: boolean;
  watchdogDS4: boolean;
  closeWithGameLabs: boolean;
  ds4Path: string;
};

const defaultSettings: ControllerSettingsData = {
  autoStartDS4: false,
  watchdogDS4: false,
  closeWithGameLabs: false,
  ds4Path: "",
};

export default function ControllerSettings() {
  const [settings, setSettings] =
    useState<ControllerSettingsData>(defaultSettings);

  const [saving, setSaving] = useState(false);
  const [installingDS4, setInstallingDS4] = useState(false);
  const [ds4Progress, setDS4Progress] = useState(0);
  const [ds4InstallError, setDS4InstallError] = useState<string | null>(null);

  const [dependencies, setDependencies] = useState<{
    dotnetInstalled: boolean;
    vigemBusInstalled: boolean;
  } | null>(null);

  useEffect(() => {
    window.electronAPI.loadControllerSettings().then((data) => {
      if (data) {
        setSettings(data);
      }
    });

    window.electronAPI
      .checkDS4Dependencies()
      .then(
        (status: { dotnetInstalled: boolean; vigemBusInstalled: boolean }) => {
          setDependencies(status);
        },
      );
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onDS4DownloadProgress(
      (progress: number) => {
        setDS4Progress(progress);
      },
    );

    return unsubscribe;
  }, []);

  const updateSetting = <K extends keyof ControllerSettingsData>(
    key: K,
    value: ControllerSettingsData[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleInstallDS4 = async () => {
    if (installingDS4) return;

    if (settings.ds4Path) {
      const confirmed = window.confirm(
        "Deseja realmente reinstalar o DS4Windows?\n\nO DS4Windows será fechado e reinstalado. As configurações do GameLabs serão aplicadas novamente.",
      );

      if (!confirmed) return;
    }

    setInstallingDS4(true);
    setDS4Progress(0);
    setDS4InstallError(null);

    try {
      const result = await window.electronAPI.setupDS4Windows();

      const updatedSettings = {
        ...settings,
        ds4Path: result.executablePath,
      };

      setSettings(updatedSettings);

      await window.electronAPI.saveControllerSettings(updatedSettings);

      setDependencies(result.dependencies);
      setDS4Progress(100);
    } catch (error) {
      console.error("Erro ao instalar DS4Windows:", error);

      setDS4InstallError(
        error instanceof Error
          ? error.message
          : "Não foi possível instalar o DS4Windows.",
      );
    } finally {
      setInstallingDS4(false);
    }
  };

  const handleSelectDS4 = async () => {
    const result = await window.electronAPI.selectDS4Executable();

    if (!result?.canceled && result?.path) {
      updateSetting("ds4Path", result.path);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    await window.electronAPI.saveControllerSettings(settings);

    setSaving(false);
  };

  return (
    <div
      data-gamepad-controller-settings
      style={{ padding: 32, color: "#fff" }}
    >
      <h2>Controles</h2>

      <p style={{ opacity: 0.7 }}>
        Configure a integração do GameLabs com o DS4Windows.
      </p>

      {dependencies && (
        <div style={{ marginTop: 16 }}>
          <div>
            .NET Desktop Runtime:{" "}
            {dependencies.dotnetInstalled ? "Instalado ✓" : "Não instalado ✗"}
          </div>

          <div>
            ViGEmBus:{" "}
            {dependencies.vigemBusInstalled ? "Instalado ✓" : "Não instalado ✗"}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <label>Caminho do DS4Windows</label>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <input
            value={settings.ds4Path}
            readOnly
            placeholder="Nenhum DS4Windows selecionado"
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
            }}
          />

          <button onClick={handleSelectDS4}>Selecionar DS4</button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={handleInstallDS4}
          disabled={installingDS4}
        >
          {installingDS4
            ? `Instalando DS4Windows... ${ds4Progress}%`
            : settings.ds4Path
              ? "Reinstalar DS4Windows"
              : "Instalar DS4Windows"}
        </button>

        {installingDS4 && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                background: "rgba(255,255,255,0.10)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${ds4Progress}%`,
                  height: "100%",
                  background: "#ffffff",
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </div>
        )}

        {ds4InstallError && (
          <div style={{ marginTop: 10 }}>Erro: {ds4InstallError}</div>
        )}
      </div>

      <div style={{ marginTop: 28, display: "grid", gap: 14 }}>
        <label>
          <input
            type="checkbox"
            checked={settings.autoStartDS4}
            onChange={(e) => updateSetting("autoStartDS4", e.target.checked)}
          />{" "}
          Iniciar DS4Windows automaticamente
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.watchdogDS4}
            onChange={(e) => updateSetting("watchdogDS4", e.target.checked)}
          />{" "}
          Reabrir DS4Windows se fechar
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.closeWithGameLabs}
            onChange={(e) =>
              updateSetting("closeWithGameLabs", e.target.checked)
            }
          />{" "}
          Encerrar DS4Windows ao fechar o GameLabs
        </label>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ marginTop: 32 }}>
        {saving ? "Salvando..." : "Salvar configurações"}
      </button>
    </div>
  );
}
