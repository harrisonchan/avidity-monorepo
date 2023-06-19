import { Goal, GoalGroup } from '@shared/types';

export const EMPTY_GOAL: Goal = {
  id: '',
  title: 'EMPTY_GOAL',
  icon: { name: 'accessibility' },
  date: '',
  repeat: { type: 'none' },
  categories: new Set(),
  completion: {
    completed: new Set(),
    incomplete: new Set(),
    skipped: new Set(),
  },
};
export const EMPTY_GOAL_GROUP: GoalGroup = {
  id: '',
  title: 'EMPTY_GOAL_GROUP',
  illustration: { name: 'illustration-animal' },
  goals: new Set(),
  categories: new Set(),
};
