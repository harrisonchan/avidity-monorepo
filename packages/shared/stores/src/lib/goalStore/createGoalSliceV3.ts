import { StateCreator } from 'zustand';
import { isEqual } from 'lodash';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as tz from 'dayjs/plugin/timezone';
import { DateParam, Goal, GoalDateTimeEntry, GoalGroup, GoalStatus, TimeFormat } from '@shared/types';
import { getRecurrenceDates, getStandardFormat } from '@shared/utils';
import { generateGoalId, generateGroupId } from '@shared/helpers';

dayjs.extend(utc);
dayjs.extend(tz);

export type CachedGoal = Omit<Goal, 'dateTimeData' | 'recurrence' | 'groupId'> & { status: GoalStatus };
export interface BaseGoalState {
  goals: Record<string, Goal>;
  groups: Record<string, GoalGroup>;
  dateCache: Record<string, Record<string, CachedGoal>>; //cached goals in local date
  selectedDateData: {
    date: string; //local date
    timeZone: string;
    goals: CachedGoal[];
    groups: GoalGroup[];
  };
}

export type NewGoal = Omit<Goal, 'id' | 'dateTimeData'> & {
  dateTimeData: {
    start: GoalDateTimeEntry;
    end: GoalDateTimeEntry;
  };
};
export interface BaseGoalActions {
  updateSelectedDateData: (params: { newDate?: { date: DateParam; timeZone?: string }; dateMetadata?: DateParam[] }) => void;
  createDateCache: () => void;
  addToDateCache: (params: { id: string }) => void;
  removeFromDateCache: (params: { id: string }) => void;
  addGoal: (params: { goal: NewGoal; timeFormat?: TimeFormat }) => void;
  updateGoal: (params: { goal: Pick<Goal, 'id'> & Partial<Goal>; timeFormat?: TimeFormat }) => void;
  updateGoalStatus: (params: { id: string; status: GoalStatus; date: DateParam; timeFormat?: TimeFormat }) => void;
  deleteGoal: (params: { id: string }) => void;
  addGroup: (params: { group: Omit<GoalGroup, 'id'> }) => void;
  updateGroup: (params: { group: Pick<GoalGroup, 'id'> & Partial<GoalGroup> }) => void;
  deleteGroup: (params: { id: string }) => void;
  addGoalToGroup: (params: { id: string; groupId: string }) => void;
  removeGoalFromGroup: (params: { id: string }) => void;
}

const initialState: BaseGoalState = {
  goals: {},
  groups: {},
  dateCache: {},
  selectedDateData: {
    date: getStandardFormat(dayjs()),
    timeZone: dayjs.tz.guess(),
    goals: [],
    groups: [],
  },
};

const createGoalSlice: StateCreator<
  BaseGoalState & BaseGoalActions,
  [['zustand/persist', unknown], ['zustand/immer', never]],
  [],
  BaseGoalState & BaseGoalActions
> = (set, get) => ({
  ...initialState,
  updateSelectedDateData: (params) => {
    // const dates = params.dates
    const { newDate, dateMetadata } = params;
    const timeZone = newDate?.timeZone ?? dayjs.tz.guess();
    if (timeZone !== get().selectedDateData.timeZone || newDate) {
      set((state) => {
        state.selectedDateData = {
          ...state.selectedDateData,
          date: getStandardFormat(newDate?.date ?? dayjs()),
          timeZone,
        };
      });
      //Create new date cache
    }
    //Compare datemetadata and selected date...if selected date in metadata add goals from datecache
    //Implement goal groups in future
  },
  createDateCache: () => {},
  addToDateCache: (params) => {
    const id = params.id;
    const goal = get().goals[id];
    const { dateTimeData, recurrence, groupId, ...rest } = goal;
    const cachedGoal: CachedGoal = { ...rest, status: 'incomplete' };
    const recurrenceDates = goal.recurrence
      ? getRecurrenceDates({ recurrenceRule: goal.recurrence })
      : [getStandardFormat(goal.dateTimeData.start.date)];
    set((state) => {
      recurrenceDates.forEach((date) => {
        const _d = getStandardFormat(date);
        const status = Object.entries(goal.dateTimeData.status).find((entry) => entry[0] === _d)![1];
        if (!state.dateCache[_d]) state.dateCache[_d] = {};
        state.dateCache[_d][id] = { ...cachedGoal, status };
      });
    });
  },
  removeFromDateCache: (params) => {
    const id = params.id;
    set((state) => {
      Object.keys(state.dateCache).forEach((key) => {
        delete state.dateCache[key][id];
      });
    });
  },
  addGoal: (params) => {
    const { goal, timeFormat } = params;
    const id = generateGoalId(goal.title, goal.dateTimeData.start.date);
    const initialGoalStatus: Record<string, GoalStatus> = {};
    initialGoalStatus[goal.dateTimeData.start.date] = 'incomplete';
    const newGoal: Goal = { id, ...goal, dateTimeData: { ...goal.dateTimeData, status: initialGoalStatus } };
    set((state) => {
      state.goals[id] = newGoal;
    });
    get().addToDateCache({ id });
    //Add to selected date data if needed
  },
  updateGoal: (params) => {
    const { goal } = params;
    const id = goal.id;
    const originalGoal = get().goals[id];
    if (!originalGoal) console.debug(`useGoalStore >> updateGoal: No goal found with id(${id})`);
    else {
      const newGoal = { ...originalGoal, goal };

      if (newGoal.groupId !== goal.groupId) {
        get().removeGoalFromGroup({ id });
        newGoal.groupId !== '' && get().addGoalToGroup({ id, groupId: newGoal.groupId });
      }

      set((state) => {
        state.goals[id] = newGoal;
      });

      const { status, ...dateTime1 } = newGoal.dateTimeData;
      const dateTime2 = {
        start: originalGoal.dateTimeData.start,
        end: originalGoal.dateTimeData.end,
      };
      if (!isEqual(dateTime1, dateTime2)) {
        get().removeFromDateCache({ id });
        get().addToDateCache({ id });
      }

      //update selected date data if needed
    }
  },
  updateGoalStatus: (params) => {
    const { id, date, status } = params;
    const dateToChange = getStandardFormat(date);
    const goal = get().goals[id];
    if (!goal) console.debug(`useGoalStore >> updateGoalStatus: No goal found with id(${id})`);
    else {
      set((state) => {
        goal.dateTimeData.status[dateToChange] = status;
        state.goals[id] = goal;
        state.dateCache[dateToChange][id].status = status;
      });

      //update selected date data if needed
    }
  },
  deleteGoal: (params) => {
    const id = params.id;
    set((state) => {
      delete state.goals[id];
    });
    get().removeFromDateCache({ id });
    get().removeGoalFromGroup({ id });

    // update selected date data if needed
  },
  addGroup: (params) => {
    const group = params.group;
    const id = generateGroupId(group.title);
    const newGroup = { ...group, id };
    set((state) => {
      state.groups[id] = newGroup;
    });

    //update selected date data if goal group has date/time and is within range
  },
  updateGroup: (params) => {
    const group = params.group;
    const id = group.id;
    const originalGroup = get().groups[id];
    if (!originalGroup) console.debug(`useGoalStore >> updateGroup: No goal group found with id(${id})`);
    else {
      set((state) => {
        state.groups[id] = { ...originalGroup, ...group };
      });

      //update selected date data if needed
    }
  },
  deleteGroup: (params) => {
    const id = params.id;
    const group = get().groups[id];
    if (!group) console.debug(`useGoalStore >> deleteGroup: No goal group found with id(${id})`);
    else {
      set((state) => {
        group.goals.forEach((goalId) => {
          state.goals[goalId].groupId = '';
        });
        delete state.groups[id];
      });

      //update selected date data if needed
    }
  },
  addGoalToGroup: (params) => {
    const { id, groupId } = params;
    const goal = get().goals[id];
    const group = get().groups[groupId];
    if (!goal) console.debug(`useGoalStore >> addGoalToGroup: No goal found with id(${id})`);
    else if (!group) console.debug(`useGoalStore >> addGoalToGroup: No group found with id(${id})`);
    else {
      if (goal.groupId !== '') get().removeGoalFromGroup({ id });
      set((state) => {
        state.goals[id].groupId = groupId;
        state.groups[groupId].goals.add(id);
      });

      //update selected date data if needed
    }
  },
  removeGoalFromGroup: (params) => {
    const id = params.id;
    const goal = get().goals[id];
    if (!goal) console.debug(`useGoalStore >> removeGoalFromGroup: No goal found with id(${id})`);
    else if (goal.groupId === '') console.debug(`useGoalStore >> removeGoalFromGroup: Goal(${id}) is already not in a group`);
    else {
      set((state) => {
        state.goals[id].groupId = '';
        state.groups[goal.groupId].goals.delete(id);
      });

      //update selected date data if needed
    }
  },
});

export default createGoalSlice;
