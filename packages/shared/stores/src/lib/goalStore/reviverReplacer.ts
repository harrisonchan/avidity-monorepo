import * as dayjs from 'dayjs';
import * as duration from 'dayjs/plugin/duration';
import { isNil } from 'lodash';

dayjs.extend(duration);

export function goalStorageReviver(key: string, item: any) {
  if (typeof item === 'object' && item !== null) {
    if (item.dataType === 'Set') {
      return new Set(item.value);
    } else if (item.dataType === 'Map') {
      return new Map(item.value);
    } else if (item.dataType === 'DayjsDuration') {
      return dayjs.duration(item.value);
    }
  }
  return item;
}

export function goalStorageReplacer(key: string, item: any) {
  if (item instanceof Set) {
    return {
      dataType: 'Set',
      value: [...item], // or with spread: value: [...value]
    };
  } else if (item instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(item.entries()),
    };
  } else {
    return item;
  }
}
