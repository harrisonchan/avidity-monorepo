import { BaseGoalActions, BaseGoalState } from '@shared/types';
import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { TODAY_DATE_FORMATTED, standardFormat, utcFormat } from '@shared/utils';

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
    // console.debug(`useNewGoalStore (runTasks): Updating selectedDateData`)
    // get().setSelectedDateData({ date: dayjsUtils.TODAY_DATE.add(0, 'day') })
    // const { goals, goalGroups } = get().getDateData({ date: dayjsUtils.TODAY_DATE_FORMATTED })
    // set((state) => {
    //   console.log('biatch')
    //   state.selectedDateData = {
    //     date: dayjsUtils.standardFormat(dayjsUtils.TODAY_DATE.add(1, 'day')),
    //     goals,
    //     goalGroups,
    //   }
    // })
    //Prune and update dateCache
  },
  getDateData: (params) => {
    const { date, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? standardFormat({ date }) : utcFormat({ date });
    const goals = get().dateCache.get(utcFormattedDate);
    if (goals) {
      const goalGroupIds = new Set<string>();
      goals.forEach((_m) => {
        const goalGroupId = get().goals.get(_m.id)?.goalGroupId!;
        goalGroupId !== '' && goalGroupIds.add(goalGroupId);
      });
      const goalGroups: NewGoalGroupType[] = Array.from(goalGroupIds).map((_id) => get().goalGroups.get(_id)!);
      const sortedGoalGroups = goalGroups.sort((a, b) => {
        if (a.title.toUpperCase() < b.title.toUpperCase()) return -1;
        return 1;
      });
      const sortedGoals = convertMapToArray(goals).sort((a, b) => {
        if (a.title.toUpperCase() < b.title.toUpperCase()) return -1;
        return 1;
      });
      const result = { goals: sortedGoals, goalGroups: sortedGoalGroups };
      return result;
    }
    console.debug(`useNewGoalStore (getDateData): No goals found for ${dayjsUtils.standardFormat(date)}`);
    return { goals: [], goalGroups: [] };
  },
  setSelectedDateData: (params) => {
    const { date, timeFormat, checkIsSameSelectedDate } = params;
    const utcFormattedDate = timeFormat === 'utc' ? standardFormat({ date }) : utcFormat({ date });
    if ((checkIsSameSelectedDate && utcFormattedDate !== get().selectedDateData.date) || !checkIsSameSelectedDate) {
      const { goals, goalGroups } = get().getDateData({ date });
      set((state) => {
        state.selectedDateData = {
          date: utcFormattedDate,
          goals,
          goalGroups,
        };
      });
    } else
      console.debug(
        `useNewGoalStore (setSelectedDateData): Cannot change date because ${dayjsUtils.standardFormat(date)} is already the selected date`
      );
  },
  getGoal: (params) => {
    const id = params.id;
    const goal = get().goals.get(id);
    if (!goal) {
      console.debug(`useNewGoalStore (getGoal): No goal found with id ${id}`);
      return undefined;
    } else return goal;
  },
  addGoal: (params) => {
    const { goal, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? goal.date : dayjsUtils.utcFormat(goal.date);
    const id = goalHelpers.generateGoalId(goal.title, goal.date);
    const newGoal = { ...goal, id };
    set((state) => {
      state.goals.set(id, newGoal);
    });
    get().addGoalToDateCache({ id });
    newGoal.goalGroupId !== '' && get().addGoalToGroup({ goalId: id, goalGroupId: newGoal.goalGroupId });
    utcFormattedDate === get().selectedDateData.date && get().setSelectedDateData({ date: utcFormattedDate });
  },
  updateGoal: (params) => {
    const { goal, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? goal.date : dayjsUtils.utcFormat(goal.date);
    const id = goal.id;
    const originalGoal = get().goals.get(id);
    if (!originalGoal) console.debug(`useNewGoalStore (updateGoal): No goal found with id ${id}`);
    else {
      set((state) => {
        state.goals.set(id, { ...originalGoal, ...goal });
      });
      if ((goal.date && !isEqual(goal.date, originalGoal.date)) || (goal.repeat && !isEqual(goal.repeat, originalGoal.repeat))) {
        get().removeGoalFromDateCache({ id });
        get().addGoalToDateCache({ id });
      } else {
        set((state) => {
          state.dateCache.forEach((goalsForDate) => {
            goalsForDate.forEach((_m) => _m.id === id && goalsForDate.set(id, { ..._m, ...goal }));
          });
        });
      }
      //addGoalToGroup already tries to update selectedDateData FYI
      if (goal.goalGroupId && !isEqual(goal.goalGroupId, originalGoal.goalGroupId)) {
        get().removeGoalFromGroup({ goalId: id, goalGroupId: originalGoal.goalGroupId });
        get().addGoalToGroup({ goalId: id, goalGroupId: goal.goalGroupId });
      } else if (utcFormattedDate === get().selectedDateData.date) {
        get().setSelectedDateData({ date: utcFormattedDate });
      }
    }
  },
  updateGoalComplete: (params) => {
    const { id, isComplete, isCompleteDate, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? dayjsUtils.standardFormat(isCompleteDate) : dayjsUtils.utcFormat(isCompleteDate);
    set((state) => {
      const goal = state.goals.get(id);
      if (!goal) console.debug(`useNewGoalStore (updateGoalComplete): No goal found with id ${id}`);
      else {
        const goalsForDate = state.dateCache.get(utcFormattedDate);
        if (!goalsForDate) console.debug(`useNewGoalStore (updateGoalComplete): No goals found for ${utcFormattedDate}`);
        else {
          goalsForDate.set(id, { ...goalsForDate.get(id)!, isComplete });
          if (isComplete) {
            goal.completion.complete.add(utcFormattedDate);
            goal.completion.incomplete.delete(utcFormattedDate);
          } else {
            goal.completion.complete.delete(utcFormattedDate);
            goal.completion.incomplete.add(utcFormattedDate);
          }
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
    if (!goal) console.debug(`useNewGoalStore (deleteGoal): No goal found with id ${id}`);
    else {
      set((state) => {
        state.goalGroups.get(goal.goalGroupId)?.goals.delete(id);
        state.dateCache.forEach((goalsForDate) => {
          goalsForDate.delete(id);
        });
        state.goals.delete(id);
        console.log(`useNewGoalStore (deleteGoal): deleted goal ${id} with title: ${goal.title}}`);
      });
      if (get().selectedDateData.date === goal.date) {
        get().setSelectedDateData({ date: goal.date });
      }
    }
  },
  getGoalGroup: (params) => {
    const id = params.id;
    const goalGroup = get().goalGroups.get(id);
    if (!goalGroup) {
      console.debug(`useNewGoalStore (getGoalGroup): No goal group found with id ${id}`);
      return undefined;
    }
    return goalGroup;
  },
  getAllGoalsNotInGroup: () => {
    const goalsNotInGroup: NewGoalType[] = [];
    get().goals.forEach((goal) => {
      goal.goalGroupId === '' && goalsNotInGroup.push(goal);
    });
    return goalsNotInGroup;
  },
  getGoalsInGroup: (params) => {
    const id = params.id;
    const goalsInGroup: NewGoalType[] = [];
    const goalGroup = get().goalGroups.get(id);
    if (!goalGroup) console.debug(`useNewGoalStore (getGoalsInGroup): No goal group found with id ${id}`);
    else {
      goalGroup.goals.forEach((goalId) => {
        const goal = get().goals.get(goalId);
        if (goal) goalsInGroup.push(goal);
      });
    }
    return goalsInGroup;
  },
  addGoalGroup: (params) => {
    const { goalGroup } = params;
    const id = goalHelpers.generateGoalGroupId(goalGroup.title);
    const newGoalGroup = { ...goalGroup, id };
    set((state) => {
      state.goalGroups.set(id, newGoalGroup);
    });
  },
  updateGoalGroup: (params) => {
    const goalGroup = params.goalGroup;
    const id = goalGroup.id;
    const originalGoalGroup = get().goalGroups.get(id);
    if (!originalGoalGroup) console.debug(`useNewGoalStore (updateGoalGroup): No goal group found with id ${id}`);
    else {
      set((state) => {
        state.goalGroups.set(id, { ...originalGoalGroup, ...goalGroup });
      });
      let shouldUpdateSelectedDateDataFlag = false;
      get().selectedDateData.goals.forEach((_m) => get().goals.get(_m.id)!.goalGroupId === id && (shouldUpdateSelectedDateDataFlag = true));
      shouldUpdateSelectedDateDataFlag && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  deleteGoalGroup: (params) => {
    const id = params.id;
    const goalGroup = get().goalGroups.get(id);
    if (!goalGroup) console.debug(`useNewGoalStore (deleteGoalGroup): No goal group found with id ${id}`);
    else {
      set((state) => {
        goalGroup.goals.forEach((goalId) => (state.goals.get(goalId)!.goalGroupId = ''));
        state.goalGroups.delete(id);
      });
      let shouldUpdateSelectedDateDataFlag = false;
      get().selectedDateData.goals.forEach((_m) => get().goals.get(_m.id)!.goalGroupId === id && (shouldUpdateSelectedDateDataFlag = true));
      shouldUpdateSelectedDateDataFlag && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  addGoalToGroup: (params) => {
    const { goalId, goalGroupId } = params;
    const goal = get().goals.get(goalId);
    const goalGroup = get().goalGroups.get(goalGroupId);
    if (!goal) console.debug(`useNewGoalStore (addGoalToGroup): No goal found with id ${goalId}`);
    else if (goal.goalGroupId !== '' && goal.goalGroupId !== goalGroupId)
      console.debug(`useNewGoalStore (addGoalToGroup): Goal ${goalId} already belongs to a group`);
    else if (!goalGroup) console.debug(`useNewGoalStore (addGoalToGroup): No goal group found with id ${goalGroupId}`);
    else if (goalGroup.goals.has(goalId))
      console.debug(`useNewGoalStore (addGoalToGroup): Goal ${goalId} already belongs to goal group ${goalGroupId}`);
    else {
      set((state) => {
        state.goals.get(goalId)!.goalGroupId = goalGroupId;
        state.goalGroups.get(goalGroupId)!.goals.add(goalId);
      });
      shouldShowGoalForDate({ goal, date: get().selectedDateData.date }) && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  removeGoalFromGroup: (params) => {
    const { goalId, goalGroupId } = params;
    const goal = get().goals.get(goalId);
    const goalGroup = get().goalGroups.get(goalGroupId);
    if (!goal) console.debug(`useNewGoalStore (removeGoalFromGroup): No goal found with id ${goalId}`);
    else if (goal.goalGroupId !== goalGroupId)
      console.debug(`useNewGoalStore (removeGoalFromGroup): Goal ${goalId} does not belong to goal group ${goalGroupId}`);
    else if (!goalGroup) console.debug(`useNewGoalStore (removeGoalFromGroup): No goal group found with id ${goalGroupId}`);
    else if (!goalGroup.goals.has(goalId))
      console.debug(`useNewGoalStore (removeGoalFromGroup): Goal group ${goalGroupId} does not have goal ${goalId}???`);
    else {
      set((state) => {
        state.goals.get(goalId)!.goalGroupId = '';
        state.goalGroups.get(goalGroupId)!.goals.delete(goalId);
      });
      shouldShowGoalForDate({ goal, date: get().selectedDateData.date }) && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  //adds goal and repeats to dateCache
  addGoalToDateCache: (params) => {
    const dateCache = get().dateCache;
    const id = params.id;
    const goal = get().goals.get(id);
    if (!goal) console.debug(`useNewGoalStore (addGoalToDateCache): No goal found with id ${id}`);
    else {
      const dateCacheGoal = convertGoalToDateCacheGoal({ goal });
      const range = goal.repeat ? params.range ?? 25 : 1;
      //functional programming not happy
      for (let i = 0; i < range; i++) {
        const date = dayjsUtils.standardDate(goal.date).add(i, 'day');
        const formattedDate = dayjsUtils.standardFormat(date);
        if (shouldShowGoalForDate({ goal, date })) {
          const goalsForDate = dateCache.get(formattedDate);
          if (goalsForDate) {
            set((state) => {
              state.dateCache.get(formattedDate)!.set(id, dateCacheGoal);
            });
          } else {
            const newGoalsForDate = new Map([[id, dateCacheGoal]]);
            set((state) => {
              state.dateCache.set(formattedDate, newGoalsForDate);
            });
          }
          if (!goal.completion.complete.has(formattedDate)) {
            const incomplete = new Set(goal.completion.incomplete);
            incomplete.add(formattedDate);
            set((state) => {
              state.goals.set(id, { ...goal, completion: { ...goal.completion, incomplete } });
            });
          }
        }
      }
    }
  },
  removeGoalFromDateCache: (params) => {
    const dateCache = get().dateCache;
    const id = params.id;
    const goal = get().goals.get(id);
    if (!goal) console.debug(`useNewGoalStore (removeGoalFromDateCache): No goal found with id ${id}`);
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
