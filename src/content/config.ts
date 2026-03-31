// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    github:      z.string().url(),
    image:       z.string(),
    // si quieres tags en frontmatter:
    tags:        z.array(z.string()).optional(),
  }),
});

export const collections = { projects };
