import { useGoalSchedule } from '@shared/helpers';
import { Goal, ScheduledGoal } from '@shared/types';
import { TODAY_DATE, formatDuration, hourTimeFormat, standardFormat, toTitleCase } from '@shared/utils';
import { useGoalStore } from '@web/stores';
import * as dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import { Duration } from 'dayjs/plugin/duration';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface GoalItemProps {
  id: string;
  title: string;
}

function GoalItem(props: GoalItemProps) {
  return (
    <div>
      <p className="text-xl">{props.id}</p>
      <p className="text-2xl">{props.title}</p>
    </div>
  );
}

interface ScheduleItemProps {
  id: string;
  title: string;
  time: { start: Dayjs; end: Dayjs };
  duration: Duration;
  commute: { start: Dayjs; end: Dayjs } | null;
  rest: { start: Dayjs; end: Dayjs } | null;
  type: 'goal' | 'commute' | 'rest';
}

function ScheduleItem(props: ScheduleItemProps) {
  const { title, time, duration, commute, rest, type } = props;
  return (
    <div>
      <p className="text-2xl">
        {toTitleCase(type)}: {title}
      </p>
      <p className="text-xl">
        Time: {hourTimeFormat(time.start)} ~ {hourTimeFormat(time.end)}-
      </p>
      <p className="text-xl">Duration: {duration.format()}</p>
      {commute ? (
        <p className="text-xl">
          Commute: {hourTimeFormat(commute.start)} ~ {hourTimeFormat(commute.end)}
        </p>
      ) : null}
      {rest ? (
        <p className="text-xl">
          Rest: {hourTimeFormat(rest.start)} ~ {hourTimeFormat(rest.end)}
        </p>
      ) : null}
    </div>
  );
}

export default function Schedule() {
  const { date } = useParams();
  const { getDateData, getGoal } = useGoalStore((state) => ({ getDateData: state.getDateData, getGoal: state.getGoal }));
  const { createSchedule, isCalculating, resetSchedule, scheduleObject } = useGoalSchedule();
  const goals = getDateData({ date }).goals.map((goal) => getGoal({ id: goal.id })!);
  const scheduleGoals = () => {
    createSchedule(1, {
      date: dayjs(date),
      goals,
      scheduleStart: TODAY_DATE.set('hours', 8),
      useGoogleDistanceMatrix: false,
    });
  };
  useEffect(() => {
    scheduleGoals();
  }, []);
  // useEffect(() => {
  //   console.debug('WOOHOO', schedule);
  // }, [schedule]);
  return (
    <div>
      {/* {scheduleObject.schedule.map((item) => (
        <div key={item.id}>
          <ScheduleItem
            id={item.id}
            title={item.title}
            commute={item.type === 'goal' && item.commute ? item.commute : null}
            duration={item.duration}
            rest={item.type === 'goal' && item.rest ? item.rest : null}
            time={item.time}
            type={item.type}
          />
        </div>
      ))} */}
      <button className="btn" onClick={() => scheduleGoals()}>
        Reschedule
      </button>
      <button className="btn" onClick={() => resetSchedule()}>
        Reset
      </button>
      <p className="text-xl">Schedule for the day</p>
      <table>
        <thead>
          <tr>
            {/* <th>ID</th> */}
            <th>Title</th>
            <th>Type</th>
            <th>Time</th>
            <th>Duration</th>
            <th>Commute</th>
            <th>Rest</th>
          </tr>
        </thead>
        <tbody>
          {scheduleObject.schedule.map((item) => {
            const time = item.time;
            const commute = item.type === 'goal' ? item.commute : null;
            const rest = item.type === 'goal' ? item.rest : null;
            return (
              <tr key={item.id}>
                {/* <td className="text-center px-4">{item.id}</td> */}
                <td
                  className={`text-center px-4 ${
                    item.type === 'goal' ? 'text-primary' : item.type === 'commute' ? 'text-secondary' : 'text-rose-400'
                  }`}>
                  {item.title}
                </td>
                <td className="text-center px-4">{item.type}</td>
                <td className="text-center px-4">
                  Time: {hourTimeFormat(item.time.start)} ~ {hourTimeFormat(item.time.end)}
                </td>
                <td className="text-center px-4">{formatDuration(item.duration, ['hours', 'minutes'])}</td>
                <td className="text-center px-4">{commute ? `${hourTimeFormat(commute.start)} ~ ${hourTimeFormat(commute.end)}` : 'n/a'}</td>
                <td className="text-center px-4">{rest ? `${hourTimeFormat(rest.start)} ~ ${hourTimeFormat(rest.end)}` : 'n/a'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xl">Unscheduled</p>
      <table>
        <thead>
          <tr>
            {/* <th>ID</th> */}
            <th>Title</th>
            <th>Time</th>
            <th>Duration</th>
            <th>Commute Duration</th>
            <th>Rest Duration</th>
          </tr>
        </thead>
        <tbody>
          {scheduleObject.goalsNotAdded.map((item) => {
            const time = item.time;
            const commute = item.commute;
            return (
              <tr key={item.id}>
                <td className="text-center px-4">{item.title}</td>
                <td className="text-center px-4">{time ? `${hourTimeFormat(time.start)} ~ ${hourTimeFormat(time.end)}` : 'n/a'}</td>
                <td className="text-center px-4">{formatDuration(item.duration, ['hours', 'minutes'])}</td>
                <td className="text-center px-4">{commute ? `${formatDuration(commute.duration, ['hours', 'minutes'])}` : 'n/a'}</td>
                <td className="text-center px-4">{item.rest ? `${formatDuration(item.rest.duration, ['hours', 'minutes'])}` : 'n/a'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
