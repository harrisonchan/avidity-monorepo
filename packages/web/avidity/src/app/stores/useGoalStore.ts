import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { BaseGoalState, BaseGoalActions, createGoalSlice } from '@shared/stores';
import { createSelectors } from '@shared/helpers';
import { mapSetStorageReplacer, mapSetStorageReviver } from '@shared/utils';

const useGoalStore = create(
  persist(
    immer<BaseGoalState & BaseGoalActions>((...a) => ({
      //@ts-ignore
      ...createGoalSlice(...a),
    })),
    {
      // name: 'goal-storage',
      name: 'goal-storage-v2',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str, mapSetStorageReviver);
          const state = data.state;
          return { state };
        },
        setItem: (name, newValue) => {
          const str = JSON.stringify({ state: { ...newValue.state } }, mapSetStorageReplacer);
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export default createSelectors(useGoalStore);
