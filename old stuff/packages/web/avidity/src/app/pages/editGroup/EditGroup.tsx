import { GoalGroup, GoalIllustration, ILLUSTRATION_ARRAY } from '@shared/types';
import { useGoalStore } from '@web/stores';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type EditGroupLocationState = {
  editType: 'add' | 'update';
  groupId?: string;
};

export default function EditGroup() {
  const { goals, groups, addGroup, updateGroup } = useGoalStore((state) => ({
    goals: state.goals,
    groups: state.groups,
    addGroup: state.addGroup,
    updateGroup: state.updateGroup,
  }));
  const navigate = useNavigate();
  const locationState = useLocation().state as EditGroupLocationState;
  const { editType, groupId } = locationState;
  const group = locationState && editType === 'update' && groupId ? groups[groupId] : null;
  const initialValues: Omit<GoalGroup, 'goals' | 'id' | 'illustration'> & {
    goals: string[];
    illustration: Required<GoalIllustration>;
  } = group
    ? {
        ...group,
        goals: [...group.goals],
        illustration: {
          name: group.illustration.name,
          iconColor: JSON.stringify(group.illustration.iconColor),
          backgroundColor: JSON.stringify(group.illustration.backgroundColor),
        },
      }
    : {
        title: '',
        description: '',
        date: {
          start: '',
          end: '',
        },
        goals: [],
        illustration: {
          name: 'illustration-animal',
          iconColor: 'beige',
          backgroundColor: 'aqua',
        },
      };
  const [useDate, setUseDate] = useState(false);
  return (
    <div className="pl-2 pt-2">
      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          const description = values.description && values.description !== '' ? values.description : null;
          const date = values.date && values.date.start !== '' && values.date.end !== '' ? values.date : null;

          const newGoalGroup: Omit<GoalGroup, 'id'> = {
            title: values.title,
            description,
            date,
            illustration: values.illustration,
            goals: new Set(values.goals),
          };
          console.log('GOALS', values.goals);
          console.log('NEW GOAL GROUP', newGoalGroup);

          if (editType === 'update' && groupId) {
            updateGroup({ group: { ...newGoalGroup, id: groupId } });
            navigate(`/group/${groupId}`);
          } else {
            addGroup({ group: newGoalGroup });
            navigate('/');
          }
        }}>
        {({ values, setFieldValue }) => (
          <Form className="flex flex-col">
            <label>
              Title<span className="text-error">*</span>
            </label>
            <Field type="text" name="title" className="input border-primary w-full max-w-xs" />
            <label>Description</label>
            <Field type="text" name="description" className="input border-primary w-full max-w-xs" />
            <div className="mt-2">
              <button
                className="btn"
                onClick={() => {
                  if (useDate) {
                    setFieldValue('date', { start: '', end: '' });
                  }
                  setUseDate(!useDate);
                }}>
                {useDate ? 'Remove Date Range' : 'Set Date Range'}
              </button>
              {useDate ? (
                <div className="mt-2 flex flex-col">
                  <label>Start</label>
                  <Field type="datetime-local" name="date.start" className="input border-primary w-full max-w-xs" />
                  <label>End</label>
                  <Field type="datetime-local" name="date.end" className="input border-primary w-full max-w-xs" />
                </div>
              ) : null}
            </div>
            <label>Select goals to add to group</label>
            <div className="overflow-x-scroll">
              {Object.values(goals).map((_g) => (
                <label className="ml-1">
                  <Field type="checkbox" name="goals" value={_g.id} className="mr-1" />
                  {_g.title}
                </label>
              ))}
            </div>
            <label className="mt-2">Illustration</label>
            <select
              onChange={(evt) => {
                const value = evt.target.value;
                setFieldValue('illustration.name', value);
              }}>
              <option disabled>Select a category</option>
              {ILLUSTRATION_ARRAY.map((_c) => (
                <option>{_c}</option>
              ))}
            </select>
            <button type="submit" className="btn mt-2">
              {editType==='update' ? 'Update Group' : 'Add Group'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
