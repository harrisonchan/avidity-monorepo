import { getStreakData } from '@shared/helpers';
import { Goal } from '@shared/types';
import { RecurrenceRule, getStandardFormat, useValidateRecurrentDates } from '@shared/utils';
import { useGoalStore } from '@web/stores';
import dayjs from 'dayjs';
import * as tz from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { useEffect, useState } from 'react';
import { RRule, datetime } from 'rrule';

dayjs.extend(utc);
dayjs.extend(tz);

export default function Test() {
  const [goal, setGoal] = useState<Goal>({
    id: '',
    title: '',
    description: null,
    icon: { name: 'accessibility' },
    dateTimeData: { start: { date: '', timeZone: '' }, end: { date: '', timeZone: '' }, status: {} },
    category: null,
    commute: null,
    duration: null,
    groupId: '',
    location: null,
    recurrence: null,
    respite: null,
    streakData: null,
  });
  const { goals } = useGoalStore((state) => ({ goals: state.goals }));
  useEffect(() => {
    const values = Object.entries(goals);
    // const goal = values[0][1];
    setGoal(values[0][1]);
  }, []);
  const onClick = () => {
    const streaks = getStreakData({ goal });
    setGoal({ ...goal, streakData: streaks });
  };
  const onClick2 = () => {
    const streaksTwo = getStreakData({ goal: { ...goal, streakData: goal.streakData } });
  };
  return (
    <div className="flex flex-col">
      <button className="btn" onClick={onClick}>
        press me bitch
      </button>
      <button className="btn" onClick={() => console.log(goal)}>
        Log goal
      </button>
      <button className="btn" onClick={onClick2}>
        press me bitch 2
      </button>
    </div>
  );
}
