import React, { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import Search from "./pages/Search";
import LogSession from "./pages/LogSession";
import LogMatch from "./pages/LogMatch";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import MapExplorer from "./pages/MapExplorer";
import TennisAI from "./pages/TennisAI";
import TennisPreferences from "./pages/TennisPreferences";
import VideoAnalysis from "./pages/VideoAnalysis";
import PostDetail from "./pages/PostDetail";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminRoute } from "./components/admin/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminContent from "./pages/admin/AdminContent";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminCourts from "./pages/admin/AdminCourts";
import SocialOnboarding from "./pages/SocialOnboarding";

const AdminAmbassadors = lazy(() => import("./pages/admin/AdminAmbassadors"));

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout><div /></MainLayout>,
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <Index />,
      },
      {
        path: "/auth",
        element: <Auth />,
      },
      {
        path: "/onboarding",
        element: <SocialOnboarding />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/feed",
        element: <Feed />,
      },
      {
        path: "/search",
        element: <Search />,
      },
      {
        path: "/log-session",
        element: <LogSession />,
      },
      {
        path: "/log-match",
        element: <LogMatch />,
      },
      {
        path: "/profile/:userId?",
        element: <Profile />,
      },
      {
        path: "/profile-edit",
        element: <ProfileEdit />,
      },
      {
        path: "/messages",
        element: <Messages />,
      },
      {
        path: "/messages/:conversationId",
        element: <Messages />,
      },
      {
        path: "/notifications",
        element: <Notifications />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      {
        path: "/map",
        element: <MapExplorer />,
      },
      {
        path: "/tennis-ai",
        element: <TennisAI />,
      },
      {
        path: "/tennis-preferences",
        element: <TennisPreferences />,
      },
      {
        path: "/video-analysis",
        element: <VideoAnalysis />,
      },
      {
        path: "/posts/:postId",
        element: <PostDetail />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        path: "/admin",
        element: <AdminDashboard />,
      },
      {
        path: "/admin/users",
        element: <AdminUsers />,
      },
      {
        path: "/admin/ambassadors",
        element: <AdminAmbassadors />,
      },
      {
        path: "/admin/content",
        element: <AdminContent />,
      },
      {
        path: "/admin/messages",
        element: <AdminMessages />,
      },
      {
        path: "/admin/courts",
        element: <AdminCourts />,
      },
    ],
  },
]);
