require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "tinyllama";
const getAiProvider = () => (process.env.AI_PROVIDER || "gemini").toLowerCase();

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
    res.json({ ok: true, service: "AI Video Studio", provider: getAiProvider() });
});

function buildStoryPrompt(topic, style) {
    return `Write a detailed ${style} video story about: ${topic}. Structure it into numbered scenes. For each scene include visual action, camera direction, narration, approximate duration, and characters present. Keep character descriptions consistent across all scenes.`;
}

async function generateWithOllama(prompt) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            messages: [{ role: "user", content: prompt }]
        }),
        signal: AbortSignal.timeout(120000)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.error || `Ollama returned HTTP ${response.status}. Check that Ollama is running and the model is installed.`);
    }
    return data?.message?.content?.trim() || "";
}

async function generateWithGemini(prompt) {
    if (!process.env.GEMINI_API_KEY) {
        const error = new Error("Gemini is selected but GEMINI_API_KEY is not configured.");
        error.status = 503;
        throw error;
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY
            },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(120000)
        }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data?.error?.message || "The Gemini story provider could not complete the request.");
        error.status = response.status === 429 ? 429 : 502;
        throw error;
    }
    return data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim() || "";
}

app.post("/api/story", async (req, res) => {
    const topic = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
    const style = typeof req.body?.style === "string" ? req.body.style.trim().slice(0, 100) : "cinematic";

    if (!topic) {
        return res.status(400).json({ error: "Please provide a story topic." });
    }
    if (topic.length > 12000) {
        return res.status(413).json({ error: "Story topic is too long. Keep it under 12,000 characters." });
    }

    const provider = getAiProvider();
    const prompt = buildStoryPrompt(topic, style || "cinematic");

    try {
        let story;
        if (provider === "ollama") {
            story = await generateWithOllama(prompt);
        } else if (provider === "gemini") {
            story = await generateWithGemini(prompt);
        } else {
            return res.status(500).json({ error: "Unsupported AI_PROVIDER. Set it to 'ollama' or 'gemini'." });
        }

        if (!story) {
            return res.status(502).json({ error: "The AI provider returned an empty story." });
        }
        return res.json({ story, provider });
    } catch (error) {
        console.error(`${provider} story generation error:`, error);
        return res.status(error.status || 502).json({
            error: error.message || "Story generation failed. Check the server logs."
        });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`AI Video Studio server running at http://localhost:${PORT}`);
        console.log(`Story AI provider: ${getAiProvider()}`);
    });
}

module.exports = app;
