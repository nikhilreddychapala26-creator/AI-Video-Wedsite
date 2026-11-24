require("dotenv").config();
const express = require("express");
const path = require("path");
const handleStory = require("./story-handler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/story", handleStory);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`AI Video Studio server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
