import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image: img }) =>
    z.object({
      title: z.string(),
      subtitle: z.string(),
      client: z.string(),
      services: z.array(z.string()),
      industries: z.array(z.string()),
      date: z.date(),
      featured: z.boolean().default(false),
      order: z.number(),
      cover: img(),
      summary: z.string(),
      description: z.string(),
      closing: z.string().optional(),
      coverPosition: z.string().optional().default('center'),
      galleryLayout: z.enum(['grid', 'single', 'grid2col']).optional().default('grid'),
      gallery: z.array(img()).optional(),
      carousels: z
        .array(
          z.object({
            title: z.string(),
            images: z.array(img()),
          })
        )
        .optional(),
      links: z
        .array(
          z.object({
            label: z.string(),
            url: z.string(),
            type: z.enum(['demo', 'github', 'article', 'instagram', 'external']),
          })
        )
        .optional(),
      location: z
        .object({
          city: z.string(),
          country: z.string(),
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
      tags: z.array(z.string()).optional(),
      videos: z
        .array(
          z.object({
            src: z.string(),
            poster: z.string().optional(),
            title: z.string(),
            aspectRatio: z.string().optional(),
          })
        )
        .optional(),
    }),
});

export const collections = { projects };
