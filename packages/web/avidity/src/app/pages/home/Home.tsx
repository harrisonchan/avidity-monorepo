import { useEffect, useState } from 'react';
import { GoalCard, SideBar } from '@web/components';
import useGoalStore from '@web/stores/useGoalStore';
import dayjs, { Dayjs } from 'dayjs';
import { standardFormat } from '@shared/utils';
import useUtilStore from '@web/stores/useUtilStore';
import { daisyUIThemeArr } from '@web/types';
import useTestStore from '@web/stores/useTestStore';
import { EMPTY_GOAL } from '@shared/helpers';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

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
  const theme = useUtilStore.use.theme();
  const setTheme = useUtilStore.use.setTheme();
  const test = useTestStore.use.test();
  const addTest = useTestStore.use.addTest();
  const addGoal = useGoalStore.use.addGoal();
  const onClick = () => {
    addGoal({ goal: { ...EMPTY_GOAL, title: `TestMission ${goals.length + 1}`, date } });
  };
  const clearStore = useGoalStore.use.clearStore();
  useEffect(() => {
    console.log(goals);
  }, [goals]);
  return (
    <div className="flex flex-col bg-base-100">
      <div className="flex flex-row items-center">
        <button className="mr-2" onClick={() => setSelectedDateData({ date: dayjs(date).subtract(1, 'day') })}>
          <IoChevronBack className="text-3xl" />
        </button>
        <p>{dayjs(date).format('MMM DD, YYYY')}</p>
        <button className="ml-2" onClick={() => setSelectedDateData({ date: dayjs(date).add(1, 'day') })}>
          <IoChevronForward className="text-3xl" />
        </button>
      </div>
      <button className="btn" onClick={onClick}>
        Add Goal
      </button>
      <button className="btn" onClick={clearStore}>
        Clear All
      </button>
      {goals.map((goal) => (
        <div className="rounded-md card-bordered mb-1 p-2" style={{ borderWidth: '0.2rem' }}>
          <p className="text-sm">{goal.id}</p>
          <p className="text-lg">{goal.title}</p>
        </div>
      ))}
    </div>
  );
}
