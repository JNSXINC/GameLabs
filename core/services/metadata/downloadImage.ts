import * as fs from "node:fs";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";

export async function downloadImage(
    imageUrl: string,
    outputPath: string
) {
    try {
        const response = await fetch(imageUrl);

        if (!response.ok || !response.body) {
            throw new Error("Falha ao baixar imagem.");
        }

        fs.mkdirSync(path.dirname(outputPath), {
            recursive: true,
        });

        const fileStream = fs.createWriteStream(outputPath);

        await pipeline(response.body as any, fileStream);

        return outputPath;
    } catch (error) {
        console.error("Erro ao baixar imagem:", error);

        return null;
    }
}