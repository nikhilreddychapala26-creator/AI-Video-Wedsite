require("dotenv").config();
const express = require("express");
const path = require("path");
const handleStory = require("./story-handler");
const handleCharacters = require("./characters-handler");
const handleReferenceImage = require("./reference-image-handler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.post("/api/story", handleStory);
app.post("/api/characters", handleCharacters);
app.post("/api/reference-image", handleReferenceImage);

if (require.main === module) {
    app.listen(PORT, () => console.log(`AI Video Studio server running at http://localhost:${PORT}`));
}
module.exports = app;
