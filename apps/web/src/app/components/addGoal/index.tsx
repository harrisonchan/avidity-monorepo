'use client';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

type Inputs = {
  title: String;
  description: String;
};

function AddGoal() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data);
  console.log(watch('title')); // watch input value by passing the name of it
  return (
    <div>
      {/* "handleSubmit" will validate your inputs before invoking "onSubmit" */}
      <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        {/* errors will return when field validation fails  */}
        {errors.title && <span className="text-rose-500">This field is required</span>}
        {/* include validation with required or other standard HTML validation rules */}
        <input {...register('title', { required: true })} placeholder="Your Goal Title" />
        {/* register your input into the hook by invoking the "register" function */}
        <input className="border-2" defaultValue="test" {...register('description')} />

        <input type="submit" />
      </form>
    </div>
  );
}

export default AddGoal;
