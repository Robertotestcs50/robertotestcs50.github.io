# Image Guide

## Where to Drop Real Images

Each project has its own folder under `src/assets/projects/`:

```
src/assets/projects/
├── 01-cor-petit/
│   ├── cover.jpg       ← main hero image
│   ├── 01.jpg          ← gallery image 1
│   ├── 02.jpg          ← gallery image 2
│   └── 03.jpg          ← gallery image 3
├── 02-africa-crutches/
│   └── ...
└── ...
```

## File Naming Convention

| File | Size | Usage |
|------|------|-------|
| `cover.jpg` | 1920×1080 (16:9) | Project hero & card thumbnail |
| `01.jpg` | 1200×675 (16:9) | First gallery image (full-width) |
| `02.jpg` | 1200×900 (4:3) | Second gallery image |
| `03.jpg` | 1080×1080 (1:1) | Third gallery image |

Supported formats: `.jpg`, `.png`, `.webp`, `.svg`

## How to Update Frontmatter

After adding real images, update the `cover` and `gallery` fields in the project's `.mdx` file:

```yaml
cover: ./cover.jpg
gallery:
  - ./01.jpg
  - ./02.jpg
  - ./03.jpg
```

## Tips

- **Format**: Use `.jpg` for photos, `.webp` for maximum performance
- **Cover size**: Minimum 1920×1080 for best quality at all viewports
- **Gallery**: You can have 1–6 gallery images; layout adapts automatically
- **Alt text**: Alt text is auto-generated from project title. For custom alt text, the gallery array accepts objects: `{ src: './01.jpg', alt: 'Custom description' }`

## OG Image

The site-wide OG image lives at `public/og-default.svg`. Replace `public/og-default.png` with a 1200×630 PNG for social sharing.
