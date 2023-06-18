import React from 'react';
import { useRoutes } from 'react-router-dom';
import { Home } from '@web/pages';

export default function AppRouter() {
  const elements = useRoutes([
    {
      path: '/',
      element: <Home />,
    },
  ]);
  return elements;
}
