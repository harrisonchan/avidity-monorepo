import { Duration } from 'dayjs/plugin/duration';
import { Color, LatLng } from './baseTypes';
import { Illustration, IoniconsName } from './componentTypes';
import { Dayjs } from 'dayjs';

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

export type Weekdays = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type GoalRepeat = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'weekdays' | 'none';
  frequency?: number;
  weekdays?: Set<Weekdays>;
  end?: string; // date in UTC format
};

export type GoalStreakItem = {
  date: { start: string; end: string }; // [start, end] date in UTC YYYY-MM-DD format
  length: number;
  skipped: Set<string>; // set of dates in UTC YYYY-MM-DD format
  rests: Set<string>; // set of dates in UTC YYYY-MM-DD format
};

export type GoalStreakData = {
  current: GoalStreakItem | null;
  longest: GoalStreakItem | null;
};

export type GoalStreakOptions = {
  skips: { frequency: number } & ({ type: 'week' } | { type: 'month' } | { type: 'year' } | { type: 'none' });
  skipsWeekends: boolean;
  skipsHolidays: boolean;
  rests: { start: string; end: string }[]; // [start, end] date in UTC YYYY-MM-DD format
};

export type GoalStreaks = GoalStreakItem[];

export type GoalStatus = {
  completed: Set<string>; //set of dates in UTC format
  incomplete: Set<string>;
  skipped: Set<string>;
  rests: Set<string>;
  streaks: GoalStreakData;
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  icon: GoalIcon;
  date: string; // date in UTC format (YYYY-MM-DD)
  time: { start: string; end: string } | null;
  repeat: GoalRepeat;
  categories: Set<string>;
  status: GoalStatus;
  streakOptions: GoalStreakOptions;
  groupId: string | null;
  location: string | LatLng | null;
  commute: {
    time?: { start: string; end: string } | null;
    duration: string;
  } | null;
  rest: {
    time?: { start: string; end: string } | null;
    duration: string;
  } | null;
  duration: string;
};

export type GoalGroup = {
  id: string;
  title: string;
  description?: string;
  illustration: GoalIllustration;
  goals: Set<string>; //set of goal ids
  categories: Set<string>;
};

export type ScheduledGoal = {
  id: string;
  title: string;
  time: { start: Dayjs; end: Dayjs };
  commute: { start: Dayjs; end: Dayjs } | null;
  rest: { start: Dayjs; end: Dayjs } | null;
  location: string | LatLng | null;
  duration: Duration;
  type: 'goal';
};

export type ScheduledGoalCommute = Omit<ScheduledGoal, 'type' | 'commute' | 'rest'> & {
  type: 'commute';
  goalId: string;
};

export type ScheduledGoalRest = Omit<ScheduledGoal, 'type' | 'commute' | 'rest'> & {
  type: 'rest';
  goalId: string;
};

export type Schedule = (ScheduledGoal | ScheduledGoalCommute | ScheduledGoalRest)[];

export type ScheduleObject = {
  date: Dayjs;
  schedule: Schedule;
  goalsNotAdded: Goal[]; // details goals that might not have been added to the schedule due to time constraints
};
