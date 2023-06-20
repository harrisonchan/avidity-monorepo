import { Dayjs } from 'dayjs';
import { Goal } from '../goalTypes';

export interface AddForm extends Omit<Goal, 'id' | 'time' | 'categories' | 'groupId' | 'completion'> {
  time?: { start: Dayjs; end: Dayjs };
}
