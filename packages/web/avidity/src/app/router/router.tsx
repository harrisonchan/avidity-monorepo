import { Home } from '@web/pages';
import React from 'react';
import { useRoutes } from 'react-router-dom';

export default function AppRouter() {
  const routes = useRoutes([
    {
      path: '/',
      element: <Home />,
    },
  ]);
  return routes;
}
