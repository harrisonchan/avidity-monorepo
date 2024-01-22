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
  const { selectedDateData, updateSelectedDateData, addGoal, updateGoalStatus, updateGoal, deleteGoal, clearStore } = useGoalStore((state) => ({
    selectedDateData: state.selectedDateData,
    updateSelectedDateData: state.updateSelectedDateData,
    addGoal: state.addGoal,
    updateGoal: state.updateGoal,
    updateGoalStatus: state.updateGoalStatus,
    deleteGoal: state.deleteGoal,
    clearStore: state.clearStore,
  }));
  const { date, goals, groups } = selectedDateData;
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
          <form className="mt-2 flex flex-col">
            <label>
              New goal name
              <input type="text" placeholder="Enter new name" onChange={(evt) => setGoalName(evt.target.value)} />
            </label>
            <button type="submit" className="btn mt-2" onClick={() => updateGoal({ goal: { id: goal.id, title: goalName } })}>
              Update goal
            </button>
          </form>
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
    <div className="ml-5">
      {renderDateControl()}
      {renderMenu()}
      {renderGoals()}
      <button
        className="btn mt-2"
        onClick={() => {
          console.log(d1);
          console.log(d2);
          console.log(d1.asMilliseconds());
          console.log(d2.asMilliseconds());
        }}>
        Test duration
      </button>
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
