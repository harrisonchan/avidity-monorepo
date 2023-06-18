import { ColorType } from './baseTypes';
import { Illustration } from './components';

export type GoalIcon = {
  name: string;
  iconColor: ColorType;
  backgroundColor: ColorType;
};

export type GoalIllustration = {
  name: Illustration;
  color: ColorType;
  backgroundColor: ColorType;
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
  description: string;
  icon: GoalIcon;
  date: string; // date in UTC format (YYYY-MM-DD)
  time?: { start: string; end: string };
  repeat: GoalRepeat;
  categories: Set<string>;
  completion: {
    completed: Set<string>; //set of dates in UTC format
    incomplete: Set<string>;
    skipped: Set<string>;
    total: number;
  };
  missionGroupId: string;
  location?: string || LatLng
  commute?: {

  }
};
