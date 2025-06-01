
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
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
        element: <Index />
      },
      {
        path: "/dashboard",
        element: <Dashboard />
      },
      {
        path: "/profile/:userId",
        element: <Profile />
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
