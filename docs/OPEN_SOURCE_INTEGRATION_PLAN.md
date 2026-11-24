# AI Video Studio — Open-Source Integration Plan

## Product direction

Build a browser-based production studio for cinematic films, YouTube long-form videos, and Shorts. The workflow should cover:

1. Idea and story development
2. Script breakdown into scenes
3. Character bible and reusable reference images
4. Storyboard and shot planning
5. Image/video generation through replaceable providers
6. Timeline editing, transitions, titles, subtitles, and audio
7. Thumbnail design
8. MP4 rendering and YouTube-ready export

The visual target is premium, cinematic, and IMAX-inspired. Do not claim that a normal web preview is an actual IMAX master or that generated clips have theatrical IMAX specifications.

## Existing repository observations

- `index.html`: early story input and character image preview.
- `video.html`: story input, browser English speech synthesis, and a call to `/api/story`.
- `server.js`: Express static server and Gemini story-generation endpoint.
- `package.json`: Express and dotenv only.
- `api/story.js`: inspect and repair before relying on it.
- No verified video-rendering pipeline, timeline editor, thumbnail renderer, or YouTube publishing integration exists yet.

The new `studio.html` is a separate workspace foundation. Existing pages are intentionally left unchanged.

## Candidate open-source projects to evaluate

These are candidates, not yet imported dependencies:

- Coji — https://github.com/smadrom/coji
- AI Video Production Editor — https://github.com/LudwigKienle/ai-video-production-editor
- Timeline Studio — https://github.com/MartinDelophy/ai-video-editor

Before copying or integrating any code, verify the repository's current license file, dependencies, maintenance status, security posture, model requirements, and whether the desired feature is actually available. Preserve attribution and license notices. Do not assume a project is production-ready because its README advertises a feature.

## Proposed architecture

- Frontend: keep the current Express app initially; evolve into modular pages/components after a compatibility review.
- Story service: provider adapter for Gemini or another configured LLM; validate input and return structured scenes.
- Asset service: character references, generated stills, thumbnails, and audio metadata.
- Generation adapters: separate interfaces for image and video providers so one vendor can be replaced without rewriting the application.
- Editing/rendering: evaluate an open-source timeline/render engine; perform heavy rendering in a worker or external service, not inside a browser request.
- Export: render MP4 with explicit aspect ratio, resolution, frame rate, audio mix, and captions.
- YouTube: optional OAuth-based upload integration; never request or store a user's Google password.

## Safety, cost, and reliability

- Never commit API keys, OAuth secrets, or `.env` files.
- Use `.env.example` with placeholder variable names only.
- Clearly label mock/demo functionality. Never show a success state for an export or upload that did not happen.
- Open-source software may be free while hosted inference, GPU time, storage, and bandwidth still cost money.
- Prefer local or free-tier options where practical, but disclose hardware and usage limits.
- Add tests for server endpoints and validate uploaded file types and sizes.

## Milestones

### M0 — Safe foundation
- Preserve `main`.
- Work on `feature/open-source-video-studio`.
- Add a separate cinematic workspace and this plan.

### M1 — Repair and structure
- Audit and repair the story endpoint.
- Add request validation, clear error responses, and basic tests.
- Add project/scene JSON schema and persistence strategy.

### M2 — Storyboard
- Convert a story into structured scenes with narration, visual prompt, shot type, duration, and characters.
- Add character bible and reference asset management.

### M3 — Generation
- Integrate one image provider and one video provider behind adapters.
- Show job progress, failures, retries, and cost estimates where available.

### M4 — Editing
- Integrate or build timeline editing, clip trimming, transitions, text, subtitles, music, and voice-over.

### M5 — Delivery
- Generate thumbnails and MP4 exports in 16:9 and 9:16.
- Add YouTube OAuth upload only after explicit user authorization.

## Definition of done

A feature is complete only when it works end-to-end, reports errors accurately, has its required configuration documented, and has been tested. A scene outline is not a generated video; a thumbnail brief is not a thumbnail image; and an export button is not an MP4 until a real render file exists.
