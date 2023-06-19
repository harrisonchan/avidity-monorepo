import { Dayjs } from 'dayjs';
import { Goal } from '../goalTypes';

export interface AddForm extends Omit<Goal, 'id' | 'time' | 'date' | 'categories' | 'groupId' | 'completion'> {
  date: Dayjs;
  time?: { start: Dayjs; end: Dayjs };
}
