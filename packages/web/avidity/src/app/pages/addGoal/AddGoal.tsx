import { EMPTY_GOAL } from '@shared/helpers';
import { AddForm, Goal, GoalRepeat, ioniconsArr } from '@shared/types';
import { TODAY_DATE, TODAY_DATE_FORMATTED, WEEKDAYS, standardFormat } from '@shared/utils';
import { SideBar } from '@web/components';
import { useGoalStore } from '@web/stores';
import { ErrorMessage, Field, FieldArray, Form, Formik, FormikHelpers } from 'formik';
import React, { useEffect, useRef } from 'react';

export default function AddGoal() {
  const addGoal = useGoalStore.use.addGoal();
  return (
    <div className="flex bg-base-100">
      <Formik
        initialValues={{
          title: '',
          description: '',
          date: TODAY_DATE_FORMATTED,
          icon: { name: 'accessibility', backgroundColor: 'beige', iconColor: 'indianred' },
          time: undefined,
          repeat: { type: 'none' },
          break: undefined,
          commute: undefined,
          location: undefined,
        }}
        onSubmit={(values, { setSubmitting }: FormikHelpers<AddForm>) => {
          // console.log(values);
          const repeat = values.repeat;
          const newRepeat: GoalRepeat =
            repeat.type === 'custom'
              ? { type: 'custom', frequency: repeat.frequency, end: repeat.end }
              : repeat.type === 'weekdays'
              ? { type: 'weekdays', weekdays: repeat.weekdays }
              : { type: repeat.type };
          const newGoal: Omit<Goal, 'id'> = {
            ...EMPTY_GOAL,
            ...values,
            repeat: newRepeat,
            time: values.time ? { start: standardFormat(values.time.start), end: standardFormat(values.time.end) } : undefined,
            categories: new Set(),
          };
          addGoal({
            goal: newGoal,
          });
        }}>
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
          setFieldValue,
          /* and other goodies */
        }) => {
          // useEffect(() => {
          //   console.log(values);
          // }, [values, values.repeat.weekdays]);
          return (
            <Form className="flex flex-col">
              <label>
                Title<span className="text-error">*</span>
              </label>
              <Field type="text" name="title" className="input border-primary w-full max-w-xs" />
              <ErrorMessage name="title" component="div" />
              <label>Description</label>
              <Field type="description" name="description" className="input border-primary w-full max-w-xs" />
              <ErrorMessage name="description" component="div" />
              <label>
                Date<span className="text-error">*</span>
              </label>
              <Field type="date" name="date" className="input border-primary w-full max-w-xs" />
              <label>Time</label>
              <label>Start</label>
              <Field type="time" name="time.start" className="input border-primary w-full max-w-xs" />
              <label>End</label>
              <Field type="time" name="time.end" className="input border-primary w-full max-w-xs" />
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
              <label>Repeat</label>
              <select
                onChange={(evt) => setFieldValue('repeat.type', evt.target.value)}
                defaultValue={'Select the repeat type'}
                className="select border-primary w-full max-w-xs">
                <option disabled>Select the repeat type</option>
                {['daily', 'weekly', 'monthly', 'yearly', 'custom', 'weekdays', 'none'].map((_i) => (
                  <option>{_i}</option>
                ))}
              </select>
              {values.repeat.type === 'custom' ? (
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
              ) : null}
              <label>Location</label>
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
              </div>
              <button type="submit" className="btn">
                Submit
              </button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
