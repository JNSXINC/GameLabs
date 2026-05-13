type Props = {
  path?: string;
};

const getExecutableName = (filePath?: string) => {
  if (!filePath) return "Nenhum executável definido";
  return filePath.split("\\").pop() || filePath;
};

export default function ExecutableName({ path }: Props) {
  return (
    <div
      style={{
        fontSize: "12px",
        color: "rgba(255,255,255,0.85)",
        marginTop: "8px",
        textAlign: "center",
        fontWeight: 500
      }}
    >
      {getExecutableName(path)}
    </div>
  );
}