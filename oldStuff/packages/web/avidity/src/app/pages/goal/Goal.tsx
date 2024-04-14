import { Goal as GoalType } from '@shared/types';
import { useGoalStore } from '@web/stores';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './styles.css';
import { getStreakData } from '@shared/helpers';
import { getStandardFormat } from '@shared/utils';
import dayjs from 'dayjs';

export default function Goal() {
  const { id } = useParams();
  const { goals, updateGoal, selectedDateData } = useGoalStore((state) => ({
    goals: state.goals,
    selectedDateData: state.selectedDateData,
    updateGoal: state.updateGoal,
  }));
  const [goal, setGoal] = useState<GoalType>({
    id: '',
    title: '',
    description: null,
    dateTimeData: { start: { date: '', timeZone: '' }, end: { date: '', timeZone: '' }, status: {} },
    icon: { name: 'accessibility' },
    streakData: { current: [], longest: [], streakOptions: null, streaks: [] },
    groupId: '',
    recurrence: null,
    duration: null,
    commute: null,
    respite: null,
    location: null,
    category: null,
  });
  const [streaks, setStreaks] = useState<string[]>([]);
  const [incompletes, setIncompletes] = useState<string[]>([]);
  const [test, setTest] = useState<boolean>(false);
  useEffect(() => {
    if (id) setGoal(goals[id]);
    // if (streakData) fillStreakDates({ streakData }).streaks.forEach((streak) => setStreaks(streaks.concat(streak.dates)));
    // Object.keys(_goal.dateTimeData.status).forEach((date) => setIncompletes((prev) => [...prev, date]));
  }, []);
  useEffect(() => {
    if (streaks.length === 0 && Object.values(goal.dateTimeData.status).length > 0) {
      const streakData = getStreakData({ goal });
      updateGoal({ goal: { ...goal, streakData } });
      if (streakData) {
        const _streaks = streakData.streaks.map((streak) => {
          if (!(streak.dates.length > 1)) return streak;
          const dates = [];
          const _d = dayjs(streak.dates[0]);
          while (!_d.isSame(streak.dates.slice(-1)[0])) {
            dates.push(getStandardFormat(_d));
            _d.add(1, 'day');
          }
          return { ...streak, dates };
        });
        let streakDates: string[] = [];
        _streaks.forEach((_s) => {
          streakDates = streakDates.concat(_s.dates);
        });
        // setStreaks(streakDates);
        console.log(streakDates);
      }
    }
  }, [goal]);
  return (
    <div className="pt-2 pl-2">
      <p>{goal.id}</p>
      <g className="text-2xl">{goal.title}</g>
      <button className="btn mt-2 mb-2" onClick={() => console.log(streaks)}>
        click
      </button>
      <button
        className="btn mt-2 mb-2"
        onClick={() => {
          // if (goal.recurrence) {
          //   const rule = getGoalRecurrentDates({ recurrenceRule: { ...goal.recurrence, until: '2026-12-31' } });
          //   console.log(rule);
          // }
          setTest(true);
        }}>
        click1
      </button>
      <div className="container">
        <Calendar
          defaultActiveStartDate={new Date(selectedDateData.date)}
          // @ts-ignore
          value={streaks}
          tileContent={({ date }) => {
            // console.log(date);
            return !streaks.includes(getStandardFormat(date)) ? <span className="text-error">*</span> : <span className="text-success">!</span>;
          }}
        />
      </div>
    </div>
  );
}
