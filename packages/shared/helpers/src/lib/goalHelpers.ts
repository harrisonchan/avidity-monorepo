import { isUndefined } from 'lodash';
import { v5 as uuidV5 } from 'uuid';
import * as dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { DateParam, Goal } from '@shared/types';
import { standardDate, standardFormat, utcDate } from '@shared/utils';
import { CachedGoal } from '@shared/stores';
dayjs.extend(utc);

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
