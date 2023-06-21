import { Goal } from '@shared/types';
import { useGoalStore } from '@web/stores';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IoRemoveCircle, IoAddCircle } from 'react-icons/io5';

export default function Group() {
  const { id } = useParams();
  const { _groups, getGroupGoalsData, addToGroup, removeFromGroup } = useGoalStore((state) => ({
    _groups: state.groups,
    getGroupGoalsData: state.getGroupGoalsData,
    addToGroup: state.addToGroup,
    removeFromGroup: state.removeFromGroup,
  }));
  const group = _groups[id ?? ''];
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [goalsInGroup, setGoalsInGroup] = useState<Goal[]>([]);
  const [goalsNotInGroup, setGoalsNotInGroup] = useState<Goal[]>([]);
  useEffect(() => {
    const groupGoalsData = getGroupGoalsData({ id: group.id })!;
    setGoalsInGroup(groupGoalsData.goalsInGroup);
    setGoalsNotInGroup(groupGoalsData.goalsNotInGroup);
    console.debug('groupGoalsData', groupGoalsData);
  }, [_groups]);
  return (
    <div>
      <p className="text-lg">{group.id}</p>
      <p className="text-2xl">{group.title}</p>
      <div className="flex flex-row">
        <div className="flex flex-col">
          {goalsInGroup.length > 0 ? <p className="text-2xl">Current Goals</p> : null}
          {goalsInGroup.map((goal) => (
            <button className="btn btn-outline flex flex-col" onClick={() => removeFromGroup({ id: goal.id })}>
              <p className="text-xl">{goal.title}</p>
            </button>
          ))}
        </div>
        <div className="flex flex-col">
          <button className="btn" onClick={() => setIsAddingGoal(!isAddingGoal)}>
            {isAddingGoal ? 'Cancel' : 'Add Goal'}
          </button>
          {isAddingGoal ? (
            <div className="flex flex-col">
              {goalsNotInGroup.map((goal) => (
                <button className="btn btn-outline flex flex-col" onClick={() => addToGroup({ id: goal.id, groupId: group.id })}>
                  <p className="text-xl">{goal.title}</p>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
