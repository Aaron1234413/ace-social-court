
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import LogMatch from './pages/LogMatch';
import LogSession from './pages/LogSession';
import MapExplorer from './components/map/MapExplorer';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <HomePage />
      },
      {
        path: "/dashboard",
        element: <DashboardPage />
      },
      {
        path: "/profile/:userId",
        element: <ProfilePage />
      },
      {
        path: "/log/match",
        element: <LogMatch />
      },
      {
        path: "/log/session",
        element: <LogSession />
      },
      {
        path: "/map",
        element: <MapExplorer />
      }
    ]
  }
]);
