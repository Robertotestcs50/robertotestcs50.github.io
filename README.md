# Roberto Zúñiga — Portfolio

Personal portfolio of Roberto Zúñiga, Designer + Engineer.

**Live site**: [https://robertozuniga.github.io](https://robertozuniga.github.io)

Built with Astro 5, Tailwind CSS v4, React 19, and Framer Motion.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Preview Built Site

```bash
npm run preview
```

---

## Deployment

Automatic on push to `main` via GitHub Actions (`.github/workflows/deploy.yml`).

The workflow:
1. Installs Node 20 and runs `npm ci`
2. Runs `npm run build`
3. Uploads `dist/` as a GitHub Pages artifact
4. Deploys via `actions/deploy-pages@v4`

The repo **must be named `robertozuniga.github.io`** — this is what makes `https://robertozuniga.github.io` the live URL. If you rename the repo, also update `site` in `astro.config.mjs`.

---

## Adding a New Project

Three steps, zero code changes:

1. **Create** `src/content/projects/[your-slug].mdx` — copy an existing file as a template and fill in the frontmatter + body
2. **Drop images** into `src/assets/projects/[your-slug]/` — see [IMAGES.md](./IMAGES.md) for naming conventions
3. **Commit and push** — the site rebuilds and deploys automatically

To feature a project on the home page, set `featured: true` in the frontmatter (currently the 4 with the highest impact are featured).

---

## Swapping In Real Images

See [IMAGES.md](./IMAGES.md) for full instructions.

Short version:
1. Drop your real images into `src/assets/projects/[slug]/`
2. Update the `cover` and `gallery` paths in the `.mdx` frontmatter
3. Push — done

---

## Reordering Projects

Change the `order` field in each project's frontmatter. Projects are sorted ascending (1 = first). The `/work` page, the home page featured grid, and the "Next project" navigation all respect this order.

---

## Domain Note

The site lives at `https://robertozuniga.github.io` because the GitHub repo is named exactly `robertozuniga.github.io`. GitHub Pages uses the repo name as the subdomain for user/org pages repos.

If the repo is ever renamed:
1. Update `site: 'https://...'` in `astro.config.mjs`
2. Update the canonical URL in `src/components/SEO.astro`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 5 (static output) |
| Styling | Tailwind CSS v4 (@tailwindcss/vite) |
| Content | MDX + Astro Content Collections |
| Interactivity | React 19 islands |
| Animation | Framer Motion |
| View Transitions | Astro `<ClientRouter />` |
| Fonts | Geist Sans + Geist Mono (self-hosted) |
| Icons | Lucide React |
| Sitemap | @astrojs/sitemap |
| Deploy | GitHub Actions → GitHub Pages |
