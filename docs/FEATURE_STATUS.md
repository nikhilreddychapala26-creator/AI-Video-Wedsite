# Feature Status

Status as of 2026-11-24. This is a development checklist, not a claim of completed integrations.

| Feature | Status | Next work |
|---|---|---|
| Existing Express app | Present | Audit and test |
| Story endpoint | Present, unverified | Validate Gemini model/config and errors |
| Cinematic workspace | Initial UI added in studio.html | UX review and modularization |
| Local scene outline | Basic browser-side demo | Replace with structured AI scene breakdown |
| Character consistency | Upload preview exists on legacy page | Character bible and provider reference support |
| Storyboard image generation | Not connected | Select and integrate image provider |
| AI video generation | Not connected | Select video model/provider and job system |
| Timeline editor | Not connected | Evaluate open-source editor/rendering stack |
| Voice-over and subtitles | Browser English speech only | Server-side TTS, subtitle editor |
| Thumbnail image generation | Not connected | Add image generation and text-safe layout |
| MP4 export | Not connected | Rendering worker and downloadable output |
| YouTube upload | Not connected | OAuth consent and upload flow |

## Immediate next steps

1. Inspect the complete `api/story.js` file and reconcile it with `server.js`.
2. Test the existing server and story endpoint with a valid API key kept only in environment variables.
3. Decide the first image/video provider based on free-tier limits, output quality, region availability, and license.
4. Evaluate candidate open-source code in isolation before importing dependencies.
