# Auto Edit Videos

A cinematic AI video-production workspace for turning story ideas into structured video projects. The project is being developed in the `feature/open-source-video-studio` branch while the default `main` branch remains unchanged.

## Current workspace

- Story and concept input
- Genre and visual-direction choices
- AI story endpoint with selectable Ollama or Gemini provider
- Local scene-outline cards for planning
- Character-reference and audio-reference upload controls
- YouTube aspect-ratio and target-duration planning
- Thumbnail concept brief

Open `studio.html` through the Express app to use the workspace.

## Run locally with Ollama

1. Install Node.js (LTS recommended) and Ollama.
2. In the project folder, install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`. On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Download the starter model once:

   ```bash
   ollama pull llama3.2:3b
   ```

5. Make sure Ollama is running, then start the website:

   ```bash
   npm start
   ```

6. Open `http://localhost:3000/studio.html` (or the port printed by the server).

The local configuration uses `AI_PROVIDER=ollama` and sends story requests to `OLLAMA_BASE_URL`. Change `OLLAMA_MODEL` if you install a different model.

## Use Gemini instead

Set `AI_PROVIDER=gemini` and provide `GEMINI_API_KEY` in your local `.env` file. The Gemini model can be selected with `GEMINI_MODEL`. Never commit the real key.

**Deployment note:** a Vercel-hosted function cannot reach Ollama at `127.0.0.1` on your laptop. For Vercel, use a cloud provider such as Gemini, or a separately hosted, authenticated Ollama endpoint. Do not expose an unauthenticated Ollama port to the public internet.

## Honest feature status

This is an early workspace foundation, not yet a complete video-generation product. The story endpoint can call Ollama or Gemini, but end-to-end image/video generation, character-reference conditioning, timeline editing, server-side voice-over, subtitle rendering, thumbnail image generation, MP4 rendering/export, and YouTube publishing are not connected yet. The scene cards and thumbnail brief are planning helpers only; they do not render media.

See [Feature Status](docs/FEATURE_STATUS.md) and the [Open-source Integration Plan](docs/OPEN_SOURCE_INTEGRATION_PLAN.md) for the roadmap.

## Tests

Run the API tests with:

```bash
npm test
```

## Security

- Keep secrets in local environment variables or a deployment secret manager.
- Do not commit `.env`, API keys, OAuth tokens, or user media.
- YouTube publishing must use an explicit account authorization flow.
