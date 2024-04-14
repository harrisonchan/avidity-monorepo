import { v5 as uuidV5 } from 'uuid';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isBetween from 'dayjs/plugin/isBetween';
import * as duration from 'dayjs/plugin/duration';
import * as tz from 'dayjs/plugin/timezone';
import Holidays from 'date-holidays';
import { DateParam, Goal, GoalDuration, GoalRecurrenceRule, GoalStatus, GoalStreak, GoalStreakData, GoalStreakOptions } from '@shared/types';
import { RecurrentRuleSliceOptions, createRecurrenceRule, getRecurrenceDates, getUtcDate, sanitizeDateForRRule } from '@shared/utils';
import { useEffect, useState } from 'react';
// import { EMPTY_STREAK_ITEM } from './constants';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(tz);

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

function getGoalStatusStreakValidity(params: { goalStatus: GoalStatus; streakOptions?: GoalStreakOptions | null }): boolean {
  const goalStatus = params.goalStatus;
  const streakOptions = params.streakOptions ?? {
    tolerateIncomplete: false,
    tolerateSkip: true,
    tolerateHoliday: true,
  };
  switch (goalStatus) {
    case 'incomplete':
      if (streakOptions.tolerateIncomplete) return true;
      return false;
    case 'skip':
      if (streakOptions.tolerateSkip) return true;
      return false;
    case 'holiday':
      if (streakOptions.tolerateHoliday) return true;
      return false;
    case null:
      return false;
    case undefined:
      return false;
    default:
      return true;
  }
}

function getStreakDataStats(streakData: Omit<GoalStreakData, 'current' | 'longest'>): { current: string[]; longest: string[][] } {
  if (streakData.streaks.length > 0) {
    const current = streakData.streaks[streakData.streaks.length - 1].dates;
    const streakLengths = streakData.streaks.map((_s) => _s.dates.length);
    let longest: string[][] = [];
    let currentMax = 0;
    streakLengths.forEach((_l, _idx) => {
      if (_l > currentMax) {
        currentMax = _l;
        longest = [];
        longest.push(streakData.streaks[_idx].dates);
      } else if (_l === currentMax) longest.push(streakData.streaks[_idx].dates);
    });
    return { current, longest };
  } else return { current: [], longest: [] };
}

export function getStreakDataDeprecated(goal: Goal, getLatestOnly: boolean = false): GoalStreakData | null {
  if (!goal.recurrence && !goal.streakData) return null;
  else if (!goal.recurrence && goal.streakData) {
    const { current, longest } = getStreakDataStats(goal.streakData);
    return { ...goal.streakData, current, longest };
  }
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
    // Get all statuses
    // Check prev status. If prev was streak check if this is the direct next one. If it is, continue the streak. If it isn't create a new streak.

    const goalStatusEntries = Object.entries(goal.dateTimeData.status);
    const orderedGoalStatusDates: string[] = goalStatusEntries
      .map((entry) => entry[0])
      .sort((_d1, _d2) => {
        if (dayjs(_d1).isAfter(_d2)) return 0;
        else return -1;
      });
    const earliestStatusDate = orderedGoalStatusDates[0];
    const latestStatusDate = orderedGoalStatusDates[orderedGoalStatusDates.length - 1];
    const recurrentDates = getGoalRecurrentDates({
      recurrenceRule: { ...goal.recurrence, start: earliestStatusDate, until: latestStatusDate, timeZone: goal.dateTimeData.start.timeZone },
    });
    const streakData: GoalStreakData = {
      streaks: [],
      current: [],
      longest: [],
      streakOptions: goal.streakData?.streakOptions ?? null,
    };
    const {
      streaks,
      // incomplete, skips, holidays,
      streakOptions,
    } = streakData;
    recurrentDates.forEach((date) => {
      const goalStatus = goal.dateTimeData.status[date] ?? 'incomplete';
      if (getGoalStatusStreakValidity({ goalStatus, streakOptions })) {
        if (streaks.length === 0) {
          streaks.push({
            dates: [date],
            incomplete: goalStatus === 'incomplete' ? [date] : null,
            skips: goalStatus === 'skip' ? [date] : null,
            holidays: goalStatus === 'holiday' ? [date] : null,
            // length: 1,
          });
        } else {
          const prevStreak = streaks[streaks.length - 1];
          prevStreak.dates.push(date);
          if (goalStatus === 'incomplete') prevStreak.incomplete !== null ? prevStreak.incomplete.push(date) : (prevStreak.incomplete = [date]);
          else if (goalStatus === 'skip') prevStreak.skips !== null ? prevStreak.skips.push(date) : (prevStreak.skips = [date]);
          else if (goalStatus === 'holiday') prevStreak.holidays !== null ? prevStreak.holidays.push(date) : (prevStreak.holidays = [date]);
          // prevStreak.length++;
          streaks[streaks.length - 1] = prevStreak;
        }
      } else if (streaks.length > 0 && streaks[streaks.length - 1].dates.length !== 0) {
        streaks.push({
          dates: [],
          incomplete: null,
          skips: null,
          holidays: null,
          // length: 0,
        });
      }
      // else {
      //   if (!goalStatus || goalStatus === 'incomplete') incomplete.push(date);
      //   else if (goalStatus === 'skip') skips.push(date);
      //   else if (goalStatus === 'holiday') holidays.push(date);
      //   //push extra one to streak if prev wasn't already empty
      //   if (streaks.length > 0 && streaks[streaks.length - 1].dates.length !== 0) {
      //     streaks.push({
      //       dates: [],
      //       incomplete: null,
      //       skips: null,
      //       holidays: null,
      //       length: 0,
      //     });
      //   }
      // }
    });
    //remove "extra" item from streaks arr if empty
    if (streaks[streaks.length - 1].dates.length === 0) streaks.pop();
    const { current, longest } = getStreakDataStats({
      streaks,
      // incomplete, skips, holidays,
      streakOptions,
    });
    return {
      streaks,
      // incomplete, skips, holidays,
      streakOptions,
      current,
      longest,
    };
  } else return null;
}

// TODO: fromData param not working because I don't know how to fucking code. Great!
export function getStreakData(params: {
  goal: Goal;
  // fromDate?: DateParam | null
}): GoalStreakData | null {
  const {
    goal,
    // fromDate
  } = params;
  if (!goal.recurrence && !goal.streakData) return null;
  else if (!goal.recurrence && goal.streakData) {
    const { current, longest } = getStreakDataStats(goal.streakData);
    return { ...goal.streakData, current, longest };
  } else if (goal.recurrence) {
    // Get all statuses
    // Check prev status. If prev was streak check if this is the direct next one. If it is, continue the streak. If it isn't create a new streak.
    const goalStatusEntries = Object.entries(goal.dateTimeData.status).sort((entryOne, entryTwo) => {
      if (dayjs(entryOne[0]).isAfter(entryTwo[0])) return 1;
      else return -1;
    });
    // const latestOnlyType: 'boolean' | 'number' | null = getLatestOnly ? typeof getLatestOnly === "boolean" ? "number" : typeof getLatestOnly === 'number' ? 'number' :null
    // const streaks: GoalStreak[] = latestOnlyType === 'boolean' ? goal.streakData?.streaks??[] : latestOnlyType === 'number' ? goal.streakData?.streaks
    let streaks: GoalStreak[] = [];
    // let fromDateIndex = 0;
    // if (fromDate && goal.streakData?.streaks) {
    //   const _i = goal.streakData.streaks.findIndex((_streak) => _streak.dates.includes(getStandardFormat(fromDate)));
    //   console.log('ONE', goal.streakData.streaks[_i]);
    //   if (_i !== -1) {
    //     streaks = goal.streakData.streaks.slice(0, _i + 1);
    //     console.log('TWO', [...streaks]);
    //     const lastStreak = streaks[streaks.length - 1];
    //     lastStreak.dates.forEach((_d, idx) => {
    //       dayjs(_d).isSameOrAfter(fromDate, 'date') && lastStreak.dates.splice(idx, 1);
    //     });
    //     lastStreak.holidays?.forEach((_d, idx) => {
    //       dayjs(_d).isSameOrAfter(fromDate, 'date') && lastStreak.holidays?.splice(idx, 1);
    //     });
    //     lastStreak.incomplete?.forEach((_d, idx) => {
    //       dayjs(_d).isSameOrAfter(fromDate, 'date') && lastStreak.incomplete?.splice(idx, 1);
    //     });
    //     lastStreak.skips?.forEach((_d, idx) => {
    //       dayjs(_d).isSameOrAfter(fromDate, 'date') && lastStreak.skips?.splice(idx, 1);
    //     });
    //     fromDateIndex = goalStatusEntries.findIndex((_entry) => _entry[0] === getStandardFormat(fromDate));
    //     if (streaks[streaks.length - 1].dates.length === 0) streaks.pop();
    //     console.log('THREE', [...streaks], fromDateIndex);
    //   } else {
    //     streaks = goal.streakData.streaks;
    //     fromDateIndex = goalStatusEntries.length - 1;
    //   }
    // }
    const streakOptions = goal.streakData?.streakOptions;
    const rule = createRecurrenceRule({ recurrenceRule: goal.recurrence, noCache: true });
    const parseStreaks = (index: number) => {
      if (index >= goalStatusEntries.length) return;
      else {
        const [date, goalStatus] = goalStatusEntries[index];
        if (index === 0 && getGoalStatusStreakValidity({ goalStatus, streakOptions })) {
          streaks.push({
            dates: [date],
            incomplete: goalStatus === 'incomplete' ? [date] : null,
            skips: goalStatus === 'skip' ? [date] : null,
            holidays: goalStatus === 'holiday' ? [date] : null,
          });
        } else if (goalStatusEntries[index - 1] && getGoalStatusStreakValidity({ goalStatus, streakOptions })) {
          // If there's a previous one, check if it's the direct previous date in recurrent dates
          const before = dayjs(rule.before(sanitizeDateForRRule({ date, returnType: 'Date' }), false));
          const prevStreak = streaks[streaks.length - 1];
          if (before.isSame(...prevStreak.dates.slice(-1), 'date')) {
            prevStreak.dates.push(date);
            if (goalStatus === 'incomplete') prevStreak.incomplete !== null ? prevStreak.incomplete.push(date) : (prevStreak.incomplete = [date]);
            else if (goalStatus === 'skip') prevStreak.skips !== null ? prevStreak.skips.push(date) : (prevStreak.skips = [date]);
            else if (goalStatus === 'holiday') prevStreak.holidays !== null ? prevStreak.holidays.push(date) : (prevStreak.holidays = [date]);
          } else {
            streaks.push({
              dates: [date],
              incomplete: goalStatus === 'incomplete' ? [date] : null,
              skips: goalStatus === 'skip' ? [date] : null,
              holidays: goalStatus === 'holiday' ? [date] : null,
            });
          }
        }
        parseStreaks(index + 1);
      }
    };
    // if (fromDate) parseStreaks(fromDateIndex);
    // else parseStreaks(0);
    parseStreaks(0);
    const { current, longest } = getStreakDataStats({ streaks, streakOptions: streakOptions ?? null });
    return { streaks, current, longest, streakOptions: streakOptions ?? null };
  } else return null;
}

// TODO: Test this
export function useGetStreakData(params: { goal: Goal }): { isCalculating: boolean; streakData: GoalStreakData | null } {
  const [isCalculating, setIsCalculating] = useState(true);
  const goal = params.goal;
  const streakData = getStreakData({ goal });
  useEffect(() => {
    if (streakData) setIsCalculating(true);
  }, [streakData]);
  return { isCalculating, streakData };
}

// /**
//  *
//  * @param params streakData: GoalStreakData
//  * @returns GoalStreakData with dates filled in between streak dates
//  */
// export function fillStreakDates(params: { streakData: GoalStreakData }): GoalStreakData {
//   let streakData = { ...params.streakData };
//   streakData.streaks = streakData.streaks.map((streak) => {
//     const dates = getRecurrenceDates({ recurrenceRule: { frequency: 'daily', start: streak.dates[0], until: streak.dates.slice(-1)[0] } });
//     return { ...streak, dates };
//   });
//   streakData.current = getRecurrenceDates({
//     recurrenceRule: { frequency: 'daily', start: streakData.current[0], until: streakData.current.slice(-1)[0] },
//   });
//   streakData.longest = streakData.longest.map((streak) =>
//     getRecurrenceDates({ recurrenceRule: { frequency: 'daily', start: streak[0], until: streak.slice(-1)[0] } })
//   );
//   return streakData;
// }

export function getGoalDuration(goalDuration: GoalDuration): duration.Duration {
  const minutes = goalDuration.minutes ?? 0;
  const hours = goalDuration.hours ?? 0;
  const days = goalDuration.days ?? 0;
  const months = goalDuration.months ?? 0;
  const years = goalDuration.years ?? 0;
  return dayjs.duration({ minutes, hours, days, months, years });
}

export function getGoalRecurrentDates(params: {
  recurrenceRule: GoalRecurrenceRule;
  sliceOptions?: RecurrentRuleSliceOptions | null;
  noCache?: boolean;
}): string[] {
  const { recurrenceRule, sliceOptions } = params;
  const { start, until, timeZone } = recurrenceRule;
  const _start = dayjs(start);
  const _until = until ? dayjs(until) : null;
  const _sliceStart = sliceOptions ? dayjs(sliceOptions.start) : null;
  const _sliceEnd = sliceOptions ? dayjs(sliceOptions.end) : null;
  const noCache = params.noCache ?? false;
  return getRecurrenceDates({
    recurrenceRule: {
      ...recurrenceRule,
      start: new Date(Date.UTC(_start.year(), _start.month(), _start.date(), 0, 0)),
      until: _until ? new Date(Date.UTC(_until.year(), _until.month(), _until.date(), 0, 0)) : null,
      timeZone,
    },
    sliceOptions:
      _sliceStart && _sliceEnd
        ? {
            start: new Date(Date.UTC(_sliceStart.year(), _sliceStart.month(), _sliceStart.date(), 0, 0)),
            end: new Date(Date.UTC(_sliceEnd.year(), _sliceEnd.month(), _sliceEnd.date(), 0, 0)),
          }
        : null,
    noCache,
  });
}
