'use client';

import { GoalRecurrenceRule } from '@shared/types';
import { createRecurrenceRule, getStandardFormat, sanitizeDateForRRule, useGetRecurrentDates } from '@shared/utils';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@web/components';

const Boop1 = () => {
  return <div>Boop1</div>;
};
const Boop2 = () => {
  return <div>Boop2</div>;
};
const Boops = { Boop1, Boop2 };
const TestComponent = (props: { boopAmount: 'Boop1' | 'Boop2' }) => {
  const Boop = Boops[props.boopAmount];
  return (
    <div>
      <Boop />
    </div>
  );
};

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
      hey bitch
      <TestComponent boopAmount={'Boop1'} />
      <TestComponent boopAmount={'Boop2'} />
      <Icon name="AirplaneTakeoff" />
    </div>
  );
}
