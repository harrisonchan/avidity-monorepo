import { StateCreator } from 'zustand';
import { isEqual } from 'lodash';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as tz from 'dayjs/plugin/timezone';
import { DateParam, Goal, GoalDateTimeEntry, GoalGroup, GoalStatus, TimeFormat } from '@shared/types';
import { getRecurrenceDates, getStandardFormat } from '@shared/utils';
import { generateGoalId, generateGroupId, getGoalRecurrentDates, getStreakData } from '@shared/helpers';

dayjs.extend(utc);
dayjs.extend(tz);

const DEFAULT_DATE_CACHE_RANGE = 63;

export type CachedGoal = Omit<Goal, 'dateTimeData' | 'recurrence' | 'groupId'> & { status: GoalStatus };
// TODO:
// Implement recurrent dates cache for goals
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

export type NewGoal = Omit<Goal, 'id' | 'groupId' | 'dateTimeData'> & {
  dateTimeData: {
    start: GoalDateTimeEntry;
    end: GoalDateTimeEntry;
  };
};
export interface BaseGoalActions {
  updateSelectedDateData: (params: { newDate: { date: DateParam; timeZone?: string } }) => void;
  createDateCache: (params?: { centerDate?: { date: DateParam; timeZone?: string }; range?: number }) => void;
  addToDateCache: (params: { id: string }) => void;
  removeFromDateCache: (params: { id: string }) => void;
  addGoal: (params: { goal: NewGoal }) => void;
  updateGoal: (params: { goal: Pick<Goal, 'id'> & Partial<Goal> }) => void;
  updateGoalStatus: (params: { id: string; status: GoalStatus; date: DateParam }) => void;
  deleteGoal: (params: { id: string }) => void;
  addGroup: (params: { group: Omit<GoalGroup, 'id'> }) => void;
  updateGroup: (params: { group: Pick<GoalGroup, 'id'> & Partial<GoalGroup> }) => void;
  deleteGroup: (params: { id: string }) => void;
  addGoalToGroup: (params: { id: string; groupId: string; shouldUpdateSelectedDateData?: boolean }) => void;
  removeGoalFromGroup: (params: { id: string; shouldUpdateSelectedDateData?: boolean }) => void;
  clearStore: () => void;
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
  //some stupid code here. nice!
  //days since brain shut down: 9999999
  updateSelectedDateData: (params) => {
    const newDate = params.newDate;
    const selectedDateData = get().selectedDateData;
    const selectedDate = selectedDateData.date;
    const newTimeZone = newDate.timeZone ?? dayjs.tz.guess();
    const newSelectedDate = newDate?.date
      ? newDate.timeZone
        ? getStandardFormat(dayjs(newDate.date).tz(newTimeZone))
        : getStandardFormat(dayjs(newDate.date).tz(newTimeZone))
      : selectedDate;
    //create new datecache if needed (selected date over 7 days of starting/end datecache date)
    const sortedDateCache = Object.keys(get().dateCache).sort((a, b) => {
      if (dayjs(a).isBefore(dayjs(b))) {
        return -1;
      } else return 1;
    });
    const start = dayjs(sortedDateCache[0]);
    const end = dayjs(sortedDateCache[sortedDateCache.length - 1]);
    if (start.diff(newSelectedDate, 'day') > -7 || end.diff(newSelectedDate, 'day') < 7) {
      // console.log('SHIT PASSED');
      console.log(getStandardFormat(start));
      console.log(getStandardFormat(end));
      console.log(newSelectedDate);
      console.log(start.diff(newSelectedDate, 'day'));
      console.log(end.diff(newSelectedDate, 'day'));
      get().createDateCache({ centerDate: { date: newSelectedDate, timeZone: newTimeZone } });
    }
    const goals: CachedGoal[] = Object.values(get().dateCache[newSelectedDate]);
    const groups: GoalGroup[] = [];
    goals.forEach((_g) => {
      const groupId = get().goals[_g.id].groupId;
      if (groupId !== '') groups.push(get().groups[groupId]);
    });
    const prevDayGoals: CachedGoal[] = Object.values(get().dateCache[getStandardFormat(dayjs(newSelectedDate).subtract(1, 'day'))]);
    prevDayGoals.forEach((_g) => {
      const goal = get().goals[_g.id];
      const start = dayjs(goal.dateTimeData.start.date).tz(goal.dateTimeData.start.timeZone);
      const end = dayjs(goal.dateTimeData.end.date).tz(goal.dateTimeData.end.timeZone);
      console.log('diff', start.diff(end, 'day'));
      if (start.diff(end, 'day') < 0) {
        goals.unshift(_g);
      }
    });
    const shouldUpdateCurrent =
      selectedDate !== newSelectedDate ||
      (selectedDate === newSelectedDate && (!isEqual(goals, selectedDateData.goals) || !isEqual(groups, selectedDateData.groups)));
    if (shouldUpdateCurrent) {
      set((state) => {
        state.selectedDateData = {
          date: newSelectedDate,
          goals,
          groups,
          timeZone: newDate?.timeZone ?? dayjs.tz.guess(),
        };
      });
    }

    // if (shouldUpdateCurrent || )
    // const shouldUpdateCurrent =
    // const { newDate, dateMetadata } = params;
    // const dateMetadataCheck = dateMetadata && dateMetadata.map((_d) => getStandardFormat(_d)).includes(newSelectedDate)
    // const timeZone = newDate?.timeZone ?? dayjs.tz.guess();
    // const newDateCheck = newDate &&
    // if (dateMetadata) {
    //   const compareDates = dateMetadata.map((_d) => getStandardFormat(_d));
    //   if (compareDates.includes(selectedDate)) {
    //     set((state) => {
    //       state.selectedDateData = { ...state.selectedDateData, goals, groups };
    //     });
    //   }
    // } else if (newDate) {
    //   if (!dayjs(selectedDate).isSame(dayjs(newDate.date), 'day')) {
    //     const goals: CachedGoal[] = Object.values(get().dateCache[selectedDate]);
    //     const groups: GoalGroup[] = [];
    //     const prevDayGoals: CachedGoal[] = Object.values(get().dateCache[getStandardFormat(dayjs(selectedDate).subtract(1, 'day'))]);
    //     prevDayGoals.forEach((_g) => {
    //       const goal = get().goals[_g.id];
    //       const start = dayjs(goal.dateTimeData.start.date).tz(goal.dateTimeData.start.timeZone);
    //       const end = dayjs(goal.dateTimeData.end.date).tz(goal.dateTimeData.end.timeZone);
    //       if (start.diff(end, 'day') > 0) {
    //         goals.unshift(_g);
    //       }
    //     });
    //   }
    // }
    // const timeZone = newDate?.timeZone ?? dayjs.tz.guess();
    // const selectedDateData = get().selectedDateData;
    // // if (timeZone !== get().selectedDateData.timeZone) {
    // //   set((state) => {
    // //     state.selectedDateData = {
    // //       ...state.selectedDateData,
    // //       // date: getStandardFormat(newDate?.date ?? dayjs()),
    // //       timeZone,
    // //     };
    // //   });
    // // }
    // if (newDate || timeZone !== selectedDateData.timeZone) {
    //   set((state) => {
    //     state.selectedDateData = {
    //       ...state.selectedDateData,
    //       date: getStandardFormat(newDate?.date ?? dayjs()),
    //       timeZone,
    //     };
    //   });
    // }
    // //Compare datemetadata and selected date...if selected date in metadata add goals from datecache
    // //Implement goal groups in future
    // const compareDates = dateMetadata ? dateMetadata.map((_d) => getStandardFormat(_d)) : null;
    // const selectedDate = selectedDateData.date;
    // if (compareDates && compareDates.includes(selectedDate)) {
    //   const goals: CachedGoal[] = Object.values(get().dateCache[selectedDate]);
    //   const groups: GoalGroup[] = [];
    //   const prevDayGoals: CachedGoal[] = Object.values(get().dateCache[getStandardFormat(dayjs(selectedDate).subtract(1, 'day'))]);
    //   prevDayGoals.forEach((_g) => {
    //     const goal = get().goals[_g.id];
    //     const start = dayjs(goal.dateTimeData.start.date).tz(goal.dateTimeData.start.timeZone);
    //     const end = dayjs(goal.dateTimeData.end.date).tz(goal.dateTimeData.end.timeZone);
    //     if (start.diff(end, 'day') > 0) {
    //       goals.push(_g);
    //     }
    //   });
    //   //sort goals[]
    //   set((state) => {
    //     state.selectedDateData = { ...state.selectedDateData, goals, groups };
    //   });
    // }
    //if dateMetadata
  },
  createDateCache: (params) => {
    const dateCacheRange = params?.range ? Math.round((params.range - 1) / 2) * 2 + 1 : DEFAULT_DATE_CACHE_RANGE;
    const centerDate = params?.centerDate
      ? params.centerDate.timeZone
        ? dayjs(params.centerDate.date).tz(params.centerDate.timeZone)
        : dayjs(params.centerDate.date).tz(get().selectedDateData.timeZone)
      : dayjs(get().selectedDateData.date).tz(get().selectedDateData.timeZone);
    const dates = getGoalRecurrentDates({
      recurrenceRule: {
        count: dateCacheRange,
        frequency: 'daily',
        start: centerDate.subtract(Math.round((dateCacheRange - 1) / 2), 'day'),
        timeZone: get().selectedDateData.timeZone,
      },
    });
    set((state) => {
      state.dateCache = {};
      dates.forEach((_d) => {
        state.dateCache[_d] = {};
      });
    });
    Object.values(get().goals).forEach((goal) => {
      get().addToDateCache({ id: goal.id });
    });
  },
  addToDateCache: (params) => {
    const id = params.id;
    const goal = get().goals[id];
    const { dateTimeData, recurrence, groupId, ...rest } = goal;
    const cachedGoal: CachedGoal = { ...rest, status: 'incomplete' };
    const sortedDateCache = Object.keys(get().dateCache).sort((a, b) => {
      if (dayjs(a).isBefore(dayjs(b), 'date')) return -1;
      else return 0;
    });
    // console.log(sortedDateCache);
    //Gets recurrent dates within date cache range. Won't be added if not within
    const recurrentDates = goal.recurrence
      ? getGoalRecurrentDates({
          recurrenceRule: {
            ...goal.recurrence,
            start: dateTimeData.start.date,
            // until: sortedDateCache[sortedDateCache.length - 1],
            timeZone: goal.dateTimeData.start.timeZone,
          },
          sliceOptions: {
            start: dayjs(dateTimeData.start.date).isAfter(sortedDateCache[0], 'date') ? dateTimeData.start.date : sortedDateCache[0],
            end: sortedDateCache[sortedDateCache.length - 1],
          },
          noCache: true,
        })
      : [getStandardFormat(goal.dateTimeData.start.date)];
    console.log(goal.title, goal.id);
    console.log(recurrentDates);
    set((state) => {
      recurrentDates.forEach((_d) => {
        // console.log(_d);
        const date = getStandardFormat(_d);
        const status: GoalStatus = goal.dateTimeData.status[date] ?? 'incomplete';
        if (state.dateCache[date]) state.dateCache[date][id] = { ...cachedGoal, status };
        // console.log(status);
        // console.log(date);
      });
    });
    // set((state) => {
    //   recurrentDates.forEach((date) => {
    //     const _d = getStandardFormat(date);
    //     const status = Object.entries(goal.dateTimeData.status).find((entry) => entry[0] === _d)![1];
    //     //if date not in datecache won't be added
    //     console.log(_d);
    //     if (state.dateCache[_d]) {
    //       console.log('date in date cache');
    //       state.dateCache[_d][id] = { ...cachedGoal, status };
    //     }
    //   });
    // });
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
    const goal = params.goal;
    const id = generateGoalId(goal.title, goal.dateTimeData.start.date);
    const initialGoalStatus: Record<string, GoalStatus> = {};
    initialGoalStatus[goal.dateTimeData.start.date] = 'incomplete';
    const newGoal: Goal = { id, groupId: '', ...goal, dateTimeData: { ...goal.dateTimeData, status: initialGoalStatus } };
    set((state) => {
      state.goals[id] = newGoal;
    });
    get().addToDateCache({ id });
    //Add to selected date data if needed
    get().updateSelectedDateData({ newDate: { date: goal.dateTimeData.start.date, timeZone: goal.dateTimeData.start.timeZone } });
  },
  updateGoal: (params) => {
    const { goal } = params;
    const id = goal.id;
    const originalGoal = get().goals[id];
    if (!originalGoal) console.debug(`useGoalStore >> updateGoal: No goal found with id(${id})`);
    else {
      const newGoal = { ...originalGoal, ...goal };

      if (!isEqual(originalGoal, newGoal)) {
        //Fix statuses
        if (!isEqual(newGoal.dateTimeData, originalGoal.dateTimeData)) {
          newGoal.dateTimeData.status = {};
          const originalStatuses = originalGoal.dateTimeData.status;
          const originalStatusDates = Object.keys(originalStatuses).sort((a, b) => (dayjs(a).isAfter(b, 'date') ? 1 : -1));
          if (newGoal.recurrence) {
            const newRecurrentDates = getRecurrenceDates({
              recurrenceRule: newGoal.recurrence,
              sliceOptions: { start: originalStatusDates[0], end: originalStatusDates.slice(-1)[0] },
            });
            newRecurrentDates.forEach((_d) => {
              if (originalStatuses[_d]) newGoal.dateTimeData.status[_d] = originalStatuses[_d];
            });
          } else {
            const date = newGoal.dateTimeData.start.date;
            if (originalStatuses[date]) {
              newGoal.dateTimeData.status[date] = originalStatuses[date];
            }
          }
        }

        set((state) => {
          state.goals[id] = newGoal;
        });

        get().removeFromDateCache({ id });
        get().addToDateCache({ id });

        if (newGoal.groupId !== originalGoal.groupId) {
          get().removeGoalFromGroup({ id });
          newGoal.groupId !== '' && get().addGoalToGroup({ id, groupId: newGoal.groupId });
        }

        // const { status, ...dateTime1 } = newGoal.dateTimeData;
        // const dateTime2 = {
        //   start: originalGoal.dateTimeData.start,
        //   end: originalGoal.dateTimeData.end,
        // };
        // if (!isEqual(dateTime1, dateTime2)) {
        //   get().removeFromDateCache({ id });
        //   get().addToDateCache({ id });
        // }

        //update selected date data if needed
        get().updateSelectedDateData({ newDate: { date: newGoal.dateTimeData.start.date, timeZone: newGoal.dateTimeData.start.timeZone } });
      }
    }
  },
  updateGoalStatus: (params) => {
    const { id, date, status } = params;
    const dateToChange = getStandardFormat(date);
    const goal = { ...get().goals[id] }; //create shallow copy --> why tf did we need to create a shallow copy? Must've been high
    if (!goal) console.debug(`useGoalStore >> updateGoalStatus: No goal found with id(${id})`);
    else {
      set((state) => {
        // goal.dateTimeData.status[dateToChange] = status;
        state.goals[id].dateTimeData.status[dateToChange] = status;
        //goal might be in prev day's dateCache
        if (state.dateCache[dateToChange][id]) state.dateCache[dateToChange][id].status = status;
        else {
          const prevDay = getStandardFormat(dayjs(dateToChange).subtract(1, 'day'));
          if (state.dateCache[prevDay][id]) state.dateCache[prevDay][id].status = status;
          else
            console.debug(
              `useGoalStore >> updateGoalStatus: Tried updating goal status for a goal not stored in date cache for selected date. However, was not able to find goal in previous day either. Oops`
            );
        }
        // Moving streaks outta here. Takes too long and is not worth it. Should just show streaks when viewing a goal
        // const streakData = getStreakData({ goal: state.goals[id] });
        // if (streakData) state.goals[id].streakData = streakData;
      });

      //update selected date data if needed
      get().updateSelectedDateData({ newDate: { date: get().selectedDateData.date, timeZone: goal.dateTimeData.start.timeZone } });
    }
  },
  deleteGoal: (params) => {
    const id = params.id;
    const goal = get().goals[id];
    set((state) => {
      delete state.goals[id];
    });
    get().removeFromDateCache({ id });
    get().removeGoalFromGroup({ id });

    // update selected date data if needed
    get().updateSelectedDateData({ newDate: { date: get().selectedDateData.date, timeZone: goal.dateTimeData.start.timeZone } });
  },
  addGroup: (params) => {
    const group = params.group;
    const id = generateGroupId(group.title);
    const newGroup: GoalGroup = { ...group, id };
    set((state) => {
      state.groups[id] = newGroup;
    });
    if (group.goals.size > 0) {
      const addGoalToGroup = get().addGoalToGroup;
      const removeGoalFromGroup = get().removeGoalFromGroup;
      group.goals.forEach((goalId) => {
        // const goal = state.goals[goalId];
        // if (goal.groupId !== '') state.goals[goalId].groupId = id;
        addGoalToGroup({ id: goalId, groupId: id, shouldUpdateSelectedDateData: false });
      });
    }

    //update selected date data if goal group has date/time and is within range
    const { date, timeZone } = get().selectedDateData;
    get().updateSelectedDateData({ newDate: { date, timeZone } });
  },
  updateGroup: (params) => {
    const group = params.group;
    const id = group.id;
    const originalGroup = get().groups[id];
    if (!originalGroup) console.debug(`useGoalStore >> updateGroup: No goal group found with id(${id})`);
    else {
      const newGroup = { ...originalGroup, ...group };
      if (!isEqual(newGroup, originalGroup)) {
        set((state) => {
          state.groups[id] = { ...originalGroup, ...group };
        });

        //update selected date data if needed
        const { date, timeZone } = get().selectedDateData;
        get().updateSelectedDateData({ newDate: { date, timeZone } });
      }
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
      const { date, timeZone } = get().selectedDateData;
      get().updateSelectedDateData({ newDate: { date, timeZone } });
    }
  },
  addGoalToGroup: (params) => {
    const { id, groupId, shouldUpdateSelectedDateData } = params;
    const goal = get().goals[id];
    const group = get().groups[groupId];
    if (!goal) console.debug(`useGoalStore >> addGoalToGroup: No goal found with id(${id})`);
    else if (!group) console.debug(`useGoalStore >> addGoalToGroup: No group found with id(${id})`);
    else {
      if (goal.groupId !== '') get().removeGoalFromGroup({ id, shouldUpdateSelectedDateData: false });
      set((state) => {
        state.goals[id].groupId = groupId;
        state.groups[groupId].goals.add(id);
      });

      //update selected date data if needed
      if (shouldUpdateSelectedDateData) {
        const { date, timeZone } = get().selectedDateData;
        get().updateSelectedDateData({ newDate: { date, timeZone } });
      }
    }
  },
  removeGoalFromGroup: (params) => {
    const { id, shouldUpdateSelectedDateData } = params;
    const goal = get().goals[id];
    if (!goal) console.debug(`useGoalStore >> removeGoalFromGroup: No goal found with id(${id})`);
    else if (goal.groupId === '') console.debug(`useGoalStore >> removeGoalFromGroup: Goal(${id}) is already not in a group`);
    else {
      set((state) => {
        state.goals[id].groupId = '';
        state.groups[goal.groupId].goals.delete(id);
      });

      //update selected date data if needed
      if (shouldUpdateSelectedDateData) {
        const { date, timeZone } = get().selectedDateData;
        get().updateSelectedDateData({ newDate: { date, timeZone } });
      }
    }
  },
  clearStore: () => {
    set((state) => {
      state.goals = {};
      state.groups = {};
      state.dateCache = {};
      state.selectedDateData = {
        date: getStandardFormat(dayjs()),
        timeZone: dayjs.tz.guess(),
        goals: [],
        groups: [],
      };
    });
    get().createDateCache();
  },
});

export default createGoalSlice;
