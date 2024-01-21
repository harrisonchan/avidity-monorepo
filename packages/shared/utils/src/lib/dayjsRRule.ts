import { RRule } from 'rrule';
import * as dayjs from 'dayjs';
import { DateParam } from '@shared/types';
import { getStandardFormat } from './dayjsUtils';

export type RecurrenceRule = {
  frequency: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly';
  start?: DateParam; //recurrence start
  timeZone?: string;
  until?: DateParam;
  count?: number;
  interval?: number;
  byweekday?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
};

function createRecurrenceRule(params: { recurrenceRule: RecurrenceRule }) {
  const recurrenceRule = params.recurrenceRule;
  let frequency = RRule.DAILY;
  switch (recurrenceRule.frequency) {
    case 'yearly':
      frequency = RRule.YEARLY;
      break;
    case 'monthly':
      frequency = RRule.MONTHLY;
      break;
    case 'weekly':
      frequency = RRule.WEEKLY;
      break;
    case 'daily':
      frequency = RRule.DAILY;
      break;
    case 'hourly':
      frequency = RRule.HOURLY;
      break;
    default:
      frequency = RRule.DAILY;
  }
  let byweekday: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[] | null = null;
  if (recurrenceRule.byweekday) {
    recurrenceRule.byweekday.forEach((_w) => {
      let weekday: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU') | null = null;
      switch (_w) {
        case 'monday':
          weekday = 'MO';
          break;
        case 'tuesday':
          weekday = 'TU';
          break;
        case 'wednesday':
          weekday = 'WE';
          break;
        case 'thursday':
          weekday = 'TH';
          break;
        case 'friday':
          weekday = 'FR';
          break;
        case 'saturday':
          weekday = 'SA';
          break;
        case 'sunday':
          weekday = 'SU';
          break;
        default:
          weekday = null;
      }
      if (weekday) {
        if (!byweekday) {
          byweekday = [];
        }
        byweekday.push(weekday);
      }
    });
  }
  return new RRule({
    freq: frequency,
    dtstart: recurrenceRule.start ? dayjs(recurrenceRule.start).toDate() : null,
    tzid: recurrenceRule.timeZone ?? null,
    until: recurrenceRule.until ? dayjs(recurrenceRule.until).toDate() : null,
    count: recurrenceRule.count,
    interval: recurrenceRule.interval ?? 1,
    byweekday,
  });
}

//Get all recurrence dates
export function getRecurrenceDates(params: {
  recurrenceRule: RecurrenceRule;
  sliceOptions?: {
    start: string;
    end: string;
  };
}): string[] {
  const { recurrenceRule, sliceOptions } = params;
  const rule = createRecurrenceRule({ recurrenceRule });
  if (sliceOptions) {
    return rule.between(dayjs(sliceOptions.start).toDate(), dayjs(sliceOptions.end).toDate(), true).map((date) => getStandardFormat(date));
  } else {
    return rule.all().map((date) => getStandardFormat(date));
  }
}
//Validate if date is valid recurrent date
export function validateRecurrentDate(params: { date: DateParam; recurrenceRule: RecurrenceRule }): boolean {
  const { date, recurrenceRule } = params;
  const rule = createRecurrenceRule({ recurrenceRule: recurrenceRule });
  const isValid = rule
    .between(dayjs(date).subtract(7, 'day').toDate(), dayjs(date).add(7, 'day').toDate())
    .some((_date) => dayjs(_date).isSame(date, 'day'));
  return isValid;
}
