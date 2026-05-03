# Roberto Zúñiga — Portfolio
<<<<<<< HEAD
 
A custom-built, design-engineering portfolio. Live at **[robertotestcs50.github.io](https://robertotestcs50.github.io/)**.
 
Designed and engineered by Roberto Zúñiga.
 
=======

Personal portfolio of Roberto Zúñiga, Designer, Engineer.

**Live site**: [https://robertozuniga.github.io](https://robertozuniga.github.io)

Built with Astro 5, Tailwind CSS v4, React 19, and Framer Motion.

>>>>>>> ff12c50 (Honest press callout, real impact numbers, footer fix, accent metrics)
---
 
## What this is
 
A static, dark-mode editorial portfolio with deep interactive layers most student portfolios don't have. Built to signal a designer-engineer hybrid identity: every interaction is intentional, every piece of code is hand-written or hand-reviewed, every detail serves a narrative purpose.
 
The site has two modes — a calm "site view" for first-time visitors who want to read about the work, and a "dev view" that turns the same data into an interactive 3D globe and chronological timeline.
 
---
 
## Live URLs
 
- **Site:** https://robertotestcs50.github.io/
- **GitHub repo:** https://github.com/Robertotestcs50/Robertotestcs50.github.io
- **Guestbook backend:** Cloudflare Worker at `guestbook.robertozuca27.workers.dev`
---
 
## Tech stack
 
| Layer | Choice |
|---|---|
| Framework | Astro 5 (static site, content collections, view transitions) |
| Styling | Tailwind CSS v4 (configured via `@theme` in CSS, no `tailwind.config.js`) |
| Content | MDX with strict TypeScript schemas |
| Interactivity | React 19 islands (`client:visible`, `client:idle`, `client:load`) |
| Animation | Framer Motion + custom Canvas 2D + Three.js (for the globe) |
| Typography | Geist Sans + Geist Mono (self-hosted via `@fontsource-variable`) |
| Icons | Lucide React |
| Deployment | GitHub Pages via GitHub Actions |
| Backend (guestbook) | Cloudflare Workers + KV |
 
Node 20+. `npm` as package manager.
 
---
 
## Pages
 
### `/` — Home
- Editorial dark hero: "Roberto Zúñiga" in massive Geist Sans, "Learning..." with three independently-pulsing dots, hover (or tap on mobile) reveals the longer tagline
- Calm walking figure animation across the hero (no nodes — kept pure for the standard view)
- Selected work grid: 4 featured projects with the Framer-style hover effect (title slides up, subtitle slides up to take its place, arrow badge with nudge animation)
- Philosophy pull quote
- Florence walking photo with scroll-driven parallax
- Skills marquee (paused on hover, hidden on `prefers-reduced-motion`)
- Two CTAs: View all work + Get in touch
- "Roberto Runs" — a custom Canvas 2D endless runner, drawn entirely with primitives, themed in the site's accent color
- "God is great." — small italic footer line with a warm-light hover animation (sparks rise, ivory glow, halo)
### `/work`
- All 9 projects in the chronological storytelling order Roberto chose, sorted by an `order` frontmatter field
- Year filter chips (2023 / 2024 / 2025 / 2026 / All)
- Same card hover treatment as the home page
- On mobile: only the project most centered in the viewport reveals its subtitle and animates its arrow
### `/projects/[slug]`
- Per-project hero with full-bleed cover, project name overlaid bottom-left
- Sticky sidebar (desktop) or collapsed metadata grid (mobile): client, services, industries, date, links, tags
- Body description, MDX rich content, gallery (single-column or masonry per project)
- Embedded videos with custom player (COR PETIT demo, Ease Backpack functionality tests)
- "Next project" navigation at the bottom
### `/about`
- Intro paragraph
- Personal photo with the same scroll parallax as the home page
- Hard skills / Soft skills / Languages
- Tools grouped by category (Design / CAD / Code / Data / AI / Manufacturing)
- "Download my journey" → Drive CV
- Closing line: *"We just have one life. Are you being the person you want to be in it?"*
### `/contact`
- Massive "Let's talk." headline
- Click-to-email + LinkedIn + tel link
- Two locations (Spain · United States)
### `/404`
- Custom dark page in the same design system
---
 
## Projects (9 total)
 
The MDX content collection schema enforces consistency across all projects. Adding a new project = drop a new `.mdx` file into `src/content/projects/`. No code changes needed.
 
Order on `/work`:
1. **COR PETIT** — Hospital pediatric emotion-reading AI, Hacking Bridge × Talentum Gaudium hackathon, Jan 2026
2. **Ease Backpack** — Concept brief for The North Face, easy-open band mechanism, Apr 2025
3. **PLAN Z App** — Community app for outdoor enthusiasts, May 2024
4. **Africa Crutches** — Locally-manufacturable crutches + replication manual for South Sudan, Apr 2024
5. **UAX OASIS** — Campus coffee kiosk where each cup funds €0.50 of education, Dec 2025
6. **Aurora Lamp** — Modular laser-cut wooden pendant, Nov 2023
7. **Form & Shape** — Sketches and form studies, Mar 2023
8. **OficinasYA Dashboard** — Power BI dashboard for a real estate + coworking business, Nov 2023
9. **Manufacturing** — Hands-on CNC, woodworking, 3D printing skills at USU, Sep 2024
Each project supports:
- `cover` + `coverPosition` (per-project hero framing)
- `gallery` (array of images, single-column or masonry layout)
- `carousels` (4 phase-based auto-advancing carousels — used on PLAN Z)
- `videos` (custom HTML5 player with frosted-glass play button)
- `links` (typed: demo, github, instagram, article, external — each gets its own Lucide icon)
- `location` (city, country, lat, lng — drives globe placement)
Press coverage embedded as article links:
- Africa Crutches → El País
- Ease Backpack → USU Today
- COR PETIT → COPE Radio (via Talentum Gaudium)
---
 
## Dev mode
 
A persistent toggle pill in the top-right of every page (`Eye` ↔ `Code` icons, exactly mirroring Claude's artifact view toggle). Press `D` anywhere on the site to flip between modes.
 
**Globe view** (default in dev mode):
- Stylized dot-grid Earth: ~3500 dots traced over hardcoded continent bounding polygons + ocean carve-outs (Mediterranean, Hudson Bay, Black Sea, Red Sea)
- 9 pulsing project pins at real-world coordinates
- Multi-project city clusters (Madrid, Logan) shown as radial arcs above the city with thin connecting lines
- Subtle blue atmospheric glow at the globe's edge
- A 3D stick figure walks Roberto's real chronological life journey across all 41 stops (Spain → 14 European cities via interrail → back to Spain → Utah for USU → road-trip across America → back to Spain → Italy → London → Spain)
- Travel breadcrumbs visible as small white dots
- As the figure passes a project pin, that pin lights up and connects to all previously-visited project pins (the same N-1 compound-learning math as the hero metaphor)
- Africa Crutches gets a special dashed pulsing line from Madrid/Logan to South Sudan during pauses there — visual proof of "I helped from afar"
- "Thought pulse" arcs flash briefly between visited pins
- Auto-rotation, pinch-to-zoom, drag-to-rotate, hover info cards
- Visited-pin state persists in `sessionStorage`
**Timeline view**:
- Horizontal chronological ribbon with year markers
- Zigzag layout (alternating above/below the axis)
- Real cover image thumbnails
- Wheel-scrolls horizontally without needing shift-wheel
- Edges fade so the ribbon feels infinite
**Stats strip** (auto-computed):
> +9 SELECTED PROJECTS · +18 COUNTRIES · 22 YEARS
 
Adding a project automatically updates the count. Adding a new country in any project's location field bumps the country count. Years are computed from a March 15, 2004 birth date.
 
**Guestbook**:
- Bottom-left "+ LEAVE A MARK" pill
- Expands into a panel with name + country flag picker + message
- All entries stored permanently in Cloudflare KV
- Visible to all visitors globally
- Custom country dropdown (replaced the broken native `<select>`)
- Honeypot anti-spam + 3-submissions-per-IP-per-hour rate limit at the Worker level
**Keyboard shortcuts**:
- `D` — toggle dev mode
- `G` — globe view
- `T` — timeline view
- `Escape` — exit dev mode
---
 
## Distinctive touches (what makes this not a template)
 
1. **Hero "Learning..."** — the three dots pulse independently with staggered keyframes
2. **The walking figure** — slow Bézier-curve paths between waypoints, breathing animation, occasional thinking gesture, persistent state across page navigation via `sessionStorage`
3. **Roberto Runs game** — pure Canvas 2D, four design-tool obstacles (Figma frame, Power BI chart, closing laptop, rolling coffee cup), 3-layer parallax city, score in meters, mobile speed boost, and a hidden win condition at 10,000 m that reveals the message *"Max wasn't reliable."* with a continue option for high-score chasers
4. **Globe figure** — a 3D stick figure walking great-circle paths between 41 real cities Roberto has visited, leaving permanent neural arcs only between project pins
5. **God is great. footer** — a quietly humble line at the bottom-center of every page that, on hover, blooms with rising sparks and a warm ivory glow. Distinct from the site's blue-accent visual category — its own sacred space
6. **Custom video player** — frosted-glass 96px play button, scale-on-hover, click-anywhere to play, double-tap to seek on mobile, full-screen support
7. **Mobile active-card pattern** — IntersectionObserver-based "this card is selected" treatment that mirrors the desktop hover effect via scroll position instead of cursor
8. **Tap-to-reveal tagline on mobile** — pulsing dot signals tappability, 10-second auto-hide, tap-outside dismisses early
9. **Persistent state everywhere** — guestbook entries, hero figure position, globe visited-pin state all survive page navigation
10. **Reduced motion respected throughout** — every animation has a static fallback
---
 
## File layout
 
```
.
├── astro.config.mjs           # site URL, integrations, Tailwind plugin
├── package.json
├── tsconfig.json
├── .nojekyll                  # tells GitHub Pages to skip Jekyll
├── public/                    # copied verbatim to dist/
│   ├── favicon.svg / .ico / -16.png / -32.png
│   ├── apple-touch-icon.png
│   ├── og-default.png         # the RZ social-share card
│   ├── videos/                # cor-petit-demo.mp4, ease-backpack-test-1/2.mp4
│   └── .nojekyll
├── cloudflare-worker/
│   ├── guestbook-worker.js    # the Cloudflare Worker source
│   └── README.md              # deploy instructions
├── scripts/
│   ├── gen-images.mjs
│   └── generate-favicons.mjs
└── src/
    ├── content.config.ts      # MDX schema (projects collection)
    ├── content/projects/      # 9 .mdx files
    ├── assets/
    │   ├── projects/          # one folder per project, with cover + numbered gallery images
    │   ├── about-photo.jpg
    │   ├── hero-walking.png
    │   └── favicon-source.svg
    ├── components/
    │   ├── ProjectCard.astro
    │   ├── Footer.astro
    │   ├── SEO.astro
    │   └── react/
    │       ├── DevModeToggle.tsx
    │       ├── DevMode.tsx
    │       ├── ProjectGlobe.tsx       # ~600 lines, the globe
    │       ├── ProjectTimeline.tsx
    │       ├── HeroLearningAnimation.tsx
    │       ├── ParallaxPhoto.tsx
    │       ├── PhaseCarousel.tsx
    │       ├── PhaseCarouselGroup.tsx
    │       ├── VideoPlayer.tsx
    │       ├── GameCanvas.tsx          # ~700 lines, "Roberto Runs"
    │       ├── Guestbook.tsx
    │       ├── CountryPicker.tsx
    │       └── WorkFilter.tsx
    ├── layouts/
    │   └── BaseLayout.astro
    ├── lib/
    │   └── travel-journey.ts          # the 41-stop JOURNEY array
    ├── pages/
    │   ├── index.astro
    │   ├── work.astro
    │   ├── about.astro
    │   ├── contact.astro
    │   ├── 404.astro
    │   └── projects/[slug].astro
    ├── scripts/
    │   └── active-card-observer.ts    # mobile-only IntersectionObserver
    ├── styles/
    │   └── global.css                 # Tailwind v4 @theme + custom CSS
    └── data/
        └── guestbook-seed.json
```
 
---
 
## Design system
 
| Token | Value |
|---|---|
| `--color-background` | `#0A0A0A` |
| `--color-foreground` | `#FAFAFA` |
| `--color-muted` | `#71717A` |
| `--color-subtle` | `#18181B` |
| `--color-border` | `rgba(255, 255, 255, 0.08)` |
| `--color-accent` | `#C8E6FF` (light blue) |
| `--header-height` | `4rem` |
 
- Display headings: Geist Sans 600, tracking `-0.04em` for sizes >4rem, `-0.02em` between 2–4rem, `clamp()` for fluid sizing
- Body: Geist Sans 400, line-height 1.5, max-width 65ch
- Eyebrow / labels / metadata / code: Geist Mono uppercase, tracking `0.1em`, 11px
- Container: `max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12`
- Radii: `rounded-2xl` for cards, `rounded-full` for pills, `rounded-lg` for buttons
- Selection: accent on background
---
 
## Development
 
### Local dev
```bash
npm install
npm run dev
# → http://localhost:4321
```
 
### Build
```bash
npm run build
npm run preview   # serve dist/ locally
```
 
### Deploy
Push to `main`. GitHub Actions builds Astro and publishes `dist/` to GitHub Pages. Workflow at `.github/workflows/deploy.yml`. Takes 2–3 minutes.
 
### Adding a new project
1. Drop a new `.mdx` file into `src/content/projects/` with frontmatter (title, subtitle, client, services, industries, date, order, cover, summary, description, location?, links?, gallery?, carousels?, videos?)
2. Place images at `src/assets/projects/[slug]/cover.jpg`, `01.jpg`, `02.jpg`, etc.
3. Commit and push
The dev-mode stat strip auto-updates. The /work grid auto-resorts. Globe auto-places the pin if `location` is set.
 
### Adding a new project image to an existing project
1. Drop the image into `src/assets/projects/[slug]/`
2. Add `- ./XX.jpg` to the `gallery` array in the project's MDX
3. Commit and push
### Reordering projects
Edit the `order` field in any project's frontmatter (lower = earlier).
 
### Featuring on home
Set `featured: true` on up to 4 projects.
 
### Updating the guestbook backend
The Worker code lives in `cloudflare-worker/guestbook-worker.js`. To redeploy:
1. Cloudflare dashboard → Workers & Pages → `guestbook` → Edit code
2. Paste current contents of the local file
3. Save and Deploy
---
 
## Performance
 
- Static output, no server runtime
- Per-image responsive `<picture>` via Astro `<Image />` with WebP/AVIF transforms
- React islands hydrated only when needed (`client:visible` for below-fold, `client:idle` for non-blocking, `client:load` only for the ever-present DevModeToggle)
- Three.js is lazy-loaded — only fetched when dev mode opens
- Game canvas uses a single `requestAnimationFrame` loop with proper cleanup, paused when tab is hidden or scrolled out of view
- Hero animation uses `useRef` for per-frame state updates instead of React re-renders
- Bundle: ~140 KB gzipped (excluding Three.js which is lazy)
---
 
## Accessibility
 
- WCAG AA contrast across the dark theme
- `prefers-reduced-motion` respected: hero figure, globe rotation, marquee, parallax, video controls, page transitions, dev-mode entry/exit, guestbook animations all have static fallbacks
- All interactive elements have visible focus rings
- Skip-to-content link
- ARIA roles on the dev mode dialog, toggle pill, guestbook
- Keyboard navigation throughout — tab order, escape to close, arrow keys for carousels and game
---
 
## Status
 
| Area | Status |
|---|---|
| Design system | ✅ Settled |
| 9 project pages with real images | ✅ Complete |
| Press coverage links (El País, USU, COPE) | ✅ Mostly done — verify across all projects |
| Embedded videos with custom player | ✅ Working on desktop + iOS + Android |
| Dev mode (globe + timeline) | ✅ Complete |
| Live guestbook on Cloudflare KV | ✅ Persistent, no signup required |
| Mobile patterns | ✅ Active-card, tap-to-reveal, touch-friendly video |
| GitHub Pages deploy | ✅ Automated via Actions |
| Quantified outcomes per project | ⏳ In progress |
| Press strip on home page | ⏳ Pending |
| Hero substance line (status / chips) | ⏳ Pending |
| Lighthouse audit | ⏳ Pending |
 
---
 
## Story
 
This site started as a Framer-built page with the free-tier "Made in Framer" badge. Over a focused build cycle in spring 2026, it was rebuilt from scratch as a hand-coded Astro project. Every component was either written manually or generated through deliberate prompt design and reviewed line-by-line.
 
The goal was never to "build a portfolio." It was to demonstrate, on the artifact itself, the kind of designer + engineer work the fellowship is selecting for: opinionated taste, real engineering depth, narrative thinking, restraint, and the patience to make small details matter.
 
The walking figure, the globe journey, the impossible-to-win game with the *"Max wasn't reliable"* easter egg, the quiet "God is great." line at the bottom — these aren't decorations. They're the substance.
 
---
 
*Last updated: May 2026.*
