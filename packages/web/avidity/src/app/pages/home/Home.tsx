import { useEffect, useState } from 'react';
import { GoalCard, SideBar } from '@web/components';
import useGoalStore from '@web/stores/useGoalStore';
import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { TODAY_DATE, TODAY_DATE_FORMATTED, getStandardFormat } from '@shared/utils';
import useUtilStore from '@web/stores/useUtilStore';
import { daisyUIThemeArr } from '@web/types';
import useTestStore from '@web/stores/useTestStore';
import { EMPTY_GOAL, EMPTY_GOAL_GROUP } from '@shared/helpers';
import { IoChevronBack, IoChevronForward, IoRemoveCircle, IoRemoveCircleOutline } from 'react-icons/io5';
import classNames from 'classnames';
import { Link, useFetcher, useNavigate } from 'react-router-dom';
import { DUMMY_GOALS_TO_SCHEDULE, DUMMY_GOALS_TO_SCHEDULE_2 } from '@web/data';

dayjs.extend(duration);

const TEST_DATA = [
  { title: 'test1', description: '' },
  { title: 'test2', description: '' },
  { title: 'test3', description: '' },
  { title: 'test4', description: '' },
  { title: 'test5', description: '' },
];

export default function Home() {
  const test = dayjs.duration(123);
  const navigate = useNavigate();
  const { date, goals, groups } = useGoalStore.use.selectedDateData();
  const setSelectedDateData = useGoalStore.use.setSelectedDateData();
  const { addGoal, clearStore, deleteGoal, updateGoal, updateGoalStatus, addGroup, deleteGroup, updateGroup, stateGoals, stateGroups } = useGoalStore(
    (state) => ({
      addGoal: state.addGoal,
      clearStore: state.clearStore,
      deleteGoal: state.deleteGoal,
      updateGoal: state.updateGoal,
      updateGoalStatus: state.updateGoalStatus,
      addGroup: state.addGroup,
      deleteGroup: state.deleteGroup,
      updateGroup: state.updateGroup,
      stateGoals: state.goals,
      stateGroups: state.groups,
    })
  );
  const [newGoalName, setNewGoalName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  useEffect(() => {
    console.count('home screen rerender');
    console.log('from home: ', date);
  }, [date]);
  const renderGoals = () => (
    <div className="flex flex-col">
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
      <button className="btn mt-1" onClick={() => setSelectedDateData({ date: TODAY_DATE })}>
        Go back to Today
      </button>
      <button className="btn mt-2">
        <Link to={`/schedule/${date}`}>Schedule Day</Link>
      </button>
      <button
        className="btn mt-2"
        onClick={() =>
          addGoal({
            goal: {
              ...EMPTY_GOAL,
              title: `TestMission ${Object.keys(stateGoals).length + 1}`,
              date,
              duration: dayjs.duration({ hours: 1 }).toISOString(),
            },
          })
        }>
        Add Goal
      </button>
      <button className="btn mt-2" onClick={() => DUMMY_GOALS_TO_SCHEDULE.forEach((goal) => addGoal({ goal: { ...goal, date } }))}>
        Add Dummy Goals for scheduling
      </button>
      <button className="btn mt-2 mb-3" onClick={clearStore}>
        Clear All
      </button>
      {goals.map((goal) => (
        <div
          key={goal.id}
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
          <div className="mt-2 flex flex-row justify-evenly">
            <button
              className="btn"
              onClick={() => {
                if (goal.status === 'completed') updateGoalStatus({ id: goal.id, status: 'incomplete', statusDate: date });
                else updateGoalStatus({ id: goal.id, status: 'completed', statusDate: date });
              }}>
              {goal.status === 'completed' ? 'Revert' : 'Complete'}
            </button>
            <button className="btn" onClick={() => updateGoalStatus({ id: goal.id, status: 'skipped', statusDate: date })}>
              Skip
            </button>
            <button className="btn" onClick={() => updateGoalStatus({ id: goal.id, status: 'incomplete', statusDate: date })}>
              Mark incomplete
            </button>
          </div>
          <div className="mt-2 flex flex-col">
            <label>
              New goal name
              <input placeholder="Enter new name" onChange={(evt) => setNewGoalName(evt.target.value)} />
            </label>
            <button className="btn" onClick={() => updateGoal({ goal: { id: goal.id, title: newGoalName } })}>
              Update goal
            </button>
            <button className="btn" onClick={() => updateGoal({ goal: { id: goal.id, date: getStandardFormat(dayjs(goal.date).add(1, 'day')) } })}>
              Change date
            </button>
            <button className="btn" onClick={() => updateGoal({ goal: { id: goal.id, repeat: { type: 'custom', frequency: 3 } } })}>
              Change repeat
            </button>
          </div>
        </div>
      ))}
    </div>
  );
  const renderSelectedDateGroups = () => (
    <div className="flex flex-col">
      <p className="text-2xl">Groups for the day</p>
      {groups.map((group) => (
        <div>
          <p className="text-3xl">{group.title}</p>
        </div>
      ))}
    </div>
  );
  const renderGroups = () => (
    <div className="flex flex-col text-center">
      <p className="text-2xl">Groups</p>
      <button
        className="btn mt-1"
        onClick={() =>
          addGroup({
            group: {
              ...EMPTY_GOAL_GROUP,
              title: `Test Group ${Object.keys(stateGroups).length + 1}`,
            },
          })
        }>
        Add Group
      </button>
      {Object.values(stateGroups).map((group) => (
        <div>
          <Link to={`/group/${group.id}`} className="flex flex-col">
            <button
            // onClick={() => navigate(`/groups/${group.id}`)}
            >
              <p className="text-3xl">{group.title}</p>
            </button>
          </Link>
          <button onClick={() => deleteGroup({ id: group.id })}>
            <IoRemoveCircle className="text-2xl" />
          </button>
          <div>
            <label>
              <input placeholder="enter new group name" onChange={(evt) => setNewGroupName(evt.target.value)} />
            </label>
            <button className="btn btn-sm" onClick={() => updateGroup({ group: { id: group.id, title: newGroupName } })}>
              Update group
            </button>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex flex-1 flex-row bg-base-100 p-6 pt-5 justify-between">
      {renderGoals()}
      {renderSelectedDateGroups()}
      {renderGroups()}
    </div>
  );
}
