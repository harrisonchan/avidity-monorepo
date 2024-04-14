import { DateParam } from './baseTypes';

export type RecurrenceRule = {
  frequency: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly';
  start?: DateParam | null; //recurrence start, implementing mandatory start for performance. Should be set to goal start date by default
  timeZone?: string | null;
  until?: DateParam | null;
  count?: number | null;
  interval?: number | null;
  byweekday?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[] | null;
};
