'use client';
import React from 'react';
import { Plus } from '@phosphor-icons/react';
import { AddGoal } from '@web/components';

function addGoalPage() {
  return (
    <div>
      <button className="flex flex-row items-center">
        <Plus size={32} className="hover:" />
        <h3>Add Goal</h3>
      </button>
      <AddGoal />
    </div>
  );
}

export default addGoalPage;
