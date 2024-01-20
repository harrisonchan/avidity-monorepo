import { Home } from '@web/pages';
import { RouteObject, useRoutes } from 'react-router-dom';

export const ROUTES: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/home', element: <Home /> },
  // { path: '/add-goal', element: <AddGoal /> },
  // { path: '/group/:id', element: <Group /> },
  // { path: '/schedule/:date', element: <Schedule /> },
];

export default function AppRouter() {
  return useRoutes(ROUTES);
}
