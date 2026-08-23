import { useEffect, useState } from "react";
import { Emulator } from "../../../types/emulator";
import { useEmulatorValidation } from "../../../hooks/useEmulatorValidation";
import { useEmulatorBios } from "../../../hooks/useEmulatorBios";
import BiosManager from "../bios/BiosManager";

type Props = {
    emulators: Emulator[];
    setEmulators: React.Dispatch<React.SetStateAction<Emulator[]>>;
    setEmulatorExecutable: (id: string) => void | Promise<void>;
};

type SetupSection = "emulators" | "bios" | "performance";

export default function EmulatorSettings({
    emulators,
    setEmulators,
    setEmulatorExecutable,
}: Props) {
    const [activeSection, setActiveSection] =
        useState<SetupSection>("emulators");

    const [performancePreset, setPerformancePreset] =
        useState("equilibrado");

    const [systemInfo, setSystemInfo] = useState<{
        cpu: string;
        gpu: string;
        ramGb: number;
        recommendedPreset: string;
    } | null>(null);

    const [recommendedApplied, setRecommendedApplied] = useState(false);
    const [isDetectingSystem, setIsDetectingSystem] = useState(false);
    const [expandedEmulatorId, setExpandedEmulatorId] = useState<string | null>(
        null
    );

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await window.electronAPI.loadSettings();

                if (settings?.performancePreset) {
                    setPerformancePreset(settings.performancePreset);
                }
            } catch (error) {
                console.error("Erro ao carregar configurações:", error);
            }
        }

        loadSettings();
    }, []);

    const { setEmulatorBios } = useEmulatorBios({
        setEmulators,
    });

    const { emulatorStatus } = useEmulatorValidation(emulators);

    const getStatusLabel = (id: string) => {
        const status = emulatorStatus[id];

        if (status === "valid") return "Configurado";
        if (status === "invalid") return "Arquivo não encontrado";
        return "Não configurado";
    };

    const getStatusStyle = (id: string): React.CSSProperties => {
        const status = emulatorStatus[id];

        if (status === "valid") {
            return {
                background: "rgba(34,197,94,0.18)",
                border: "1px solid rgba(34,197,94,0.55)",
                color: "#86efac",
            };
        }

        if (status === "invalid") {
            return {
                background: "rgba(245,158,11,0.18)",
                border: "1px solid rgba(245,158,11,0.55)",
                color: "#fcd34d",
            };
        }

        return {
            background: "rgba(239,68,68,0.18)",
            border: "1px solid rgba(239,68,68,0.55)",
            color: "#fca5a5",
        };
    };

    const sectionCardStyle = (section: SetupSection): React.CSSProperties => ({
        background: "rgba(7, 13, 28, 0.62)",
        border:
            activeSection === section
                ? "1px solid rgba(59,130,246,0.8)"
                : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "18px",
        cursor: "pointer",
        opacity: activeSection === section ? 1 : 0.55,
    });

    const getReadableEmulatorPath = (emulator: Emulator) => {
        if (!emulator.executablePath) return "";

        const normalized = emulator.executablePath.replace(/\\/g, "/");
        const parts = normalized.split("/");

        const emulatorsIndex = parts.findIndex(
            (part) => part.toLowerCase() === "emulators"
        );

        if (emulatorsIndex >= 0) {
            return parts.slice(emulatorsIndex, emulatorsIndex + 2).join("/");
        }

        return parts.slice(-2, -1).join("/");
    };

    const detectSystem = async () => {
        try {
            setIsDetectingSystem(true);

            const info = await window.electronAPI.getSystemInfo();

            setSystemInfo(info);
            setRecommendedApplied(false);
        } catch (error) {
            console.error("Erro ao detectar hardware:", error);
        } finally {
            setIsDetectingSystem(false);
        }
    };

    return (
        <div style={{ marginTop: "28px" }}>
            <div style={{ marginBottom: "28px" }}>
                <h2 style={{ fontSize: "28px", marginBottom: "10px" }}>
                    Setup Center
                </h2>

                <p style={{ opacity: 0.65, marginBottom: "18px" }}>
                    Configure emuladores, BIOS e desempenho do GameLabs em um só lugar.
                </p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: "14px",
                        maxWidth: "760px",
                    }}
                >
                    <div
                        onClick={() => setActiveSection("emulators")}
                        style={sectionCardStyle("emulators")}
                    >
                        <h3 style={{ margin: 0 }}>Emuladores</h3>
                        <p style={{ opacity: 0.6, fontSize: "13px" }}>
                            Detectar, instalar e configurar emuladores.
                        </p>
                    </div>

                    <div
                        onClick={() => setActiveSection("bios")}
                        style={sectionCardStyle("bios")}
                    >
                        <h3 style={{ margin: 0 }}>BIOS</h3>
                        <p style={{ opacity: 0.6, fontSize: "13px" }}>
                            Gerenciar BIOS necessárias para cada plataforma.
                        </p>
                    </div>

                    <div
                        onClick={() => setActiveSection("performance")}
                        style={sectionCardStyle("performance")}
                    >
                        <h3 style={{ margin: 0 }}>Performance</h3>
                        <p style={{ opacity: 0.6, fontSize: "13px" }}>
                            Ajustar gráficos e desempenho conforme o PC.
                        </p>
                    </div>
                </div>
            </div>

            {activeSection === "emulators" && (
                <>
                    <h2 style={{ fontSize: "26px", marginBottom: "18px" }}>
                        Emuladores
                    </h2>

                    <div style={{ display: "grid", gap: "14px", maxWidth: "900px" }}>
                        {emulators.map((emulator) => {
                            const status = emulatorStatus[emulator.id];
                            const isConfigured = status === "valid";
                            const isExpanded = expandedEmulatorId === emulator.id;

                            return (
                                <div
                                    key={emulator.id}
                                    style={{
                                        background: "rgba(7, 13, 28, 0.62)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "18px",
                                        padding: "18px 20px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "18px",
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <h3 style={{ margin: 0, fontSize: "20px" }}>
                                            {emulator.name}
                                        </h3>

                                        <p style={{ margin: "8px 0 0", opacity: 0.65 }}>
                                            Plataformas: {emulator.platforms.join(", ")}
                                        </p>

                                        {emulator.biosRequired && (
                                            <p
                                                style={{
                                                    margin: "8px 0 0",
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    color: emulator.biosConfigured
                                                        ? "#86efac"
                                                        : "#fca5a5",
                                                }}
                                            >
                                                {emulator.biosConfigured
                                                    ? "BIOS configurada"
                                                    : "BIOS não configurada"}
                                            </p>
                                        )}

                                        {emulator.executablePath && (
                                            <p
                                                style={{
                                                    margin: "8px 0 0",
                                                    opacity: 0.45,
                                                    fontSize: "12px",
                                                    maxWidth: "520px",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                Instalação detectada:
                                                {getReadableEmulatorPath(emulator)}
                                            </p>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            width: "145px",
                                            flexShrink: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-end",
                                            gap: "10px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "inline-block",
                                                padding: "7px 12px",
                                                borderRadius: "999px",
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                ...getStatusStyle(emulator.id),
                                            }}
                                        >
                                            {getStatusLabel(emulator.id)}
                                        </div>

                                        {isConfigured && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedEmulatorId(
                                                        isExpanded ? null : emulator.id
                                                    )
                                                }
                                                style={{
                                                    padding: "9px 12px",
                                                    borderRadius: "999px",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                ⚙ Reconfigurar
                                            </button>
                                        )}

                                        {isConfigured && isExpanded && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-end",
                                                    gap: "10px",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEmulatorExecutable(emulator.id)
                                                    }
                                                    style={{
                                                        padding: "10px 14px",
                                                        borderRadius: "999px",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    Selecionar executável
                                                </button>

                                                {emulator.executablePath && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            window.electronAPI.openGameFolder(
                                                                emulator.executablePath
                                                            )
                                                        }
                                                        style={{
                                                            padding: "10px 14px",
                                                            borderRadius: "999px",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        Abrir pasta
                                                    </button>
                                                )}

                                                {["duckstation", "pcsx2", "ppsspp", "dolphin", "retroarch"].includes(
                                                    emulator.id
                                                ) && (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                const confirmReinstall = window.confirm(
                                                                    `${emulator.name} já está configurado. Deseja reinstalar mesmo assim?`
                                                                );

                                                                if (!confirmReinstall) return;

                                                                try {
                                                                    const result =
                                                                        await window.electronAPI.downloadEmulator(
                                                                            emulator.id
                                                                        );

                                                                    if (
                                                                        result?.success &&
                                                                        result.executablePath
                                                                    ) {
                                                                        setEmulators((prev) =>
                                                                            prev.map((item) =>
                                                                                item.id === emulator.id
                                                                                    ? {
                                                                                        ...item,
                                                                                        executablePath:
                                                                                            result.executablePath,
                                                                                        installed: true,
                                                                                    }
                                                                                    : item
                                                                            )
                                                                        );
                                                                    }
                                                                } catch (error) {
                                                                    console.error(error);
                                                                    alert(
                                                                        "Falha ao reinstalar o emulador."
                                                                    );
                                                                }
                                                            }}
                                                            style={{
                                                                padding: "10px 14px",
                                                                borderRadius: "999px",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            Reinstalar
                                                        </button>
                                                    )}

                                                {emulator.biosRequired && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setEmulatorBios(emulator.id)
                                                        }
                                                        style={{
                                                            padding: "10px 14px",
                                                            borderRadius: "999px",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        Selecionar BIOS
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {!isConfigured && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-end",
                                                    gap: "10px",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEmulatorExecutable(emulator.id)
                                                    }
                                                    style={{
                                                        padding: "10px 14px",
                                                        borderRadius: "999px",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    Selecionar executável
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            if (isConfigured) {
                                                                const confirmReinstall = window.confirm(
                                                                    `${emulator.name} já está configurado. Deseja reinstalar mesmo assim?`
                                                                );

                                                                if (!confirmReinstall) {
                                                                    return;
                                                                }
                                                            }
                                                            const result =
                                                                await window.electronAPI.downloadEmulator(
                                                                    emulator.id
                                                                );

                                                            if (
                                                                result?.success &&
                                                                result.executablePath
                                                            ) {
                                                                setEmulators((prev) =>
                                                                    prev.map((item) =>
                                                                        item.id === emulator.id
                                                                            ? {
                                                                                ...item,
                                                                                executablePath:
                                                                                    result.executablePath,
                                                                                installed: true,
                                                                            }
                                                                            : item
                                                                    )
                                                                );
                                                            }
                                                        } catch (error) {
                                                            console.error(error);
                                                            alert(
                                                                "Falha ao instalar o emulador."
                                                            );
                                                        }
                                                    }}
                                                    style={{
                                                        padding: "10px 14px",
                                                        borderRadius: "999px",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    Instalar automaticamente
                                                </button>

                                                {emulator.biosRequired && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setEmulatorBios(emulator.id)
                                                        }
                                                        style={{
                                                            padding: "10px 14px",
                                                            borderRadius: "999px",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        Selecionar BIOS
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {activeSection === "bios" && (
                <div style={{ maxWidth: "900px" }}>
                    <BiosManager />
                </div>
            )}

            {activeSection === "performance" && (
                <div style={{ maxWidth: "760px" }}>
                    <h2 style={{ fontSize: "26px", marginBottom: "18px" }}>
                        Performance
                    </h2>

                    <p style={{ opacity: 0.65, marginBottom: "18px" }}>
                        Escolha um perfil de desempenho para o GameLabs ajustar os emuladores futuramente.
                    </p>

                    <div style={{ marginBottom: "20px" }}>
                        <button
                            type="button"
                            onClick={detectSystem}
                            style={{
                                padding: "12px 18px",
                                borderRadius: "999px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 700,
                            }}
                        >
                            {isDetectingSystem ? "Detectando..." : "Detectar Meu PC"}
                        </button>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                            gap: "12px",
                        }}
                    >
                        {["baixo", "equilibrado", "alto", "ultra"].map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={async () => {
                                    setPerformancePreset(preset);

                                    await window.electronAPI.saveSettings({
                                        performancePreset: preset,
                                        autoDetectHardware: true,
                                    });
                                }}
                                style={{
                                    padding: "18px",
                                    borderRadius: "18px",
                                    border:
                                        performancePreset === preset
                                            ? "1px solid rgba(59,130,246,0.9)"
                                            : "1px solid rgba(255,255,255,0.1)",
                                    background:
                                        performancePreset === preset
                                            ? "rgba(59,130,246,0.35)"
                                            : "rgba(7,13,28,0.62)",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontWeight: 800,
                                    textTransform: "capitalize",
                                }}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>

                    {systemInfo && (
                        <div
                            style={{
                                marginTop: "20px",
                                background: "rgba(7, 13, 28, 0.62)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "18px",
                                padding: "18px",
                            }}
                        >
                            <h3 style={{ marginTop: 0 }}>
                                Hardware Detectado
                            </h3>

                            <p>
                                <strong>CPU:</strong> {systemInfo.cpu}
                            </p>

                            <p>
                                <strong>GPU:</strong> {systemInfo.gpu}
                            </p>

                            <p>
                                <strong>RAM:</strong> {systemInfo.ramGb} GB
                            </p>

                            <p>
                                <strong>Perfil recomendado:</strong>{" "}
                                {systemInfo.recommendedPreset.toUpperCase()}
                            </p>

                            <div style={{ marginTop: "18px" }}>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setPerformancePreset(
                                            systemInfo.recommendedPreset
                                        );

                                        await window.electronAPI.saveSettings({
                                            performancePreset:
                                                systemInfo.recommendedPreset,
                                            autoDetectHardware: true,
                                        });

                                        setRecommendedApplied(true);
                                    }}
                                    style={{
                                        padding: "12px 18px",
                                        borderRadius: "999px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                    }}
                                >
                                    Aplicar Perfil Recomendado
                                </button>

                                {recommendedApplied && (
                                    <p
                                        style={{
                                            marginTop: "12px",
                                            color: "#86efac",
                                            fontWeight: 700,
                                        }}
                                    >
                                        Perfil aplicado com sucesso.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}