import React from 'react';
import { Link } from 'react-router-dom';
import { GoalCard } from '@web/components';

const TEST_DATA = [
  {
    title: '1',
    description: '',
  },
  {
    title: '2',
    description: '123',
  },
  {
    title: '3',
    description: '123',
  },
  {
    title: '4',
    description: '123',
  },
];
export default function Home() {
  return (
    <div>
      <h2 className="text-center text-green-500">Home</h2>
      <div>Hello World</div>
      <h1 className="text-3xl font-bold underline border-lime-700 text-violet-400">Hello world Styled!</h1>
      {/* {TEST_DATA.map((item, idx) => (
        <GoalCard title={item.title} description={item.description} />
      ))} */}
      <div className="bg-blue-500 max-w-sm border-red-100">
        <h1>saf</h1>
      </div>
    </div>
  );
}
