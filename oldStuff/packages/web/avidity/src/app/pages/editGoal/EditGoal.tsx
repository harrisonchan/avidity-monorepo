import { Goal, GoalCategory, GoalRecurrenceRule, IONICONS_ARRAY, goalCategoryArr } from '@shared/types';
import { getStandardFormat } from '@shared/utils';
import { Field, Form, Formik } from 'formik';
import dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as tz from 'dayjs/plugin/timezone';
import { useGoalStore } from '@web/stores';
import { useLocation, useNavigate } from 'react-router-dom';
import { getGoalDuration } from '@shared/helpers';

dayjs.extend(utc);
dayjs.extend(tz);

type EditGoalLocationState = {
  editType: 'add' | 'update';
  goalId?: string;
};

export default function EditGoal() {
  // const location = useLocation();
  const { addGoal, updateGoal, goals, selectedDateData } = useGoalStore((state) => ({
    addGoal: state.addGoal,
    updateGoal: state.updateGoal,
    goals: state.goals,
    selectedDateData: state.selectedDateData,
  }));
  const locationState = useLocation().state as EditGoalLocationState;
  const goal = locationState && locationState.editType === 'update' && locationState.goalId ? goals[locationState.goalId] : null;
  const navigate = useNavigate();
  const initialValues: {
    title: string;
    description: string;
    dateTime: {
      start: {
        date: string;
        dateTime?: string;
        timeZone: string;
      };
      end: {
        date: string;
        dateTime?: string;
        timeZone: string;
      };
    };
    icon: { name: string; backgroundColor: string; iconColor: string };
    recurrence: GoalRecurrenceRule & { type: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'weekday' | 'custom' | 'none' };
    duration: number;
    category: GoalCategory | null;
  } = goal
    ? {
        title: goal.title,
        description: goal.description ?? '',
        dateTime: {
          start: {
            date: dayjs(goal.dateTimeData.start.date).format('YYYY-MM-DDTHH:mm'),
            dateTime: goal.dateTimeData.start.dateTime ? dayjs(goal.dateTimeData.start.dateTime).format() : '',
            timeZone: goal.dateTimeData.start.timeZone,
          },
          end: {
            date: dayjs(goal.dateTimeData.end.date).format('YYYY-MM-DDTHH:mm'),
            dateTime: goal.dateTimeData.end.dateTime ? dayjs(goal.dateTimeData.end.dateTime).format() : '',
            timeZone: goal.dateTimeData.end.timeZone,
          },
        },
        icon: {
          name: goal.icon.name,
          iconColor: JSON.stringify(goal.icon.iconColor),
          backgroundColor: JSON.stringify(goal.icon.backgroundColor),
        },
        recurrence: goal.recurrence
          ? { ...goal.recurrence, type: goal.recurrence.byweekday ? 'weekday' : goal.recurrence.frequency }
          : {
              type: 'none',
              frequency: 'daily',
              start: '',
              timeZone: goal.dateTimeData.start.timeZone,
              until: '',
              count: 0,
              interval: 0,
              byweekday: [],
            },
        duration: goal.duration ? getGoalDuration(goal.duration).asMinutes() : 0,
        category: goal.category,
      }
    : {
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
          timeZone: dayjs.tz.guess(),
          until: '',
          count: 0,
          interval: 0,
          byweekday: [],
        },
        duration: 0,
        category: null,
      };
  return (
    <div className="flex flex-col ml-5">
      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          //   console.log(values);
          const { title, description, dateTime, icon, recurrence, duration, category } = values;
          const timeZone = dayjs.tz.guess();
          let newGoalRecurrence: GoalRecurrenceRule | null = null;
          const startDate = dateTime.start.date !== '' ? dateTime.start.date : dayjs(selectedDateData.date).format();
          switch (recurrence.type) {
            case 'none':
              newGoalRecurrence = null;
              break;
            case 'weekday':
              newGoalRecurrence = {
                start: startDate,
                frequency: 'weekly',
                byweekday: recurrence.byweekday,
                timeZone: recurrence.timeZone,
              };
              break;
            case 'custom':
              newGoalRecurrence = {
                start: startDate,
                frequency: 'daily',
                interval: recurrence.interval,
                timeZone: recurrence.timeZone,
              };
              break;
            default:
              newGoalRecurrence = {
                start: startDate,
                frequency: recurrence.type,
                timeZone: recurrence.timeZone,
              };
          }
          const newGoal: Omit<Goal, 'id' | 'groupId'> = {
            title: title,
            description: description !== '' ? description : null,
            dateTimeData: {
              start: {
                date: getStandardFormat(dateTime.start.date !== '' ? dateTime.start.date : selectedDateData.date),
                dateTime: dateTime.start.date !== '' ? dateTime.start.date : undefined,
                timeZone,
              },
              end: {
                date: getStandardFormat(dateTime.end.date !== '' ? dateTime.end.date : selectedDateData.date),
                dateTime: dateTime.end.date !== '' ? dateTime.end.date : undefined,
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
            duration: duration !== 0 ? { minutes: duration } : null,
            category,
          };
          //   console.log(newGoal);
          if (locationState && locationState.editType === 'update' && goal) updateGoal({ goal: { ...newGoal, id: goal.id } });
          else addGoal({ goal: newGoal });
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
              <Field
                type="datetime-local"
                name="dateTime.start.date"
                className="input border-primary w-full max-w-xs"
                onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                  const value = evt.target.value;
                  setFieldValue('dateTime.start.date', value);
                  if (values.dateTime.end.date !== '' && !dayjs(value).isSame(dayjs(values.dateTime.end.date), 'minute'))
                    setFieldValue('duration', 0);
                }}
              />
              <label>End</label>
              <Field
                type="datetime-local"
                name="dateTime.end.date"
                className="input border-primary w-full max-w-xs"
                onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                  const value = evt.target.value;
                  setFieldValue('dateTime.end.date', value);
                  if (values.dateTime.start.date !== '' && !dayjs(value).isSame(dayjs(values.dateTime.start.date), 'minute'))
                    setFieldValue('duration', 0);
                }}
              />
              <label>
                Icon<span className="text-error">*</span>
              </label>
              <select
                name="icon"
                onChange={(evt) => setFieldValue('icon.name', evt.target.value)}
                onBlur={handleBlur}
                className="select border-primary w-full max-w-xs"
                value={values.icon.name}
                defaultValue={'Select an icon'}>
                <option disabled>Select an icon</option>
                {IONICONS_ARRAY.map((_i) => (
                  <option key={_i}>{_i}</option>
                ))}
              </select>
              <label>Frequency</label>
              <select
                onChange={(evt) => setFieldValue('recurrence.type', evt.target.value)}
                value={values.recurrence.type}
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
              {(values.dateTime.start.date === '' && values.dateTime.end.date === '') ||
              dayjs(values.dateTime.start.date).isSame(dayjs(values.dateTime.end.date), 'minute') ? (
                <label>
                  Duration (minutes)
                  <Field
                    type="number"
                    name="duration"
                    className="input border-primary w-full max-w-xs"
                    onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                      // console.log(evt)
                      const value = evt.target.value;
                      setFieldValue('duration', value);
                      if (parseInt(value) > 0) {
                        setFieldValue('dateTime.start.date', '');
                        setFieldValue('dateTime.end.date', '');
                      }
                    }}>
                    {/* <input
                      type="number"
                      
                    /> */}
                  </Field>
                </label>
              ) : (
                <></>
              )}
              <label>
                Category
                <select
                  onChange={(evt) => {
                    const value = evt.target.value;
                    value === 'none' ? setFieldValue('category', null) : setFieldValue('category', value);
                  }}>
                  <option disabled>Select a category</option>
                  {[...goalCategoryArr, 'none'].map((_c) => (
                    <option>{_c}</option>
                  ))}
                </select>
              </label>
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
