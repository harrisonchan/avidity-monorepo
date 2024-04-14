import { RecurrenceRule } from '@shared/utils';
import { Color, DateParam, LatLng } from './baseTypes';
import { Illustration, IoniconsName } from './componentTypes';

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

export type GoalStatus = 'complete' | 'incomplete' | 'skip' | 'holiday';

export type GoalDateTimeEntry = {
  date: string;
  dateTime?: string;
  timeZone: string; //changing this to required. I'm tired of dealing with dates fucking hell
};

export type GoalStreak = { dates: string[]; incomplete: string[] | null; skips: string[] | null; holidays: string[] | null };

export type GoalStreakData = {
  streaks: GoalStreak[];
  // incomplete: string[];
  // skips: string[];
  // holidays: string[];
  current: string[];
  longest: string[][];
  streakOptions: GoalStreakOptions | null;
};

export type GoalStreakOptions = {
  tolerateIncomplete: boolean;
  tolerateSkip: boolean;
  tolerateHoliday: boolean;
};

export type GoalDuration = {
  minutes?: number;
  hours?: number;
  days?: number;
  months?: number;
  years?: number;
};

export type GoalCategory =
  | 'business'
  | 'education'
  | 'entertainment'
  | 'finance'
  | 'food'
  | 'health'
  | 'lifestyle'
  | 'news'
  | 'productivity'
  | 'shopping'
  | 'social'
  | 'sports'
  | 'travel'
  | 'utilities';

export const goalCategoryArr: GoalCategory[] = [
  'business',
  'education',
  'entertainment',
  'finance',
  'food',
  'health',
  'lifestyle',
  'news',
  'productivity',
  'shopping',
  'social',
  'sports',
  'travel',
  'utilities',
];

export type GoalRecurrenceRule = RecurrenceRule & { start: DateParam; timeZone: string };

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  icon: GoalIcon;
  dateTimeData: {
    start: GoalDateTimeEntry;
    end: GoalDateTimeEntry;
    status: Record<string, GoalStatus>;
  };
  streakData: GoalStreakData | null;
  recurrence: GoalRecurrenceRule | null;
  groupId: string;
  duration: GoalDuration | null;
  commute: GoalDuration | null;
  respite: GoalDuration | null;
  location: string | LatLng | null;
  category: GoalCategory | null;
};

export type GoalGroup = {
  id: string;
  title: string;
  description: string | null;
  illustration: GoalIllustration;
  goals: Set<string>; //goal ids
  date: { start: string; end: string } | null; //change date to GoalDateTimeEntry later
};
