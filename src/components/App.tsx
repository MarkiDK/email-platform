import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { EmailProvider } from '@/contexts/EmailContext';
import { ToastProvider } from '@/contexts/ToastContext';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import InboxPage from '@/pages/email/InboxPage';
import ComposePage from '@/pages/email/ComposePage';
import EmailDetailPage from '@/pages/email/EmailDetailPage';
import DraftsPage from '@/pages/email/DraftsPage';
import SentPage from '@/pages/email/SentPage';
import TrashPage from '@/pages/email/TrashPage';
import SpamPage from '@/pages/email/SpamPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import ContactsPage from '@/pages/contacts/ContactsPage';
import CalendarPage from '@/pages/calendar/CalendarPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/inbox" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <EmailProvider>
              <Router>
                <Routes>
                  {/* Auth Routes */}
                  <Route element={<AuthLayout />}>
                    <Route
                      path="/login"
                      element={
                        <PublicRoute>
                          <LoginPage />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <PublicRoute>
                          <RegisterPage />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/forgot-password"
                      element={
                        <PublicRoute>
                          <ForgotPasswordPage />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/reset-password"
                      element={
                        <PublicRoute>
                          <ResetPasswordPage />
                        </PublicRoute>
                      }
                    />
                  </Route>

                  {/* Protected Routes */}
                  <Route
                    element={
                      <PrivateRoute>
                        <MainLayout />
                      </PrivateRoute>
                    }
                  >
                    <Route path="/" element={<Navigate to="/inbox" replace />} />
                    <Route path="/inbox" element={<InboxPage />} />
                    <Route path="/compose" element={<ComposePage />} />
                    <Route path="/email/:id" element={<EmailDetailPage />} />
                    <Route path="/drafts" element={<DraftsPage />} />
                    <Route path="/sent" element={<SentPage />} />
                    <Route path="/trash" element={<TrashPage />} />
                    <Route path="/spam" element={<SpamPage />} />
                    <Route path="/contacts" element={<ContactsPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>

                  {/* 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Router>
            </EmailProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;