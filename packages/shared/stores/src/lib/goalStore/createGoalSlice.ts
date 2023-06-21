import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { isEqual } from 'lodash';
import { DateParam, Goal, GoalGroup, TimeFormat } from '@shared/types';
import { TODAY_DATE_FORMATTED, convertMapToArray, standardDate, standardFormat, utcFormat } from '@shared/utils';
import {
  generateGoalId,
  generateGroupId,
  checkValidRepeatDate,
  createValidRepeatDates,
  convertGoalToDateCacheGoal,
  EMPTY_GOAL,
} from '@shared/helpers';

export type CachedGoal = Omit<Goal, 'repeat' | 'completion' | 'groupId' | 'location' | 'commute' | 'break'> & {
  isComplete: 'completed' | 'incomplete' | 'skipped';
};

export type GoalMap = Map<string, Goal>;
export type CachedGoalMap = Map<string, Map<string, CachedGoal>>;
export type GroupMap = Map<string, GoalGroup>;

export interface BaseGoalState {
  goals: GoalMap;
  dateCache: CachedGoalMap;
  groups: GroupMap;
  selectedDateData: {
    date: string;
    goals: CachedGoal[];
    groups: GoalGroup[];
  };
}

export interface BaseGoalActions {
  runTasks: () => void;
  getDateData: (params: { date: DateParam; timeFormat?: TimeFormat }) => { goals: CachedGoal[]; groups: GoalGroup[] };
  setSelectedDateData: (params: { date: DateParam; timeFormat?: TimeFormat; checkIsSameSelectedDate?: boolean }) => void;
  getGoal: (params: { id: string }) => Goal | undefined;
  addGoal: (params: { goal: Omit<Goal, 'id'>; timeFormat?: TimeFormat }) => void;
  updateGoal: (params: { goal: Pick<Goal, 'id'> & Partial<Goal>; timeFormat?: TimeFormat }) => void;
  updateGoalComplete: (params: {
    id: string;
    isComplete: 'completed' | 'incomplete' | 'skipped';
    isCompleteDate: DateParam;
    timeFormat?: TimeFormat;
  }) => void;
  deleteGoal: (params: { id: string }) => void;
  getGroup: (params: { id: string }) => GoalGroup | undefined;
  getGoalsNotInGroup: () => Goal[];
  getGoalsInGroup: (params: { id: string }) => Goal[];
  addGroup: (params: { group: Omit<GoalGroup, 'id'> }) => void;
  updateGroup: (params: { group: Pick<GoalGroup, 'id'> & Partial<GoalGroup> }) => void;
  deleteGroup: (params: { id: string }) => void;
  addToGroup: (params: { id: string; groupId: string }) => void;
  removeFromGroup: (params: { id: string }) => void;
  addToDateCache: (params: { id: string; range?: number }) => void;
  removeFromDateCache: (params: { id: string }) => void;
  clearStore: () => void;
}

const initialState: BaseGoalState = {
  goals: new Map(),
  dateCache: new Map(),
  groups: new Map(),
  selectedDateData: {
    date: TODAY_DATE_FORMATTED,
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
  runTasks: () => {
    // console.log('hello')
    // console.log(`Today's date: ${dayjsUtils.standardFormat(dayjsUtils.TODAY_DATE_FORMATTED)}`)
    //Update selectedDateData
    get().setSelectedDateData({ date: TODAY_DATE_FORMATTED });
    // console.debug(`useV1GoalStore (runTasks): Updating selectedDateData`)
    // get().setSelectedDateData({ date: dayjsUtils.TODAY_DATE.add(0, 'day') })
    // const { goals, groups } = get().getDateData({ date: dayjsUtils.TODAY_DATE_FORMATTED })
    // set((state) => {
    //   console.log('biatch')
    //   state.selectedDateData = {
    //     date: dayjsUtils.standardFormat(dayjsUtils.TODAY_DATE.add(1, 'day')),
    //     goals,
    //     groups,
    //   }
    // })
    //Prune and update dateCache
  },
  getDateData: (params) => {
    const { date, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? standardFormat(date) : utcFormat(date);
    const goals = get().dateCache?.get(utcFormattedDate);
    if (goals) {
      const groupIds = new Set<string>();
      goals.forEach((_m) => {
        const groupId = get().goals.get(_m.id)?.groupId;
        groupId && groupIds.add(groupId);
      });
      const groups: GoalGroup[] = Array.from(groupIds).map((_id) => get().groups.get(_id)!);
      const sortedGroups = groups.sort((a, b) => {
        if (a.title.toUpperCase() < b.title.toUpperCase()) return -1;
        return 1;
      });
      const sortedGoals = convertMapToArray(goals).sort((a, b) => {
        if (a.title.toUpperCase() < b.title.toUpperCase()) return -1;
        return 1;
      });
      const result = { goals: sortedGoals, groups: sortedGroups };
      return result;
    }
    console.debug(`useV1GoalStore (getDateData): No goals found for ${standardFormat(date)}`);
    return { goals: [], groups: [] };
  },
  setSelectedDateData: (params) => {
    const { date, timeFormat, checkIsSameSelectedDate } = params;
    const utcFormattedDate = timeFormat === 'utc' ? standardFormat(date) : utcFormat(date);
    if ((checkIsSameSelectedDate && utcFormattedDate !== get().selectedDateData.date) || !checkIsSameSelectedDate) {
      // console.log(get());
      // console.log(get().getDateData);
      const { goals, groups } = get().getDateData({ date });
      set((state) => {
        state.selectedDateData = { date: utcFormattedDate, goals, groups };
      });
    } else console.debug(`useV1GoalStore (setSelectedDateData): Cannot change date because ${standardFormat(date)} is already the selected date`);
  },
  getGoal: (params) => {
    const id = params.id;
    const goal = get().goals.get(id);
    if (!goal) {
      console.debug(`useV1GoalStore (getGoal): No goal found with id ${id}`);
      return undefined;
    } else return goal;
  },
  addGoal: (params) => {
    const { goal, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? goal.date : utcFormat(goal.date);
    const id = generateGoalId(goal.title, goal.date);
    const newGoal = { ...goal, id };
    get().goals.set(id, newGoal);
    get().addToDateCache({ id });
    newGoal.groupId && get().addToGroup({ id, groupId: newGoal.groupId });
    utcFormattedDate === get().selectedDateData.date && get().setSelectedDateData({ date: utcFormattedDate });
  },
  updateGoal: (params) => {
    const { goal, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? goal.date : utcFormat(goal.date);
    const id = goal.id;
    const originalGoal = get().goals.get(id);
    if (!originalGoal) console.debug(`useV1GoalStore (updateGoal): No goal found with id ${id}`);
    else {
      set((state) => {
        state.goals.set(id, { ...originalGoal, ...goal });
      });
      if ((goal.date && !isEqual(goal.date, originalGoal.date)) || (goal.repeat && !isEqual(goal.repeat, originalGoal.repeat))) {
        get().removeFromDateCache({ id });
        get().addToDateCache({ id });
      } else {
        set((state) => {
          state.dateCache.forEach((date) => {
            date.forEach((_g) => _g.id === id && date.set(id, { ..._g, ...goal }));
          });
        });
      }
      //addToGroup already tries to update selectedDateData FYI
      if (goal.groupId && !isEqual(goal.groupId, originalGoal.groupId)) {
        get().removeFromGroup({ id });
        get().addToGroup({ id, groupId: goal.groupId });
      } else if (utcFormattedDate === get().selectedDateData.date) {
        get().setSelectedDateData({ date: utcFormattedDate });
      }
    }
  },
  updateGoalComplete: (params) => {
    const { id, isComplete, isCompleteDate, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? standardFormat(isCompleteDate) : utcFormat(isCompleteDate);
    set((state) => {
      const goal = state.goals.get(id);
      const goalsForDate = state.dateCache.get(utcFormattedDate);
      if (!goal) console.debug(`useV1GoalStore (updateGoalComplete): No goal found with id ${id}`);
      else if (!goalsForDate) console.debug(`useV1GoalStore (updateGoalComplete): No goals found for ${utcFormattedDate}`);
      else {
        goalsForDate.set(id, { ...goalsForDate.get(id)!, isComplete });
        const completion = goal.completion;
        if (isComplete === 'completed') {
          completion.completed.add(utcFormattedDate);
          completion.incomplete.delete(utcFormattedDate);
        } else if (isComplete === 'skipped') {
          completion.skipped.add(utcFormattedDate);
        } else {
          completion.completed.delete(utcFormattedDate);
          completion.incomplete.add(utcFormattedDate);
        }
      }
    });
    if (utcFormattedDate === get().selectedDateData.date) {
      get().setSelectedDateData({ date: utcFormattedDate });
    }
  },
  deleteGoal: (params) => {
    const id = params.id;
    const goal = get().goals.get(id);
    if (!goal) console.debug(`useV1GoalStore (deleteGoal): No goal found with id ${id}`);
    else {
      set((state) => {
        state.groups.get(goal.groupId ?? '')?.goals.delete(id);
        state.dateCache.forEach((date) => {
          date.delete(id);
        });
        state.goals.delete(id);
        console.log(`useV1GoalStore (deleteGoal): deleted goal ${id} with title: ${goal.title}}`);
      });
      if (get().selectedDateData.date === goal.date) {
        get().setSelectedDateData({ date: goal.date });
      }
    }
  },
  getGroup: (params) => {
    const id = params.id;
    const group = get().groups.get(id);
    if (!group) {
      console.debug(`useV1GoalStore (getGroup): No goal group found with id ${id}`);
      return undefined;
    }
    return group;
  },
  getGoalsNotInGroup: () => {
    const goalsNotInGroup: Goal[] = [];
    get().goals.forEach((goal) => {
      goal.groupId === '' && goalsNotInGroup.push(goal);
    });
    return goalsNotInGroup;
  },
  getGoalsInGroup: (params) => {
    const id = params.id;
    const goalsInGroup: Goal[] = [];
    const group = get().groups.get(id);
    if (!group) console.debug(`useV1GoalStore (getGoalsInGroup): No goal group found with id ${id}`);
    else {
      group.goals.forEach((id) => {
        const goal = get().goals.get(id);
        if (goal) goalsInGroup.push(goal);
      });
    }
    return goalsInGroup;
  },
  addGroup: (params) => {
    const { group } = params;
    const id = generateGroupId(group.title);
    const newgroup = { ...group, id };
    set((state) => {
      state.groups.set(id, newgroup);
    });
  },
  updateGroup: (params) => {
    const group = params.group;
    const id = group.id;
    const originalgroup = get().groups.get(id);
    if (!originalgroup) console.debug(`useV1GoalStore (updateGroup): No goal group found with id ${id}`);
    else {
      set((state) => {
        state.groups.set(id, { ...originalgroup, ...group });
      });
      let shouldUpdateSelectedDateDataFlag = false;
      get().selectedDateData.goals.forEach((_m) => get().goals.get(_m.id)!.groupId === id && (shouldUpdateSelectedDateDataFlag = true));
      shouldUpdateSelectedDateDataFlag && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  deleteGroup: (params) => {
    const id = params.id;
    const group = get().groups.get(id);
    if (!group) console.debug(`useV1GoalStore (deleteGroup): No goal group found with id ${id}`);
    else {
      set((state) => {
        group.goals.forEach((id) => (state.goals.get(id)!.groupId = ''));
        state.groups.delete(id);
      });
      let shouldUpdateSelectedDateDataFlag = false;
      get().selectedDateData.goals.forEach((_m) => get().goals.get(_m.id)!.groupId === id && (shouldUpdateSelectedDateDataFlag = true));
      shouldUpdateSelectedDateDataFlag && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  addToGroup: (params) => {
    const { id, groupId } = params;
    const goal = get().goals.get(id);
    const group = get().groups.get(groupId);
    if (!goal) console.debug(`useV1GoalStore (addToGroup): No goal found with id ${id}`);
    else if (goal.groupId !== '' && goal.groupId !== groupId) console.debug(`useV1GoalStore (addToGroup): Goal ${id} already belongs to a group`);
    else if (!group) console.debug(`useV1GoalStore (addToGroup): No goal group found with id ${groupId}`);
    else if (group.goals.has(id)) console.debug(`useV1GoalStore (addToGroup): Goal ${id} already belongs to goal group ${groupId}`);
    else {
      set((state) => {
        state.goals.get(id)!.groupId = groupId;
        state.groups.get(groupId)!.goals.add(id);
      });
      checkValidRepeatDate({ goal, date: get().selectedDateData.date }) && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  removeFromGroup: (params) => {
    const id = params.id;
    const goal = get().goals.get(id)!;
    if (!goal) console.debug(`useV1GoalStore (removeFromGroup): No goal found with id ${id}`);
    else if (!goal.groupId) console.debug(`useV1GoalStore (removeFromGroup): Goal ${id} does not have a group id?`);
    const group = get().groups.get(goal.groupId!);
    if (!group) console.debug(`useV1GoalStore (removeFromGroup): No goal group found with id ${goal.groupId}`);
    else if (!group.goals.has(id)) console.debug(`useV1GoalStore (removeFromGroup): Goal group ${group.id} does not have goal ${id}???`);
    else {
      set((state) => {
        state.goals.get(id)!.groupId = '';
        state.groups.get(group.id)!.goals.delete(id);
      });
      checkValidRepeatDate({ goal, date: get().selectedDateData.date }) && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  //adds goal and repeats to dateCache
  addToDateCache: (params) => {
    const dateCache = get().dateCache;
    const id = params.id;
    const goal = get().goals.get(id);
    if (!goal) console.debug(`useV1GoalStore (addToDateCache): No goal found with id ${id}`);
    else {
      // const dateCacheGoal = convertGoalToDateCacheGoal({ goal, date:  });
      const range = goal.repeat ? params.range ?? 25 : 1;
      createValidRepeatDates({ goal, range }).forEach((date) => {
        const formattedDate = standardFormat(date);
        const goalsForDate = dateCache.get(formattedDate);
        const cachedGoal: CachedGoal = convertGoalToDateCacheGoal({ goal, date: date });
        if (goalsForDate) {
          set((state) => {
            state.dateCache.get(formattedDate)!.set(id, cachedGoal);
          });
        } else {
          const newGoalsForDate = new Map([[id, cachedGoal]]);
          set((state) => {
            state.dateCache.set(formattedDate, newGoalsForDate);
          });
        }
        if (!goal.completion.completed.has(formattedDate)) {
          const incomplete = new Set(goal.completion.incomplete);
          incomplete.add(formattedDate);
          set((state) => {
            state.goals.set(id, { ...goal, completion: { ...goal.completion, incomplete } });
          });
        }
      });
    }
  },
  removeFromDateCache: (params) => {
    const dateCache = get().dateCache;
    const id = params.id;
    const goal = get().goals.get(id);
    if (!goal) console.debug(`useV1GoalStore (removeFromDateCache): No goal found with id ${id}`);
    else {
      dateCache.forEach((goalsForDate) => {
        goalsForDate.delete(id);
      });
    }
  },
  clearStore: () => {
    set(() => ({ ...initialState }));
  },
});

export default createGoalSlice;
