import { useEffect, useState } from 'react';
import { GoalCard, SideBar } from '@web/components';
import useGoalStore from '@web/stores/useGoalStore';
import dayjs, { Dayjs } from 'dayjs';
import { standardFormat } from '@shared/utils';

const TEST_DATA = [
  { title: 'test1', description: '' },
  { title: 'test2', description: '' },
  { title: 'test3', description: '' },
  { title: 'test4', description: '' },
  { title: 'test5', description: '' },
];

export default function Home() {
  const { date, goals, groups } = useGoalStore.use.selectedDateData();
  const setSelectedDateData = useGoalStore.use.setSelectedDateData();
  const changeDate = (date: Dayjs) => {
    setSelectedDateData({ date, timeFormat: 'local' });
  };
  return (
    <div className="flex">
      {/* <SideBar /> */}
      <h1>Hello World</h1>
      {/* <button
        className="btn"
        onClick={() =>
          useGoalStore.setState((state) => ({
            selectedDateData: { ...state.selectedDateData, date: standardFormat(dayjs(date).subtract(1, 'day')) },
          }))
        }>
        Back
      </button>
      <h3>{date}</h3>
      <button
        className="btn"
        onClick={() =>
          useGoalStore.setState((state) => ({ selectedDateData: { ...state.selectedDateData, date: standardFormat(dayjs(date).add(1, 'day')) } }))
        }>
        Forward
      </button> */}
    </div>
  );
}
