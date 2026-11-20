
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = "gemini-3.8-flash";

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/story", async (req, res) => {
    const topic = req.body?.topic || "";
    const style = req.body?.style || "cinematic";

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
                            text: `Write a detailed ${style} video story about: ${topic}. Use clear scenes.`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.log("Gemini error:", data);
            return res.status(500).json({ error: "Story generation failed." });
        }

        const story = data.candidates[0].content.parts
            .map(part => part.text || "")
            .join("");

        res.json({ story });
    } catch (error) {
        console.log("Server error:", error);
        res.status(500).json({ error: "Story generation failed." });
    }
});

module.exports = app;