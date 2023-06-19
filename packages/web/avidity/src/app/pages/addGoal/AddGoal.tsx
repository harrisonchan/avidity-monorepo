import { AddForm } from '@shared/types';
import { TODAY_DATE } from '@shared/utils';
import { SideBar } from '@web/components';
import { useFormik } from 'formik';

export default function AddGoal() {
  const addFormik = useFormik<AddForm>({
    initialValues: {
      title: '',
      description: '',
      date: TODAY_DATE,
      icon: { name: 'accessibility', backgroundColor: 'beige', iconColor: 'indianred' },
      time: undefined,
      repeat: { type: 'none' },
      break: undefined,
      commute: undefined,
      location: undefined,
    },
    onSubmit: (values) => {},
  });
  return <div>{/* <SideBar /> */}</div>;
}
