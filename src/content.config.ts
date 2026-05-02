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
      tags: z.array(z.string()).optional(),
    }),
});

export const collections = { projects };
