// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  schema: z.object({
    order:       z.number().int().nonnegative().optional(),
    title:       z.string(),
    description: z.string(),
    github:      z.string().url().optional(),
    image:       z.string().optional(),
    images:      z.array(z.string()).optional(),
    // si quieres tags en frontmatter:
    tags:        z.array(z.string()).optional(),
  }),
});

export const collections = { projects };
