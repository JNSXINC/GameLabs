import fs from "fs";
import https from "https";
import path from "path";

export async function downloadFile(
    url: string,
    destination: string
): Promise<void> {
    fs.mkdirSync(path.dirname(destination), {
        recursive: true,
    });

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);

        https
            .get(url, (response) => {
                if (
                    response.statusCode === 301 ||
                    response.statusCode === 302 ||
                    response.statusCode === 307 ||
                    response.statusCode === 308
                ) {
                    file.close();

                    const redirectUrl = response.headers.location;

                    if (!redirectUrl) {
                        reject(new Error("Redirect sem URL."));
                        return;
                    }

                    downloadFile(redirectUrl, destination)
                        .then(resolve)
                        .catch(reject);

                    return;
                }

                if (response.statusCode !== 200) {
                    file.close();

                    reject(
                        new Error(
                            `Falha no download (${response.statusCode}) de ${url}`
                        )
                    );

                    return;
                }

                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    resolve();
                });
            })
            .on("error", (error) => {
                file.close();

                if (fs.existsSync(destination)) {
                    fs.unlinkSync(destination);
                }

                reject(error);
            });
    });
}