import { z } from 'zod';
import { SupportedPhosphorIconNames, supportedPhosphorIconNames } from '@shared/types';

const goalIcon = z.object({
  iconColor: z.string(),
  backgroundColors: z.string(),
  name: z.enum(supportedPhosphorIconNames),
});

const addGoalFormSchema = z.object({
  title: z.string().min(1, { message: 'Goal title is required' }),
  description: z.optional(z.string().min(2, { message: 'at least 2 characters' })),
  icon: goalIcon,
});

export { goalIcon, addGoalFormSchema };
