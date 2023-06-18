import { Duration } from 'dayjs/plugin/duration';
import { Color, LatLng } from './baseTypes';
import { Illustration, IoniconsName } from './components';

type BaseGoalIconIllustration = {
  iconColor?: Color;
  backgroundColor?: Color;
};
export type GoalIcon = BaseGoalIconIllustration & {
  name: IoniconsName;
};
export type GoalIllustration = BaseGoalIconIllustration & {
  name: Illustration;
};

export type GoalWeekdays = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type GoalRepeat = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'weekdays' | 'none';
  frequency?: number;
  weekdays?: Set<GoalWeekdays>;
  numRepeats?: number;
  end?: string; // date in UTC format
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  icon: GoalIcon;
  date: string; // date in UTC format (YYYY-MM-DD)
  time?: { start: string; end: string } | undefined;
  repeat: GoalRepeat;
  categories: Set<string>;
  completion: {
    completed: Set<string>; //set of dates in UTC format
    incomplete: Set<string>;
    skipped: Set<string>;
    streaks: { streakStart: string; streakEnd: string; skipped: string[] }[];
    total: number;
  };
  groupId?: string | undefined;
  location?: string | LatLng | undefined;
  commute?:
    | {
        duration: Duration;
      }
    | undefined;
  break?:
    | {
        duration: Duration;
      }
    | undefined;
};
export const _emptyGoal: Goal = {
  id: '',
  title: '_emptyGoal',
  icon: { name: 'accessibility' },
  date: '',
  repeat: { type: 'none' },
  categories: new Set(),
  completion: {
    completed: new Set(),
    incomplete: new Set(),
    skipped: new Set(),
    streaks: [],
    total: 0,
  },
};

export type GoalGroup = {
  id: string;
  title: string;
  description?: string;
  illustration: GoalIllustration;
  goals: Set<string>; //set of goal ids
  categories: Set<string>;
};
export const _emptyGoalGroup: GoalGroup = {
  id: '',
  title: '_emptyGoalGroup',
  illustration: { name: 'illustration-animal' },
  goals: new Set(),
  categories: new Set(),
};
