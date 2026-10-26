import { useEffect, useState } from "react";

type BiosRegion = {
  region: "usa" | "japan" | "europe";
  name: string;
  biosHint?: string;
  path?: string;
  status: "configured" | "missing";
};

type BiosItem = {
  platform: string;
  name: string;
  path?: string;
  required: boolean;
  status: "configured" | "partial" | "missing" | "not_required";
  regions?: BiosRegion[];
};

export default function BiosManager() {
  const [biosList, setBiosList] = useState<BiosItem[]>([]);

  async function loadBios() {
    const bios = await window.electronAPI.listBios();
    setBiosList(bios);
  }

  useEffect(() => {
    loadBios();
  }, []);

  async function handleSelectBios(platform: string, region?: string) {
    await window.electronAPI.selectBios(platform, region);
    await loadBios();
  }

  async function handleOpenFolder(path?: string) {
    if (!path) return;
    await window.electronAPI.openBiosFolder(path);
  }

  const getStatusLabel = (status: BiosItem["status"]) => {
    if (status === "configured") return "Configurada";
    if (status === "partial") return "Parcial";
    if (status === "not_required") return "Não necessita BIOS";
    return "Não configurada";
  };

  const getRegionStatusLabel = (status: BiosRegion["status"]) => {
    if (status === "configured") return "Configurada";
    return "Não configurada";
  };

  const getStatusColor = (
    status: BiosItem["status"] | BiosRegion["status"],
  ) => {
    if (status === "configured") return "#22c55e";
    if (status === "partial") return "#f59e0b";
    if (status === "not_required") return "#38bdf8";
    return "#ef4444";
  };

  return (
    <div>
      <h2 style={{ marginBottom: "16px" }}>BIOS Manager</h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {biosList.map((bios) => {
          const isNotRequired = bios.status === "not_required";

          return (
            <div
              key={bios.platform}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{bios.name}</div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: getStatusColor(bios.status),
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${getStatusColor(bios.status)}55`,
                    }}
                  >
                    <span>●</span>
                    {getStatusLabel(bios.status)}
                  </div>
                </div>

                {isNotRequired && (
                  <div
                    style={{
                      opacity: 0.65,
                      fontSize: "13px",
                    }}
                  >
                    Sem ação necessária
                  </div>
                )}
              </div>

              {bios.regions && bios.regions.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                    marginTop: "14px",
                  }}
                >
                  {bios.regions.map((region) => {
                    const isConfigured = region.status === "configured";

                    return (
                      <div
                        key={region.region}
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          background: "rgba(0,0,0,0.18)",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                              }}
                            >
                              {region.name}
                            </div>

                            {region.biosHint && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  opacity: 0.65,
                                  marginTop: "2px",
                                }}
                              >
                                {region.biosHint}
                              </div>
                            )}
                            <div
                              style={{
                                color: getStatusColor(region.status),
                                fontSize: "13px",
                                marginTop: "4px",
                                fontWeight: 700,
                              }}
                            >
                              ● {getRegionStatusLabel(region.status)}
                            </div>

                            {region.path && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  opacity: 0.7,
                                  marginTop: "6px",
                                  wordBreak: "break-all",
                                }}
                              >
                                {region.path}
                              </div>
                            )}
                          </div>

                          <div
                            data-gamepad-bios-actions
                            style={{
                              display: "flex",
                              gap: "8px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectBios(bios.platform, region.region)
                              }
                            >
                              {isConfigured ? "Trocar BIOS" : "Selecionar BIOS"}
                            </button>

                            {isConfigured && region.path && (
                              <button
                                type="button"
                                onClick={() => handleOpenFolder(region.path)}
                              >
                                Abrir Pasta
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
