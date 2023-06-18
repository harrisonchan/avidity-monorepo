import { DateParam, Goal, GoalGroup, TimeFormat } from '@shared/types';

export type CachedGoal = Omit<Goal, 'repeat' | 'completion' | 'groupId' | 'location' | 'commute' | 'break'> & {
  isComplete: boolean;
};

export type GoalMap = Map<string, Goal>;
export type CachedGoalMap = Map<string, Map<string, CachedGoal>>;
export type GoalGroupMap = Map<string, GoalGroup>;

export interface BaseGoalState {
  goals: GoalMap;
  dateCache: CachedGoalMap;
  groups: GoalGroupMap;
  selectedDateData: {
    date: string;
    goals: CachedGoal[];
    groups: GoalGroup[];
  };
}

export interface BaseGoalActions {
  runTasks: () => void;
  getDateData: (params: { date: DateParam; timeFormat?: TimeFormat }) => { goals: CachedGoal[]; goalGroups: GoalGroup[] };
  setSelectedDateData: (params: { date: DateParam; timeFormat?: TimeFormat; checkIsSameSelectedDate?: boolean }) => void;
  getGoal: (params: { id: string }) => Goal | undefined;
  addGoal: (params: { goal: Omit<Goal, 'id'>; timeFormat?: TimeFormat }) => void;
  updateGoal: (params: { goal: Pick<Goal, 'id'> & Partial<Goal>; timeFormat?: TimeFormat }) => void;
  updateGoalComplete: (params: { id: string; isComplete: boolean; isCompleteDate: DateParam; timeFormat?: TimeFormat }) => void;
  deleteGoal: (params: { id: string }) => void;
  getGoalGroup: (params: { id: string }) => GoalGroup | undefined;
  getAllGoalsNotInGroup: () => Goal[];
  getGoalsInGroup: (params: { id: string }) => Goal[];
  addGoalGroup: (params: { goalGroup: Omit<GoalGroup, 'id'> }) => void;
  updateGoalGroup: (params: { goalGroup: Pick<GoalGroup, 'id'> & Partial<GoalGroup> }) => void;
  deleteGoalGroup: (params: { id: string }) => void;
  addGoalToGroup: (params: { goalId: string; goalGroupId: string }) => void;
  removeGoalFromGroup: (params: { goalId: string; goalGroupId: string }) => void;
  addGoalToDateCache: (params: { id: string; range?: number }) => void;
  removeGoalFromDateCache: (params: { id: string }) => void;
  clearStore: () => void;
}
