import { DateParam, Goal, GoalCategory, GoalDuration, GoalStatus } from '@shared/types';
import { TODAY_DATE, compareDuration, getStandardFormat, shuffleArray, sortDateArray } from '@shared/utils';
import axios from 'axios';
import * as dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import { isNil } from 'lodash';
// import { EMPTY_GOAL } from './constants';
import { useEffect, useState } from 'react';
import * as duration from 'dayjs/plugin/duration';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as isBetween from 'dayjs/plugin/isBetween';
import { getGoalDuration } from './goalHelpers';

dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

// const MINUTES_IN_HOUR = 60;
// const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;

/** Sort goals by importance:
 * Goals with defined start and end times 1st
 * Goals with duration defined 2nd
 * Goals without any of the above defined last
 * ----
 * If there are goals with time conflicts and check time conflicts option is on, implement option to either pick from most or least time consuming (duration)
 * ----
 * Goals with start and end times defined always get scheduled if possible
 * Goals won't be schedule during respites if disallowed by options
 * blocked respites in options cannot have goals scheduled (other than goals with start and end times defined)
 * ----
 * Schedules can be over 24 hours or extend into or from other days if goals extend into other days
 **/

export type ScheduledGoal = {
  id: string;
  title: string;
  description?: string;
  start: string; // date time
  end: string; // date time
  goalStart: string;
  goalEnd: string;
  commute?: {
    start: string;
    end: string;
  };
  respite?: {
    start: string;
    end: string;
  };
};

export type GoalSchedule = {
  schedule: ScheduledGoal[];
  unscheduled: Goal[];
};

export type ScheduleOptions = {
  scheduleStart?: DateParam;
  scheduleEnd?: DateParam;
  sortByMostTimeConsuming?: boolean;
  checkTimeConflicts?: boolean;
  scheduleRespiteOptions?: {
    respites: { start: DateParam; end: DateParam }[];
    blockedRespites: { start: DateParam; end: DateParam }[]; //for sleeping zzz...or other stuff
    allowedDuringRespites?: GoalCategory[];
    allowUncategorizedDuringRespites?: boolean;
  };
  defaultGoalDuration?: GoalDuration;
  randomizeScheduling?: boolean; //randomizes scheduling for goals without time/duration defined
};

function convertGoalToScheduledGoal(
  goal: Goal & {
    dateTimeData: {
      start: { date: string; dateTime: string; timeZone?: string };
      end: { date: string; dateTime: string; timeZone?: string };
      status: Record<string, GoalStatus>;
    };
  }
): ScheduledGoal {
  // const { commute, respite, duration } = goal
  let start = dayjs(goal.dateTimeData.start.dateTime);
  let end = dayjs(goal.dateTimeData.end.dateTime);
  let commute = goal.commute
    ? {
        start: dayjs(),
        end: dayjs(),
      }
    : null;
  let respite = goal.respite
    ? {
        start: dayjs(),
        end: dayjs(),
      }
    : null;
  const goalStart = goal.dateTimeData.start.dateTime;
  const goalEnd = goal.dateTimeData.end.dateTime;
  if (goal.commute && commute) {
    const commuteStart = dayjs(goalStart).subtract(getGoalDuration(goal.commute));
    start = commuteStart;
    commute.start = commuteStart;
    commute.end = dayjs(goalStart);
  }
  if (goal.respite && respite) {
    const respiteStart = dayjs(goalEnd);
    end = respiteStart;
    respite.start = respiteStart;
    respite.end = dayjs(goalEnd).add(getGoalDuration(goal.respite));
  }
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description ?? undefined,
    start: start.format(),
    end: end.format(),
    goalStart,
    goalEnd,
    commute: commute
      ? {
          start: commute.start.format(),
          end: commute.end.format(),
        }
      : undefined,
    respite: respite
      ? {
          start: respite.start.format(),
          end: respite.end.format(),
        }
      : undefined,
  };
}

export type TimeBlock = {
  start: Dayjs;
  end: Dayjs;
};

export type TimeSlot = TimeBlock;

function hasTimeConflict(blockOne: TimeBlock, blockTwo: TimeBlock, compareType: '[]' | '()' | '(]' | '[)' = '[]'): boolean {
  return (
    blockOne.start.isBetween(blockTwo.start, blockTwo.end, 'minute', compareType) ||
    blockOne.end.isBetween(blockTwo.start, blockTwo.end, 'minute', compareType) ||
    blockTwo.start.isBetween(blockOne.start, blockOne.end, 'minute', compareType) ||
    blockTwo.end.isBetween(blockOne.start, blockOne.end, 'minute', compareType)
  );
}

/**
 * creates time slots
 * @param params.timeBlocks blocks of time that are unavailable for time slots
 * @returns TimeSlot[]
 */
function createTimeSlots(params: { timeBlocks: TimeBlock[]; scheduleStart?: Dayjs; scheduleEnd?: Dayjs }): TimeSlot[] {
  const { timeBlocks, scheduleStart, scheduleEnd } = params;
  if (scheduleStart) {
    timeBlocks.unshift({ start: scheduleStart.subtract(1, 'minute'), end: scheduleStart });
  }
  if (scheduleEnd) {
    timeBlocks.push({ start: scheduleEnd, end: scheduleEnd.add(1, 'minute') });
  }
  const mergedBlocks: TimeBlock[] = [];
  // let index = 0;
  // while (index < timeBlocks.length) {
  //   const mergedBlock = timeBlocks[index];
  //   let _i = index + 1;
  //   while (_i < timeBlocks.length) {
  //     if (hasTimeConflict(mergedBlock, timeBlocks[_i], '[]')) {
  //       mergedBlock.start = mergedBlock.start.isSameOrBefore(timeBlocks[_i].start, 'minute') ? mergedBlock.start : timeBlocks[_i].start;
  //       mergedBlock.end = mergedBlock.end.isSameOrAfter(timeBlocks[_i].end, 'minute') ? mergedBlock.end : timeBlocks[_i].end;
  //       timeBlocks.splice(_i, 1);
  //     } else _i++;
  //   }
  //   mergedBlocks.push(mergedBlock);
  //   index++;
  // }
  const mergeBlocks = (idx: number) => {
    if (idx > timeBlocks.length - 1) return;
    const mergedBlock = timeBlocks[idx];
    for (let i = idx + 1; i < timeBlocks.length; i++) {
      if (hasTimeConflict(mergedBlock, timeBlocks[i], '[]')) {
        mergedBlock.start = mergedBlock.start.isSameOrBefore(timeBlocks[i].start, 'minute') ? mergedBlock.start : timeBlocks[i].start;
        mergedBlock.end = mergedBlock.end.isSameOrAfter(timeBlocks[i].end, 'minute') ? mergedBlock.end : timeBlocks[i].end;
        timeBlocks.splice(i, 1);
        i--; //adjust index after splicing
      }
    }
    mergedBlocks.push(mergedBlock);
    mergeBlocks(idx + 1);
  };
  mergeBlocks(0);
  const sortedMergedBlocks = mergedBlocks.sort((_b1, _b2) => {
    if (_b1.start.isAfter(_b2.start, 'minute')) return 1;
    return -1;
  });
  const timeSlots: TimeSlot[] = [];
  for (let i = 0; i < sortedMergedBlocks.length - 1; i++) {
    const start = sortedMergedBlocks[i].end;
    const end = sortedMergedBlocks[i + 1].start;
    if (start.isBefore(end, 'minute')) timeSlots.push({ start, end });
  }
  return timeSlots;
}

export function createSchedule(params: { date: DateParam; goals: Goal[]; scheduleOptions?: ScheduleOptions }): GoalSchedule {
  const { goals } = params;
  const date = dayjs(getStandardFormat(params.date));
  console.log(date);
  const scheduleOptions: Required<ScheduleOptions> = {
    scheduleStart: dayjs(params.scheduleOptions?.scheduleStart ?? date.set('hour', 6).set('minute', 30)),
    scheduleEnd: params.scheduleOptions?.scheduleEnd ? dayjs(params.scheduleOptions?.scheduleEnd) : date.add(1, 'day'),
    sortByMostTimeConsuming: true,
    checkTimeConflicts: true, // Change to false later. Just testing for now
    scheduleRespiteOptions: {
      respites: params.scheduleOptions?.scheduleRespiteOptions?.respites ?? [
        { start: date.set('hour', 12).set('minute', 0), end: date.set('hour', 13).set('minute', 0) },
      ], // defaults to lunch
      blockedRespites: params.scheduleOptions?.scheduleRespiteOptions?.blockedRespites ?? [
        { start: date.set('hour', 22).set('minute', 0), end: date.add(1, 'day').set('hour', 6).set('minute', 30) },
      ],
      allowedDuringRespites: params.scheduleOptions?.scheduleRespiteOptions?.allowedDuringRespites ?? ['entertainment', 'food', 'lifestyle'],
      allowUncategorizedDuringRespites: params.scheduleOptions?.scheduleRespiteOptions?.allowUncategorizedDuringRespites ?? true,
      // ^change to false later. just testing it as true for now
    },
    defaultGoalDuration: params.scheduleOptions?.defaultGoalDuration ?? { minutes: 30 },
    randomizeScheduling: true,
  };
  console.log('SCHEDULE OPTIONS: ', scheduleOptions);
  //Split goals into 3 arrays of importance
  const goalsWithTime: (Goal & {
    dateTimeData: {
      start: { date: string; dateTime: string; timeZone?: string };
      end: { date: string; dateTime: string; timeZone?: string };
      status: Record<string, GoalStatus>;
    };
  })[] = [];
  const goalsWithDuration: (Goal & { duration: GoalDuration })[] = [];
  const goalsWithoutTime: Goal[] = [];
  goals.forEach((goal) => {
    const start = goal.dateTimeData.start.dateTime;
    const end = goal.dateTimeData.end.dateTime;
    if (start && end && dayjs(end).diff(start, 'minute') > 0) {
      // I'm stupid and typescript is annoying
      goalsWithTime.push({
        ...goal,
        dateTimeData: {
          start: {
            ...goal.dateTimeData.start,
            dateTime: goal.dateTimeData.start.dateTime!,
          },
          end: {
            ...goal.dateTimeData.end,
            dateTime: goal.dateTimeData.end.dateTime!,
          },
          status: goal.dateTimeData.status,
        },
      });
    } else if (goal.duration) goalsWithDuration.push({ ...goal, duration: goal.duration });
    else goalsWithoutTime.push(goal);
  });
  console.log('---- LOGGING GOAL ARRAYS ----');
  console.log(goalsWithTime);
  console.log(goalsWithDuration);
  console.log(goalsWithoutTime);
  //Sort all 3 arrays by either starting time or duration (based on scheduleOptions)
  const sortedGoalsWithTime = goalsWithTime.sort((_g1, _g2) => {
    const dateTime1 = _g1.dateTimeData.start.dateTime!;
    const dateTime2 = _g2.dateTimeData.start.dateTime!;
    if (dayjs(dateTime1).isSameOrBefore(dayjs(dateTime2), 'minute')) return -1;
    return 1;
  });
  const sortedGoalsWithDuration = goalsWithDuration.sort((_g1, _g2) => {
    const duration1 = getGoalDuration(_g1.duration!);
    const duration2 = getGoalDuration(_g2.duration!);
    if (scheduleOptions.sortByMostTimeConsuming) {
      if (compareDuration(duration2, duration1)) return 1;
      return -1;
    } else {
      if (compareDuration(duration2, duration1)) return 1;
      return -1;
    }
  });
  const allowedCategoriesDuringRespites = scheduleOptions.scheduleRespiteOptions?.allowedDuringRespites!;
  let sortedGoalsWithoutTime = goalsWithoutTime.map((goal) => ({ ...goal, duration: scheduleOptions.defaultGoalDuration! })); //add duration using defaultGoalDuration
  if (scheduleOptions.randomizeScheduling) sortedGoalsWithoutTime = shuffleArray(sortedGoalsWithoutTime);
  //sorted by "work" (disallowed during respites) first
  else
    sortedGoalsWithoutTime = sortedGoalsWithoutTime.sort((_g1, _g2) => {
      if (_g1.category && allowedCategoriesDuringRespites.includes(_g1.category)) return 1;
      return -1;
    });
  console.log('---- LOGGING SORTED GOAL ARRAYS ----');
  console.log('GOALS WITH TIME', sortedGoalsWithTime);
  console.log('GOALS WITH DURATION', sortedGoalsWithDuration);
  console.log('GOALS WITHOUT TIME', sortedGoalsWithoutTime);
  // Start scheduling
  const unscheduled: Goal[] = [];
  // Schedule by importance
  // Start by finding those with time conflicts if time conflict option is on
  // If there is a time conflict remove from goalsWithTime array according to schedule options. Then add those removed to unscheduled array
  if (scheduleOptions.checkTimeConflicts) {
    goalsWithTime.forEach((goalOne, i) => {
      goalsWithTime.forEach((goalTwo, _i) => {
        const goalOneDateTime = goalOne.dateTimeData;
        const goalTwoDateTime = goalTwo.dateTimeData;
        if (
          hasTimeConflict(
            { start: dayjs(goalOneDateTime.start.dateTime), end: dayjs(goalOneDateTime.end.dateTime) },
            { start: dayjs(goalTwoDateTime.start.dateTime), end: dayjs(goalTwoDateTime.end.dateTime) },
            '[]'
          ) &&
          i !== _i
        ) {
          const durationOne = dayjs.duration(dayjs(goalOneDateTime.start.dateTime).diff(goalOneDateTime.end.dateTime, 'minute'));
          const durationTwo = dayjs.duration(dayjs(goalTwoDateTime.start.dateTime).diff(goalTwoDateTime.end.dateTime, 'minute'));
          const comparison = compareDuration(durationOne, durationTwo);
          if (scheduleOptions.sortByMostTimeConsuming) {
            if (comparison) {
              goalsWithTime.splice(_i, 1);
              unscheduled.push(goalTwo);
            } else {
              goalsWithTime.splice(i, 1);
              unscheduled.push(goalOne);
            }
          } else if (comparison) {
            goalsWithTime.splice(i, 1);
            unscheduled.push(goalOne);
          } else {
            goalsWithTime.splice(_i, 1);
            unscheduled.push(goalTwo);
          }
        }
      });
    });
  }
  const schedule: ScheduledGoal[] = sortedGoalsWithTime.map((_g) => convertGoalToScheduledGoal(_g));
  const blockedRespites: TimeSlot[] = scheduleOptions
    .scheduleRespiteOptions!.blockedRespites!.map((item) => ({
      start: dayjs(item.start),
      end: dayjs(item.end),
    }))
    .sort((a, b) => {
      if (a.end.isBefore(b.end, 'minute')) return -1;
      return 1;
    });
  console.log('BLOCKED RESPITES: ', blockedRespites);
  let timeBlocks: TimeBlock[] = sortedGoalsWithTime
    .map((_g) => ({ start: dayjs(_g.dateTimeData.start.dateTime), end: dayjs(_g.dateTimeData.end.dateTime) }))
    .concat(blockedRespites);
  let respiteTimeSlots: TimeSlot[] = scheduleOptions.scheduleRespiteOptions.respites.map((respite) => ({
    start: dayjs(respite.start),
    end: dayjs(respite.end),
  }));
  timeBlocks = timeBlocks.concat(respiteTimeSlots);
  console.log('RESPITE TIME SLOTS', respiteTimeSlots);
  console.log('TIMEBLOCKS', timeBlocks);
  let availableTimeSlots: TimeSlot[] = createTimeSlots({
    timeBlocks,
    scheduleStart: dayjs(scheduleOptions.scheduleStart),
    scheduleEnd: dayjs(scheduleOptions.scheduleEnd),
  });
  console.log('TIMESLOTS(0000): ', availableTimeSlots);
  //now that we have time slots we can start scheduling
  const addToScheduleUsingTimeSlots = (goals: (Goal & { duration: GoalDuration })[], timeSlots: TimeSlot[]) => {
    for (let i = 0; i < timeSlots.length; i++) {
      const timeSlot = timeSlots[i];
      goals.forEach((goal, idx) => {
        const timeSlotDuration = timeSlot.end.diff(timeSlot.start, 'millisecond');
        const goalDuration = getGoalDuration(goal.duration).asMilliseconds();
        if (timeSlotDuration >= goalDuration) {
          const { start, end, status } = goal.dateTimeData;
          schedule.push(
            convertGoalToScheduledGoal({
              ...goal,
              dateTimeData: {
                start: { date: start.date, dateTime: timeSlot.start.format() },
                end: { date: end.date, dateTime: timeSlot.start.add(goalDuration, 'millisecond').format() },
                status,
              },
            })
          );
          goals.splice(idx, 1);
          timeSlot.start = timeSlot.start.add(goalDuration, 'millisecond');
        }
      });
    }
  };
  let disallowedCategoriesGoalsWithDuration: (Goal & { duration: GoalDuration })[] = [];
  const allowedCategoriesGoalsWithDuration = sortedGoalsWithDuration.filter((_g) => {
    if (scheduleOptions.scheduleRespiteOptions.allowUncategorizedDuringRespites || allowedCategoriesDuringRespites.includes(_g.category!))
      return true;
    disallowedCategoriesGoalsWithDuration.push(_g);
    return false;
  });
  console.log(allowedCategoriesGoalsWithDuration);
  console.log(disallowedCategoriesGoalsWithDuration);
  let disallowedCategoriesGoalsWithoutTime: (Goal & { duration: GoalDuration })[] = [];
  const allowedCategoriesGoalsWithoutTime = sortedGoalsWithoutTime.filter((_g) => {
    if (scheduleOptions.scheduleRespiteOptions.allowUncategorizedDuringRespites || allowedCategoriesDuringRespites.includes(_g.category!))
      return true;
    disallowedCategoriesGoalsWithoutTime.push(_g);
    return false;
  });
  console.log(allowedCategoriesGoalsWithoutTime);
  console.log(disallowedCategoriesGoalsWithoutTime);
  addToScheduleUsingTimeSlots(allowedCategoriesGoalsWithDuration, respiteTimeSlots);
  disallowedCategoriesGoalsWithDuration = disallowedCategoriesGoalsWithDuration.concat(allowedCategoriesGoalsWithDuration);
  addToScheduleUsingTimeSlots(disallowedCategoriesGoalsWithDuration, availableTimeSlots);
  disallowedCategoriesGoalsWithDuration.forEach((goal) => unscheduled.push(goal));

  addToScheduleUsingTimeSlots(allowedCategoriesGoalsWithoutTime, respiteTimeSlots);
  disallowedCategoriesGoalsWithoutTime = disallowedCategoriesGoalsWithoutTime.concat(allowedCategoriesGoalsWithoutTime);
  addToScheduleUsingTimeSlots(disallowedCategoriesGoalsWithoutTime, availableTimeSlots);
  disallowedCategoriesGoalsWithoutTime.forEach((goal) => unscheduled.push(goal));

  console.log('AVAILABLE TIMESLOTS', availableTimeSlots);
  console.log('RESPITE TIMESLOTS', respiteTimeSlots);

  sortedGoalsWithoutTime.forEach((goal) => unscheduled.push(goal));
  schedule.sort((a, b) => {
    if (dayjs(a.start).isBefore(dayjs(b.start), 'minute')) return -1;
    return 1;
  });
  return {
    schedule,
    unscheduled,
  };
}
