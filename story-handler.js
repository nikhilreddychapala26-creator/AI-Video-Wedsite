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

    const prompt = `You are a professional animation film director, character-continuity supervisor, and storyboard artist.

Create a complete, polished, production-ready scene plan for this story in the requested ${style} visual style.

STORY AND CHARACTER PROFILES:
${topic}

NON-NEGOTIABLE CHARACTER IDENTITY LOCK:
1. Treat every supplied character profile as the canonical design sheet.
2. A character's face must remain exactly the same in every scene and shot: same facial structure, eye shape and color, nose, mouth, skin/fur tone, hairstyle, hair color, age appearance, body proportions, and distinctive marks/accessories.
3. Never redesign, age up/down, beautify, or randomly alter a character. Never change a character's species or defining physical traits.
4. Repeat a concise but specific identity description for each visible character in every scene prompt, using the supplied profile. Do not rely on phrases such as "same character as before" alone.
5. If a detail is not supplied, choose it once in a Character Continuity Bible and keep it unchanged throughout the story.

WARDROBE AND LOCATION CONTINUITY:
1. Clothing is allowed to change when the story moves to a different day, season, weather, activity, or location and a change makes practical story sense.
2. A wardrobe change must never change the character's face, hair, age, body, or identity.
3. Create a clear wardrobe plan: specify the outfit for each story day/location, explain why it changes, and keep that outfit identical across all scenes taking place in the same continuous time period.
4. If the story does not justify a clothing change, keep the outfit unchanged. Do not change clothes randomly between adjacent shots.
5. Keep props, bags, tools, and carried objects consistent. Track when an item is picked up, used, handed over, or put away.
6. Keep geography, weather, time of day, lighting direction, and screen direction coherent between connected scenes. Show believable transitions when time or place changes.

SCENE PLAN REQUIREMENTS:
- First provide a Character Continuity Bible for every important character: exact face and physical identity, hair, age appearance, body proportions, signature details, and default outfit.
- Then provide a Day / Location / Wardrobe Continuity Schedule. Clearly state which outfit is used on each day or location and why any change is needed.
- Then create a logical scene-by-scene storyboard. Include as many scenes as the story needs; do not force the story into six scenes if its length requires more or fewer.
- For every scene include: scene number and title; story day and elapsed time; location and time of day; weather and lighting; characters present; each character's exact identity lock and that scene's outfit; action and emotional performance; camera shot, angle, movement and framing; dialogue; narration; props and continuity notes; and a transition to the next scene.
- Make each scene visually specific and suitable for generating an individual image or video clip.
- Keep dialogue natural and avoid repeating the same information in narration.
- Preserve the user's original story events, character names, relationships, and intended ending. Do not invent unrelated characters or change the plot.
- Ensure every important character in the supplied profiles has a meaningful role where the story allows. Do not insert a character into a scene without a story reason.
- End with a final production checklist for face consistency, wardrobe continuity, props, locations, and scene transitions.

IMPORTANT: A written prompt can strongly guide visual consistency but cannot guarantee identical faces in generated images or videos. The plan must therefore include explicit reference-image instructions for each character wherever the video-generation workflow supports reference images.

Return a clean, well-organized scene plan with readable headings and no raw JSON.`;

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
