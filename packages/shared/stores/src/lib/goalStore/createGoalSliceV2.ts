import { StateCreator } from 'zustand';
import { isEqual } from 'lodash';
import * as dayjs from 'dayjs';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { DateParam, Goal, GoalGroup, TimeFormat } from '@shared/types';
import {
  TODAY_DATE_FORMATTED,
  TODAY_DATE_UTC,
  TODAY_DATE_UTC_FORMATTED,
  getLocalDate,
  getLocalFormat,
  getStandardFormat,
  getUtcFormat,
} from '@shared/utils';
import {
  generateGoalId,
  generateGroupId,
  checkValidRepeatDate,
  createValidRepeatDates,
  convertGoalToDateCacheGoal,
  EMPTY_GOAL_STATUS,
  getStreaks,
  useGoalRestCheck,
} from '@shared/helpers';

dayjs.extend(isSameOrAfter);

const DEFAULT_DATE_CACHE_RANGE = 61;

export type CachedGoalStatus = 'completed' | 'incomplete' | 'skipped';
export type CachedGoal = Omit<Goal, 'repeat' | 'status' | 'groupId' | 'location' | 'commute' | 'rest'> & {
  status: CachedGoalStatus;
};

export type GoalRecord = Record<string, Goal>;
export type CachedGoalRecord = Record<string, Record<string, CachedGoal>>;
export type GroupRecord = Record<string, GoalGroup>;

export interface BaseGoalState {
  goals: GoalRecord;
  dateCache: CachedGoalRecord;
  groups: GroupRecord;
  selectedDateData: {
    date: string; //local date
    goals: CachedGoal[];
    groups: GoalGroup[];
  };
}

export type DateCachePruneOption = { enable: boolean; cutoff?: number | DateParam };

export interface BaseGoalActions {
  runDailyTasks: (params?: { dateCachePruneOptions: { pastDates?: DateCachePruneOption; futureDates?: DateCachePruneOption } }) => void;
  getDateData(params: { date: DateParam; timeFormat?: TimeFormat; fillGoalsForSelectedDate?: boolean }): { goals: CachedGoal[]; groups: GoalGroup[] };
  fillGoalsForSelectedDate: (params: { date: DateParam; timeFormat?: TimeFormat; skipChecks?: boolean }) => Record<string, CachedGoal> | null;
  setSelectedDateData: (params: { date: DateParam; timeFormat?: TimeFormat; checkIsSameSelectedDate?: boolean }) => void;
  getGoal: (params: { id: string }) => Goal | undefined;
  addGoal: (params: { goal: Omit<Goal, 'id' | 'status'>; timeFormat?: TimeFormat }) => void;
  updateGoal: (params: { goal: Pick<Goal, 'id'> & Partial<Goal>; timeFormat?: TimeFormat }) => void;
  updateGoalStatus: (params: { id: string; status: 'completed' | 'incomplete' | 'skipped'; statusDate: DateParam; timeFormat?: TimeFormat }) => void;
  deleteGoal: (params: { id: string }) => void;
  getGroup: (params: { id: string }) => GoalGroup | undefined;
  getGoalsNotInGroup: (params: { id: string }) => Goal[] | null;
  getGoalsInGroup: (params: { id: string }) => Goal[] | null;
  getGroupGoalsData: (params: { id: string; timeFormat?: TimeFormat }) => { goalsInGroup: Goal[]; goalsNotInGroup: Goal[] };
  addGroup: (params: { group: Omit<GoalGroup, 'id'> }) => void;
  updateGroup: (params: { group: Pick<GoalGroup, 'id'> & Partial<GoalGroup> }) => void;
  deleteGroup: (params: { id: string }) => void;
  addToGroup: (params: { id: string; groupId: string }) => void;
  removeFromGroup: (params: { id: string }) => void;
  addToDateCache: (params: { id: string; range?: number; fillGoalsForNewDates?: boolean }) => void;
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
  //TODO: update runDailyTasks()
  runDailyTasks: (params) => {
    console.log;
    set((state) => {
      //Update selectedDateData to today
      state.setSelectedDateData({ date: TODAY_DATE_UTC_FORMATTED });
      //Before pruning and updating dateCache, we need to mark all goals before today that don't have status as "incomplete"
      const goals = state.goals;
      const dateCache = state.dateCache;
      const todayIdx = Object.keys(dateCache).indexOf(TODAY_DATE_UTC_FORMATTED);
      Object.entries(dateCache)
        .slice(0, todayIdx)
        .forEach(([formattedDate, cachedGoalsForDate]) => {
          Object.values(cachedGoalsForDate).forEach((cachedGoal) => {
            goals[cachedGoal.id].status.incomplete.add(formattedDate);
          });
        });
      //Prune and update dateCache
      const dateCachePruneOptions = params?.dateCachePruneOptions;
      if (dateCachePruneOptions) {
        const { pastDates, futureDates } = dateCachePruneOptions;
        if (pastDates?.enable) {
          console.debug('useGoalStore (runDailyTasks): Pruning past dates from dateCache...');
          const cutoff = pastDates?.cutoff
            ? typeof pastDates.cutoff === 'number'
              ? TODAY_DATE_UTC.subtract(pastDates.cutoff, 'day')
              : dayjs(pastDates.cutoff)
            : TODAY_DATE_UTC.subtract(DEFAULT_DATE_CACHE_RANGE, 'day');
          const _d = dayjs(Object.keys(get().dateCache ?? {}).at(0));
          const diff = Math.abs(cutoff.diff(_d, 'day'));
          let count = 0;
          if (diff > 0) {
            Object.keys(state.dateCache).forEach((formattedDate) => {
              if (dayjs(formattedDate).isBefore(cutoff, 'day')) {
                delete state.dateCache[formattedDate];
                count++;
              }
            });
          }
          console.debug(`useGoalStore (runDailyTasks): Pruned ${count} past dates from dateCache`);
        }
        if (futureDates?.enable) {
          console.debug('useGoalStore (runDailyTasks): Pruning future dates from dateCache...');
          const cutoff = futureDates?.cutoff
            ? typeof futureDates.cutoff === 'number'
              ? TODAY_DATE_UTC.add(futureDates.cutoff, 'day')
              : dayjs(futureDates.cutoff)
            : TODAY_DATE_UTC.add(DEFAULT_DATE_CACHE_RANGE, 'day');
          const _d = dayjs(Object.keys(get().dateCache ?? {}).at(-1));
          const diff = Math.abs(cutoff.diff(_d, 'day'));
          let count = 0;
          if (diff > 0) {
            Object.keys(state.dateCache).forEach((formattedDate) => {
              if (dayjs(formattedDate).isAfter(cutoff, 'day')) {
                delete state.dateCache[formattedDate];
                count++;
              }
            });
          }
          console.debug(`useGoalStore (runDailyTasks): Pruned ${count} future dates from dateCache`);
        }
      }
    });
  },
  getDateData: (params) => {
    const _stateGoals = get().goals;
    const _stateGroups = get().groups;
    const { date, timeFormat, fillGoalsForSelectedDate } = params;
    const utcFormattedDate = timeFormat === 'utc' ? getStandardFormat(date) : getUtcFormat(date);
    let goals = Object.values(get().dateCache[utcFormattedDate] ?? {});
    if (!goals || goals.length < 1) {
      if (fillGoalsForSelectedDate) {
        const newGoalsForDate = get().fillGoalsForSelectedDate({ date: utcFormattedDate, timeFormat: 'utc' });
        if (newGoalsForDate) goals = Object.values(newGoalsForDate);
      } else console.debug(`useGoalStore (getDateData): No goals found for ${getStandardFormat(date)}`);
    }
    if (goals && goals.length > 0) {
      const groupIds = new Set<string>();
      goals.forEach((_m) => {
        const groupId = _stateGoals[_m.id]?.groupId;
        groupId && groupId !== '' && groupIds.add(groupId);
        // if ()
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
  fillGoalsForSelectedDate: (params) => {
    const { date, timeFormat, skipChecks } = params;
    const utcFormattedDate = timeFormat === 'utc' ? getStandardFormat(date) : getUtcFormat(date);
    const utcDate = dayjs(utcFormattedDate);
    console.debug(`useGoalStore (fillGoalsForSelectedDate): Trying to create goals for ${utcFormattedDate} with params: ${JSON.stringify(params)}`);
    if (!skipChecks) {
      const goalsForDate = get().dateCache[utcFormattedDate];
      if (Object.keys(goalsForDate ?? {}).length > 0) return null;
    }
    let newGoalsForDate: Record<string, CachedGoal> = {};
    Object.values(get().goals).forEach((goal) => {
      if (utcDate.isSameOrAfter(dayjs(goal.date).startOf('day')) && checkValidRepeatDate({ goal, date: utcDate })) {
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
    const localDate = timeFormat === 'utc' ? getLocalFormat(date) : getStandardFormat(date);
    if ((checkIsSameSelectedDate && localDate !== get().selectedDateData.date) || !checkIsSameSelectedDate) {
      const { goals, groups } = get().getDateData({ date, fillGoalsForSelectedDate: true });
      set((state) => {
        state.selectedDateData = { date: localDate, goals, groups };
      });
    } else console.debug(`useGoalStore (setSelectedDateData): Cannot change date because ${getStandardFormat(date)} is already the selected date`);
  },
  getGoal: (params) => {
    const id = params.id;
    const goal = get().goals[id];
    if (!goal) {
      console.debug(`useGoalStore (getGoal): No goal found with id ${id}`);
      return undefined;
    } else return goal;
  },
  addGoal: (params) => {
    const { goal, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? goal.date : getUtcFormat(goal.date);
    const id = generateGoalId(goal.title, goal.date);
    const selectedDate = get().selectedDateData.date;
    const incomplete: Set<string> = new Set(
      Array(Math.abs(dayjs(selectedDate).diff(goal.date, 'day')))
        .fill(0)
        .map((_, idx) => getStandardFormat(dayjs(selectedDate).subtract(idx + 1, 'day')))
    );
    incomplete.add(goal.date);
    const newGoal: Goal = { ...goal, id, status: EMPTY_GOAL_STATUS };
    set((state) => {
      state.goals[id] = newGoal;
    });
    get().addToDateCache({ id });
    newGoal.groupId && get().addToGroup({ id, groupId: newGoal.groupId });
    (utcFormattedDate === get().selectedDateData.date || checkValidRepeatDate({ goal: newGoal, date: get().selectedDateData.date })) &&
      get().setSelectedDateData({ date: get().selectedDateData.date });
  },
  // TODO: Figure this out
  // Should we remove completion data if date or repeat changes?
  updateGoal: (params) => {
    const { goal, timeFormat } = params;
    const id = goal.id;
    const originalGoal = get().goals[id];
    if (!originalGoal) console.debug(`useGoalStore (updateGoal): No goal found with id ${id}`);
    else {
      const utcFormattedDate = timeFormat === 'utc' ? goal.date ?? originalGoal.date : getUtcFormat(goal.date ?? getLocalDate(originalGoal.date));
      const newGoal: Goal = { ...originalGoal, ...goal };
      console.debug(`useGoalStore (updateGoal): Updating goal with id ${id} with params: ${JSON.stringify(goal)}`);
      set((state) => {
        state.goals[id] = newGoal;
      });
      if ((goal.date && utcFormattedDate !== originalGoal.date) || (goal.repeat && !isEqual(goal.repeat, originalGoal.repeat))) {
        get().removeFromDateCache({ id });
        get().addToDateCache({ id });
        // Need to update streaks
        const { latest, longest } = getStreaks({ status: newGoal.status, streakOptions: newGoal.streakOptions });
        set((state) => {
          state.goals[id].status.streaks.current = latest;
          state.goals[id].status.streaks.longest = longest;
        });
      } else {
        set((state) => {
          Object.entries(state.dateCache).forEach(([_date, goalsForDate]) => {
            Object.values(goalsForDate).forEach((_g) => {
              if (_g.id === id) goalsForDate[id] = { ..._g, ...convertGoalToDateCacheGoal({ goal: newGoal, date: _date }) };
            });
          });
        });
      }
      //addToGroup already tries to update selectedDateData FYI
      if (goal.groupId && !isEqual(goal.groupId, originalGoal.groupId)) {
        get().removeFromGroup({ id });
        get().addToGroup({ id, groupId: goal.groupId });
      }
      get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  updateGoalStatus: (params) => {
    const { id, status, statusDate, timeFormat } = params;
    const utcFormattedDate = timeFormat === 'utc' ? getStandardFormat(statusDate) : getUtcFormat(statusDate);
    set((state) => {
      const goal = state.goals[id];
      const goalsForDate = state.dateCache[utcFormattedDate];
      if (!goal) console.debug(`useGoalStore (updateGoalComplete): No goal found with id ${id}`);
      else if (!goalsForDate) console.debug(`useGoalStore (updateGoalComplete): No goals found for ${utcFormattedDate}`);
      else {
        goalsForDate[id] = { ...goalsForDate[id], status };
        if (status === 'completed') {
          goal.status.completed.add(utcFormattedDate);
          goal.status.incomplete.delete(utcFormattedDate);
          goal.status.skipped.delete(utcFormattedDate);
          goal.status.rests.delete(utcFormattedDate);
        } else if (status === 'skipped') {
          goal.status.skipped.add(utcFormattedDate);
          goal.status.completed.delete(utcFormattedDate);
          goal.status.incomplete.delete(utcFormattedDate);
          goal.status.rests.delete(utcFormattedDate);
        } else {
          goal.status.incomplete.add(utcFormattedDate);
          goal.status.completed.delete(utcFormattedDate);
          goal.status.skipped.delete(utcFormattedDate);
          goal.status.rests.delete(utcFormattedDate);
        }
        const { passesHolidayCheck, passesRestCheck } = useGoalRestCheck({
          date: statusDate,
          timeFormat: 'utc',
          streakOptions: goal.streakOptions,
        });
        if (passesRestCheck || passesHolidayCheck) {
          goal.status.rests.add(utcFormattedDate);
          goal.status.completed.delete(utcFormattedDate);
          goal.status.skipped.delete(utcFormattedDate);
          goal.status.incomplete.delete(utcFormattedDate);
        }
        const { latest, longest } = getStreaks({ status: goal.status, streakOptions: goal.streakOptions });
        goal.status.streaks.current = latest;
        goal.status.streaks.longest = longest;
      }
    });
    utcFormattedDate === get().selectedDateData.date && get().setSelectedDateData({ date: utcFormattedDate });
  },
  deleteGoal: (params) => {
    const id = params.id;
    const _g = get().goals[id];
    const goal: Goal = { ..._g, repeat: { ..._g.repeat } }; // shallow copy with repeat deeper and deepa and deepa an deepa
    /** I think I am literally going insane. I will definitely be out on the streets soon. How fun. */
    if (!goal) console.debug(`useGoalStore (deleteGoal): No goal found with id ${id}`);
    else {
      set((state) => {
        state.groups[goal.groupId ?? '']?.goals.delete(id);
        Object.values(state.dateCache).forEach((goalsForDate) => {
          delete goalsForDate[id];
        });
        delete state.goals[id];
        console.debug(`useGoalStore (deleteGoal): Deleted goal ${id} with title: ${goal.title}`);
      });
      const selectedDate = get().selectedDateData.date;
      get().setSelectedDateData({ date: selectedDate });
    }
  },
  getGroup: (params) => {
    const id = params.id;
    const group = get().groups[id];
    if (!group) {
      console.debug(`useGoalStore (getGroup): No goal group found with id ${id}`);
      return undefined;
    }
    return group;
  },
  getGoalsNotInGroup: (params) => {
    const id = params.id;
    const group = get().groups[id];
    if (!group) console.debug(`useGoalStore (getGoalsNotInGroup): No goal group found with id ${id}`);
    else return Object.values(get().goals).filter((goal) => !group.goals.has(goal.id) && (goal.groupId === null || goal.groupId === ''));
    return null;
  },
  getGoalsInGroup: (params) => {
    const id = params.id;
    const group = get().groups[id];
    if (!group) console.debug(`useGoalStore (getGoalsInGroup): No goal group found with id ${id}`);
    else {
      return Object.values(get().goals).filter((goal) => group.goals.has(goal.id));
    }
    return null;
  },
  getGroupGoalsData: (params) => {
    const id = params.id;
    const goalsInGroup = get().getGoalsInGroup({ id }) ?? [];
    const goalsNotInGroup = get().getGoalsNotInGroup({ id }) ?? [];
    return { goalsInGroup, goalsNotInGroup };
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
    if (!originalGroup) console.debug(`useGoalStore (updateGroup): No goal group found with id ${id}`);
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
    const _stateGoals = get().goals;
    const id = params.id;
    const group = get().groups[id];
    if (!group) console.debug(`useGoalStore (deleteGroup): No goal group found with id ${id}`);
    else {
      set((state) => {
        group.goals.forEach((id) => (state.goals[id].groupId = null));
        delete state.groups[id];
      });
      let shouldUpdateSelectedDateDataFlag = false;
      get().selectedDateData.goals.forEach((_m) => _stateGoals[_m.id].groupId === id && (shouldUpdateSelectedDateDataFlag = true));
      shouldUpdateSelectedDateDataFlag && get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  addToGroup: (params) => {
    const { id, groupId } = params;
    const goal = get().goals[id];
    const group = get().groups[groupId];
    if (!goal) console.debug(`useGoalStore (addToGroup): No goal found with id ${id}`);
    else if (goal.groupId) {
      if (goal.groupId !== '' && goal.groupId !== groupId) console.debug(`useGoalStore (addToGroup): Goal ${id} already belongs to a group`);
    } else if (!group) console.debug(`useGoalStore (addToGroup): No goal group found with id ${groupId}`);
    else if (group.goals.has(id)) console.debug(`useGoalStore (addToGroup): Goal ${id} already belongs to goal group ${groupId}`);
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
    if (!goal) console.debug(`useGoalStore (removeFromGroup): No goal found with id ${id}`);
    else if (!goal.groupId) console.debug(`useGoalStore (removeFromGroup): Goal ${id} does not have a group id?`);
    const group = get().groups[goal.groupId ?? ''];
    if (!group) console.debug(`useGoalStore (removeFromGroup): No goal group found with id ${goal.groupId}`);
    else if (!group.goals.has(id)) console.debug(`useGoalStore (removeFromGroup): Goal group ${group.id} does not have goal ${id}???`);
    else {
      set((state) => {
        state.goals[id].groupId = '';
        state.groups[group.id].goals.delete(id);
      });
      get().setSelectedDateData({ date: get().selectedDateData.date });
    }
  },
  //adds goal and repeats to dateCache
  addToDateCache: (params) => {
    console.debug('useGoalStore (addToDateCache): Adding to date cache...');
    const dateCache = get().dateCache;
    const id = params.id;
    const goal = get().goals[id];
    if (!goal) console.debug(`useGoalStore (addToDateCache): No goal found with id ${id}`);
    else {
      const diff = dayjs(Object.keys(get().dateCache).at(-1) ?? TODAY_DATE_UTC).diff(goal.date, 'day') + 1;
      const selectedDate = get().selectedDateData.date;
      const range = goal.repeat ? (params.range ?? diff > DEFAULT_DATE_CACHE_RANGE ? diff : DEFAULT_DATE_CACHE_RANGE) : 1;
      let shouldUpdateSelectedDateData = false;
      createValidRepeatDates({ goal, range }).forEach((date) => {
        const formattedDate = getStandardFormat(date);
        const goalsForDate = dateCache[formattedDate];
        if (!goalsForDate) {
          get().fillGoalsForSelectedDate({ date, timeFormat: 'utc', skipChecks: true });
        }
        set((state) => {
          state.dateCache[formattedDate][id] = convertGoalToDateCacheGoal({ goal, date });
        });
        if (getStandardFormat(date) === selectedDate) shouldUpdateSelectedDateData = true;
      });
    }
  },
  removeFromDateCache: (params) => {
    const dateCacheKeys = Object.keys(get().dateCache ?? {});
    const id = params.id;
    const goal = get().goals[id];
    if (!goal) console.debug(`useGoalStore (removeFromDateCache): No goal found with id ${id}`);
    else {
      set((state) => {
        dateCacheKeys.forEach((keys) => {
          delete state.dateCache[keys][id];
        });
      });
    }
  },
  clearStore: () => {
    set(() => ({ ...initialState }));
  },
});

export default createGoalSlice;
