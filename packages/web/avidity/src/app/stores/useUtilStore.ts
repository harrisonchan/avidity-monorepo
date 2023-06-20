import { createSelectors } from '@shared/helpers';
import { DaisyUITheme } from '@web/types';
import { produce } from 'immer';
import { isUndefined } from 'lodash';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UtilState {
  theme: DaisyUITheme;
  test: Map<string, boolean>;
}

const initialState: UtilState = {
  theme: 'lemonade',
  test: new Map([['1', true]]),
};

interface UtilActions {
  setTheme: (theme: DaisyUITheme) => void;
  addTest: () => void;
}

const useUtilStore = create(
  persist(
    immer<UtilState & UtilActions>((set, get) => ({
      ...initialState,
      setTheme: (theme: DaisyUITheme) => {
        set(() => ({ theme }));
      },
      addTest: () => {
        // if (isUndefined(get().test)) set(() => ({ test: new Map<string, string>() }));
        // set((state) => {
        //   state.test.set(`TEST${state.test.size}`, true);
        // });
        // console.log(get().test);
      },
    })),
    {
      name: 'util-storage!',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default createSelectors(useUtilStore);
