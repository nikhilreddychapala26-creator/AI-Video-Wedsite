const MAX_BYTES = 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

module.exports = function handleReferenceImage(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed." });
    }

    const image = typeof req.body?.image === "string" ? req.body.image : "";
    const match = image.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match || !ALLOWED_TYPES.has(match[1])) {
        return res.status(400).json({ error: "Upload a valid PNG, JPEG, or WebP image." });
    }

    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length || bytes.length > MAX_BYTES) {
        return res.status(413).json({ error: "Image must be smaller than or equal to 1 MB." });
    }

    const canonicalImage = `data:${match[1]};base64,${bytes.toString("base64")}`;
    return res.status(200).json({
        image: canonicalImage,
        mimeType: match[1],
        sizeBytes: bytes.length
    });
};
