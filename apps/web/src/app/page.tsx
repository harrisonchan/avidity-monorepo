'use client';

import { GoalRecurrenceRule } from '@shared/types';
import { createRecurrenceRule, getStandardFormat, sanitizeDateForRRule, useGetRecurrentDates } from '@shared/utils';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { RRule } from 'rrule';
import { AddGoal } from './components';

export default function Index() {
  const rrule = useRef<GoalRecurrenceRule>({
    frequency: 'weekly',
    byweekday: ['monday', 'tuesday'],
    start: dayjs(),
    // until: dayjs().add(1, 'month'),
    timeZone: 'Asia/Taipei',
  });
  const sliceOne = { start: dayjs(), end: dayjs().add(5, 'week') };
  const sliceTwo = { start: dayjs().add(20, 'year'), end: dayjs().add(20, 'year').add(5, 'week') };
  const { calculate, dates, isCalculating, rule, calculationStats } = useGetRecurrentDates({ recurrenceRule: rrule.current, sliceOptions: sliceOne });
  // useEffect(() => {
  //   console.log('dates', dates);
  // }, [dates]);
  // useEffect(() => {
  //   console.log('calculationStats', calculationStats);
  // }, [calculationStats]);
  // useEffect(() => {
  //   console.log('rule', rule);
  // }, [rule]);
  return (
    <div>
      <AddGoal />
      {isCalculating ? <h1 className="text-3xl">is Loading...</h1> : <h1 className="text-3xl">is not Loading...</h1>}
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => {
          // sliceOptions = sliceOne;
          // setSliceOptions(sliceOne);
          // calculate(sliceOne);
          // setSliceOptions(sliceOne);
          // setIsCalculating(true);
          // setIsCalculating(true);
          // setTimeout(() => {
          //   getDates(sliceOne)
          //     .then((res) => console.log(res))
          //     .then(() => setIsCalculating(false));
          // }, 0);
          // setTimeout(() => {
          //   expensiveFn().then(() => setIsCalculating(false));
          // }, 0);
          calculate(sliceOne);
        }}>
        Test
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => {
          // sliceOptions = sliceTwo;
          // setSliceOptions(sliceTwo);
          // calculate(sliceTwo);
          // setIsCalculating(true);
          // setTimeout(() => {
          //   getDates(sliceTwo)
          //     .then((res) => console.log(res))
          //     .then(() => setIsCalculating(false));
          // }, 0);
          calculate(sliceTwo);
          // calculate();
        }}>
        Test 2
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => {
          console.log(rule);
        }}>
        check rule
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => {
          rrule.current = {
            ...rrule.current,
            byweekday: ['friday', 'saturday', 'tuesday'],
          };
        }}>
        change rule
      </button>
    </div>
  );
}
