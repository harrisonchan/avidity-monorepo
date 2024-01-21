import { DateParam, Goal, ioniconsArr } from '@shared/types';
import { RecurrenceRule, WEEKDAYS, getStandardFormat } from '@shared/utils';
import { Field, Form, Formik } from 'formik';
import dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as tz from 'dayjs/plugin/timezone';
import { useGoalStore } from '@web/stores';
import { useNavigate } from 'react-router-dom';

dayjs.extend(utc);
dayjs.extend(tz);

export default function AddGoal() {
  const { addGoal } = useGoalStore((state) => ({
    addGoal: state.addGoal,
  }));
  const navigate = useNavigate();
  const initialValues: {
    title: string;
    description: string;
    dateTime: {
      start: {
        date: string;
        dateTime?: string;
        timeZone?: string;
      };
      end: {
        date: string;
        dateTime?: string;
        timeZone?: string;
      };
    };
    icon: { name: string; backgroundColor: string; iconColor: string };
    recurrence: RecurrenceRule & { type: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'weekday' | 'custom' | 'none' };
  } = {
    title: '',
    description: '',
    dateTime: {
      start: {
        date: '',
        dateTime: '',
        timeZone: '',
      },
      end: {
        date: '',
        dateTime: '',
        timeZone: '',
      },
    },
    icon: { name: 'accessibility', backgroundColor: '', iconColor: '' },
    recurrence: {
      type: 'none',
      frequency: 'daily',
      start: '',
      timeZone: '',
      until: '',
      count: 0,
      interval: 0,
      byweekday: [],
    },
  };
  return (
    <div className="flex flex-col ml-5">
      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          //   console.log(values);
          const { title, description, dateTime, icon, recurrence } = values;
          const timeZone = dayjs.tz.guess();
          let newGoalRecurrence: RecurrenceRule | null = null;
          switch (recurrence.type) {
            case 'none':
              newGoalRecurrence = null;
              break;
            case 'weekday':
              newGoalRecurrence = {
                frequency: 'weekly',
                byweekday: recurrence.byweekday,
              };
              break;
            case 'custom':
              newGoalRecurrence = {
                frequency: 'daily',
                interval: recurrence.interval,
              };
              break;
            default:
              newGoalRecurrence = {
                frequency: recurrence.type,
              };
          }
          const newGoal: Omit<Goal, 'id' | 'groupId'> = {
            title: title,
            description: description !== '' ? description : null,
            dateTimeData: {
              start: {
                date: getStandardFormat(dateTime.start.date),
                dateTime: dateTime.start.date,
                timeZone,
              },
              end: {
                date: getStandardFormat(dateTime.end.date),
                dateTime: dateTime.end.date,
                timeZone,
              },
              status: {},
            },
            icon: {
              //@ts-ignore
              name: icon.name,
              backgroundColor: 'beige',
              iconColor: 'white',
            },
            recurrence: newGoalRecurrence,
          };
          //   console.log(newGoal);
          addGoal({ goal: newGoal });
          navigate('/');
        }}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => {
          return (
            <Form className="flex flex-col">
              <label>
                Title<span className="text-error">*</span>
              </label>
              <Field type="text" name="title" className="input border-primary w-full max-w-xs" />
              <label>Description</label>
              {/* <ErrorMessage name="title" component="div" /> */}
              <Field type="description" name="description" className="input border-primary w-full max-w-xs" />
              {/* <ErrorMessage name="description" component="div" /> */}
              <label>Date</label>
              <label>Start</label>
              <Field type="datetime-local" name="dateTime.start.date" className="input border-primary w-full max-w-xs" />
              <label>End</label>
              <Field type="datetime-local" name="dateTime.end.date" className="input border-primary w-full max-w-xs" />
              <label>
                Icon<span className="text-error">*</span>
              </label>
              <select
                name="icon"
                onChange={(evt) => setFieldValue('icon.name', evt.target.value)}
                onBlur={handleBlur}
                className="select border-primary w-full max-w-xs"
                defaultValue={'Select an icon'}>
                <option disabled>Select an icon</option>
                {ioniconsArr.map((_i) => (
                  <option key={_i}>{_i}</option>
                ))}
              </select>
              <label>Frequency</label>
              <select
                onChange={(evt) => setFieldValue('recurrence.type', evt.target.value)}
                defaultValue={'Select the recurrence type'}
                className="select border-primary w-full max-w-xs">
                <option disabled>Select the recurrence type</option>
                {['daily', 'weekly', 'monthly', 'yearly', 'weekday', 'custom', 'none'].map((_i) => (
                  <option>{_i}</option>
                ))}
              </select>
              {values.recurrence.type === 'custom' ? (
                <>
                  <label>Interval</label>
                  <Field type="number" name="recurrence.interval" className="input border-primary w-full max-w-xs" />
                </>
              ) : values.recurrence.type === 'weekday' ? (
                <>
                  <label>Select weekdays</label>
                  <td className="space-x-2">
                    <label>
                      <Field type="checkbox" name="recurrence.byweekday" value="monday" className="mr-1" />
                      Monday
                    </label>
                    <label>
                      <Field type="checkbox" name="recurrence.byweekday" value="tuesday" className="mr-1" />
                      Tuesday
                    </label>
                    <label>
                      <Field type="checkbox" name="recurrence.byweekday" value="wednesday" className="mr-1" />
                      Wednesday
                    </label>
                    <label>
                      <Field type="checkbox" name="recurrence.byweekday" value="thursday" className="mr-1" />
                      Thursday
                    </label>
                    <label>
                      <Field type="checkbox" name="recurrence.byweekday" value="friday" className="mr-1" />
                      Friday
                    </label>
                    <label>
                      <Field type="checkbox" name="recurrence.byweekday" value="saturday" className="mr-1" />
                      Saturday
                    </label>
                    <label>
                      <Field type="checkbox" name="recurrence.byweekday" value="sunday" className="mr-1" />
                      Sunday
                    </label>
                  </td>
                </>
              ) : (
                <></>
              )}
              {/* {values.repeat.type === 'custom' ? (
                <div className="join items-center mt-2">
                  <label className="mr-3">Every</label>
                  <Field type="number" name="repeat.frequency" className="input border-primary w-full max-w-xs" />
                  <label className="ml-3">Days</label>
                </div>
              ) : values.repeat.type === 'weekdays' ? (
                <div>
                  {WEEKDAYS.map((_w) => (
                    <label className="label cursor-pointer">
                      <span className="label-text">{_w}</span>
                      <input
                        key={_w}
                        type="checkbox"
                        onChange={() => {
                          if (!values.repeat.weekdays) setFieldValue('repeat.weekdays', new Set([_w]));
                          else values.repeat.weekdays?.has(_w) ? values.repeat.weekdays?.delete(_w) : values.repeat.weekdays?.add(_w);
                        }}
                        // checked={values.repeat.weekdays?.has(_w)}
                        className="checkbox"
                      />
                    </label>
                  ))}
                </div>
              ) : null} */}
              {/* <label>Location</label>
              <Field type="text" name="location" className="input border-primary w-full max-w-xs" />
              <label>commute</label>
              <div className="join items-center">
                <Field type="number" name="commute" className="input border-primary w-full max-w-xs" />
                <span className="ml-2">minutes</span>
              </div>
              <label>break</label>
              <div className="join items-center">
                <Field type="number" name="break" className="input border-primary w-full max-w-xs" />
                <span className="ml-2">minutes</span>
              </div> */}
              <button type="submit" className="btn mt-2">
                Submit
              </button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
