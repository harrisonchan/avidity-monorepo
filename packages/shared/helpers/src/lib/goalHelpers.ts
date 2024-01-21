import { isUndefined } from 'lodash';
import { v5 as uuidV5 } from 'uuid';
import * as dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isBetween from 'dayjs/plugin/isBetween';
import Holidays from 'date-holidays';
import { DateParam, Goal, GoalStatus, GoalStreakData, TimeFormat } from '@shared/types';
import { TODAY_DATE_UTC_FORMATTED, getRecurrenceDates, getStandardFormat, getUtcDate, getUtcFormat } from '@shared/utils';
import { CachedGoal } from '@shared/stores';
// import { EMPTY_STREAK_ITEM } from './constants';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

const holidays = new Holidays('US');

const UUID_NAMESPACE = 'c3a24e92-b09b-11ed-afa1-0242ac120002';
export function generateGoalId(title: string, date: DateParam): string {
  const rightNow = dayjs().utc().toISOString();
  return 'goal-' + uuidV5(`${rightNow}_${getUtcDate(date).toISOString()}_${title}`, UUID_NAMESPACE);
}
export function generateGroupId(title: string): string {
  const rightNow = dayjs().utc().toISOString();
  return 'group-' + uuidV5(`${rightNow}_${title}`, UUID_NAMESPACE);
}

function getGoalStatusStreakValidity(goalStatus: GoalStatus): boolean {
  switch (goalStatus) {
    case 'incomplete':
      return false;
    default:
      return true;
  }
}

export function getStreakData(goal: Goal, getLatestOnly: boolean = false): GoalStreakData | null {
  if (!goal.recurrence && !goal.streakData) return null;
  else if (!goal.recurrence && goal.streakData) return goal.streakData;
  // else if (goal.recurrence && goal.streakData && getLatestOnly) {
  //   const goalStatusEntries = Object.entries(goal.dateTimeData.status);
  //   const orderedGoalStatusDates: string[] = goalStatusEntries
  //     .map((entry) => entry[0])
  //     .sort((_d1, _d2) => {
  //       if (dayjs(_d1).isAfter(_d2)) return 0;
  //       else return -1;
  //     });
  //   const earliestStatusDate = orderedGoalStatusDates[0];
  //   const latestStatusDate = orderedGoalStatusDates[orderedGoalStatusDates.length - 1];
  //   const recurrentDates = getRecurrenceDates({ recurrenceRule: { ...goal.recurrence, start: earliestStatusDate, until: latestStatusDate } });
  //   if (recurrentDates.length >= 2) {
  //     const latest = recurrentDates[recurrentDates.length - 1];
  //     const secondLatest = recurrentDates[recurrentDates.length - 2];
  //     if (getGoalStatusStreakValidity(goal.dateTimeData.status[latest]) && getGoalStatusStreakValidity(goal.dateTimeData.status[secondLatest])) {
  //     }
  //   }
  //   // const streakData: GoalStreakData = {
  //   //   streaks: [],
  //   //   incomplete: [],
  //   // };
  // }
  else if (goal.recurrence) {
    const goalStatusEntries = Object.entries(goal.dateTimeData.status);
    const orderedGoalStatusDates: string[] = goalStatusEntries
      .map((entry) => entry[0])
      .sort((_d1, _d2) => {
        if (dayjs(_d1).isAfter(_d2)) return 0;
        else return -1;
      });
    const earliestStatusDate = orderedGoalStatusDates[0];
    const latestStatusDate = orderedGoalStatusDates[orderedGoalStatusDates.length - 1];
    const recurrentDates = getRecurrenceDates({ recurrenceRule: { ...goal.recurrence, start: earliestStatusDate, until: latestStatusDate } });
    const streakData: GoalStreakData = {
      streaks: [],
      incomplete: [],
    };
    const { streaks, incomplete } = streakData;
    recurrentDates.forEach((date) => {
      const goalStatus = goal.dateTimeData.status[date];
      if (goalStatus !== 'incomplete') {
        if (streaks.length === 0) {
          streaks.push({
            dates: [date],
            skips: goalStatus === 'skip' ? [date] : null,
            holidays: goalStatus === 'holiday' ? [date] : null,
            length: 1,
          });
        } else {
          const prevStreak = streaks[streaks.length - 1];
          prevStreak.dates.push(date);
          if (goalStatus === 'skip') prevStreak.skips !== null ? prevStreak.skips.push(date) : (prevStreak.skips = [date]);
          else if (goalStatus === 'holiday') prevStreak.holidays !== null ? prevStreak.holidays.push(date) : (prevStreak.holidays = [date]);
          prevStreak.length++;
          streaks[streaks.length - 1] = prevStreak;
        }
      } else {
        incomplete.push(date);
        //push extra one to streak
        streaks.push({
          dates: [],
          skips: null,
          holidays: null,
          length: 0,
        });
      }
    });
    //remove "extra" item from streaks arr if empty
    if (streaks[streaks.length - 1].dates.length === 0) streaks.pop();
    return { streaks, incomplete };
  } else return null;
}

// export function convertPartialGoalToDateCacheGoal(params: { goal: Partial<Goal> & Pick<Goal, 'id'>; date: DateParam }): Partial<CachedGoal> {
//   const formattedDate = getStandardFormat(params.date);
//   const { status } = params.goal;
//   return {
//     ...params.goal,
//     status: status
//       ? status.completed.has(formattedDate)
//         ? 'completed'
//         : status.skipped.has(formattedDate)
//         ? 'skipped'
//         : 'incomplete'
//       : 'incomplete',
//   };
// }

// export function convertGoalToDateCacheGoal(params: { goal: Goal; date: DateParam }): CachedGoal {
//   const formattedDate = getStandardFormat(params.date);
//   const { status } = params.goal;
//   return {
//     ...params.goal,
//     status: status.completed.has(formattedDate) ? 'completed' : status.skipped.has(formattedDate) ? 'skipped' : 'incomplete',
//   };
// }

// export function checkValidRepeatDate(params: { goal: Goal; date: DateParam }): boolean {
//   const { goal, date } = params;
//   const _d = dayjs(date).startOf('day');
//   const goalDate = dayjs(goal.date).startOf('day');
//   if (_d.isSame(goalDate)) return true;
//   if (_d.isBefore(goalDate) || !goal.repeat || goal.repeat.type === 'none') return false;

//   const { type, end, frequency, weekdays } = goal.repeat;
//   if (end && dayjs(end).isBefore(goalDate) && _d.isAfter(end)) return false;
//   switch (type) {
//     case 'daily':
//       return true;
//     case 'weekly':
//       return goalDate.diff(_d, 'day') % 7 === 0;
//     case 'monthly':
//       return _d.get('date') === goalDate.get('date');
//     case 'yearly':
//       return _d.get('date') === goalDate.get('date') && _d.get('month') === goalDate.get('month');
//     case 'custom':
//       return !isUndefined(frequency) && goalDate.diff(_d, 'day') % frequency === 0;
//     case 'weekdays':
//       //@ts-ignore
//       return !isUndefined(weekdays) && weekdays.has(_d.format('dddd').toLowerCase());
//     default:
//       return false;
//   }
// }

// export function createValidRepeatDates(params: { goal: Goal; range: number }): Dayjs[] {
//   const { goal, range } = params;
//   return Array(range)
//     .fill(0)
//     .map((_, idx) => dayjs(goal.date).add(idx, 'day'))
//     .filter((date) => checkValidRepeatDate({ goal, date }));
// }

// export function useGoalRestCheck(params: { date: DateParam; timeFormat?: TimeFormat; streakOptions: GoalStreakOptions }): {
//   passesHolidayCheck: boolean;
//   passesRestCheck: boolean;
// } {
//   const { date, timeFormat, streakOptions } = params;
//   const utcFormattedDate = timeFormat === 'utc' ? getStandardFormat(date) : getUtcFormat(date);
//   const isHoliday = holidays.isHoliday(utcFormattedDate);
//   const passesHolidayCheck = streakOptions.skipsHolidays && (typeof isHoliday === 'boolean' ? isHoliday : isHoliday.length > 0);
//   const passesRestCheck = streakOptions.rests
//     .map(({ start, end }) => dayjs(utcFormattedDate).isBetween(dayjs(start), dayjs(end), 'day', '[]'))
//     .includes(true);
//   return { passesHolidayCheck, passesRestCheck };
// }

// type StreakMetadataItem = { date: string; type: 'completed' | 'skipped' | 'incomplete' | 'rest' };
// export function getStreaks(params: { status: GoalStatus; streakOptions: GoalStreakOptions }): {
//   streaks: GoalStreaks;
//   latest: GoalStreakItem | null;
//   longest: GoalStreakItem | null;
//   metadata: StreakMetadataItem[];
// } {
//   const { status, streakOptions } = params;
//   //remember to organize from [early...late]
//   const completed: StreakMetadataItem[] = Array.from(status.completed).map((date) => ({ date, type: 'completed' }));
//   const skipped: StreakMetadataItem[] = Array.from(status.skipped).map((date) => ({ date, type: 'skipped' }));
//   const incomplete: StreakMetadataItem[] = Array.from(status.incomplete).map((date) => ({ date, type: 'incomplete' }));
//   const rests: StreakMetadataItem[] = Array.from(status.rests).map((date) => ({ date, type: 'rest' }));
//   let dates: StreakMetadataItem[] = [...completed, ...skipped, ...incomplete, ...rests].sort((a, b) =>
//     dayjs(b.date).isAfter(a.date, 'day') ? -1 : 1
//   );
//   // console.debug('dates', dates);
//   const goalStreaks: GoalStreaks = [];
//   // start and end date doesn't really matter YET here I guess
//   let currentStreak: GoalStreakItem = {
//     date: { start: dates[0]?.date ?? TODAY_DATE_UTC_FORMATTED, end: dates[0]?.date ?? TODAY_DATE_UTC_FORMATTED },
//     skipped: new Set(),
//     rests: new Set(),
//     length: 0,
//   };
//   let tolerantRange = [];
//   let tolerance = 0;
//   dates.forEach((_d) => {
//     tolerantRange = [
//       dayjs(_d.date).startOf(streakOptions.skips.type !== 'none' ? streakOptions.skips.type : 'day'),
//       dayjs(_d.date).endOf(streakOptions.skips.type !== 'none' ? streakOptions.skips.type : 'day'),
//     ];
//     tolerance = streakOptions.skips.frequency;
//     const { passesRestCheck, passesHolidayCheck } = useGoalRestCheck({ date: _d.date, streakOptions });
//     switch (_d.type) {
//       case 'completed':
//       case 'rest':
//         if (currentStreak.length === 0) currentStreak.date.start = _d.date;
//         currentStreak.date.end = _d.date;
//         currentStreak.length++;
//         _d.type === 'rest' && currentStreak.rests.add(_d.date);
//         break;
//       case 'skipped':
//       case 'incomplete':
//         if (passesHolidayCheck || passesRestCheck || (tolerance > 0 && dayjs(_d.date).isBetween(tolerantRange[0], tolerantRange[1], 'day', '[]'))) {
//           if (currentStreak.length === 0) currentStreak.date.start = _d.date;
//           currentStreak.date.end = _d.date;
//           !(passesHolidayCheck || passesRestCheck) && tolerance > 0 && tolerance--;
//           currentStreak.length++;
//           currentStreak.skipped.add(_d.date);
//         } else {
//           currentStreak.length > 0 && goalStreaks.push(currentStreak);
//           currentStreak = { ...EMPTY_STREAK_ITEM, date: { start: _d.date, end: _d.date } };
//         }
//         break;
//     }
//   });
//   if (currentStreak.length > 0) goalStreaks.push(currentStreak);
//   //Get latest streak
//   const latest = goalStreaks.length > 0 ? goalStreaks.reduce((a, b) => (dayjs(a.date.end).isAfter(b.date.end, 'day') ? a : b)) : null;
//   //Get longest streak
//   const longest = goalStreaks.length > 0 ? goalStreaks.reduce((a, b) => (a.length > b.length ? a : b)) : null;
//   return { streaks: goalStreaks, latest, longest, metadata: dates };
// }
