# Contribution Content Guide

This site is now data-driven. New MVP renewal material should be added as content records first; pages, lists, sitemap entries, and MVP summaries are generated from those records.

## Add A 2026 Contribution

Create one file under `content/contributions/2026/`.

Use the legacy URL as the slug so the generated public URL stays stable:

```text
content/contributions/2026/sp2026-MM-DD.yml
legacyPath: /speech/sp2026-MM-DD.html
```

Example:

```yaml
id: "sp2026-05-20"
legacyPath: "/speech/sp2026-05-20.html"
type: "speaking"
date: 2026-05-20
title:
  zh: "活動或演講標題"
  en: ""
event: "活動名稱"
location: "城市或線上"
role: speaker
format: "online"
topics:
  - "AI Agent"
  - "Azure OpenAI"
microsoftProducts:
  - "Azure OpenAI"
links:
  event: "https://example.com/event"
  slides: ""
  recording: ""
evidence:
  - type: "link"
    href: "https://example.com/event"
    label: "活動頁"
summary:
  zh: "一到三句說明這個貢獻的內容、對象、與 Microsoft 技術關聯。"
  en: ""
proofStatus:
  eventLink: ready
language: "zh-Hant"
```

## Evidence Rules

- Use `href` for public links: activity pages, slides, recordings, articles, profile pages.
- Use `src` for images and screenshots.
- Local image paths should start with `/`, for example `/sp-photos/sp2026-05-20-stage.jpg`.
- Every local evidence image must exist in the repository before `npm run validate`.
- External image URLs are allowed, but long-term renewal evidence is safer if mirrored locally or hosted in a controlled storage location.

## Common Contribution Types

- `speaking`: talks, panels, meetup sessions, conference sessions.
- `workshop`: hands-on workshops or training sessions.
- `community`: admin, organizer, mentoring, community operations.
- `writing`: articles, technical posts, published tutorials.
- `book`: books and book chapters.
- `open-source`: samples, libraries, repositories, demos.

## MVP Update Flow

1. Add or update the contribution YAML file.
2. Add any local evidence images to `sp-photos/`, `community-photo/`, or another existing public asset folder.
3. Run `nvm use` from the repo root.
4. Run `npm run validate`.
5. Check `/kokoweb/mvp.html`, `/kokoweb/contributions.html`, and the generated contribution detail page locally.

The hidden helper page `/kokoweb/mvp-2026.html` is marked `noindex`. It is intended as a local update checklist, not as a public SEO landing page.

## URL Policy

- Keep `.html` URLs.
- Do not rename old `legacyPath` values.
- Do not replace `/speech/spYYYY-MM-DD.html` with `/speech/spYYYY-MM-DD/`.
- New content can be added at any time; it does not need to fit an MVP renewal window.
