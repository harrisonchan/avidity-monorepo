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
import { getGoalDuration } from './goalHelpers';

dayjs.extend(duration);
dayjs.extend(isSameOrBefore);

const test = dayjs.duration({ months: 1 });
type boop = duration.Duration;

const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;

export type TimeSlot = {
  start: Dayjs;
  end: Dayjs;
};

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

type ScheduledGoal = {
  id: string;
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

type GoalSchedule = {
  schedule: ScheduledGoal[];
  unscheduled: Goal[];
};

type ScheduleOptions = {
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
  let start = dayjs();
  let end = dayjs();
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

function createSchedule(params: { date: DateParam; goals: Goal[]; scheduleOptions?: ScheduleOptions }): GoalSchedule {
  const { date, goals } = params;
  const scheduleOptions: ScheduleOptions = {
    scheduleStart: dayjs(params.scheduleOptions?.scheduleStart) ?? dayjs(getStandardFormat(date)).set('hour', 8),
    scheduleEnd: dayjs(params.scheduleOptions?.scheduleStart) ?? null,
    sortByMostTimeConsuming: true,
    checkTimeConflicts: true, // Change to false later. Just testing for now
    scheduleRespiteOptions: {
      respites: params.scheduleOptions?.scheduleRespiteOptions?.respites ?? [],
      blockedRespites: params.scheduleOptions?.scheduleRespiteOptions?.blockedRespites ?? [
        { start: dayjs(getStandardFormat(date)).set('hour', 22), end: dayjs(getStandardFormat(date)).add(1, 'day').set('hour', 6).set('minute', 30) },
      ],
      allowedDuringRespites: params.scheduleOptions?.scheduleRespiteOptions?.allowedDuringRespites ?? ['entertainment', 'food', 'lifestyle'],
      allowUncategorizedDuringRespites: params.scheduleOptions?.scheduleRespiteOptions?.allowUncategorizedDuringRespites ?? true,
      // ^change to false later. just testing it as true for now
    },
  };
  //Split goals into 3 arrays of importance
  const goalsWithTime: (Goal & {
    dateTimeData: {
      start: { date: string; dateTime: string; timeZone?: string };
      end: { date: string; dateTime: string; timeZone?: string };
      status: Record<string, GoalStatus>;
    };
  })[] = [];
  const goalsWithDuration: Goal[] = [];
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
    } else if (goal.duration) goalsWithDuration.push(goal);
    else goalsWithoutTime.push(goal);
  });
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
  //sorted by "work" (disallowed during respites) first
  const allowedCategoriesDuringRespites = scheduleOptions.scheduleRespiteOptions?.allowedDuringRespites!;
  const sortedGoalsWithoutTime = goalsWithoutTime.sort((_g1, _g2) => {
    if (_g1.category && allowedCategoriesDuringRespites.includes(_g1.category)) return 1;
    return -1;
  });
  // Start scheduling
  const unscheduled: Goal[] = [];
  // Schedule by importance
  // Start by finding those with time conflicts if time conflict option is on
  // If there is a time conflict remove from goalsWithTime array according to schedule options. Then add those removed to unscheduled array
  if (scheduleOptions.checkTimeConflicts) {
    goalsWithTime.forEach((_g1, _i1) => {
      goalsWithTime.forEach((_g2, _i2) => {
        const dateTime1 = dayjs(_g1.dateTimeData.start.dateTime!);
        const dateTime2 = dayjs(_g2.dateTimeData.start.dateTime!);
        if (dateTime1.isSame(dateTime2, 'minute') && _g1.id !== _g2.id) {
          const duration1 = dayjs.duration(dateTime1.diff(dayjs(_g1.dateTimeData.end.dateTime!)));
          const duration2 = dayjs.duration(dateTime2.diff(dayjs(_g2.dateTimeData.end.dateTime!)));
          if (scheduleOptions.sortByMostTimeConsuming) {
            if (compareDuration(duration1, duration2)) {
              goalsWithTime.splice(_i2, 1);
              unscheduled.push(_g2);
            } else {
              goalsWithTime.splice(_i1, 1);
              unscheduled.push(_g1);
            }
          } else {
            if (compareDuration(duration1, duration2)) {
              goalsWithTime.splice(_i1, 1);
              unscheduled.push(_g1);
            } else {
              goalsWithTime.splice(_i2, 1);
              unscheduled.push(_g2);
            }
          }
        }
      });
    });
  }
  const schedule: ScheduledGoal[] = goalsWithTime.map((_g) => convertGoalToScheduledGoal(_g));

  return {
    schedule: [],
    unscheduled: [],
  };
}

// // Sorts schedule by time
// function sortSchedule(params: { schedule: Schedule }): Schedule {
//   const { schedule } = params;
//   return schedule.sort((_m1, _m2) => {
//     if ((_m1.time && _m2.time && _m1.time.start.isBefore(_m2.time.start)) || (_m1.time && !_m2.time)) {
//       return -1;
//     } else return 1;
//   });
// }

// // Creates time slots from goals for the day
// function createTimeSlots(params: { schedule: Schedule; scheduleStart: Dayjs }): TimeSlot[] {
//   const { schedule, scheduleStart } = params;
//   const sortedSchedule = sortSchedule({ schedule });

//   let timeSlots: TimeSlot[] = [];
//   let prevWithTimeIdx = -1;
//   let nextWithTimeIdx = sortedSchedule.findIndex((goal) => goal.time);
//   console.debug('sortedSchedule', sortedSchedule);
//   for (let i = 0; i < sortedSchedule.length; i++) {
//     const nextSchedule = i === sortedSchedule.length - 1 ? [] : sortedSchedule.slice(i + 1);
//     nextWithTimeIdx = nextSchedule.findIndex((goal) => goal.time);
//     const block = sortedSchedule[i];
//     if (block.time) {
//       const newSlot = { start: sortedSchedule[prevWithTimeIdx]?.time.end, end: block.time.start };
//       if (prevWithTimeIdx === -1 && block.time.start.isAfter(scheduleStart)) {
//         timeSlots.push({ start: scheduleStart, end: block.time.start });
//       } else if (prevWithTimeIdx > -1 && !newSlot.start.isSame(newSlot.end)) {
//         timeSlots.push(newSlot);
//       }
//       if (nextWithTimeIdx === -1 && block.time.end.isBefore(scheduleStart.endOf('day'))) {
//         timeSlots.push({ start: block.time.end, end: scheduleStart.endOf('day') });
//       }
//       prevWithTimeIdx = i;
//       if (nextWithTimeIdx !== -1) nextWithTimeIdx += i;
//     }
//   }

//   if (timeSlots.length === 0) {
//     timeSlots = [{ start: scheduleStart, end: scheduleStart.endOf('day') }];
//   }
//   console.debug('timeSlots', timeSlots);
//   return timeSlots;
// }

// export type CreateScheduleParams = {
//   date: Dayjs;
//   goals: Goal[];
//   scheduleStart: Dayjs;
//   useGoogleDistanceMatrix?: boolean;
// };

// async function scheduleGoals(params: CreateScheduleParams): Promise<ScheduleObject> {
//   // console.debug(`(GoalSchedule.scheduleGoals) Scheduling goals with params:`, params);
//   const { date, goals, scheduleStart, useGoogleDistanceMatrix } = params;
//   let goalsWithoutTime: Goal[] = [];
//   const goalsWithTime: Goal[] = goals
//     .filter((goal) => {
//       if (!goal.time) {
//         goalsWithoutTime.push(goal);
//         return false;
//       }
//       return true;
//     })
//     .map((goal) => {
//       const start = dayjs(goal.time!.start);
//       return { goal, score: MINUTES_IN_DAY - (start.hour() * MINUTES_IN_HOUR + start.minute()) };
//     })
//     .sort((a, b) => b.score - a.score)
//     .map((_g) => _g.goal); // Now goalsWithTime is organized by starting time, with the earliest starting time first
//   goalsWithoutTime
//     .map((goal) => {
//       const duration = dayjs.duration(goal.duration);
//       const hourMinutes = !isNaN(duration.hours()) ? duration.hours() * 60 : 0;
//       const minutes = !isNaN(duration.minutes()) ? duration.minutes() : 0;
//       return { goal, score: hourMinutes + minutes };
//     })
//     .sort((a, b) => b.score - a.score)
//     .map((_g) => _g.goal); // Now goalsWithoutTime is organized by duration, with the longest duration first
//   goalsWithoutTime = shuffleArray(goalsWithoutTime);

//   const goalsWithLocations = goals.filter((_g) => _g.location);
//   const queryUrl = `http://localhost:3001/schedules/commute-duration?locations=` + goalsWithLocations.map((_g) => _g.location).join('|');
//   const goalCommutes: {
//     id: string;
//     location: string;
//     commutes: {
//       id: string;
//       data: { destinations: string; distance: { text: string; value: number }; duration: { text: string; value: number }; status: string };
//     }[];
//   }[] =
//     useGoogleDistanceMatrix && goals.some((_g) => _g.location)
//       ? await axios.get(queryUrl).then((res) =>
//           res.data.data.map(
//             (
//               _d: {
//                 location: string;
//                 commutes: {
//                   destination: string;
//                   distance: { text: string; value: number };
//                   duration: { text: string; value: number };
//                   status: string;
//                 }[];
//               },
//               idx: number
//             ) => ({
//               id: goalsWithLocations[idx].id,
//               location: goalsWithLocations[idx].location,
//               commutes: goalsWithLocations.filter((_g, _gIdx) => _gIdx !== idx).map((_g, _gIdx) => ({ id: _g.id, data: _d.commutes[_gIdx] })),
//             })
//           )
//         )
//       : [];

//   const useGoalCommutes = goalCommutes.length > 0;

//   let schedule: Schedule = [];
//   const goalsNotAdded: Map<string, Goal> = new Map();
//   goalsWithTime.forEach((goal) => {
//     const time = { start: dayjs(goal.time!.start), end: dayjs(goal.time!.end) };
//     const commuteDuration = goal.commute ? dayjs.duration(goal.commute.duration) : null;
//     const restDuration = goal.rest ? dayjs.duration(goal.rest.duration) : null;
//     let blockStart = commuteDuration ? time.start.subtract(commuteDuration) : time.start;
//     const blockEnd = restDuration ? time.end.add(restDuration) : time.end;
//     let hasConflicts = false;
//     for (const item of schedule) {
//       if (useGoalCommutes && !isNil(item.location)) {
//         blockStart = time.start.subtract(
//           dayjs.duration({
//             seconds: goalCommutes.find((_c) => _c.id === goal.id)?.commutes.filter((_g) => _g.id === item.id)[0].data.duration.value,
//           })
//         );
//       }
//       if (
//         blockStart.isBetween(item.time.start, item.time.end, 'minute', '[]') ||
//         blockEnd.isBetween(item.time.start, item.time.end, 'minute', '[]')
//       ) {
//         // console.log(
//         //   `goal ${goal.id} (${blockStart.format('HH:mm') + ' ~ ' + blockEnd.format('HH:mm')}) has time conflict with goal ${
//         //     item.id
//         //   } (${item.time.start.format('HH:mm' + ' ~ ' + item.time.end.format('HH:mm'))})`
//         // );
//         goalsNotAdded.set(goal.id, goal);
//         hasConflicts = true;
//       }
//       blockStart = commuteDuration ? time.start.subtract(commuteDuration) : time.start;
//     }
//     if (!hasConflicts) {
//       commuteDuration &&
//         schedule.push({
//           id: `commute-${goal.id}`,
//           duration: commuteDuration,
//           time: { start: blockStart, end: time.start },
//           title: `Commute for ${goal.title}`,
//           goalId: goal.id,
//           type: 'commute',
//           location: null,
//         });
//       restDuration &&
//         schedule.push({
//           id: `rest-${goal.id}`,
//           duration: restDuration,
//           time: { start: time.end, end: blockEnd },
//           goalId: goal.id,
//           title: `Rest for ${goal.title}`,
//           type: 'rest',
//           location: null,
//         });
//       schedule.push({
//         id: goal.id,
//         duration: dayjs.duration(goal.duration),
//         time: { start: time.start, end: time.end },
//         type: 'goal',
//         commute: goal.commute ? { start: blockStart, end: time.start } : null,
//         rest: goal.rest ? { start: time.end, end: blockEnd } : null,
//         location: goal.location,
//         title: goal.title,
//       });
//     }
//   });

//   let timeSlots: TimeSlot[] = createTimeSlots({ schedule, scheduleStart });

//   for (const goal of goalsWithoutTime) {
//     let added = false;
//     for (let timeSlot of timeSlots) {
//       if (!added) {
//         const blockStart = timeSlot.start;
//         const duration = dayjs.duration(goal.duration);
//         const commuteDuration = goal.commute ? dayjs.duration(goal.commute.duration) : null;
//         const restDuration = goal.rest ? dayjs.duration(goal.rest.duration) : null;
//         let blockEnd = restDuration ? timeSlot.start.add(duration).add(restDuration) : timeSlot.start.add(duration);
//         if (commuteDuration) blockEnd = blockEnd.add(commuteDuration);
//         const goalStart = commuteDuration ? blockStart.add(commuteDuration) : blockStart;
//         const goalEnd = restDuration ? blockEnd.subtract(restDuration) : blockEnd;
//         if (blockEnd.isSameOrBefore(timeSlot.end)) {
//           const commute = { start: blockStart, end: goalStart };
//           const goalBreak = { start: goalEnd, end: blockEnd };
//           commuteDuration &&
//             schedule.push({
//               id: 'commute-' + goal.id,
//               time: commute,
//               duration: commuteDuration,
//               type: 'commute',
//               goalId: goal.id,
//               title: `Commute for ${goal.title}`,
//               location: null,
//             });
//           restDuration &&
//             schedule.push({
//               id: 'rest-' + goal.id,
//               time: goalBreak,
//               duration: restDuration,
//               type: 'rest',
//               goalId: goal.id,
//               title: `Rest for ${goal.title}`,
//               location: null,
//             });
//           const newScheduleItem: ScheduledGoal = {
//             id: goal.id,
//             time: { start: goalStart, end: goalEnd },
//             duration,
//             commute: goal.commute ? { start: blockStart, end: goalStart } : null,
//             rest: goal.rest ? { start: goalEnd, end: blockEnd } : null,
//             location: goal.location,
//             title: goal.title,
//             type: 'goal',
//           };
//           schedule.push(newScheduleItem);
//           timeSlot.start = blockEnd;
//           if (timeSlot.start.isSameOrAfter(timeSlot.end)) {
//             timeSlots.splice(timeSlots.indexOf(timeSlot), 1);
//           }
//           added = true;
//         }
//       }
//     }
//     if (!added) goalsNotAdded.set(goal.id, goal);
//   }

//   const goalsNotAddedArr = Array.from(goalsNotAdded, ([id, _m]) => _m);
//   const scheduleObject: ScheduleObject = { date, schedule: sortSchedule({ schedule }), goalsNotAdded: goalsNotAddedArr };
//   return scheduleObject;
// }

// const DEFAULT_ITERATIONS = 1;
// const EMPTY_SCHEDULE_OBJECT: ScheduleObject = { date: TODAY_DATE, schedule: [], goalsNotAdded: [] };

// export const EMPTY_SCHEDULE_OBJECT_WITH_DUMMY_GOALS_NOT_ADDED: ScheduleObject = {
//   ...EMPTY_SCHEDULE_OBJECT,
//   goalsNotAdded: [{ ...EMPTY_GOAL, id: 'dummy-goal', title: 'dummy-goal' }],
// };

// const useGoalSchedule = () => {
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [scheduleObject, setScheduleObject] = useState<ScheduleObject>(EMPTY_SCHEDULE_OBJECT_WITH_DUMMY_GOALS_NOT_ADDED);
//   useEffect(() => {
//     setIsCalculating(false);
//   }, [scheduleObject]);

//   const createSchedule = async (iterations: number, createScheduleParams: CreateScheduleParams) => {
//     setIsCalculating(true);
//     const { date, goals, scheduleStart, useGoogleDistanceMatrix } = createScheduleParams;
//     let attempts = iterations ?? DEFAULT_ITERATIONS;
//     let attemptsToSuccess = 0;
//     setTimeout(async () => {
//       while (attempts > 0 && scheduleObject.goalsNotAdded.length > 0) {
//         let newSchedule = await scheduleGoals({ date, goals, scheduleStart, useGoogleDistanceMatrix });
//         if (newSchedule.goalsNotAdded.length === 0) {
//           setScheduleObject(newSchedule);
//           break;
//         }
//         if (attempts === 1) setScheduleObject(newSchedule);
//         attempts--;
//         attemptsToSuccess++;
//       }
//       // console.debug(`(useScheduleMissions.createSchedule) create schedule took ${attemptsToSuccess} attempts: `, scheduleObject);
//     }, 1);
//   };

//   const resetSchedule = () => {
//     setScheduleObject(EMPTY_SCHEDULE_OBJECT);
//   };

//   return { isCalculating, scheduleObject, resetSchedule, createSchedule };
// };

// export default useGoalSchedule;
