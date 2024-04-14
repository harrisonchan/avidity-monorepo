import { ScheduledGoal, createSchedule } from '@shared/helpers';
import { Goal } from '@shared/types';
import { useGoalStore } from '@web/stores';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Schedule() {
  const { date } = useParams();
  const { goals, selectedDateData } = useGoalStore((state) => ({ goals: state.goals, selectedDateData: state.selectedDateData }));
  const goalsToSchedule = selectedDateData.goals.map((goal) => goals[goal.id]);
  // console.log('goalsToSchedule', goalsToSchedule);
  const [schedule, setSchedule] = useState<ScheduledGoal[]>([]);
  const [unscheduled, setUnscheduled] = useState<Goal[]>([]);
  useEffect(() => {
    const result = createSchedule({ date, goals: goalsToSchedule });
    setSchedule(result.schedule);
    setUnscheduled(result.unscheduled);
    console.log(schedule);
    console.log(unscheduled);
  }, []);
  return (
    <div>
      {date}
      {schedule.map((goal) => (
        <div>
          <h1>{goal.title}</h1>
          <p>{dayjs(goal.start).format()}</p>
          <p>{dayjs(goal.end).format()}</p>
        </div>
      ))}
    </div>
  );
}
