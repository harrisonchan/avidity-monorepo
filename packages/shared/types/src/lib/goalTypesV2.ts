import { RecurrenceRule } from '@shared/utils';
import { Color, LatLng } from './baseTypes';
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
  timeZone?: string;
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  icon: GoalIcon;
  dateTimeData: {
    start: GoalDateTimeEntry;
    end: GoalDateTimeEntry;
    status: Record<string, GoalStatus>;
  };
  // time: { start: string; end: string } | null;
  // duration: string | null;
  recurrence: RecurrenceRule | null;
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
