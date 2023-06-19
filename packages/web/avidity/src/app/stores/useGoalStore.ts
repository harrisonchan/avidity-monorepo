import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { BaseGoalState, BaseGoalActions, createGoalSlice } from '@shared/stores';
import { createSelectors } from '@shared/helpers';

const useGoalStore = create(
  persist(
    immer<BaseGoalState & BaseGoalActions>((...a) => ({
      //@ts-ignore
      ...createGoalSlice(...a),
    })),
    {
      name: 'goal-storage',
    }
  )
);

export default createSelectors(useGoalStore);
