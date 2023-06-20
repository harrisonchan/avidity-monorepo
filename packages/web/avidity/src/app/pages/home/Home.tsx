import { useEffect, useState } from 'react';
import { GoalCard, SideBar } from '@web/components';
import useGoalStore from '@web/stores/useGoalStore';
import dayjs, { Dayjs } from 'dayjs';
import { TODAY_DATE, TODAY_DATE_FORMATTED, standardFormat } from '@shared/utils';
import useUtilStore from '@web/stores/useUtilStore';
import { daisyUIThemeArr } from '@web/types';
import useTestStore from '@web/stores/useTestStore';
import { EMPTY_GOAL } from '@shared/helpers';
import { IoChevronBack, IoChevronForward, IoRemoveCircleOutline } from 'react-icons/io5';
import classNames from 'classnames';

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
  const { addGoal, clearStore, deleteGoal, updateGoalStatus } = useGoalStore((state) => ({
    addGoal: state.addGoal,
    clearStore: state.clearStore,
    deleteGoal: state.deleteGoal,
    updateGoalStatus: state.updateGoalStatus,
  }));
  const changeDate = (date: Dayjs) => {
    setSelectedDateData({ date, timeFormat: 'local' });
  };
  const onClick = () => {
    addGoal({ goal: { ...EMPTY_GOAL, title: `TestMission ${goals.length + 1}`, date } });
  };
  return (
    <div className="flex flex-col bg-base-100 pl-4">
      <div className="flex flex-row items-center self-center mb-1">
        <button className="mr-2" onClick={() => setSelectedDateData({ date: dayjs(date).subtract(1, 'day') })}>
          <IoChevronBack className="text-3xl" />
        </button>
        <div className="flex-col text-center">
          <p>{dayjs(date).isSame(TODAY_DATE, 'day') ? `Today (${dayjs(date).format('dddd')})` : dayjs(date).format('dddd')}</p>
          <p>{dayjs(date).format('MMM DD, YYYY')}</p>
        </div>
        <button className="ml-2" onClick={() => setSelectedDateData({ date: dayjs(date).add(1, 'day') })}>
          <IoChevronForward className="text-3xl" />
        </button>
      </div>
      <button className="btn" onClick={() => setSelectedDateData({ date: TODAY_DATE })}>
        Go back to Today
      </button>
      <button className="btn" onClick={onClick}>
        Add Goal
      </button>
      <button className="btn" onClick={clearStore}>
        Clear All
      </button>
      {goals.map((goal) => (
        <div
          className={classNames('rounded-md card-bordered mb-1 p-3', {
            'bg-warning': goal.status === 'skipped',
            'bg-error': goal.status === 'incomplete',
            'bg-success': goal.status === 'completed',
          })}
          style={{ borderWidth: '0.2rem' }}>
          <div className="flex flex-row">
            <div className="mr-2">
              <p className="text-sm">{goal.id}</p>
              <p className="text-lg">{goal.title}</p>
            </div>
            <button onClick={() => deleteGoal({ id: goal.id })}>
              <IoRemoveCircleOutline className="text-xl text-primary" />
            </button>
          </div>
          <div className="mt-2">
            <button
              className="btn mr-2"
              onClick={() => {
                if (goal.status === 'completed') updateGoalStatus({ id: goal.id, status: 'incomplete', statusDate: date });
                else updateGoalStatus({ id: goal.id, status: 'completed', statusDate: date });
              }}>
              {goal.status === 'completed' ? 'Revert' : 'Complete'}
            </button>
            <button className="btn" onClick={() => updateGoalStatus({ id: goal.id, status: 'skipped', statusDate: date })}>
              Skip
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
