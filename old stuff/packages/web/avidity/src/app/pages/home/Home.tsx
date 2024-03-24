import { getRecurrenceDates, getStandardFormat } from '@shared/utils';
import { useGoalStore } from '@web/stores';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import { IoAdd, IoAddCircle, IoChevronBack, IoChevronForward, IoRemoveCircleOutline } from 'react-icons/io5';
import { NewGoal } from '@shared/stores';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

export default function Home() {
  // const selectedDateData = useGoalStore.use.selectedDateData
  const { selectedDateData, updateSelectedDateData, addGoal, updateGoalStatus, updateGoal, deleteGoal, deleteGroup, clearStore } = useGoalStore(
    (state) => ({
      selectedDateData: state.selectedDateData,
      updateSelectedDateData: state.updateSelectedDateData,
      addGoal: state.addGoal,
      updateGoal: state.updateGoal,
      updateGoalStatus: state.updateGoalStatus,
      deleteGoal: state.deleteGoal,
      deleteGroup: state.deleteGroup,
      clearStore: state.clearStore,
    })
  );
  const { date, goals, groups } = selectedDateData;
  const navigate = useNavigate();
  const [goalName, setGoalName] = useState('');
  useEffect(() => {
    console.log(goals);
  }, [goals]);
  const renderDateControl = () => (
    <div className="flex flex-row items-center">
      <button
        className="mr-2"
        onClick={() => updateSelectedDateData({ newDate: { date: dayjs(selectedDateData.date).subtract(1, 'day'), timeZone: dayjs.tz.guess() } })}>
        <IoChevronBack className="text-3xl" />
      </button>
      <p>{selectedDateData.date}</p>
      <button
        className="ml-2"
        onClick={() => updateSelectedDateData({ newDate: { date: dayjs(selectedDateData.date).add(1, 'day'), timeZone: dayjs.tz.guess() } })}>
        <IoChevronForward className="text-3xl" />
      </button>
      <label>
        <input type="date" value={date} onChange={(evt) => updateSelectedDateData({ newDate: { date: dayjs(evt.target.value) } })} />
      </label>
    </div>
  );
  const renderMenu = () => (
    <div className="flex flex-col">
      <button className="btn mt-2" onClick={() => updateSelectedDateData({ newDate: { date: dayjs(), timeZone: dayjs.tz.guess() } })}>
        Go to Today
      </button>
      <button className="btn mt-2">Add Goal</button>
      <button className="btn mt-2">
        <Link to={`/schedule/${date}`}>Schedule Day</Link>
      </button>
      <button className="btn mt-2" onClick={clearStore}>
        Clear All
      </button>
    </div>
  );
  const renderGoals = () => (
    <div className="flex flex-col mt-2">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className={classNames('rounded-md card-bordered mb-1 p-3', {
            // 'bg-warning': goal.status === 'skipped',
            // 'bg-error': goal.status === 'incomplete',
            // 'bg-success': goal.status === 'completed',
            'bg-warning': goal.status === 'skip',
            'bg-error': goal.status === 'incomplete',
            'bg-success': goal.status === 'complete',
            'bg-violet-500': goal.status === 'holiday',
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
                if (goal.status === 'complete') updateGoalStatus({ id: goal.id, status: 'incomplete', date });
                else updateGoalStatus({ id: goal.id, status: 'complete', date });
              }}>
              {goal.status === 'complete' ? 'Revert' : 'Complete'}
            </button>
            <button className="btn" onClick={() => updateGoalStatus({ id: goal.id, status: 'skip', date })}>
              Skip
            </button>
            <button className="btn" onClick={() => updateGoalStatus({ id: goal.id, status: 'incomplete', date })}>
              Mark incomplete
            </button>
          </div>
          <div className="mt-2 flex flex-col">
            <label>
              New goal name
              <input type="text" placeholder="Enter new name" onChange={(evt) => setGoalName(evt.target.value)} />
            </label>
            <button
              className="btn mt-2"
              onClick={() => {
                // console.log('new goal name: ', goalName);
                // updateGoal({ goal: { id: goal.id, title: goalName } });
                navigate('/edit-goal', { state: { editType: 'update', goalId: goal.id } });
              }}>
              Update goal
            </button>
            <button className="btn mt-2" onClick={() => navigate(`/goal/${goal.id}`)}>
              Go to Goal
            </button>
          </div>
          {/* <button className="btn" onClick={() => updateGoal({ goal: { id: goal.id, date: standardFormat(dayjs(goal.date).add(1, 'day')) } })}>
              Change date
            </button>
            <button className="btn" onClick={() => updateGoal({ goal: { id: goal.id, repeat: { type: 'custom', frequency: 3 } } })}>
              Change repeat
            </button> */}
        </div>
      ))}
    </div>
  );
  const d1 = dayjs.duration({ hours: 1 });
  const d2 = dayjs.duration({ hours: 2 });
  return (
    <div className="ml-5 flex flex-row">
      <div className="flex flex-col">
        {renderDateControl()}
        {renderMenu()}
        {renderGoals()}
      </div>
      <div>
        {groups.map((group) => (
          <div>
            <button onClick={() => deleteGroup({ id: group.id })}>
              <IoRemoveCircleOutline className="text-xl text-primary" />
            </button>
            <button
              className="rounded-md card-bordered mb-1 p-3 bg-violet-500 hover:bg-violet-600 active:bg-violet-700"
              onClick={() => navigate(`/group/${group.id}`)}>
              {group.title}
            </button>
          </div>
        ))}
      </div>
      {/* <h1>hello world</h1>
      <button
        onClick={() => {
          const tz = dayjs.tz.guess()
          const newGoal: NewGoal = {
            title: 'my first goal',
            icon: { name: 'accessibility' },
            dateTimeData: {
              start: { date: getStandardFormat(dayjs()), timeZone: tz },
              end: { date: getStandardFormat(dayjs()), timeZone: tz },
            },
            groupId: '',
            recurrence: null,
          };
          console.log(newGoal);
          addGoal({
            goal: newGoal,
          });
        }}>
        <h1>add new shitty goal</h1>
      </button>
      <br />
      <button
        onClick={() => {
          const test = getRecurrenceDates({
            recurrenceRule: {
              count: 50,
              frequency: 'daily',
            },
          });
          console.log(test);
        }}>
        <IoAddCircle className="text-3xl" />
      </button> */}
    </div>
  );
}
