import dayjs, { Dayjs } from 'dayjs';
import duration, { Duration } from 'dayjs/plugin/duration';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isBetween from 'dayjs/plugin/isBetween';
import { arrayUtils } from '../utils';
import { useEffect, useState } from 'react';
import axios from 'axios';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(duration);
dayjs.extend(isBetween);

export type LatLngType = {
  lat: string | number;
  lng: string | number;
};

export type BaseMissionType = {
  id: string;
  time?: { start: Dayjs; end: Dayjs };
  duration: Duration;
  location?: string | LatLngType;
};

export type MissionType = BaseMissionType & {
  commute?: { duration: Duration };
  break?: { duration: Duration };
  type: 'mission';
};

export type ScheduleMissionType = Omit<BaseMissionType, 'time'> & {
  time: { start: Dayjs; end: Dayjs };
  commute?: { start: Dayjs; end: Dayjs };
  break?: { start: Dayjs; end: Dayjs };
  type: 'scheduleMission';
};

export type ScheduleMissionCommuteType = Omit<ScheduleMissionType, 'type' | 'commute'> & {
  type: 'scheduleMissionCommute';
  commute?: { start: Dayjs; end: Dayjs; origin?: string; destination?: string };
};

export type ScheduleMissionBreakType = Omit<ScheduleMissionType, 'type' | 'commute'> & {
  type: 'scheduleMissionBreak';
};

export type TimeSlotType = {
  start: Dayjs;
  end: Dayjs;
};

export type ScheduleArrayType = (ScheduleMissionType | ScheduleMissionCommuteType | ScheduleMissionBreakType)[];
export type ScheduleType = {
  date: Dayjs;
  schedule: ScheduleArrayType;
  missionsNotAdded: MissionType[];
};

export const sortSchedule = (params: { schedule: ScheduleArrayType }): ScheduleArrayType => {
  const { schedule } = params;
  return schedule.sort((_m1, _m2) => {
    if ((_m1.time && _m2.time && _m1.time.start.isBefore(_m2.time.start)) || (_m1.time && !_m2.time)) {
      return -1;
    } else return 1;
  });
};

export const createTimeSlots = (params: { schedule: ScheduleArrayType; scheduleStartTime: Dayjs }): TimeSlotType[] => {
  const { schedule, scheduleStartTime } = params;
  const sortedSchedule = sortSchedule({ schedule });

  let timeSlots: TimeSlotType[] = [];
  let prevWithTimeIdx = -1;
  let nextWithTimeIdx = -1;

  for (let i = 0; i < sortedSchedule.length; i++) {
    const block = sortedSchedule[i];
    if (block.time) {
      const newSlot = { start: sortedSchedule[prevWithTimeIdx]?.time.end, end: block.time.start };
      if (prevWithTimeIdx === -1 && block.time.start.isAfter(scheduleStartTime)) {
        timeSlots.push({ start: scheduleStartTime, end: block.time.start });
      } else if (prevWithTimeIdx > -1 && nextWithTimeIdx === -1 && block.time.end.isBefore(scheduleStartTime.endOf('day'))) {
        timeSlots.push({ start: block.time.end, end: scheduleStartTime.endOf('day') });
      } else if (prevWithTimeIdx > -1 && !newSlot.start.isSame(newSlot.end)) {
        timeSlots.push(newSlot);
      }
      prevWithTimeIdx = i;
      const nextSchedule = i === sortedSchedule.length - 1 ? [] : sortedSchedule.slice(i + 1);
      nextWithTimeIdx = nextSchedule.findIndex((mission) => mission.time);
      if (nextWithTimeIdx !== -1) nextWithTimeIdx += i;
    }
  }

  if (timeSlots.length === 0) {
    timeSlots = [{ start: scheduleStartTime, end: scheduleStartTime.endOf('day') }];
  }

  return timeSlots;
};

const DEFAULT_ATTEMPTS = 10;

export const scheduleMissions = async (params: {
  date: Dayjs;
  missions: MissionType[];
  scheduleStartTime: Dayjs;
  attemptsToCalc?: number;
  useGoogleDistanceMatrixApi?: boolean;
}): Promise<ScheduleType> => {
  const { date, missions, scheduleStartTime, attemptsToCalc, useGoogleDistanceMatrixApi } = params;

  const missionsWithTime = missions
    .filter((mission) => mission.time)
    .map((mission) => {
      const startTime = dayjs(mission.time!.start);
      const startHour = startTime.hour();
      const startMinute = startTime.minute();
      return { mission, score: 1440 - (startHour * 60 + startMinute) };
    })
    .sort((a, b) => b.score - a.score)
    .map((_m) => _m.mission); // Now missionsWithTime is orgainzed by starting time, with the earliest starting time first

  let missionsWithoutTime = missions
    .filter((mission) => !mission.time)
    .map((mission) => {
      const hourMinutes = !isNaN(mission.duration.hours()) ? mission.duration.hours() * 60 : 0;
      const minutes = !isNaN(mission.duration.minutes()) ? mission.duration.minutes() : 0;
      const score = hourMinutes + minutes;
      return { mission, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((_m) => _m.mission); // Now missionsWithoutTime is organized by duration, with the longest duration first
  missionsWithoutTime = arrayUtils.shuffleArray(missionsWithoutTime);

  const missionsWithLocations = missions.filter((_m) => _m.location);
  const queryUrl = `http://localhost:3001/schedules/commute-duration?locations=` + missionsWithLocations.map((_m) => _m.location).join('|');
  const missionCommutes: {
    id: string;
    location: string;
    commutes: {
      id: string;
      data: { destinations: string; distance: { text: string; value: number }; duration: { text: string; value: number }; status: string };
    }[];
  }[] =
    useGoogleDistanceMatrixApi && missions.some((_m) => _m.location)
      ? await axios.get(queryUrl).then((res) =>
          res.data.data.map(
            (
              _d: {
                location: string;
                commutes: {
                  destination: string;
                  distance: { text: string; value: number };
                  duration: { text: string; value: number };
                  status: string;
                }[];
              },
              idx: number
            ) => ({
              id: missionsWithLocations[idx].id,
              location: missionsWithLocations[idx].location,
              commutes: missionsWithLocations.filter((_m, _mIdx) => _mIdx !== idx).map((_m, _mIdx) => ({ id: _m.id, data: _d.commutes[_mIdx] })),
            })
          )
        )
      : [];

  const useMissionCommutes = missionCommutes.length > 0;

  let schedule: ScheduleArrayType = [];
  missionsWithTime.forEach((mission) => {
    let blockStart = mission.commute ? mission.time!.start.subtract(mission.commute.duration) : mission.time!.start;
    const blockEnd = mission.break ? mission.time!.end.add(mission.break.duration) : mission.time!.end;
    let hasConflicts = false;
    for (const item of schedule) {
      if (useMissionCommutes && item.location) {
        blockStart = mission.time!.start.subtract(
          dayjs.duration({
            seconds: missionCommutes.find((_c) => _c.id === mission.id)?.commutes.filter((_) => _.id === item.id)[0].data.duration.value,
          })
        );
      }
      if (
        blockStart.isBetween(item.time.start, item.time.end, 'minute', '[]') ||
        blockEnd.isBetween(item.time.start, item.time.end, 'minute', '[]')
      ) {
        console.log(
          `Mission ${mission.id} (${blockStart.format('HH:mm') + ' ~ ' + blockEnd.format('HH:mm')}) has time conflict with mission ${
            item.id
          } (${item.time.start.format('HH:mm' + ' ~ ' + item.time.end.format('HH:mm'))})`
        );
        hasConflicts = true;
      }
      blockStart = mission.commute ? mission.time!.start.subtract(mission.commute.duration) : mission.time!.start;
    }
    if (!hasConflicts) {
      mission.commute &&
        schedule.push({
          id: `commute-${mission.id}`,
          duration: mission.commute.duration,
          time: { start: blockStart, end: mission.time!.start },
          type: 'scheduleMissionCommute',
        });
      mission.break &&
        schedule.push({
          id: `break-${mission.id}`,
          duration: mission.break.duration,
          time: { start: mission.time!.end, end: blockEnd },
          type: 'scheduleMissionBreak',
        });
      schedule.push({
        id: mission.id,
        duration: mission.duration,
        time: { start: mission.time!.start, end: mission.time!.end },
        type: 'scheduleMission',
        commute: mission.commute ? { start: blockStart, end: mission.time!.start } : undefined,
        break: mission.break ? { start: mission.time!.end, end: blockEnd } : undefined,
      });
    }
  });

  let timeSlots: TimeSlotType[] = createTimeSlots({ schedule, scheduleStartTime });
  const missionsNotAdded: Map<string, MissionType> = new Map();

  for (const mission of missionsWithoutTime) {
    let added = false;
    for (let timeSlot of timeSlots) {
      if (!added) {
        const blockStart = timeSlot.start;
        let blockEnd = mission.break ? timeSlot.start.add(mission.duration).add(mission.break.duration) : timeSlot.start.add(mission.duration);
        if (mission.commute) blockEnd = blockEnd.add(mission.commute.duration);
        const missionStart = blockStart.add(mission.commute?.duration ?? dayjs.duration(0));
        const missionEnd = blockEnd.subtract(mission.break?.duration ?? dayjs.duration(0));
        if (blockEnd.isSameOrBefore(timeSlot.end)) {
          const commute = { start: blockStart, end: missionStart };
          const missionBreak = { start: missionEnd, end: blockEnd };
          mission.commute &&
            schedule.push({ id: 'commute-' + mission.id, time: commute, duration: mission.commute.duration, type: 'scheduleMissionCommute' });
          mission.break &&
            schedule.push({ id: 'break-' + mission.id, time: missionBreak, duration: mission.break.duration, type: 'scheduleMissionBreak' });
          const newScheduleItem: ScheduleMissionType = {
            id: mission.id,
            time: { start: missionStart, end: missionEnd },
            duration: mission.duration,
            commute: mission.commute ? { start: blockStart, end: missionStart } : undefined,
            break: mission.break ? { start: missionEnd, end: blockEnd } : undefined,
            type: 'scheduleMission',
          };
          schedule.push(newScheduleItem);
          timeSlot.start = blockEnd;
          if (timeSlot.start.isSameOrAfter(timeSlot.end)) {
            timeSlots.splice(timeSlots.indexOf(timeSlot), 1);
          }
          added = true;
        }
      }
    }
    if (!added) missionsNotAdded.set(mission.id, mission);
  }

  const missionsNotAddedArr = Array.from(missionsNotAdded, ([id, _m]) => _m);
  const scheduleResult: ScheduleType = { date, schedule: sortSchedule({ schedule }), missionsNotAdded: missionsNotAddedArr };
  if (missionsNotAddedArr.filter((mission) => !mission.time).length > 0) {
    if (attemptsToCalc) {
      if (attemptsToCalc <= 1) return scheduleResult;
      return scheduleMissions({ date, missions, scheduleStartTime, attemptsToCalc: attemptsToCalc - 1 });
    } else {
      return scheduleMissions({ date, missions, scheduleStartTime, attemptsToCalc: DEFAULT_ATTEMPTS });
    }
  }
  return scheduleResult;
};

export const emptySchedule: ScheduleType = {
  date: dayjs(),
  schedule: [],
  missionsNotAdded: [],
};

export const emptyScheduleWithDummyMissionsNotAdded: ScheduleType = {
  ...emptySchedule,
  missionsNotAdded: [{ id: 'dummyMissionsNotAdded', duration: dayjs.duration({ minutes: 1 }), type: 'mission' }],
};

const useScheduleMissions = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleType>(emptyScheduleWithDummyMissionsNotAdded);
  useEffect(() => {
    setIsCalculating(false);
  }, [schedule]);

  const createSchedule = async (params: {
    date: Dayjs;
    missions: MissionType[];
    scheduleStartTime: Dayjs;
    attemptsToCalc?: number;
    useGoogleDistanceMatrixApi?: boolean;
  }) => {
    setIsCalculating(true);
    const { date, missions, scheduleStartTime, attemptsToCalc, useGoogleDistanceMatrixApi } = params;
    let attempts = attemptsToCalc ?? DEFAULT_ATTEMPTS;
    let attemptsToSuccess = 0;
    setTimeout(async () => {
      while (attempts > 0 && schedule.missionsNotAdded.length > 0) {
        let newSchedule = await scheduleMissions({ date, missions, scheduleStartTime, attemptsToCalc: 1, useGoogleDistanceMatrixApi });
        if (newSchedule.missionsNotAdded.length === 0) {
          setSchedule(newSchedule);
          break;
        }
        if (attempts === 1) setSchedule(newSchedule);
        attempts--;
        attemptsToSuccess++;
      }
      console.debug(`(useScheduleMissions.createSchedule) create schedule took ${attemptsToSuccess} attempts`);
    }, 1);
  };

  const resetSchedule = () => {
    setSchedule(emptyScheduleWithDummyMissionsNotAdded);
  };

  return { isCalculating, schedule, resetSchedule, createSchedule };
};

export default useScheduleMissions;
