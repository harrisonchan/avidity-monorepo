import { Link } from 'react-router-dom';

export default function Add() {
  return (
    <div className="pt-2 pl-2 flex flex-col">
      <button className="btn">
        <Link to={'/edit-goal'} state={{ editType: 'add' }}>
          Add Goal
        </Link>
      </button>
      <button className="btn mt-2">
        <Link to={'/edit-group'} state={{ editType: 'add' }}>
          Add Group
        </Link>
      </button>
    </div>
  );
}
