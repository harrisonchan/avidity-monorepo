import { Goal, GoalGroup } from '@shared/types';
import { TODAY_DATE_FORMATTED } from '@shared/utils';

export const EMPTY_GOAL: Goal = {
  id: '',
  title: 'EMPTY_GOAL',
  icon: { name: 'accessibility' },
  date: TODAY_DATE_FORMATTED,
  repeat: { type: 'none' },
  categories: new Set(),
  status: {
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
