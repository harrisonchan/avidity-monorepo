import { Color, LatLng } from './baseTypes';
import { Illustration, IoniconsName } from './componentTypes';
import { Weekdays } from './dateTypes';

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

export type Goal = {
  id: string;
  title: string;
  description?: string;
  icon: GoalIcon;
  dateTimeData: {
    start: {
      date: string;
      dateTime?: string;
    };
    end: {
      date: string;
      dateTime?: string;
    };
    status: Record<string, GoalStatus>;
  };
  // time: { start: string; end: string } | null;
  // duration: string | null;
  recurrence: string[];
  groupId: string;
  // location: string | LatLng | null;
};

export type GoalGroup = {
  id: string;
  title: string;
  description?: string;
  illustration: GoalIllustration;
  goals: Set<string>; //goal ids
  date: { start: string; end: string } | null;
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
