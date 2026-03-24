import mongoose from "mongoose";

/**
 * Извлекает contentType и contentId из внутренней ссылки приложения (/client/...).
 * Поддерживает полный URL или только pathname.
 */
export function parseClientContentLink(link) {
    if (!link || typeof link !== "string") return null;
    let path = link.trim();
    try {
        if (path.startsWith("http://") || path.startsWith("https://")) {
            path = new URL(path).pathname;
        }
    } catch {
        return null;
    }
    if (!path.startsWith("/")) path = `/${path}`;
    const parts = path.split("/").filter(Boolean);
    const clientIdx = parts.indexOf("client");
    if (clientIdx === -1) return null;
    const rest = parts.slice(clientIdx + 1);
    if (rest.length < 2) return null;

    const segmentToContentType = {
        practice: "practice",
        "broadcast-recording": "broadcast-recording",
        "parables-of-life": "parables-of-life",
        "scientific-discoveries": "scientific-discoveries",
        "health-lab": "health-lab",
        "relationship-workshop": "relationship-workshop",
        "spirit-forge": "spirit-forge",
        "masters-tower": "masters-tower",
        "femininity-gazebo": "femininity-gazebo",
        "consciousness-library": "consciousness-library",
        "product-catalog": "product-catalog",
        "analysis-health": "analysis-health",
        "analysis-relationships": "analysis-relationships",
        "analysis-realization": "analysis-realization",
        psychodiagnostics: "psychodiagnostics",
    };

    const seg = rest[0];
    const id = rest[1];
    const contentType = segmentToContentType[seg];
    if (!contentType || !mongoose.Types.ObjectId.isValid(id)) return null;

    return { contentType, contentId: id };
}
