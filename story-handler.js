const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

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

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Create a detailed ${style} video story from this idea: ${topic}
Break the story into clearly numbered scenes. For each scene include location, visual action, character emotions, and a short narration. Keep character names and core appearance details consistent across scenes.`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 4096
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API error:", data);
            return res.status(response.status >= 500 ? 502 : response.status).json({
                error: data.error?.message || "Story generation failed. Please try again."
            });
        }

        const story = (data.candidates?.[0]?.content?.parts || [])
            .map(part => part.text || "")
            .join("")
            .trim();

        if (!story) {
            console.error("Gemini returned no text:", data);
            return res.status(502).json({
                error: "The AI returned an empty story. Please try again."
            });
        }

        return res.status(200).json({ story });
    } catch (error) {
        console.error("Story generation error:", error);
        return res.status(500).json({
            error: "Could not connect to the story generation service."
        });
    }
};
