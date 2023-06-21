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

export type Weekdays = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type GoalRepeat = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'weekdays' | 'none';
  frequency?: number;
  weekdays?: Set<Weekdays>;
  end?: string; // date in UTC format
};

export type GoalStreakOptions = {
  skips?: { frequency: number } & ({ type: 'week' } | { type: 'month' } | { type: 'year' });
};

export type GoalStreakData = {
  date: [string, string] | undefined; // [start, end] date in UTC YYYY-MM-DD format
  length: number;
  skipped?: Set<string> | undefined; // set of dates in UTC YYYY-MM-DD format
  breaks?: Set<string> | undefined; // set of dates in UTC YYYY-MM-DD format
  options: GoalStreakOptions;
};

export type GoalStreaks = {
  current: GoalStreakData | undefined;
  longest: GoalStreakData | undefined;
  data: GoalStreakData[];
};

export type GoalStatus = {
  completed: Set<string>; //set of dates in UTC format
  incomplete: Set<string>;
  skipped: Set<string>;
  streaks?: GoalStreaks | undefined;
  isOnBreak?: boolean;
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  icon: GoalIcon;
  date: string; // date in UTC format (YYYY-MM-DD)
  time?: { start: string; end: string; blocks?: { start: string; end: string }[] } | undefined;
  repeat: GoalRepeat;
  categories: Set<string>;
  status: GoalStatus;
  streakOptions?: GoalStreakOptions | undefined;
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

export type GoalGroup = {
  id: string;
  title: string;
  description?: string;
  illustration: GoalIllustration;
  goals: Set<string>; //set of goal ids
  categories: Set<string>;
};
