import { DateParam, GoalWeekdays } from '@shared/types';
import * as dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const DAYJS_FORMAT_TYPE = 'YYYY-MM-DD';

export const WEEKDAYS: GoalWeekdays[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export const WEEKDAYS_MAP = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

/** self-explanatory */
export function dayjsArrayToString(params: { array: Dayjs[]; getISOString?: boolean }): string[] {
  const { array, getISOString } = params;
  return array.map((item) => (getISOString ? item.toISOString() : item.toString()));
}

/** self-explanatory */
export function stringArrayToDayjs(params: { array: string[] }): Dayjs[] {
  const array = params.array;
  return array.map((item) => dayjs(item));
}

/** creates weekRange Dayjs[] */
export function createWeekRangeArr(params: { date: Dayjs; range: number; getStringArray?: boolean }): Dayjs[] {
  const { date, range } = params;
  const weekArr = [date];
  let _r = range;
  _r -= 1;
  _r = Math.floor(_r / 2);
  for (let i = 1; i <= _r; i++) {
    weekArr.push(date.add(i, 'day'));
    weekArr.unshift(date.subtract(i, 'day'));
  }
  return weekArr;
}

/** creates weekRange string[] */
export function createWeekRangeStringArr(params: { date: Dayjs; range: number }): string[] {
  const { date, range } = params;
  const weekArr = [standardFormat({ date })];
  let _r = range;
  _r -= 1;
  _r = Math.floor(_r / 2);
  for (let i = 1; i <= _r; i++) {
    weekArr.push(standardFormat({ date: date.add(i, 'day') }));
    weekArr.unshift(standardFormat({ date: date.subtract(i, 'day') }));
  }
  return weekArr;
}

/** returns dayjs date with time at 00:00 */
export function standardDate(params: { date: DateParam }): Dayjs {
  const date = params.date;
  return dayjs(date).startOf('day');
}

/**formats to YYYY-MM-DD string*/
export function standardFormat(params: { date: DateParam }): string {
  const date = params.date;
  return dayjs(date).format(DAYJS_FORMAT_TYPE);
}

/** local to UTC string */
export function utcFormat(params: { date: DateParam }): string {
  const date = params.date;
  return standardDate({ date }).utc().format(DAYJS_FORMAT_TYPE);
}

/** local to utc date */
export function utcDate(params: { date: DateParam }): dayjs.Dayjs {
  const date = params.date;
  return dayjs(date).utc();
}

/** local to UTC dayjs */
export function standardUtcDate(params: { date: DateParam }): Dayjs {
  const date = params.date;
  return standardDate({ date }).utc();
}

/** utc to local string */
export function localFormat(params: { date: DateParam }): string {
  const date = params.date;
  return standardDate({ date }).local().format(DAYJS_FORMAT_TYPE);
}

/** utc to local date */
export function localDate(params: { date: DateParam }): Dayjs {
  const date = params.date;
  return dayjs(date).local();
}

/** utc to local dayjs */
export function standardLocalDate(params: { date: DateParam }): Dayjs {
  const date = params.date;
  return standardDate({ date }).local();
}

export const TODAY_DATE = standardDate({ date: dayjs() });
export const TODAY_DATE_FORMATTED = standardFormat({ date: dayjs() });
