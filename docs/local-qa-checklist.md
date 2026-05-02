# Local QA Checklist

Use Node from `.nvmrc`:

```bash
nvm use
npm run validate
```

`npm run validate` runs:

- Astro type/content checks.
- Static build.
- Brand image metadata check.
- Static accessibility checks.
- Contribution proof checks.
- Legacy URL existence checks.
- Generated-page local link checks.

## Manual URLs To Inspect

Run the local server:

```bash
npm run dev -- --host 127.0.0.1
```

The `public/` directory contains symlinks to the legacy asset folders, so `astro dev` can serve `/img/*`, `/sp-photos/*`, community evidence images, and passthrough legacy pages without waiting for a production build.

Then inspect:

- `http://127.0.0.1:4321/kokoweb/index.html`
- `http://127.0.0.1:4321/kokoweb/speech.html`
- `http://127.0.0.1:4321/kokoweb/speech/sp2025-03-15.html`
- `http://127.0.0.1:4321/kokoweb/community/community.html`
- `http://127.0.0.1:4321/kokoweb/community/community-2025.html`
- `http://127.0.0.1:4321/kokoweb/contributions.html`
- `http://127.0.0.1:4321/kokoweb/mvp.html`
- `http://127.0.0.1:4321/kokoweb/about.html`
- `http://127.0.0.1:4321/kokoweb/google0d273919ce2cabd0.html`
- `http://127.0.0.1:4321/kokoweb/data-template/pages/index.html`

## Things To Check Visually

- Header navigation keeps the current page highlighted.
- Long English titles and URLs do not overflow on mobile.
- Speech evidence images render and have useful captions.
- MVP page groups recent contributions clearly.
- Homepage brand reads as AI/Microsoft/community first, not old freelance agency first.
- Legacy template URLs still load but are not part of the main navigation or sitemap.

## Current Known Warnings

Some 2019 and early 2020 imported speech records have empty `summary.zh` because the old pages did not contain a reusable summary. They still have evidence and remain valid. Add summaries gradually when those pages are touched.
