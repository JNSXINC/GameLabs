type Props = {
  path?: string;
  launchType?: "pc" | "emulator";
  gameFilePath?: string;
};

const getFileName = (filePath?: string) => {
  if (!filePath) return "";

  return (
    filePath.split("\\").pop() ||
    filePath.split("/").pop() ||
    filePath
  );
};

export default function ExecutableName({
  path,
  launchType,
  gameFilePath,
}: Props) {
  let text = "";

  if (launchType === "emulator") {
    text = gameFilePath
      ? getFileName(gameFilePath)
      : "Nenhuma ISO/ROM definida";
  } else {
    text = path
      ? getFileName(path)
      : "Nenhum executável definido";
  }

  return (
    <div
      style={{
        fontSize: "12px",
        color: "rgba(255,255,255,0.85)",
        marginTop: "8px",
        textAlign: "center",
        fontWeight: 500,
      }}
    >
      {text}
    </div>
  );
}