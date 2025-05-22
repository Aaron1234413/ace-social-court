import React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/ui/theme-provider';
import { AuthProvider } from './components/AuthProvider';
import Auth from './pages/Auth';
import ProfileEdit from './pages/ProfileEdit';
import Home from './pages/Home';
import { ErrorBoundary } from 'react-error-boundary'
import ErrorPage from './pages/ErrorPage';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import VideoAnalysis from './pages/VideoAnalysis';
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient()

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <ErrorBoundary fallback={<ErrorPage/>}>
              <Routes>
                <Route path="/" element={<Navigate to="/feed" />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/video-analysis" element={<VideoAnalysis />} />
                <Route path="/home" element={<Home />} />
              </Routes>
            </ErrorBoundary>
            
            {/* Add the Toaster component for notifications */}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
