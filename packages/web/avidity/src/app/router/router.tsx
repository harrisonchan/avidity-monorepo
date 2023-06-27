import { Group, Home, Schedule } from '@web/pages';
import { AddGoal } from '@web/pages/addGoal';
import { RouteObject, useRoutes } from 'react-router-dom';

export const ROUTES: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/home', element: <Home /> },
  { path: '/add-goal', element: <AddGoal /> },
  { path: '/group/:id', element: <Group /> },
  { path: '/schedule/:date', element: <Schedule /> },
];

export default function AppRouter() {
  return useRoutes(ROUTES);
}
