import { GoalGroup } from '@shared/types';
import { useGoalStore } from '@web/stores';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Group() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { goals, groups } = useGoalStore((state) => ({
    goals: state.goals,
    groups: state.groups,
  }));
  const randomGroupId = Object.values(groups)[0].id;
  const [group, setGroup] = useState<GoalGroup>(groups[randomGroupId]);
  useEffect(() => {
    if (id) setGroup(groups[id]);
    console.log(group);
  }, []);
  //   const group = groups[id ?? randomGroupId];
  return (
    <div className="pt-2 pl-2">
      <h1>{group.title}</h1>
      {group.description ? <p>{group.description}</p> : null}
      <ul>
        {[...group.goals].map((goalId) => {
          const goal = goals[goalId];
          return (
            <div className="card-bordered">
              <p>{goalId}</p>
              <p>{goal.title}</p>
            </div>
          );
        })}
      </ul>
      <button className="btn mt-2" onClick={() => navigate('/edit-group', { state: { editType: 'update', groupId: group.id } })}>
        Update
      </button>
    </div>
  );
}
