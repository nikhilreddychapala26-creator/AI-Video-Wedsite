# Auto Edit Videos

A cinematic AI video-production workspace for turning story ideas into structured video projects. The project is being developed in the `feature/open-source-video-studio` branch while the default `main` branch remains unchanged.

## Current workspace

- Story and concept input
- Genre and visual-direction choices
- Local scene-outline cards for planning
- Character-reference and audio-reference upload controls
- YouTube aspect-ratio and target-duration planning
- Thumbnail concept brief

Open `studio.html` through the Express app to use the workspace.

## Run locally

1. Install Node.js (LTS recommended).
2. In the project folder, install dependencies:

   ```bash
   npm install
   ```

3. Create a local `.env` file and set `GEMINI_API_KEY` if you want to test the story endpoint. Never commit API keys.
4. Start the server:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000/studio.html` (or the port printed by the server).

## Honest feature status

This is an early workspace foundation, not yet a complete video-generation product. Actual image/video model generation, character-reference conditioning, timeline editing, server-side voice-over, subtitle rendering, thumbnail image generation, MP4 rendering/export, and YouTube publishing are not connected yet. The current scene outline and thumbnail brief are planning helpers only; they do not render media.

See [Feature Status](docs/FEATURE_STATUS.md) and the [Open-source Integration Plan](docs/OPEN_SOURCE_INTEGRATION_PLAN.md) for the roadmap.

## Security

- Keep secrets in local environment variables or a deployment secret manager.
- Do not commit `.env`, API keys, OAuth tokens, or user media.
- YouTube publishing must use an explicit account authorization flow.
