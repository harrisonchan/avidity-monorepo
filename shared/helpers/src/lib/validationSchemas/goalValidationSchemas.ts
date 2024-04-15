import { z } from 'zod';

const goalIcon = z.object({
  iconColor: z.string(),
  backgroundColors: z.string(),
  name: z.enum(),
});

const addGoalFormSchema = z.object({
  title: z.string({ required_error: 'Title is required' }),
  description: z.optional(z.string()),
});
