import { createSchedule } from '@shared/helpers';
import { useGoalStore } from '@web/stores';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function Schedule() {
  const { date } = useParams();
  console.log('DATE FROM SCHEDULE: ', date);
  const { goals, selectedDateData } = useGoalStore((state) => ({ goals: state.goals, selectedDateData: state.selectedDateData }));
  const goalsToSchedule = selectedDateData.goals.map((goal) => goals[goal.id]);
  console.log('goalsToSchedule', goalsToSchedule);
  useEffect(() => {
    const schedule = createSchedule({ date, goals: goalsToSchedule });
    console.log(schedule);
  }, [goalsToSchedule]);
  return <div>{date}</div>;
}
