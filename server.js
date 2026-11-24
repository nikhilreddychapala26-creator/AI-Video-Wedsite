require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
    res.json({ ok: true, service: "AI Video Studio" });
});

app.post("/api/story", async (req, res) => {
    const topic = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
    const style = typeof req.body?.style === "string" ? req.body.style : "cinematic";

    if (!topic) {
        return res.status(400).json({ error: "Please provide a story topic." });
    }
    if (topic.length > 12000) {
        return res.status(413).json({ error: "Story topic is too long. Keep it under 12,000 characters." });
    }
    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: "Story generation is not configured. Add GEMINI_API_KEY to your local environment." });
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
                            text: `Write a detailed ${style} video story about: ${topic}. Structure it into numbered scenes. For each scene include visual action, camera direction, and narration. Keep character descriptions consistent.`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        if (!response.ok) {
            console.error("Gemini API error:", data);
            return res.status(response.status === 429 ? 429 : 502).json({
                error: data?.error?.message || "The story provider could not complete the request."
            });
        }

        const story = data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!story) {
            return res.status(502).json({ error: "The AI provider returned an empty story." });
        }
        return res.json({ story });
    } catch (error) {
        console.error("Story generation error:", error);
        return res.status(500).json({ error: "Story generation failed. Check the server logs." });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`AI Video Studio server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
