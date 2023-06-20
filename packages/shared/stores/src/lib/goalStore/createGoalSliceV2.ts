import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { cloneDeep, isEqual } from 'lodash';
import * as dayjs from 'dayjs';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { DateParam, Goal, GoalGroup, TimeFormat } from '@shared/types';
import { TODAY_DATE, TODAY_DATE_FORMATTED, convertMapToArray, standardDate, standardFormat, utcFormat } from '@shared/utils';
import {
  generateGoalId,
  generateGroupId,
  checkValidRepeatDate,
  createValidRepeatDates,
  convertGoalToDateCacheGoal,
  EMPTY_GOAL,
} from '@shared/helpers';

dayjs.extend(isSameOrAfter);

export type CachedGoal = Omit<Goal, 'repeat' | 'status' | 'groupId' | 'location' | 'commute' | 'break'> & {
  status: 'completed' | 'incomplete' | 'skipped';
};

export type GoalRecord = Record<string, Goal>;
export type CachedGoalRecord = Record<string, Record<string, CachedGoal>>;
export type GroupRecord = Record<string, GoalGroup>;

export interface BaseGoalState {
  goals: GoalRecord;
  dateCache: CachedGoalRecord;
  groups: GroupRecord;
  selectedDateData: {
    date: string;
    goals: CachedGoal[];
    groups: GoalGroup[];
  };
}

export interface BaseGoalActions {
  runTasks: () => void;
  getDateData: (params: { date: DateParam; timeFormat?: TimeFormat; createGoalsForSelectedDate?: boolean }) => {
    goals: CachedGoal[];
    groups: GoalGroup[];
  };
  createGoalsForSelectedDate: (params: { date: DateParam; timeFormat?: TimeFormat; skipChecks?: boolean }) => Record<string, CachedGoal> | null;
  setSelectedDateData: (params: { date: DateParam; timeFormat?: TimeFormat; checkIsSameSelectedDate?: boolean }) => void;
  getGoal: (params: { id: string }) => Goal | undefined;
  addGoal: (params: { goal: Omit<Goal, 'id' | 'status'>; timeFormat?: TimeFormat }) => void;
  updateGoal: (params: { goal: Pick<Goal, 'id'> & Partial<Goal>; timeFormat?: TimeFormat }) => void;
  updateGoalStatus: (params: { id: string; status: 'completed' | 'incomplete' | 'skipped'; statusDate: DateParam; timeFormat?: TimeFormat }) => void;
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
  goals: {},
  dateCache: {},
  groups: {},
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
    //Update selectedDateData
    get().setSelectedDateData({ date: TODAY_DATE_FORMATTED });
    //Prune and update dateCache
  },
  getDateData: (params) => {
    const _stateGoals = get().goals;
    const _stateGroups = get().groups;
    const { date, timeFormat, createGoalsForSelectedDate } = params;
    const utcFormattedDate = timeFormat === 'utc' ? standardFormat(date) : utcFormat(date);
    let goals = Object.values(get().dateCache[utcFormattedDate] ?? {});
    if (!goals || goals.length < 1) {
      if (createGoalsForSelectedDate) {
        const newGoalsForDate = get().createGoalsForSelectedDate({ date: utcFormattedDate, timeFormat: 'utc' });
        if (newGoalsForDate) goals = Object.values(newGoalsForDate);
      } else console.debug(`useNewGoalStore (getDateData): No goals found for ${standardFormat(date)}`);
    }
    if (goals && goals.length > 0) {
      const groupIds = new Set<string>();
      goals.forEach((_m) => {
        const groupId = _stateGoals[_m.id]?.groupId;
        groupId && groupId !== '' && groupIds.add(groupId);
      });
      const groups: GoalGroup[] = Array.from(groupIds).map((_id) => _stateGroups[_id]);
      const sortedGroups = groups.sort((a, b) => {
        if (a.title.toUpperCase() < b.title.toUpperCase()) return -1;
        return 1;
      });
      const sortedGoals = goals.sort((a, b) => {
        if (a.title.toUpperCase() < b.title.toUpperCase()) return -1;
        return 1;
      });
      const result = { goals: sortedGoals, groups: sortedGroups };
      return result;
    }
    return { goals: [], groups: [] };
  },
  createGoalsForSelectedDate: (params) => {
    const { date, timeFormat, skipChecks } = params;
    const utcFormattedDate = timeFormat === 'utc' ? standardFormat(date) : utcFormat(date);
    const utcDate = dayjs(utcFormattedDate);
    console.debug(
      `useNewGoalStore (createGoalsForSelectedDate): Trying to create goals for ${utcFormattedDate} with params: ${JSON.stringify(params)}`
    );
    if (!skipChecks) {
      const goalsForDate = get().dateCache[utcFormattedDate];
      if (Object.keys(goalsForDate ?? {}).length > 0) return null;
    }
    let newGoalsForDate: Record<string, CachedGoal> = {};
    Object.values(get().goals).forEach((goal) => {
      if (utcDate.isSameOrAfter(standardDate(goal.date)) && checkValidRepeatDate({ goal, date: utcDate })) {
        newGoalsForDate[goal.id] = convertGoalToDateCacheGoal({ goal, date: utcDate });
      }
    });
    if (Object.keys(newGoalsForDate).length > 0) {
      set((state) => {
        state.dateCache[utcFormattedDate] = newGoalsForDate;
      });
      return newGoalsForDate;
    } else return null;
  },
  setSelectedDateData: (params) => {
    const { date, timeFormat, checkIsSameSelectedDate } = params;
    const utcFormattedDate = timeFormat === 'utc' ? standardFormat(date) : utcFormat(date);
    if ((checkIsSameSelectedDate && utcFormattedDate !== get().selectedDateData.date) || !checkIsSameSelectedDate) {
      const { goals, groups } = get().getDateData({ date, createGoalsForSelectedDate: true });
      set((state) => {
        state.selectedDateData = { date: utcFormattedDate, goals, groups };
      });
    } else console.debug(`useNewGoalStore (setSelectedDateData): Cannot change date because ${standardFormat(date)} is already the selected date`);
  },
  getGoal: (params) => {
    const id = params.id;
    const goal = get().goals[id];
    if (!goal) {
      console.debug(`useNewGoalStore (getGoal): No goal found with id ${id}`);
      return undefined;
    } else return goal;
  },
  addGoal: (params) => {
    const { goal, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? goal.date : utcFormat(goal.date);
    const id = generateGoalId(goal.title, goal.date);
    const newGoal: Goal = { ...goal, id, status: { completed: new Set(), incomplete: new Set([utcFormattedDate]), skipped: new Set() } };
    set((state) => {
      state.goals[id] = newGoal;
    });
    get().addToDateCache({ id });
    newGoal.groupId && get().addToGroup({ id, groupId: newGoal.groupId });
    utcFormattedDate === get().selectedDateData.date && get().setSelectedDateData({ date: utcFormattedDate });
  },
  updateGoal: (params) => {
    const { goal, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? goal.date : utcFormat(goal.date);
    const id = goal.id;
    const originalGoal = get().goals[id];
    if (!originalGoal) console.debug(`useNewGoalStore (updateGoal): No goal found with id ${id}`);
    else {
      set((state) => {
        state.goals[id] = { ...originalGoal, ...goal };
      });
      if ((goal.date && !isEqual(goal.date, originalGoal.date)) || (goal.repeat && !isEqual(goal.repeat, originalGoal.repeat))) {
        get().removeFromDateCache({ id });
        get().addToDateCache({ id });
      } else {
        set((state) => {
          const converted = convertGoalToDateCacheGoal({ goal: originalGoal, date: utcFormattedDate });
          Object.values(state.dateCache).forEach((goalsForDate) => {
            Object.values(goalsForDate).forEach((_g) => {
              if (_g.id === id) goalsForDate[id] = { ..._g, ...converted };
            });
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
  updateGoalStatus: (params) => {
    const { id, status, statusDate, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? standardFormat(statusDate) : utcFormat(statusDate);
    set((state) => {
      const goal = state.goals[id];
      const goalsForDate = state.dateCache[utcFormattedDate];
      if (!goal) console.debug(`useNewGoalStore (updateGoalComplete): No goal found with id ${id}`);
      else if (!goalsForDate) console.debug(`useNewGoalStore (updateGoalComplete): No goals found for ${utcFormattedDate}`);
      else {
        goalsForDate[id] = { ...goalsForDate[id], status };
        if (status === 'completed') {
          goal.status.completed.add(utcFormattedDate);
          goal.status.incomplete.delete(utcFormattedDate);
          goal.status.skipped.delete(utcFormattedDate);
        } else if (status === 'skipped') {
          goal.status.skipped.add(utcFormattedDate);
          goal.status.completed.delete(utcFormattedDate);
          goal.status.incomplete.delete(utcFormattedDate);
        } else {
          goal.status.incomplete.add(utcFormattedDate);
          goal.status.completed.delete(utcFormattedDate);
          goal.status.skipped.delete(utcFormattedDate);
        }
      }
    });
    if (utcFormattedDate === get().selectedDateData.date) {
      get().setSelectedDateData({ date: utcFormattedDate });
    }
  },
  deleteGoal: (params) => {
    const id = params.id;
    const goal = get().goals[id];
    if (!goal) console.debug(`useNewGoalStore (deleteGoal): No goal found with id ${id}`);
    else {
      set((state) => {
        state.groups[goal.groupId ?? '']?.goals.delete(id);
        Object.values(state.dateCache).forEach((goalsForDate) => {
          delete goalsForDate[id];
        });
        delete state.goals[id];
        console.log(`useNewGoalStore (deleteGoal): deleted goal ${id} with title: ${goal.title}`);
      });
      if (get().selectedDateData.date === goal.date) {
        get().setSelectedDateData({ date: goal.date });
      }
    }
  },
  getGroup: (params) => {
    const id = params.id;
    const group = get().groups[id];
    if (!group) {
      console.debug(`useNewGoalStore (getGroup): No goal group found with id ${id}`);
      return undefined;
    }
    return group;
  },
  getGoalsNotInGroup: () => {
    const goalsNotInGroup: Goal[] = [];
    Object.values(get().goals ?? {}).forEach((goal) => {
      goal.groupId === '' && goalsNotInGroup.push(goal);
    });
    return goalsNotInGroup;
  },
  getGoalsInGroup: (params) => {
    const id = params.id;
    const goalsInGroup: Goal[] = [];
    const group = get().groups[id];
    if (!group) console.debug(`useNewGoalStore (getGoalsInGroup): No goal group found with id ${id}`);
    else {
      group.goals.forEach((id) => {
        const goal = get().goals[id];
        if (goal) goalsInGroup.push(goal);
      });
    }
    return goalsInGroup;
  },
  addGroup: (params) => {
    const { group } = params;
    const id = generateGroupId(group.title);
    const newGroup = { ...group, id };
    set((state) => {
      state.groups[id] = newGroup;
    });
  },
  updateGroup: (params) => {
    const group = params.group;
    const id = group.id;
    const originalGroup = get().groups[id];
    if (!originalGroup) console.debug(`useNewGoalStore (updateGroup): No goal group found with id ${id}`);
    else {
      set((state) => {
        state.groups[id] = { ...originalGroup, ...group };
      });
      let shouldUpdateSelectedDateDataFlag = false;
      get().selectedDateData.goals.forEach((_m) => get().goals[_m.id].groupId === id && (shouldUpdateSelectedDateDataFlag = true));
      shouldUpdateSelectedDateDataFlag && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  deleteGroup: (params) => {
    const id = params.id;
    const group = get().groups[id];
    if (!group) console.debug(`useNewGoalStore (deleteGroup): No goal group found with id ${id}`);
    else {
      set((state) => {
        group.goals.forEach((id) => (state.goals[id].groupId = ''));
        delete state.groups[id];
      });
      let shouldUpdateSelectedDateDataFlag = false;
      get().selectedDateData.goals.forEach((_m) => get().goals[_m.id].groupId === id && (shouldUpdateSelectedDateDataFlag = true));
      shouldUpdateSelectedDateDataFlag && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  addToGroup: (params) => {
    const { id, groupId } = params;
    const goal = get().goals[id];
    const group = get().groups[groupId];
    if (!goal) console.debug(`useNewGoalStore (addToGroup): No goal found with id ${id}`);
    else if (goal.groupId !== '' && goal.groupId !== groupId) console.debug(`useNewGoalStore (addToGroup): Goal ${id} already belongs to a group`);
    else if (!group) console.debug(`useNewGoalStore (addToGroup): No goal group found with id ${groupId}`);
    else if (group.goals.has(id)) console.debug(`useNewGoalStore (addToGroup): Goal ${id} already belongs to goal group ${groupId}`);
    else {
      set((state) => {
        state.goals[id].groupId = groupId;
        state.groups[groupId].goals.add(id);
      });
      checkValidRepeatDate({ goal, date: get().selectedDateData.date }) && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  removeFromGroup: (params) => {
    const id = params.id;
    const goal = get().goals[id]!;
    if (!goal) console.debug(`useNewGoalStore (removeFromGroup): No goal found with id ${id}`);
    else if (!goal.groupId) console.debug(`useNewGoalStore (removeFromGroup): Goal ${id} does not have a group id?`);
    const group = get().groups[goal.groupId ?? ''];
    if (!group) console.debug(`useNewGoalStore (removeFromGroup): No goal group found with id ${goal.groupId}`);
    else if (!group.goals.has(id)) console.debug(`useNewGoalStore (removeFromGroup): Goal group ${group.id} does not have goal ${id}???`);
    else {
      set((state) => {
        state.goals[id].groupId = '';
        state.groups[group.id].goals.delete(id);
      });
      checkValidRepeatDate({ goal, date: get().selectedDateData.date }) && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  //adds goal and repeats to dateCache
  addToDateCache: (params) => {
    console.debug('useNewGoalStore (addToDateCache): Adding to date cache...');
    const dateCache = get().dateCache;
    const id = params.id;
    const goal = get().goals[id];
    if (!goal) console.debug(`useNewGoalStore (addToDateCache): No goal found with id ${id}`);
    else {
      const diff = dayjs(Object.keys(get().dateCache).at(-1) ?? TODAY_DATE).diff(TODAY_DATE, 'day');
      const range = goal.repeat ? (params.range ?? diff > 25 ? diff : 25) : 1;
      createValidRepeatDates({ goal, range }).forEach((date) => {
        const formattedDate = standardFormat(date);
        const goalsForDate = dateCache[formattedDate];
        const cachedGoal: CachedGoal = convertGoalToDateCacheGoal({ goal, date: date });
        if (goalsForDate) {
          set((state) => {
            state.dateCache[formattedDate][id] = cachedGoal;
          });
        } else {
          const newGoalsForDate = { [id]: cachedGoal };
          set((state) => {
            state.dateCache[formattedDate] = newGoalsForDate;
          });
        }
      });
    }
  },
  removeFromDateCache: (params) => {
    const dateCache = Object.values(get().dateCache ?? {});
    const id = params.id;
    const goal = get().goals[id];
    if (!goal) console.debug(`useNewGoalStore (removeFromDateCache): No goal found with id ${id}`);
    else {
      dateCache.forEach((goalsForDate) => {
        delete goalsForDate[id];
      });
    }
  },
  clearStore: () => {
    set(() => ({ ...initialState }));
  },
});

export default createGoalSlice;
