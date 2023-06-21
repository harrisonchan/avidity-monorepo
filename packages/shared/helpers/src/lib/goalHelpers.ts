import { isUndefined } from 'lodash';
import { v5 as uuidV5 } from 'uuid';
import * as dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isBetween from 'dayjs/plugin/isBetween';
import Holidays from 'date-holidays';
import { DateParam, Goal, GoalStatus, GoalStreakItem, GoalStreakOptions, GoalStreaks, TimeFormat } from '@shared/types';
import { standardDate, standardFormat, utcDate, utcFormat } from '@shared/utils';
import { CachedGoal } from '@shared/stores';
import { EMPTY_STREAK_ITEM } from './constants';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

const holidays = new Holidays('US');

const UUID_NAMESPACE = 'c3a24e92-b09b-11ed-afa1-0242ac120002';
export function generateGoalId(title: string, date: DateParam): string {
  console.log(date);
  const rightNow = dayjs().utc().toISOString();
  return 'goal-' + uuidV5(`${rightNow}_${utcDate(date).toISOString()}_${title}`, UUID_NAMESPACE);
}
export function generateGroupId(title: string): string {
  const rightNow = dayjs().utc().toISOString();
  return 'group-' + uuidV5(`${rightNow}_${title}`, UUID_NAMESPACE);
}

export function convertPartialGoalToDateCacheGoal(params: { goal: Partial<Goal> & Pick<Goal, 'id'>; date: DateParam }): Partial<CachedGoal> {
  const formattedDate = standardFormat(params.date);
  const { status } = params.goal;
  return {
    ...params.goal,
    status: status
      ? status.completed.has(formattedDate)
        ? 'completed'
        : status.skipped.has(formattedDate)
        ? 'skipped'
        : 'incomplete'
      : 'incomplete',
  };
}

export function convertGoalToDateCacheGoal(params: { goal: Goal; date: DateParam }): CachedGoal {
  const formattedDate = standardFormat(params.date);
  const { status } = params.goal;
  return {
    ...params.goal,
    status: status.completed.has(formattedDate) ? 'completed' : status.skipped.has(formattedDate) ? 'skipped' : 'incomplete',
  };
}

export function checkValidRepeatDate(params: { goal: Goal; date: DateParam }): boolean {
  const { goal, date } = params;
  const _d = standardDate(date);
  const goalDate = standardDate(goal.date);
  if (_d.isSame(goalDate)) return true;
  if (_d.isBefore(goalDate) || !goal.repeat || goal.repeat.type === 'none') return false;

  const { type, end, frequency, weekdays } = goal.repeat;
  if (end && dayjs(end).isBefore(goalDate) && _d.isAfter(end)) return false;
  switch (type) {
    case 'daily':
      return true;
    case 'weekly':
      return goalDate.diff(_d, 'day') % 7 === 0;
    case 'monthly':
      return _d.get('date') === goalDate.get('date');
    case 'yearly':
      return _d.get('date') === goalDate.get('date') && _d.get('month') === goalDate.get('month');
    case 'custom':
      return !isUndefined(frequency) && goalDate.diff(_d, 'day') % frequency === 0;
    case 'weekdays':
      //@ts-ignore
      return !isUndefined(weekdays) && weekdays.has(_d.format('dddd').toLowerCase());
    default:
      return false;
  }
}

export function createValidRepeatDates(params: { goal: Goal; range: number }): Dayjs[] {
  const { goal, range } = params;
  return Array(range)
    .fill(0)
    .map((_, idx) => dayjs(goal.date).add(idx, 'day'))
    .filter((date) => checkValidRepeatDate({ goal, date }));
}

export function useGoalBreakCheck(params: { date: DateParam; timeFormat?: TimeFormat; streakOptions: GoalStreakOptions }): {
  passesHolidayCheck: boolean;
  passesBreakCheck: boolean;
} {
  const { date, timeFormat, streakOptions } = params;
  const utcFormattedDate = timeFormat === 'utc' ? standardFormat(date) : utcFormat(date);
  const isHoliday = holidays.isHoliday(utcFormattedDate);
  const passesHolidayCheck = streakOptions.skipsHolidays && (typeof isHoliday === 'boolean' ? isHoliday : isHoliday.length > 0);
  const passesBreakCheck = streakOptions.breaks
    .map(({ start, end }) => dayjs(utcFormattedDate).isBetween(dayjs(start), dayjs(end), 'day', '[]'))
    .includes(true);
  return { passesHolidayCheck, passesBreakCheck };
}

type StreakMetadataItem = { date: string; type: 'completed' | 'skipped' | 'incomplete' | 'break' };
export function getStreaks(params: { status: GoalStatus; streakOptions: GoalStreakOptions }): {
  streaks: GoalStreaks;
  latest: GoalStreakItem;
  longest: GoalStreakItem;
  metadata: StreakMetadataItem[];
} {
  const { status, streakOptions } = params;
  //remember to organize from [early...late]
  const completed: StreakMetadataItem[] = Array.from(status.completed).map((date) => ({ date, type: 'completed' }));
  const skipped: StreakMetadataItem[] = Array.from(status.skipped).map((date) => ({ date, type: 'skipped' }));
  const incomplete: StreakMetadataItem[] = Array.from(status.incomplete).map((date) => ({ date, type: 'incomplete' }));
  const breaks: StreakMetadataItem[] = Array.from(status.breaks).map((date) => ({ date, type: 'break' }));
  let dates: StreakMetadataItem[] = [...completed, ...skipped, ...incomplete, ...breaks].sort((a, b) =>
    dayjs(b.date).isAfter(a.date, 'day') ? -1 : 1
  );
  console.debug('dates', dates);
  const goalStreaks: GoalStreaks = [];
  let currentStreak: GoalStreakItem = { date: { start: dates[0].date, end: dates[0].date }, skipped: new Set(), breaks: new Set(), length: 0 };
  let tolerantRange = [];
  let tolerance = 0;
  dates.forEach((_d) => {
    tolerantRange = [
      dayjs(_d.date).startOf(streakOptions.skips.type !== 'none' ? streakOptions.skips.type : 'day'),
      dayjs(_d.date).endOf(streakOptions.skips.type !== 'none' ? streakOptions.skips.type : 'day'),
    ];
    tolerance = streakOptions.skips.frequency;
    const { passesBreakCheck, passesHolidayCheck } = useGoalBreakCheck({ date: _d.date, streakOptions });
    switch (_d.type) {
      case 'completed':
      case 'break':
        if (currentStreak.length === 0) currentStreak.date.start = _d.date;
        currentStreak.date.end = _d.date;
        currentStreak.length++;
        _d.type === 'break' && currentStreak.breaks.add(_d.date);
        break;
      case 'skipped':
      case 'incomplete':
        if (passesHolidayCheck || passesBreakCheck || (tolerance > 0 && dayjs(_d.date).isBetween(tolerantRange[0], tolerantRange[1], 'day', '[]'))) {
          if (currentStreak.length === 0) currentStreak.date.start = _d.date;
          currentStreak.date.end = _d.date;
          !(passesHolidayCheck || passesBreakCheck) && tolerance > 0 && tolerance--;
          currentStreak.length++;
          currentStreak.skipped.add(_d.date);
        } else {
          currentStreak.length > 0 && goalStreaks.push(currentStreak);
          currentStreak = { ...EMPTY_STREAK_ITEM, date: { start: _d.date, end: _d.date } };
        }
        break;
    }
  });
  if (currentStreak.length > 0) goalStreaks.push(currentStreak);
  //Get latest streak
  const latest = goalStreaks.reduce((a, b) => (dayjs(a.date.end).isAfter(b.date.end, 'day') ? a : b));
  //Get longest streak
  const longest = goalStreaks.reduce((a, b) => (a.length > b.length ? a : b));
  return { streaks: goalStreaks, latest, longest, metadata: dates };
}
