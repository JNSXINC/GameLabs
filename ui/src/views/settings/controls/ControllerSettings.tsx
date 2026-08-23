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

  useEffect(() => {
    window.electronAPI.loadControllerSettings().then((data) => {
      if (data) {
        setSettings(data);
      }
    });
  }, []);

  const updateSetting = <K extends keyof ControllerSettingsData>(
    key: K,
    value: ControllerSettingsData[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
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
    <div style={{ padding: 32, color: "#fff" }}>
      <h2>Controles</h2>

      <p style={{ opacity: 0.7 }}>
        Configure a integração do GameLabs com o DS4Windows.
      </p>

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

          <button onClick={handleSelectDS4}>
            Selecionar DS4
          </button>
        </div>
      </div>

      <div style={{ marginTop: 28, display: "grid", gap: 14 }}>
        <label>
          <input
            type="checkbox"
            checked={settings.autoStartDS4}
            onChange={(e) =>
              updateSetting("autoStartDS4", e.target.checked)
            }
          />{" "}
          Iniciar DS4Windows automaticamente
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.watchdogDS4}
            onChange={(e) =>
              updateSetting("watchdogDS4", e.target.checked)
            }
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

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: 32 }}
      >
        {saving ? "Salvando..." : "Salvar configurações"}
      </button>
    </div>
  );
}