import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as dayjs from 'dayjs';
import * as duration from 'dayjs/plugin/duration';
import { BaseGoalState, BaseGoalActions, createGoalSlice, goalStorageReviver, goalStorageReplacer } from '@shared/stores';
import { createSelectors } from '@shared/helpers';
import { useEffect, useState } from 'react';
import { Goal } from '@shared/types';

dayjs.extend(duration);

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
          const data = JSON.parse(str, goalStorageReviver);
          let state = data.state;
          // console.debug('STATEEEEE', state);
          // if (state.goals) {
          //   state.goals.map((goal: any) => ({ ...goal, duration: dayjs.duration(goal.duration) }));
          // }
          return { state };
        },
        setItem: (name, newValue) => {
          const str = JSON.stringify({ state: { ...newValue.state } }, goalStorageReplacer);
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export const useGoalStoreHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Note: This is just in case you want to take into account manual rehydration.
    // You can remove the following line if you don't need it.
    const unsubHydrate = useGoalStore.persist.onHydrate(() => setHydrated(false));

    const unsubFinishHydration = useGoalStore.persist.onFinishHydration(() => setHydrated(true));

    setHydrated(useGoalStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};

export default createSelectors(useGoalStore);
