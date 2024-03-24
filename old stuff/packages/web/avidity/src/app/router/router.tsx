import { Add, Goal, Group, EditGoal, EditGroup, Home, Schedule } from '@web/pages';
import { Test } from '@web/pages/test';
import { RouteObject, useRoutes } from 'react-router-dom';

export const ROUTES: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/home', element: <Home /> },
  { path: '/add', element: <Add /> },
  { path: '/edit-goal', element: <EditGoal /> },
  { path: '/edit-group', element: <EditGroup /> },
  // { path: '/group/:id', element: <Group /> },
  { path: '/schedule/:date', element: <Schedule /> },
  { path: '/group/:id', element: <Group /> },
  { path: '/goal/:id', element: <Goal /> },
  { path: '/test', element: <Test /> },
];

export default function AppRouter() {
  return useRoutes(ROUTES);
}
