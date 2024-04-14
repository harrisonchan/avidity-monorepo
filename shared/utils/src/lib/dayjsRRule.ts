'use client';
import { RRule } from 'rrule';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { DateParam, RecurrenceRule } from '@shared/types';
import { getStandardFormat } from './dayjsUtils';
import { useRef, useState } from 'react';

dayjs.extend(utc);

export function createRecurrenceRule(params: { recurrenceRule: RecurrenceRule; noCache?: boolean }) {
  const recurrenceRule = sanitizeRecurrentRule(params.recurrenceRule);
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
  const noCache = params.noCache ?? false;
  return new RRule(
    {
      freq: frequency,
      dtstart: recurrenceRule.start ?? null,
      tzid: recurrenceRule.timeZone ?? null,
      until: recurrenceRule.until ?? null,
      count: recurrenceRule.count,
      interval: recurrenceRule.interval ?? 1,
      byweekday,
    },
    noCache
  );
}

type SanitationType = 'dayjs' | 'Date' | 'string';
type DateSanitationReturnType<T> = T extends 'dayjs' ? dayjs.Dayjs : T extends 'Date' ? Date : T extends 'string' ? string : never;

export function sanitizeDateForRRule<T extends SanitationType>(params: { date: DateParam; returnType: T }): DateSanitationReturnType<T> {
  const { date, returnType } = params;
  const _date = dayjs(date);
  const res = dayjs(new Date(Date.UTC(_date.year(), _date.month(), _date.date(), 0, 0)));
  if (returnType === 'dayjs') return res as DateSanitationReturnType<T>;
  else if (returnType === 'Date') return new Date(Date.UTC(_date.year(), _date.month(), _date.date(), 0, 0)) as DateSanitationReturnType<T>;
  else return res.format() as DateSanitationReturnType<T>;
}

//Freaking UTC
export function sanitizeRecurrentRule(recurrenceRule: RecurrenceRule): RecurrenceRule & { start?: Date | null; until?: Date | null } {
  const start = recurrenceRule.start ? sanitizeDateForRRule({ date: recurrenceRule.start, returnType: 'Date' }) : null;
  const until = recurrenceRule.until ? sanitizeDateForRRule({ date: recurrenceRule.until, returnType: 'Date' }) : null;
  return {
    ...recurrenceRule,
    start,
    until,
  };
}

export type RecurrentRuleSliceOptions = {
  start: DateParam;
  end: DateParam;
};

//Get all recurrence dates
export function getRecurrenceDates(params: {
  recurrenceRule: RecurrenceRule;
  sliceOptions?: RecurrentRuleSliceOptions | null;
  noCache?: boolean;
}): string[] {
  const { recurrenceRule, sliceOptions } = params;
  const noCache = params.noCache ?? false;
  const rule = createRecurrenceRule({ recurrenceRule, noCache });
  if (sliceOptions) {
    return rule
      .between(
        sanitizeDateForRRule({ date: sliceOptions.start, returnType: 'Date' }),
        sanitizeDateForRRule({ date: sliceOptions.end, returnType: 'Date' }),
        true
      )
      .map((date) => getStandardFormat(date));
  } else {
    return rule.all().map((date) => getStandardFormat(date));
  }
}

//Validate if date is valid recurrent date
export function useValidateRecurrentDates(params: { dates: DateParam[]; recurrenceRule: RecurrenceRule }): { rule: RRule; results: boolean[] } {
  const { dates, recurrenceRule } = params;
  const _dates = dates.map((_date) => sanitizeDateForRRule({ date: _date, returnType: 'dayjs' }));
  const rule = createRecurrenceRule({ recurrenceRule, noCache: true });
  return { rule, results: _dates.map((_date) => rule.between(_date.toDate(), _date.toDate(), true).some((_d) => _date.isSame(_d, 'date'))) };
}

export function useGetRecurrentDates(params: {
  recurrenceRule: RecurrenceRule;
  sliceOptions?: RecurrentRuleSliceOptions | null;
  noCache?: boolean;
}): {
  rule: RRule;
  dates: string[];
  isCalculating: boolean;
  calculate: (sliceOptions?: RecurrentRuleSliceOptions | null) => void;
  calculationStats: { sliceOptions: null | RecurrentRuleSliceOptions; time: number }[];
} {
  const recurrenceRule = params.recurrenceRule;
  const noCache = params.noCache ?? false;
  const ruleRef = useRef<RRule>(createRecurrenceRule({ recurrenceRule, noCache }));
  const rule = ruleRef.current;
  const [dates, setDates] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationStats, setCalculationStats] = useState<{ sliceOptions: null | RecurrentRuleSliceOptions; time: number }[]>([]);
  function _getRecurrentDates(_sliceOptions?: RecurrentRuleSliceOptions | null): Promise<{ result: string[]; time: number }> {
    return new Promise((resolve) => {
      const _dates = _sliceOptions
        ? rule
            .between(
              sanitizeDateForRRule({ date: _sliceOptions.start, returnType: 'Date' }),
              sanitizeDateForRRule({ date: _sliceOptions.end, returnType: 'Date' }),
              true
            )
            .map((date) => getStandardFormat(date))
        : rule.all().map((date) => getStandardFormat(date));
      resolve({ result: _dates, time: performance.now() });
    });
  }
  function calculate(_sliceOptions?: RecurrentRuleSliceOptions | null) {
    const startTime = performance.now();
    setIsCalculating(true);
    // setTimeout hacky way to create new context what the actual f
    setTimeout(() => {
      _getRecurrentDates(_sliceOptions)
        .then(({ result, time }) => {
          setDates(result);
          setCalculationStats([...calculationStats, { sliceOptions: _sliceOptions ?? null, time: time - startTime }]);
        })
        .then(() => setIsCalculating(false));
    }, 0);
  }
  return { rule, dates, isCalculating, calculate, calculationStats };
}
