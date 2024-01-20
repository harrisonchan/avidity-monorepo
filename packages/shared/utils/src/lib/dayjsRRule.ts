import { RRule } from 'rrule';
import * as dayjs from 'dayjs';
import { DateParam } from '@shared/types';
import { getStandardFormat } from './dayjsUtils';

export type RecurrenceRule = {
  frequency: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly';
  start?: DateParam; //recurrence start
  timezone?: string;
  until?: DateParam;
  count: number;
  interval?: number;
};

function createRecurrenceRule(params: { recurrenceRule: RecurrenceRule }) {
  const recurrenceRule = params.recurrenceRule;
  let frequency = 0;
  switch (recurrenceRule.frequency) {
    case 'yearly':
      frequency = 0;
      break;
    case 'monthly':
      frequency = 1;
      break;
    case 'weekly':
      frequency = 2;
      break;
    case 'daily':
      frequency = 3;
      break;
    case 'hourly':
      frequency = 4;
      break;
    default:
      frequency = 0;
  }
  return new RRule({
    freq: frequency,
    dtstart: recurrenceRule.start ? dayjs(recurrenceRule.start).toDate() : null,
    tzid: recurrenceRule.timezone ?? null,
    until: recurrenceRule.until ? dayjs(recurrenceRule.until).toDate() : null,
    count: recurrenceRule.count,
    interval: recurrenceRule.interval ?? 1,
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
