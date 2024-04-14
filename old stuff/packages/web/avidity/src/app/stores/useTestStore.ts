import { createSelectors } from '@shared/helpers';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface TestState {
  test: Record<string, string>;
}

interface TestActions {
  addTest: (newTest: string) => void;
}

const initialState: TestState = {
  test: {},
};

const useTestStore = create(
  persist(
    immer<TestState & TestActions>((set, get) => ({
      ...initialState,
      addTest: (newTest: string) => {
        set((state) => {
          state.test['id' + newTest] = newTest;
        });
      },
    })),
    {
      name: 'test-storage',
    }
  )
);

export default createSelectors(useTestStore);
