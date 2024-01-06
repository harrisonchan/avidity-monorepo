import * as dayjs from 'dayjs';
// import * as duration from 'dayjs/plugin/duration';
// import { Goal, GoalGroup, GoalStatus, GoalStreakItem, GoalStreakOptions } from '@shared/types';
// import { TODAY_DATE_FORMATTED } from '@shared/utils';

import { Goal } from '@shared/types';
import { getStandardFormat } from '@shared/utils';

// dayjs.extend(duration);

// export const DEFAULT_STREAK_OPTIONS: GoalStreakOptions = {
//   skips: { type: 'none', frequency: 0 },
//   skipsWeekends: false,
//   skipsHolidays: false,
//   rests: [],
// };
// export const EMPTY_STREAK_ITEM: GoalStreakItem = {
//   date: { start: '', end: '' },
//   length: 0,
//   skipped: new Set(),
//   rests: new Set(),
// };
// export const EMPTY_GOAL_STATUS = {
//   completed: new Set(),
//   incomplete: new Set(),
//   skipped: new Set(),
//   rests: new Set(),
//   streaks: {
//     current: null,
//     longest: null,
//   },
// };
export const EMPTY_GOAL: Goal = {
  id: '',
  title: 'EMPTY_GOAL',
  icon: { name: 'accessibility' },
  dateTimeData: {
    start: {
      date: getStandardFormat(dayjs()),
    },
    end: {
      date: getStandardFormat(dayjs()),
    },
    status: {},
  },
  recurrence: [],
  groupId: '',
};
// export const EMPTY_GOAL_GROUP: GoalGroup = {
//   id: '',
//   title: 'EMPTY_GOAL_GROUP',
//   illustration: { name: 'illustration-animal' },
//   goals: new Set(),
//   categories: new Set(),
// };
