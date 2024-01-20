import { getRecurrenceDates, getStandardFormat } from '@shared/utils';
import { useGoalStore } from '@web/stores';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { IoAdd, IoAddCircle } from 'react-icons/io5';
import { NewGoal } from '@shared/stores';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Home() {
  const { addGoal } = useGoalStore((state) => ({ addGoal: state.addGoal }));
  return (
    <div>
      <h1>hello world</h1>
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
      </button>
    </div>
  );
}
