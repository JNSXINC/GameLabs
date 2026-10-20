export function updateIniValue(
  content: string,
  section: string,
  key: string,
  value: string,
): string {
  const lines = content.split(/\r?\n/);
  let currentSection = "";
  let sectionFound = false;
  let keyFound = false;

  const updated = lines.map((line) => {
    const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);

    if (sectionMatch) {
      currentSection = sectionMatch[1];

      if (currentSection === section) {
        sectionFound = true;
      }

      return line;
    }

    if (
      currentSection === section &&
      line.match(/^\s*([^=]+?)\s*=/)?.[1].trim() === key
    ) {
      keyFound = true;
      return `${key} = ${value}`;
    }

    return line;
  });

  if (!sectionFound) {
    return [...updated, "", `[${section}]`, `${key} = ${value}`].join("\r\n");
  }

  if (!keyFound) {
    const sectionIndex = updated.findIndex(
      (line) => line.trim() === `[${section}]`,
    );

    updated.splice(sectionIndex + 1, 0, `${key} = ${value}`);
  }

  return updated.join("\r\n");
}
