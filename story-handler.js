const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODELS = [PRIMARY_MODEL, "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = async function handleStory(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed." });
    }

    const topic = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
    const allowedStyles = ["cinematic", "animation", "realistic", "documentary"];
    const requestedStyle = typeof req.body?.style === "string" ? req.body.style : "cinematic";
    const style = allowedStyles.includes(requestedStyle) ? requestedStyle : "cinematic";

    if (!topic) {
        return res.status(400).json({ error: "Please enter a story topic." });
    }
    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
            error: "Gemini API key is not configured. Add GEMINI_API_KEY to your server environment."
        });
    }

    const prompt = `Create a detailed ${style} video story from this idea:
${topic}

Break the story into clearly numbered scenes. For each scene include:
- Scene number and short title
- Location and time of day
- Visual action and camera direction
- Character emotions and dialogue where appropriate
- Short narration
Keep every character name and core appearance details consistent across scenes. Return a clear, production-ready scene plan.`;

    let lastError = null;
    for (const model of [...new Set(FALLBACK_MODELS)]) {
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
                                temperature: 0.8,
                                maxOutputTokens: 4096
                            }
                        })
                    }
                );

                const data = await response.json().catch(() => ({}));
                if (response.ok) {
                    const story = (data.candidates?.[0]?.content?.parts || [])
                        .map(part => part.text || "")
                        .join("")
                        .trim();
                    if (!story) {
                        return res.status(502).json({
                            error: "The AI returned an empty scene plan. Please try again."
                        });
                    }
                    return res.status(200).json({ story });
                }

                lastError = {
                    status: response.status,
                    message: data.error?.message || "Story generation failed."
                };

                // Retry/fallback only for temporary capacity, rate-limit, and server errors.
                if (![429, 500, 502, 503, 504].includes(response.status)) {
                    return res.status(response.status).json({ error: lastError.message });
                }
                if (attempt === 0) await wait(1200);
            } catch (error) {
                lastError = { status: 503, message: error.message || "Network request failed." };
                if (attempt === 0) await wait(1200);
            }
        }
    }

    console.error("All Gemini story models are temporarily unavailable:", lastError);
    return res.status(503).json({
        error: "Gemini is temporarily busy. We tried automatic retries and backup models. Please wait a minute and try again."
    });
};
