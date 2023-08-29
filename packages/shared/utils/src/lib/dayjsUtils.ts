import { DateParam, Weekdays } from '@shared/types';
import * as dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { Duration } from 'dayjs/plugin/duration';

dayjs.extend(utc);

export const DAYJS_STANDARD_FORMAT_TYPE = 'YYYY-MM-DD';

export const WEEKDAYS: Weekdays[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
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
  const weekArr = [getStandardFormat(date)];
  let _r = range;
  _r -= 1;
  _r = Math.floor(_r / 2);
  for (let i = 1; i <= _r; i++) {
    weekArr.push(getStandardFormat(date.add(i, 'day')));
    weekArr.unshift(getStandardFormat(date.subtract(i, 'day')));
  }
  return weekArr;
}

/**formats to YYYY-MM-DD string*/
export function getStandardFormat(date: DateParam, fullLength?: boolean): string {
  if (fullLength) return dayjs(date).format();
  return dayjs(date).format(DAYJS_STANDARD_FORMAT_TYPE);
}

/** local to UTC string */
export function getUtcFormat(date: DateParam, fullLength?: boolean): string {
  if (fullLength) return dayjs(date).utc().format();
  return dayjs(date).utc().format(DAYJS_STANDARD_FORMAT_TYPE);
}

/** local to utc date */
export function getUtcDate(date: DateParam): dayjs.Dayjs {
  return dayjs(date).utc();
}

/** utc to local string */
export function getLocalFormat(date: DateParam, fullLength?: boolean): string {
  if (fullLength) return dayjs(date).local().format();
  return dayjs(date).local().format(DAYJS_STANDARD_FORMAT_TYPE);
}

/** utc to local date */
export function getLocalDate(date: DateParam): Dayjs {
  return dayjs(date).local();
}

export function getHourTimeFormat(date: DateParam): string {
  return dayjs(date).format('HH:mm');
}

export function getLocalFromUtcStandardFormat(date: string): Dayjs {
  const currentDate = getUtcDate(dayjs());
  const hour = currentDate.get('hour');
  const minute = currentDate.get('minute');
  return getLocalDate(dayjs.utc(date).set('hour', hour).set('minute', minute));
}

export function formatDuration(duration: Duration | string, formatType: ('hours' | 'minutes' | 'seconds')[]): string {
  const _duration = typeof duration === 'string' ? dayjs.duration(duration) : duration;
  const hours = formatType.includes('hours') && _duration.hours() ? `${_duration.hours()} ${_duration.hours() > 1 ? 'hours' : 'hour'}` : '';
  const minutes =
    formatType.includes('minutes') && _duration.minutes() ? `${_duration.minutes()} ${_duration.minutes() > 1 ? 'minutes' : 'minute'}` : '';
  const seconds =
    formatType.includes('seconds') && _duration.seconds() ? `${_duration.seconds()} ${_duration.seconds() > 1 ? 'seconds' : 'second'}` : '';
  return `${hours} ${minutes} ${seconds}`.trim();
}

export const TODAY_DATE = dayjs();
export const TODAY_DATE_FORMATTED = getStandardFormat(dayjs());
export const TODAY_DATE_UTC = getUtcDate(dayjs());
export const TODAY_DATE_UTC_FORMATTED = getUtcFormat(dayjs());
