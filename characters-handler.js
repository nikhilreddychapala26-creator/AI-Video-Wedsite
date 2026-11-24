const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODELS = [PRIMARY_MODEL, "gemini-3.6-flash", "gemini-3.5-flash-lite"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = async function handleCharacters(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

    const story = typeof req.body?.story === "string" ? req.body.story.trim() : "";
    if (!story) return res.status(400).json({ error: "Enter a story before creating characters." });
    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: "Gemini API key is not configured on this server." });
    }

    const prompt = `Read this story and identify every important character. Invent no fixed or preset characters. Use the names and roles that fit this story. For each character create a distinctive, detailed visual design suitable for a high-quality 3D animated film. Return ONLY valid JSON in this exact shape: {"characters":[{"name":"...","role":"...","age":"...","appearance":"...","clothing":"...","personality":"..."}]}. Include between 1 and 12 characters. Make every design visually distinct and preserve story facts. Story:\\n${story}`;

    let lastError = null;
    for (const model of [...new Set(FALLBACK_MODELS)]) {
        // Retry temporary overload once, then try the next supported model.
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": process.env.GEMINI_API_KEY
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 3000,
                                responseMimeType: "application/json"
                            }
                        })
                    }
                );

                const data = await response.json().catch(() => ({}));
                if (response.ok) {
                    const raw = (data.candidates?.[0]?.content?.parts || [])
                        .map((part) => part.text || "").join("").trim();
                    let parsed;
                    try {
                        parsed = JSON.parse(raw);
                    } catch {
                        return res.status(502).json({
                            error: "The AI returned character data in an unreadable format. Please try again."
                        });
                    }

                    const characters = Array.isArray(parsed.characters)
                        ? parsed.characters.slice(0, 12)
                        : [];
                    if (!characters.length) {
                        return res.status(502).json({ error: "No characters were found in this story." });
                    }
                    return res.status(200).json({ characters });
                }

                const message = data.error?.message || "Character creation failed.";
                lastError = { status: response.status, message };

                // Only retry/fallback on temporary capacity or rate-limit errors.
                if (![429, 500, 502, 503, 504].includes(response.status)) {
                    return res.status(response.status).json({ error: message });
                }
                if (attempt === 0) await wait(1200);
            } catch (error) {
                lastError = { status: 503, message: error.message || "Network request failed." };
                if (attempt === 0) await wait(1200);
            }
        }
    }

    console.error("All Gemini character models are temporarily unavailable:", lastError);
    return res.status(503).json({
        error: "Gemini is temporarily busy. We tried automatic retries and backup models. Please wait a minute and try again."
    });
};
