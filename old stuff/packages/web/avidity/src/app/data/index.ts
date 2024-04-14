// import * as dayjs from 'dayjs';
// import * as duration from 'dayjs/plugin/duration';
// import { Goal } from '@shared/types';
// import { TODAY_DATE } from '@shared/utils';
// import { EMPTY_GOAL } from '@shared/helpers';

// dayjs.extend(duration);

// export const DUMMY_GOALS_TO_SCHEDULE: Omit<Goal, 'id'>[] = [
//   {
//     ...EMPTY_GOAL,
//     title: 'Visit Millennium Park',
//     time: { start: TODAY_DATE.set('hour', 9).toISOString(), end: TODAY_DATE.set('hour', 10).set('minute', 30).toISOString() },
//     duration: dayjs.duration({ hours: 1 }).toISOString(),
//     location: 'Millennium Park, Chicago, IL',
//     commute: { duration: dayjs.duration({ minutes: 20 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Explore the Art Institute of Chicago',
//     time: { start: TODAY_DATE.set('hour', 11).toISOString(), end: TODAY_DATE.set('hour', 12).toISOString() },
//     duration: dayjs.duration({ hours: 1 }).toISOString(),
//     location: 'Art Institute of Chicago, Chicago, IL',
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Shop on the Magnificent Mile',
//     time: { start: TODAY_DATE.set('hour', 15).toISOString(), end: TODAY_DATE.set('hour', 17).toISOString() },
//     duration: dayjs.duration({ hours: 1 }).toISOString(),
//     location: 'The Magnificent Mile, Chicago, IL',
//     commute: { duration: dayjs.duration({ minutes: 40 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Catch a Cubs Game at Wrigley Field',
//     time: { start: TODAY_DATE.set('hour', 17).set('minute', 30).toISOString(), end: TODAY_DATE.set('hour', 20).toISOString() },
//     duration: dayjs.duration({ hours: 2, minutes: 30 }).toISOString(),
//     location: 'Wrigley Field, Chicago, IL',
//     commute: { duration: dayjs.duration({ minutes: 45 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Take a Stroll Through Lincoln Park Zoo',
//     duration: dayjs.duration({ hours: 1, minutes: 15 }).toISOString(),
//     location: 'Lincoln Park Zoo, Chicago, IL',
//     commute: { duration: dayjs.duration({ minutes: 30 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Visit the Navy Pier',
//     duration: dayjs.duration({ minutes: 30 }).toISOString(),
//     commute: { duration: dayjs.duration({ minutes: 15 }).toISOString() },
//     rest: { duration: dayjs.duration({ minutes: 10 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Try Deep Dish Pizza',
//     duration: dayjs.duration({ minutes: 40 }).toISOString(),
//     rest: { duration: dayjs.duration({ minutes: 20 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Take a Walk Along the Lakefront Trail',
//     duration: dayjs.duration({ minutes: 20 }).toISOString(),
//     rest: { duration: dayjs.duration({ minutes: 5 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Visit the Chicago Riverwalk',
//     duration: dayjs.duration({ minutes: 30 }).toISOString(),
//     commute: { duration: dayjs.duration({ minutes: 20 }).toISOString() },
//     rest: { duration: dayjs.duration({ minutes: 15 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Explore the Museum of Science and Industry',
//     duration: dayjs.duration({ hours: 1, minutes: 30 }).toISOString(),
//     rest: { duration: dayjs.duration({ minutes: 30 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Visit the Field Museum of Natural History',
//     duration: dayjs.duration({ hours: 1 }).toISOString(),
//     commute: { duration: dayjs.duration({ minutes: 25 }).toISOString() },
//     rest: { duration: dayjs.duration({ minutes: 20 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Take a Bike Ride Along the Lakefront Trail',
//     duration: dayjs.duration({ minutes: 45 }).toISOString(),
//     commute: { duration: dayjs.duration({ minutes: 15 }).toISOString() },
//     rest: { duration: dayjs.duration({ minutes: 10 }).toISOString() },
//   },
// ];

// export const DUMMY_GOALS_TO_SCHEDULE_2: Omit<Goal, 'id'>[] = [
//   {
//     ...EMPTY_GOAL,
//     title: 'Visit Millennium Park',
//     time: { start: TODAY_DATE.set('hour', 9).toISOString(), end: TODAY_DATE.set('hour', 10).set('minute', 30).toISOString() },
//     duration: dayjs.duration({ hours: 1, minutes: 30 }).toISOString(),
//     location: 'Millennium Park, Chicago, IL',
//     commute: { duration: dayjs.duration({ minutes: 20 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Shop on the Magnificent Mile',
//     time: { start: TODAY_DATE.set('hour', 15).toISOString(), end: TODAY_DATE.set('hour', 17).toISOString() },
//     duration: dayjs.duration({ hours: 2 }).toISOString(),
//     location: 'The Magnificent Mile, Chicago, IL',
//     commute: { duration: dayjs.duration({ minutes: 40 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Catch a Cubs Game at Wrigley Field',
//     time: { start: TODAY_DATE.set('hour', 16).set('minute', 30).toISOString(), end: TODAY_DATE.set('hour', 18).toISOString() },
//     duration: dayjs.duration({ hours: 2, minutes: 30 }).toISOString(),
//     location: 'Wrigley Field, Chicago, IL',
//     commute: { duration: dayjs.duration({ minutes: 15 }).toISOString() },
//   },
//   {
//     ...EMPTY_GOAL,
//     title: 'Take a Bike Ride Along the Lakefront Trail',
//     duration: dayjs.duration({ minutes: 45 }).toISOString(),
//     commute: { duration: dayjs.duration({ minutes: 15 }).toISOString() },
//     rest: { duration: dayjs.duration({ minutes: 10 }).toISOString() },
//   },
// ];

export const FAKE_DATA = [];
