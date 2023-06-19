import { Home } from '@web/pages';
import { AddGoal } from '@web/pages/addGoal';
import React from 'react';
import { useRoutes } from 'react-router-dom';

export const ROUTES: { path: string; element: React.ReactNode }[] = [
  { path: '/', element: <Home /> },
  { path: '/home', element: <Home /> },
  { path: '/add-goal', element: <AddGoal /> },
];

export default function AppRouter() {
  return useRoutes(ROUTES);
}
