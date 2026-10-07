import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    profileImage: z.string().optional(),
    profileImages: z.array(z.string()).max(5).optional(),
    autoFlipAvatar: z.boolean().optional(),
    college: z.string().trim().max(120).optional(),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string().trim()).max(20).optional(),
    github: z.string().trim().optional(),
    linkedin: z.string().trim().optional(),
    phone: z.string().trim().max(20).optional(),
  }),
});
