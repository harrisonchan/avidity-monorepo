import * as dayjs from 'dayjs';
import { DateParam } from '@shared/types';
import { getUtcFormat } from '@shared/utils';

//Gets standard formatted UTC date from local date
//Pretty shitty hack 🤷
export function getUtcFormattedFromLocal(date: DateParam): string {
  return getUtcFormat(dayjs(date).add(12, 'hour'));
}
