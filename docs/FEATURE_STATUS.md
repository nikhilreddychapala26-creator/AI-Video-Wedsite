# Feature Status

Status as of 2026-11-25. This is a development checklist, not a claim of completed integrations.

| Feature | Status | Next work |
|---|---|---|
| Existing Express app | Present; backend CI test passes | Test on the user's laptop and deployment |
| Story endpoint | Ollama/Gemini provider selection implemented; mocked API tests pass | Verify with a real local Ollama model and a configured Gemini key |
| Cinematic workspace | Initial UI added in studio.html | UX review and modularization |
| Scene planning | AI story response is split into planning cards | Return validated structured scene JSON |
| Character consistency | Reference upload controls exist | Character bible and provider reference support |
| Storyboard image generation | Not connected | Select and integrate image provider |
| AI video generation | Not connected | Select video model/provider and job system |
| Timeline editor | Not connected | Evaluate open-source editor/rendering stack |
| Voice-over and subtitles | Browser English speech only | Server-side TTS, subtitle editor |
| Thumbnail image generation | Not connected | Add image generation and text-safe layout |
| MP4 export | Not connected | Rendering worker and downloadable output |
| YouTube upload | Not connected | OAuth consent and upload flow |

## Immediate next steps

1. Run the local Ollama model and verify the story endpoint end-to-end on the user's laptop.
2. Add a validated JSON schema for scenes, characters, shot direction, and narration.
3. Configure the cloud deployment to use Gemini or another reachable hosted provider; a Vercel function cannot call Ollama on the user's laptop through localhost.
4. Select the first image/video provider after checking hardware, price, region availability, and license.
5. Evaluate candidate open-source editing/rendering projects in isolation before importing dependencies.
