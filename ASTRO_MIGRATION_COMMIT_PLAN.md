# KoKo Web Astro Migration Commit Plan

> Status: planning document only.
>
> This document defines a proposed commit-by-commit migration plan. It does not mean these commits have been made.
> Do not run git commands, change the deployment source, or overwrite production files until KoKo explicitly approves the execution phase.

## Goals

- Rebuild the site as a data-driven static site.
- Preserve every existing public URL, especially legacy MVP contribution links.
- Convert old contribution content into structured data, not leave it as unmanaged legacy HTML.
- Make future contribution updates easy: add one content entry and evidence assets, then generate all relevant pages.
- Improve SEO, metadata, sitemap, structured data, accessibility, and mobile layout.
- Reposition the brand from "KoKo Mexcelsa 接案工作室" to "大魔術熊貓工程師 / Ko Ko / Microsoft AI MVP / author / speaker / AI application architect".

## Non-Goals

- Do not enforce whether a contribution belongs to a renewal cycle. New contributions should be publishable whenever they happen.
- Do not change existing public URL formats.
- Do not replace old links with redirect-only pages unless there is no safer alternative.
- Do not depend on a third-party commercial theme.
- Do not merge the separate `magic-panda-engineer.github.io` blog into this site in this migration. Treat it as an external content source and brand reference.

## Hard Constraints

- Existing URLs must remain valid:
  - `/kokoweb/index.html`
  - `/kokoweb/speech.html`
  - `/kokoweb/speech/spYYYY-MM-DD.html`
  - `/kokoweb/community/community-YYYY.html`
  - Existing miscellaneous pages such as `/kokoweb/ans/ask-ans.html` and `/kokoweb/private/account-terms.html`
- Existing `.html` URL style must remain canonical.
- No `/speech/sp2025-03-15/` replacement for `/speech/sp2025-03-15.html`.
- Build must fail if any URL in the legacy URL manifest marked `deploy: true` disappears.
- Existing public files default to `deploy: true`; `deploy: false` is allowed only after an explicit KoKo-approved deprecation or security/privacy decision.
- SEO canonical URLs must point to the preserved `.html` URL, not to a new clean URL.
- Old content must be migrated into structured data before the final cutover.
- Astro source page names must not include `.html.astro` for normal HTML pages. With `build.format: 'file'`, use `src/pages/mvp.astro` to produce `/mvp.html`.
- All internal links and asset URLs must account for `base: '/kokoweb'`; do not hand-code extensionless root-relative URLs that ignore the base path.

## Target Architecture

```text
content/
  contributions/
    2019/
    2020/
    ...
    2026/
  community-periods/
  profile.yml
  books.yml
  external-links.yml

public/
  img/
  sp-photos/
  community-photo/
  ans-photo/
  vendor/
  evidence/
  legacy/

src/
  components/
  layouts/
  pages/
    index.astro
    speech.astro
    speech/[slug].astro
    community/[slug].astro
    mvp.astro
    mvp-2026.astro
    contributions.astro
    sitemap.xml.ts
    robots.txt.ts
    404.astro
  styles/
  utils/
    url.ts

scripts/
  inventory-legacy-urls.mjs
  extract-legacy-speech.mjs
  extract-community-periods.mjs
  check-legacy-urls.mjs
  check-content-proof.mjs
```

Astro configuration requirements:

```js
export default defineConfig({
  site: 'https://kokomexcelsa.github.io',
  base: '/kokoweb',
  trailingSlash: 'never',
  build: {
    format: 'file'
  }
});
```

`build.format: 'file'` is required so generated pages keep `.html` output semantics. In this mode Astro also sets `Astro.url.pathname` with `.html`, which should be used when generating canonical and `og:url` values.

Astro version and content loading decision:

- Use the current stable Astro major at implementation time, pinned in `package.json` and the lockfile.
- For Astro 6, use Node `22.12.0` or higher and record it in `.nvmrc` plus `package.json` `engines`.
- Use the Astro Content Layer API in `src/content.config.ts`.
- Keep content files at repo-root `content/` only if every collection uses an explicit `glob({ base: './content/...' })` loader.
- Do not rely on legacy content collection behavior or `Astro.glob()`.
- Generate `/sitemap.xml` with a custom `src/pages/sitemap.xml.ts` endpoint. Do not use `@astrojs/sitemap` for this site because that integration emits `sitemap-index.xml` and numbered sitemap files, while the legacy public URL is `/kokoweb/sitemap.xml`.

Official Astro docs checked for these decisions:

- Pages and file-based routing: https://docs.astro.build/en/basics/astro-pages/
- `base`, `trailingSlash`, `build.format`, and `Astro.url.pathname`: https://docs.astro.build/en/reference/configuration-reference/
- Content collections and `glob()` loaders: https://docs.astro.build/en/guides/content-collections/
- Static endpoints such as `sitemap.xml.ts`: https://docs.astro.build/en/guides/endpoints/
- Sitemap integration output behavior: https://docs.astro.build/en/guides/integrations-guide/sitemap/
- GitHub Pages deployment workflow: https://docs.astro.build/en/guides/deploy/github/
- Astro v6 Node requirement: https://docs.astro.build/en/guides/upgrade-to/v6/

## Content Model

Each contribution should support this shape:

```yaml
id: sp2025-03-15
legacyPath: /speech/sp2025-03-15.html
type: speaking
title:
  zh: AI Agent 的基礎：Tool Call
  en: "The Basic of AI Agent: Tool Call"
date: 2025-03-15
event: Global AI Bootcamp Taipei 2025
location: 台北大學民生校區
role: speaker
format: in-person
topics:
  - AI Agent
  - Azure OpenAI
  - OpenAI Agents SDK
microsoftProducts:
  - Azure OpenAI
links:
  event: https://www.accupass.com/event/2502151309037693459180
  recording: ''
  slides: ''
evidence:
  - type: screenshot
    src: https://magicpandaengineer.blob.core.windows.net/img/sp-photos/sp20250315-url-1.png
    alt: Global AI Bootcamp Taipei 2025 activity page screenshot
summary:
  zh: ''
  en: ''
impact:
  audience: null
  views: null
  notes: ''
proofStatus:
  eventLink: ready
  screenshot: ready
  photo: optional
```

Core required fields during migration:

- `id`
- `legacyPath`
- `type`
- `date`
- `title`

Fields such as `summary`, `links`, `evidence`, `topics`, `microsoftProducts`, `impact`, and `proofStatus` must be supported but may be empty during the first import pass. Missing proof should be visible in the UI and validation report; it should not block a build unless the record explicitly marks the proof as required.

Bilingual strategy:

- Default page language is Traditional Chinese (`zh-Hant`).
- English fields are stored where available for future reuse, external sharing, and richer metadata.
- Initial generated pages show Chinese as the primary language and may show English as secondary text where it improves recognition.
- Do not add `/en/...` routes or `hreflang` in this migration, because that would introduce a new URL strategy outside the legacy preservation goal.

Supported contribution types:

- `speaking`
- `workshop`
- `community`
- `writing`
- `book`
- `media`
- `open-source`
- `research`
- `certification`
- `mentoring`

Community period records should use a separate collection because they represent annual summary pages, not single contributions:

```yaml
id: community-2025
legacyPath: /community/community-2025.html
year: 2025
period:
  start: 2024-04-01
  end: 2025-03-31
title:
  zh: 202404-202503 社群活動規畫整理
sections:
  - communityId: ai-tech
    role: admin
    summary: ''
    evidence: []
    relatedContributionIds: []
sitemap: true
noindex: false
```

## Commit Sequence

### Commit 01: `docs: add migration execution plan`

Purpose:

- Add this planning document.
- Establish constraints before any code migration starts.

Expected changes:

- `ASTRO_MIGRATION_COMMIT_PLAN.md`

Verification:

- Confirm the document states that legacy URLs are immutable.
- Confirm the document states that git execution requires KoKo approval.

Rollback:

- Remove the planning document only.

### Commit 02: `chore: add legacy URL inventory`

Purpose:

- Capture the current public URL contract before changing anything.

Expected changes:

- Add `legacy-url-manifest.json`.
- Add `legacy-public-file-manifest.json` if non-HTML public files need explicit deployment decisions.
- Add `scripts/inventory-legacy-urls.mjs`.
- Include every existing `.html` file currently served by GitHub Pages.
- Include important non-HTML public files that must not be lost at cutover, especially `sitemap.xml`, `google0d273919ce2cabd0.html`, root images such as `pohu.JPG`, and any intentionally served downloads.

Details:

- The manifest should record:
  - path
  - source file
  - content category
  - migration status
  - intended canonical URL
  - whether it should appear in sitemap
  - whether it is safe to noindex
  - whether it is deployable after cutover

Example:

```json
{
  "path": "/speech/sp2025-03-15.html",
  "source": "speech/sp2025-03-15.html",
  "category": "speech-detail",
  "migrationStatus": "pending",
  "sitemap": true,
  "noindex": false,
  "deploy": true,
  "canonical": "https://kokomexcelsa.github.io/kokoweb/speech/sp2025-03-15.html"
}
```

Special cases:

- `google0d273919ce2cabd0.html`: `category: "search-verification"`, `sitemap: false`, `deploy: true`.
- `index-old.html`: keep the URL alive unless KoKo approves deprecation; default to `noindex`.
- `fix.patch`: proposed `deploy: false`, but removal from public output requires KoKo approval because it changes an existing public file URL.
- `sitemap.xml`: preserve the URL and regenerate it from the new source of truth.

Verification:

- Manifest count equals current HTML file count.
- Public file manifest covers the special root files listed above.
- Spot check important MVP URLs.
- No URL normalization that removes `.html`.

Rollback:

- Remove the manifest and inventory script.

### Commit 03: `chore: scaffold astro in parallel`

Purpose:

- Add Astro without affecting the current live static files.
- Keep migration work isolated until cutover.

Expected changes:

- `package.json`
- package lockfile for the chosen package manager
- `.nvmrc`
- `astro.config.mjs`
- `tsconfig.json`
- `src/pages/index.astro` placeholder
- `src/layouts/BaseLayout.astro`
- `src/styles/global.css`

Important:

- The placeholder page must not replace production output yet.
- Astro output should build into `dist/` only.
- Existing root HTML remains untouched in this commit.
- Pin Astro to the current stable major and avoid floating unreviewed major upgrades.
- For Astro 6, set `.nvmrc` to `22.12.0` and `package.json` `engines.node` to `>=22.12.0`.
- Prefer `npm` unless there is a reason to introduce another package manager.

Verification:

- `npm run build` creates `dist/index.html`.
- Output URLs include `.html`.
- `node -v` satisfies the pinned engine requirement.
- No legacy root file is deleted.

Rollback:

- Remove Astro scaffold files.

### Commit 04: `chore: prepare static assets for astro public output`

Purpose:

- Prepare Astro to serve current assets at the same public paths.

Expected changes:

- Add only the assets that the Astro build must serve from `dist/`:
  - `img/`
  - `sp-photos/`
  - `community-photo/`
  - `ans-photo/`
  - `vendor/`
  - any still-needed CSS/JS during migration

Notes:

- Keep asset URLs compatible with old pages.
- Do not optimize or rename assets in this commit.
- Do not permanently duplicate the full historical asset tree in two tracked locations if the cutover can be done with a tracked move.
- During pre-cutover work, keep the current production root assets untouched unless work is isolated from the deployed branch.
- At cutover, prefer move semantics over copy semantics so repository history does not retain two active copies of the same large asset folders.
- If an old path is still referenced after cutover, update generated references in the same commit that moves the asset.

Verification:

- Current asset paths still map to the same URLs.
- Important images used by old speech pages resolve under `dist/`.
- Repository does not carry an unnecessary second copy of large asset folders after cutover.

Rollback:

- Restore the previous asset location and generated references.

### Commit 05: `feat(content): add contribution schema`

Purpose:

- Define the structured content contract.
- Make missing critical fields fail at build time.

Expected changes:

- `src/content.config.ts`.
- Schema for contributions.
- Schema for community period summary pages.
- Schema for profile, books, and external links if using data collections.
- Explicit `glob()` loaders for root-level content directories, for example `glob({ pattern: '**/*.{md,mdx,yml,yaml,json}', base: './content/contributions' })`.

Required validation:

- `id`
- `legacyPath`
- `type`
- `date`
- `title`

Allowed optional fields:

- `summary`
- `links`
- `evidence`
- `topics`
- `microsoftProducts`
- `impact.audience`
- `impact.views`
- `proofStatus`
- `recording`
- `slides`
- `photo`
- `language`

Do not validate:

- Whether the date falls inside a renewal cycle.
- Whether optional proof fields are complete during the first import pass.

Community period schema:

- Required: `id`, `legacyPath`, `year`, `title`, `sections`.
- Optional: `period.start`, `period.end`, `sitemap`, `noindex`, `relatedContributionIds`.

Language policy:

- Store `title.zh` as required.
- Store `title.en` and `summary.en` as optional.
- Do not create separate localized routes in this migration.

Verification:

- A sample contribution builds.
- Invalid sample missing `legacyPath` fails.
- Invalid sample missing `date` fails.
- A list-only imported speech record with empty `summary`, `links`, `evidence`, `topics`, and `microsoftProducts` still builds.
- A sample community period record builds.

Rollback:

- Remove content schema and sample data.

### Commit 06: `feat(brand): add profile and brand data`

Purpose:

- Centralize brand information.
- Avoid repeating contact, title, and social links in every page.

Expected changes:

- `content/profile.yml`
- `content/external-links.yml`
- Optional `content/books.yml`

Brand positioning:

```yaml
name:
  zh: 大魔術熊貓工程師
  en: Magic Panda Engineer
personName:
  zh: 柯克 Ko Ko
  en: Ko Ko (Kirk)
headline:
  zh: Microsoft AI MVP、生成式 AI 作者、技術講者與 AI 應用架構顧問
  en: Microsoft AI MVP, author, speaker, and AI application architect
```

Important links:

- Microsoft MVP profile
- Linktree
- GitHub
- Google Scholar
- Technical blog
- Facebook page
- Credly
- Slideshare

Verification:

- All global links come from one data source.
- No page hardcodes the old "接案工作室" title except in legacy historical context.

Rollback:

- Remove profile data.

### Commit 07: `feat(ui): implement base layout and design tokens`

Purpose:

- Create the new visual foundation without migrating content yet.

Expected changes:

- `src/layouts/BaseLayout.astro`
- `src/components/SiteHeader.astro`
- `src/components/SiteFooter.astro`
- `src/pages/404.astro`
- `src/utils/url.ts`
- `src/styles/tokens.css`
- `src/styles/global.css`

Design direction:

- Professional AI MVP / author / speaker identity.
- Keep "大魔術熊貓工程師" character, but do not make the site cartoonish.
- Palette:
  - ink black
  - clean white
  - Azure blue
  - pohutukawa red
  - restrained green accent

Verification:

- Layout supports desktop and mobile.
- Header does not overflow on small widths.
- Footer uses current year dynamically or from one config value.
- No third-party template code is copied.
- `src/utils/url.ts` exposes one helper for base-aware internal URLs, such as `withBase('/speech.html')`.
- All header/footer links and asset references use the helper or `import.meta.env.BASE_URL`, not ad hoc root-relative paths.
- Custom `404.html` builds and uses the same brand system.

Rollback:

- Remove new layout and styles.

### Commit 08: `feat(content): import legacy speech list`

Purpose:

- Convert the current hardcoded speech tables into structured data.

Expected changes:

- `content/contributions/2019/*.md`
- `content/contributions/2020/*.md`
- `content/contributions/2021/*.md`
- `content/contributions/2022/*.md`
- `content/contributions/2023/*.md`
- `content/contributions/2024/*.md`
- `content/contributions/2025/*.md`

Scope:

- Every row currently in `index.html` and `speech.html`.
- Preserve existing `spYYYY-MM-DD` IDs.
- Preserve existing detail page path in `legacyPath`.

Verification:

- Count of `speaking` records equals the old table count.
- Each speech record has a matching existing or planned detail URL.
- Known records match old content:
  - `sp2025-03-15`
  - `sp2024-12-14`
  - `sp2024-09-12`
  - `sp2023-12-10`
  - `sp2019-01-05`

Rollback:

- Remove imported speech content.

### Commit 09: `feat(content): import legacy speech detail evidence`

Purpose:

- Migrate each old speech detail page into structured data.

Expected changes:

- Update each speech content file with:
  - zh/en summary
  - event links
  - recording links
  - slides links
  - screenshot/photo evidence
  - image alt text
  - role and location

Details:

- Extract from all `speech/sp*.html`.
- Preserve external evidence URLs if assets are hosted outside the repo.
- Where images are local, keep paths compatible.

Verification:

- Every old speech detail page has a corresponding content entry.
- At least one evidence item exists when old page had evidence.
- No image path is accidentally changed.
- Manual review for all 2024 and 2025 records.

Rollback:

- Revert detail-field additions only.

### Commit 10: `feat(content): import community contribution pages`

Purpose:

- Convert existing community pages into structured content.

Expected changes:

- `content/community-periods/*.yml` for annual summary pages.
- `content/contributions/community/*.md` only for single dated community contributions that should appear in the global contribution database.
- Records for:
  - AI Tech admin
  - Chatbot Taiwan core member
  - LangChain Developers Taiwan admin
  - Global AI in Taiwan organizer/core member
  - COSCUP co-organizer community entries where applicable

Verification:

- `community/community.html`
- `community/community-2021.html`
- `community/community-2022.html`
- `community/community-2024.html`
- `community/community-2025.html`

all have corresponding generated pages or migrated structured entries.
- Annual pages are modeled as `community-periods`, not overloaded as one fake contribution record.
- Dated activities inside annual pages can reference individual contribution IDs when useful.

Rollback:

- Remove imported community content.

### Commit 11: `feat(content): add books, writing, and external authority records`

Purpose:

- Bring the current brand evidence from Linktree and blog references into the site.

Expected changes:

- `content/books.yml`
- `content/writing.yml` or contribution entries of type `writing`
- External authority links:
  - technical blog
  - iThome Ironman series
  - books on Tenlong
  - Google Scholar
  - Microsoft MVP page
  - Hello World speaker page

Verification:

- Book count matches the publicly stated current positioning.
- Links are external and open safely.
- This content does not replace the technical blog; it links to it.

Rollback:

- Remove books/writing records.

### Commit 12: `feat(routes): generate URL-compatible speech pages`

Purpose:

- Generate all old speech detail URLs from structured content.

Expected changes:

- `src/pages/speech/[slug].astro`
- `src/components/ContributionDetail.astro`
- `src/components/EvidenceGallery.astro`

Output requirement:

- `/speech/sp2025-03-15.html`
- not `/speech/sp2025-03-15/`

Verification:

- Every `legacyPath` for speech type exists in `dist/`.
- Randomly compare old vs new content for at least 10 pages.
- Important external links still present.

Rollback:

- Remove generated route and keep old static pages untouched until cutover.

### Commit 13: `feat(routes): generate speech index from content`

Purpose:

- Replace duplicated hardcoded speech list with one generated page.

Expected changes:

- `src/pages/speech.astro`
- `src/components/ContributionTable.astro`
- `src/components/YearSection.astro`

Requirements:

- URL remains `/speech.html`.
- Sort descending by date.
- Group by year.
- Provide filters only if they do not harm mobile usability.

Verification:

- Count matches imported speech records.
- All row links point to `.html` detail pages.
- Table is usable on mobile, preferably card layout below tablet width.

Rollback:

- Remove generated speech index.

### Commit 14: `feat(routes): generate community pages`

Purpose:

- Generate existing community URLs from content.

Expected changes:

- `src/pages/community/[slug].astro`
- `src/components/CommunityEvidenceSection.astro`
- Query `content/community-periods/` for annual pages and `content/contributions/` only for linked single contributions.

Output requirement:

- `/community/community-2025.html`
- `/community/community-2024.html`
- `/community/community-2022.html`
- `/community/community-2021.html`
- `/community/community.html`

Verification:

- All old community URLs exist.
- Existing screenshots are still visible.
- Page titles reflect their original periods while using the new visual system.

Rollback:

- Remove community route generation.

### Commit 15: `feat(routes): generate new contribution hub`

Purpose:

- Add the new long-term contribution database view.

Expected changes:

- `src/pages/contributions.astro`
- `src/components/ContributionFilters.astro`
- `src/components/ContributionCard.astro`

Features:

- Filter by year.
- Filter by contribution type.
- Filter by Microsoft product.
- Filter by topic.
- Show proof status.
- Do not filter by renewal-cycle eligibility.

Verification:

- New page builds.
- All contribution types appear.
- Filtering works without breaking no-JS fallback, or page remains usable without filtering.

Rollback:

- Remove contribution hub route.

### Commit 16: `feat(routes): add MVP evidence pages`

Purpose:

- Add reviewer-friendly MVP contribution summaries.

Expected changes:

- `src/pages/mvp.astro`
- Optional `src/pages/mvp-2026.astro`
- `src/components/MvpSummaryStats.astro`
- `src/components/ProofChecklist.astro`

Route naming:

- `src/pages/mvp.astro` builds `/mvp.html` under `build.format: 'file'`.
- Do not create `src/pages/mvp.html.astro`, which would make the route source ambiguous and can produce an unwanted `.html.html` path.

Content:

- Speaking summary.
- Writing summary.
- Book summary.
- Community leadership summary.
- Open source / sample code summary if available.
- Media / external recognition if available.

Rules:

- Do not hide contributions because they are outside a renewal cycle.
- Show all content chronologically and by type.
- Optionally provide year filters.

Verification:

- MVP page links to original preserved detail URLs.
- Each important contribution has an event/proof link if available.
- Missing proof is visible for maintenance, not a build blocker unless the content declares `proofStatus` as required.

Rollback:

- Remove MVP pages.

### Commit 17: `feat(home): rebuild homepage with new brand`

Purpose:

- Replace the old "接案工作室" home positioning with the current public identity.

Expected changes:

- `src/pages/index.astro`
- `src/components/HomeHero.astro`
- `src/components/FeaturedContributions.astro`
- `src/components/BookShelf.astro`
- `src/components/SpeakingHighlights.astro`

Homepage message:

```text
大魔術熊貓工程師 Ko Ko
Microsoft AI MVP, author, speaker, and AI application architect.
```

Important:

- URL remains `/index.html`.
- The root `/kokoweb/` should still serve the same homepage if GitHub Pages maps it.
- Keep the old Pohutukawa / Mexcelsa story in About, not as the primary homepage message.
- The preserved URL can have rewritten content. After cutover, `dist/index.html` serves `/kokoweb/index.html`; the old static `index.html` should only remain in a non-served archive if retained.
- Replace prominent phone-number contact UI with email and maintained social/profile links in the regenerated page.

Verification:

- Homepage title and meta no longer say only "接案工作室".
- Main CTA links to:
  - MVP contributions
  - speaking
  - books/writing
  - contact

Rollback:

- Remove generated homepage route.

### Commit 18: `feat(about): rebuild about and brand story`

Purpose:

- Preserve KoKo Mexcelsa and 大魔術熊貓工程師 history while modernizing the profile.

Expected changes:

- `src/pages/about.astro` or section on homepage.
- `src/components/ProfileTimeline.astro`
- `src/components/IdentityStory.astro`

Content strategy:

- Explain `KoKo Mexcelsa` origin and Pohutukawa story.
- Explain `大魔術熊貓工程師` as the public technical content brand.
- State current professional identity:
  - Microsoft AI MVP
  - author
  - speaker
  - LLM / Azure OpenAI / AI Agent practitioner
  - community contributor

Verification:

- Tone is professional but still personal.
- Avoid overusing old freelance framing.

Rollback:

- Remove new About route/components.

### Commit 19: `feat(seo): add metadata, sitemap, robots, and structured data`

Purpose:

- Make the rebuilt site SEO-friendly and machine-readable.

Expected changes:

- `src/components/Seo.astro`
- `src/utils/seo.ts`
- `src/pages/sitemap.xml.ts`
- `src/pages/robots.txt.ts`
- JSON-LD helpers:
  - `Person`
  - `Event` only for future or recent talks where event markup is still meaningful
  - `Article`
  - `Book`
  - `BreadcrumbList`

Requirements:

- Canonical uses existing `.html` URL.
- This is a new canonical implementation; do not assume legacy pages already had correct canonical tags.
- Do not copy legacy `og:url` values. Generate `og:url` from the generated page URL, using `Astro.url.pathname` plus the configured site/base.
- OG image is specific per important page where possible.
- Old low-value template demo pages can be `noindex`.
- Main contribution pages are included in sitemap.
- Generate the legacy `/sitemap.xml` URL with the custom endpoint. Do not use `@astrojs/sitemap` in this migration because it emits a sitemap index and numbered files.
- `robots.txt` points to `https://kokomexcelsa.github.io/kokoweb/sitemap.xml`.
- `Event` JSON-LD should only be applied to future talks and recent talks within roughly 12 months. Older talk pages should prefer `Article`, `CreativeWork`, or plain `Person`/`BreadcrumbList` context.

Verification:

- Sitemap contains old important URLs and new hub URLs.
- Canonical for `/speech/sp2025-03-15.html` points to `/speech/sp2025-03-15.html`.
- `og:url` for `/speech/sp2025-03-15.html` points to `/kokoweb/speech/sp2025-03-15.html`, not `/kokoweb/index.html`.
- No canonical points to extensionless routes.
- `/kokoweb/sitemap.xml` exists; no plan depends on `/kokoweb/sitemap-index.xml`.

Rollback:

- Remove SEO component and generated sitemap.

### Commit 20: `feat(assets): add brand-safe OG images and cleaned profile assets`

Purpose:

- Replace generic old OG image usage.
- Avoid leaking EXIF/GPS data in newly published brand images.

Expected changes:

- `public/og/`
- cleaned profile images if needed
- brand image metadata

Rules:

- Keep old images available for legacy references.
- New profile/OG images should have no GPS EXIF.
- Do not remove historical evidence images.
- Prefer `exiftool -all= -overwrite_original <file>` for newly created brand/OG image copies, then verify metadata is gone.

Verification:

- `exiftool -gps:all -a -G1 -s <file>` or equivalent image metadata tooling confirms cleaned new images.
- Key pages have meaningful OG image.

Rollback:

- Remove new OG/profile assets.

### Commit 21: `fix(a11y): improve accessibility and responsive behavior`

Purpose:

- Ensure the rebuilt site is accessible and works on mobile.

Expected changes:

- Improve semantic headings.
- Replace table-only mobile layout with responsive cards if needed.
- Add meaningful `alt` text.
- Improve keyboard focus states.
- Ensure skip link works.
- Ensure color contrast.

Verification:

- Lighthouse targets on representative pages:
  - Performance >= 80
  - Accessibility >= 90
  - SEO >= 95
- Manual keyboard navigation.
- Mobile viewport checks for:
  - homepage
  - speech list
  - speech detail
  - community page
  - MVP page

Rollback:

- Revert accessibility-specific styling/components if necessary.

### Commit 22: `chore: preserve low-value legacy pages`

Purpose:

- Keep miscellaneous old URLs alive without giving them SEO weight.

Expected changes:

- Routes or static passthrough for:
  - `ans/ask-ans.html`
  - `private/account-terms.html`
  - `blog-template/blogT.html`
  - `cart-template/cartT.html`
  - `company-template/companyT.html`
  - `data-template/dataT.html`
  - `index-old.html`
  - `google0d273919ce2cabd0.html`
  - root public assets such as `pohu.JPG` if they are still referenced or intentionally public

Strategy:

- If a page is still meaningful, migrate it to Astro.
- If a page is only legacy/demo, copy as static passthrough and add `noindex` if safe.
- Keep the Google verification file as a static passthrough and exclude it from sitemap.
- Decide explicitly whether `fix.patch` should be deployed. Default recommendation: mark it `deploy: false`, but do not remove it from public output without KoKo approval.
- Do not delete any old public URL until there is an explicit deprecation decision.

Verification:

- All old miscellaneous URLs marked `deploy: true` still exist.
- Low-value template pages are excluded from sitemap.

Rollback:

- Restore passthrough legacy pages.

### Commit 23: `test: add legacy URL and content integrity checks`

Purpose:

- Prevent future regressions after all planned legacy passthrough pages exist.

Expected changes:

- `scripts/check-legacy-urls.mjs`
- `scripts/check-content-proof.mjs`
- `scripts/check-links.mjs`
- package scripts:
  - `check:legacy-urls`
  - `check:content`
  - `check:links`
  - `validate`

Checks:

- Every path in `legacy-url-manifest.json` with `deploy: true` exists in `dist/`.
- Every generated contribution detail has a canonical URL.
- Every contribution has title/date/type/legacyPath.
- Internal links resolve.
- Evidence asset references are valid where local.
- Warn when old-vs-new extracted plain text length differs by more than 30% for migrated speech/community pages, so accidental content loss is visible.
- Assert sitemap exclusion for `sitemap: false` entries such as verification files and low-value demos.

Do not check:

- Whether contribution dates fall inside a renewal cycle.

Verification:

- `npm run validate` fails when a manifest URL is missing.
- `npm run validate` passes on the complete rebuilt site.

Rollback:

- Remove validation scripts.

### Commit 24: `qa: reconcile migrated content with legacy site`

Purpose:

- Correct extraction errors before cutover.

Expected changes:

- Content corrections only.
- No route architecture changes.

Manual QA checklist:

- Compare every 2024 and 2025 speech detail page, with the exact file list generated from `legacy-url-manifest.json` into `docs/migration-qa.md`.
- Compare all community pages.
- Spot check 2019-2023 speech pages.
- Verify all external links in recent contributions.
- Verify old phone/email handling.
- Verify brand links:
  - Linktree
  - Blog
  - GitHub
  - Microsoft MVP profile
  - Google Scholar
  - Credly

Verification:

- QA notes stored in `docs/migration-qa.md`.
- All P0/P1 content mismatches fixed.

Rollback:

- Revert individual content corrections if incorrect.

### Commit 25: `perf: optimize images and remove unsafe metadata for new assets`

Purpose:

- Improve performance without breaking old evidence references.

Expected changes:

- Optimized derivatives for new brand images.
- Image size guidelines in docs.
- Do not destructively overwrite historical evidence images unless approved.

Verification:

- Homepage image weight acceptable.
- No newly generated brand image contains GPS EXIF.
- Old evidence still loads.
- Use the same EXIF verification command as Commit 20 for all optimized brand derivatives.

Rollback:

- Remove optimized derivatives and fall back to original assets.

### Commit 26: `ci: add build and validation workflow`

Purpose:

- Ensure every future change keeps legacy URLs and content valid.

Expected changes:

- `.github/workflows/validate.yml`

Workflow:

- install dependencies
- build Astro
- run `npm run validate`
- upload build artifact for preview if desired

Important:

- This is validation only, not production deployment.

Verification:

- Workflow passes on the branch.
- Workflow fails if a legacy URL is removed.

Rollback:

- Remove validation workflow.

### Commit 27: `ci: add GitHub Pages deployment workflow`

Purpose:

- Prepare deployment from generated Astro output.

Expected changes:

- `.github/workflows/deploy.yml`
- `public/.nojekyll`

Requirements:

- Use the official Astro GitHub Action plus GitHub Pages deploy action unless there is a repository-specific reason not to.
- Deploy the generated Astro artifact from `dist/`.
- Keep GitHub Pages URL path `/kokoweb/`.
- Build uses the same `base: '/kokoweb'` config.
- Workflow includes `permissions: contents: read`, `pages: write`, and `id-token: write`.
- Workflow includes `concurrency` for Pages deployment so overlapping deploys do not race.
- Workflow uses the same Node version as `.nvmrc`.
- The chosen package manager lockfile is committed so the Astro action does not guess dependencies differently in CI.

Manual deployment prerequisite:

- Repository GitHub Pages settings must be switched to GitHub Actions at cutover time.
- Do not perform this setting change until KoKo approves.
- Before changing the production Pages source, run the same workflow in a fork, protected branch, or manual preview context and confirm `npm run validate` passes against the artifact.

Verification:

- Build artifact contains `index.html`, `speech.html`, and all legacy speech/community pages.
- Deploy workflow can be tested on a non-production branch or fork first if available.
- Artifact includes `.nojekyll`.

Rollback:

- Disable deployment workflow.
- Switch Pages source back to previous configuration if cutover has happened.

### Commit 28: `release: cut over to astro-generated site`

Purpose:

- Production cutover after all validation passes.

Expected changes:

- Finalize deployment workflow.
- Archive old root static files if the deployment model no longer serves them directly.
- Keep old source in `legacy/` or a documented archive location if useful.
- After cutover, public URLs such as `/kokoweb/index.html` and `/kokoweb/speech.html` are served by generated `dist/` files. Old source files are retained only as non-served history if retained at all.

Cutover checklist:

- KoKo approval obtained.
- `npm run validate` passes.
- GitHub Pages source change approved.
- Rollback reference recorded before cutover; if KoKo approves git operations during execution, create a `pre-astro-cutover` tag.
- Current production site snapshot saved.
- Legacy URL manifest passes against final `dist/`.
- Sitemap reviewed.
- Home, speech, community, and MVP pages manually checked.
- Preview/fork workflow artifact has already passed validation before switching GitHub Pages source.

Verification after deployment:

- Visit:
  - `/kokoweb/`
  - `/kokoweb/index.html`
  - `/kokoweb/speech.html`
  - `/kokoweb/speech/sp2025-03-15.html`
  - `/kokoweb/community/community-2025.html`
  - `/kokoweb/mvp.html`
- Confirm no visual asset 404.
- Confirm canonical and OG metadata.

Rollback:

- Revert Pages source to previous static root deployment.
- Restore previous production snapshot if needed.

### Commit 29: `docs: add contribution update guide`

Purpose:

- Make future updates easy without rereading implementation details.

Expected changes:

- `docs/add-contribution.md`
- `docs/evidence-assets.md`
- `docs/url-policy.md`

Guide should explain:

- How to add a new talk.
- How to add a new community contribution.
- How to add a new book/writing/media item.
- Where to put screenshots.
- Which fields are required for build (`id`, `legacyPath`, `type`, `date`, `title`) and which fields are required for high-quality MVP evidence.
- How to run validation.
- Why `.html` URLs must be preserved.

Verification:

- A new sample draft contribution can be added by following the guide.

Rollback:

- Remove docs if incorrect.

### Commit 30: `chore: post-launch cleanup`

Purpose:

- Clean up only after production stability is confirmed.

Expected changes:

- Remove unused old CSS/JS only if not referenced.
- Remove duplicate template assets only if no legacy page needs them.
- Document intentionally retained legacy assets.

Rules:

- Do not delete historical evidence images.
- Do not delete old pages without a separate approved deprecation plan.
- Do not rename URLs.

Verification:

- Legacy URL check still passes.
- Link checker still passes.
- Visual spot checks still pass.

Rollback:

- Restore deleted assets/pages.

## Final Acceptance Criteria

The migration is complete only when all items below are true:

- Every URL in `legacy-url-manifest.json` returns a valid page.
- All important legacy contribution pages are generated from structured content.
- `index.html` and `speech.html` no longer maintain duplicated hand-coded speech tables.
- New contributions can be added once and appear in all relevant generated views.
- Canonical URLs preserve `.html`.
- `og:url` is generated per page and no longer points every page to `/kokoweb/index.html`.
- Sitemap is generated and excludes low-value legacy demos.
- `/kokoweb/sitemap.xml` remains the sitemap URL.
- Homepage brand no longer presents the site primarily as a freelance studio.
- Site clearly presents:
  - 大魔術熊貓工程師
  - Ko Ko / Kirk
  - Microsoft AI MVP
  - author
  - speaker
  - AI / LLM / Azure OpenAI practitioner
- Mobile layout is usable.
- Basic accessibility checks pass.
- Lighthouse representative-page targets are met: Performance >= 80, Accessibility >= 90, SEO >= 95.
- No third-party commercial template dependency is introduced.
- New brand images do not contain unsafe EXIF/GPS metadata.
- GitHub Pages cutover has an approved rollback path.

## Risk Register

### Risk: `.html` URLs accidentally become directory URLs

Mitigation:

- Use Astro `build.format: 'file'`.
- Use source filenames such as `mvp.astro`, `speech.astro`, and `contributions.astro`, not `mvp.html.astro`.
- Add legacy URL validation.
- Canonical tests check `.html` URLs.

### Risk: old content extraction loses details

Mitigation:

- Import first, then manual QA.
- Prioritize 2024-2026 pages for full review.
- Keep old source files available during migration.

### Risk: image paths break

Mitigation:

- Prepare assets for `public/` without renaming public URL paths.
- Avoid keeping duplicate tracked asset trees after cutover; prefer move semantics once execution is approved.
- Link checker validates local image paths.
- External evidence URLs are preserved unless intentionally downloaded.

### Risk: SEO drop after cutover

Mitigation:

- Preserve URLs.
- Preserve canonical `.html` routes.
- Generate `/sitemap.xml`.
- Generate per-page `og:url` values instead of importing old incorrect metadata.
- Avoid redirect-only replacements.
- Add structured data.
- Keep content substance, not just summaries.

### Risk: brand becomes too playful

Mitigation:

- Use 大魔術熊貓工程師 as brand name, but keep visual system professional.
- Use panda/magic references as subtle identity cues, not primary decorative theme.
- Do not use animal emoji as primary navigation, oversized cartoon mascots, brush-style novelty typography, or a playful palette that weakens the MVP/author/speaker positioning.

### Risk: phone number privacy

Mitigation:

- Replace prominent phone display with email/social/contact links in new pages.
- Preserve old URLs by regenerating safer content; do not keep old static files publicly served just to preserve the URL.

### Risk: deployment source change causes outage

Mitigation:

- Validate `dist/` before switching.
- Keep current static source recoverable.
- Cut over only after approval.
- Document rollback.

### Risk: content collections drift because Astro docs changed

Mitigation:

- Pin Astro major and Node version in Commit 03.
- Use `src/content.config.ts`, `glob()` loaders, and `astro/zod` imports from the current official docs.
- Avoid legacy collection APIs and `Astro.glob()`.

### Risk: RSS/feed is expected later

Mitigation:

- Treat RSS as a post-migration backlog item unless KoKo explicitly prioritizes it.
- Keep the content model rich enough that a future feed can be generated without URL changes.

## Recommended Execution Policy

- Do not squash commits during implementation. The sequence is designed for review and rollback.
- Execute migration work away from the currently deployed source until cutover is approved.
- Run validation after every content import and every routing commit.
- Do not combine content extraction, UI redesign, and deployment cutover in one commit.
- The final cutover commit should be small and reversible.
