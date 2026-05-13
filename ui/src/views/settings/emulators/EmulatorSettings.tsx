import { Emulator } from "../../../types/emulator";
import { useEmulatorValidation } from "../../../hooks/useEmulatorValidation";
import { useEmulatorBios } from "../../../hooks/useEmulatorBios";

type Props = {
    emulators: Emulator[];
    setEmulators: React.Dispatch<React.SetStateAction<Emulator[]>>;
    setEmulatorExecutable: (id: string) => void | Promise<void>;
};

export default function EmulatorSettings({
    emulators,
    setEmulators,
    setEmulatorExecutable,
}: Props) {

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

    const getStatusStyle = (id: string) => {
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

    return (
        <div style={{ marginTop: "28px" }}>
            <h2 style={{ fontSize: "26px", marginBottom: "18px" }}>
                Emuladores
            </h2>

            <div style={{ display: "grid", gap: "14px", maxWidth: "760px" }}>
                {emulators.map((emulator) => (
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
                        <div>
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
                                        maxWidth: "420px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {emulator.executablePath}
                                </p>
                            )}
                        </div>

                        <div style={{ textAlign: "right" }}>
                            <div
                                style={{
                                    display: "inline-block",
                                    padding: "7px 12px",
                                    borderRadius: "999px",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    marginBottom: "10px",
                                    ...getStatusStyle(emulator.id),
                                }}
                            >
                                {getStatusLabel(emulator.id)}
                            </div>

                            <br />

                            <button
                                type="button"
                                onClick={() => setEmulatorExecutable(emulator.id)}
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

                            {emulator.biosRequired && (
                                <>
                                    <br />

                                    <button
                                        type="button"
                                        onClick={() => setEmulatorBios(emulator.id)}
                                        style={{
                                            marginTop: "10px",
                                            padding: "10px 14px",
                                            borderRadius: "999px",
                                            border: "none",
                                            cursor: "pointer",
                                            fontWeight: 700,
                                        }}
                                    >
                                        Selecionar BIOS
                                    </button>
                                </>
                            )}

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}